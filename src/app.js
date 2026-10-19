'use strict';
const crypto = require('node:crypto');
const http = require('node:http');
const config = require('./config');
const { packages, findPackage } = require('./data/packages');
const pages = require('./render/pages');
const { send, sendJson, redirect, readJson, serveStatic, clientIp, isHttps, baseHeaders, HttpError } = require('./lib/http');
const { validateBooking } = require('./lib/validate');
const { createStore } = require('./lib/store');
const { createFirestoreStore } = require('./lib/firestore-store');
const { STATUSES } = require('./lib/booking-model');
const { createLimiter } = require('./lib/ratelimit');
const { notifyBooking } = require('./lib/notify');

const log = (o) => console.log(JSON.stringify({ t: new Date().toISOString(), ...o }));

/** Bangun server. Dipisah dari `listen` agar mudah diuji. */
function createApp({ store = config.storage === 'firestore' ? createFirestoreStore() : createStore() } = {}) {
  const bookingLimiter = createLimiter({ limit: 6, windowMs: 10 * 60_000 });
  const adminLimiter = createLimiter({ limit: 20, windowMs: 10 * 60_000 });

  // Halaman publik di-render sekali saat start; isinya statis sehingga aman di-cache.
  const HTML = 'text/html; charset=utf-8';
  const cache = new Map();
  const page = (key, fn) => {
    if (!cache.has(key)) cache.set(key, fn());
    return cache.get(key);
  };
  const SHORT = 'public, max-age=300, stale-while-revalidate=86400';

  /* ------------------------------------------------------------ API */

  const isAdmin = (req) => {
    if (!config.adminToken) return false;
    const m = /^Bearer (.+)$/.exec(String(req.headers.authorization || ''));
    if (!m) return false;
    const a = crypto.createHash('sha256').update(m[1]).digest();
    const b = crypto.createHash('sha256').update(config.adminToken).digest();
    return crypto.timingSafeEqual(a, b);
  };

  const csvCell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // cegah CSV/formula injection di Excel
    return `"${s.replace(/"/g, '""')}"`;
  };

  async function api(req, res, url) {
    const { pathname } = url;
    const method = req.method;

    if (pathname === '/api/health') return sendJson(req, res, 200, { ok: true, uptime: Math.round(process.uptime()) });

    if (pathname === '/api/packages' && method === 'GET') {
      return sendJson(req, res, 200, { packages: packages.map(({ stops, ...p }) => p) });
    }
    let m = /^\/api\/packages\/([a-z0-9-]+)$/.exec(pathname);
    if (m && method === 'GET') {
      const p = findPackage(m[1]);
      return p ? sendJson(req, res, 200, { package: p }) : sendJson(req, res, 404, { error: 'Paket tidak ditemukan' });
    }

    if (pathname === '/api/bookings') {
      if (method !== 'POST') return sendJson(req, res, 405, { error: 'Metode tidak diizinkan' }, { Allow: 'POST' });
      const ip = clientIp(req);
      const rl = bookingLimiter.take(ip);
      if (!rl.allowed) return sendJson(req, res, 429, { error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { 'Retry-After': String(rl.retryAfter) });

      const input = await readJson(req);
      // Honeypot: bot mengisi kolom tersembunyi. Pura-pura sukses agar bot tidak belajar.
      if (input && input.website) return sendJson(req, res, 201, { ok: true, ref: 'WTG-AAAAAA' });

      const { ok, errors, value } = validateBooking(input);
      if (!ok) return sendJson(req, res, 422, { error: 'Data belum lengkap atau tidak valid', errors });

      const booking = await store.create(value, {
        ipHash: crypto.createHash('sha256').update(ip + config.adminToken).digest('hex').slice(0, 16),
        userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
      });
      log({ level: 'info', msg: 'booking', ref: booking.ref, paket: booking.paket });
      notifyBooking(booking); // tidak ditunggu: respons ke tamu tidak boleh lambat karena Telegram
      return sendJson(req, res, 201, { ok: true, ref: booking.ref });
    }

    if (pathname.startsWith('/api/admin/')) {
      if (!config.adminToken) return sendJson(req, res, 503, { error: 'ADMIN_TOKEN belum diatur di server' });
      const rl = adminLimiter.take(clientIp(req));
      if (!rl.allowed) return sendJson(req, res, 429, { error: 'Terlalu banyak percobaan' }, { 'Retry-After': String(rl.retryAfter) });
      if (!isAdmin(req)) return sendJson(req, res, 401, { error: 'Token salah' }, { 'WWW-Authenticate': 'Bearer' });

      if (pathname === '/api/admin/bookings' && method === 'GET') {
        const status = url.searchParams.get('status') || undefined;
        const bookings = (await store.list({ status })).map((b) => ({ ...b, paketNama: findPackage(b.paket)?.name || b.paket }));
        return sendJson(req, res, 200, { bookings, statuses: STATUSES });
      }
      if (pathname === '/api/admin/bookings.csv' && method === 'GET') {
        const cols = ['ref', 'createdAt', 'status', 'nama', 'kontak', 'paket', 'tamu', 'tanggal', 'berangkat', 'pulang', 'catatan'];
        const rows = (await store.list()).map((b) => cols.map((c) => csvCell(b[c])).join(','));
        return send(req, res, {
          type: 'text/csv; charset=utf-8', body: '\uFEFF' + [cols.join(','), ...rows].join('\r\n'), cache: 'no-store',
          etag: `"c${Date.now()}"`, headers: { 'Content-Disposition': 'attachment; filename="pesanan-togean.csv"' },
        });
      }
      m = /^\/api\/admin\/bookings\/([0-9a-f-]{36})$/.exec(pathname);
      if (m && method === 'PATCH') {
        const body = await readJson(req);
        const updated = await store.updateStatus(m[1], body.status);
        return updated ? sendJson(req, res, 200, { booking: updated }) : sendJson(req, res, 404, { error: 'Pesanan atau status tidak valid' });
      }
    }
    return sendJson(req, res, 404, { error: 'Endpoint tidak ditemukan' });
  }

  /* ------------------------------------------------------------ halaman */

  async function route(req, res) {
    const url = new URL(req.url, 'http://x');
    let { pathname } = url;

    if (config.forceHttps && !isHttps(req)) {
      return redirect(req, res, `${config.siteUrl.replace(/^http:/, 'https:')}${req.url}`, 308);
    }

    if (pathname.startsWith('/api/')) {
      if (req.method === 'OPTIONS') { res.writeHead(204, { ...baseHeaders(req), Allow: 'GET, POST, PATCH, HEAD' }); return res.end(); }
      return api(req, res, url);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(req, res, { status: 405, type: 'text/plain; charset=utf-8', body: 'Metode tidak diizinkan', headers: { Allow: 'GET, HEAD' } });
    }

    // Hilangkan garis miring di akhir agar tiap halaman punya satu URL kanonik.
    if (pathname.length > 1 && pathname.endsWith('/')) {
      return redirect(req, res, pathname.replace(/\/+$/, '') + url.search);
    }

    if (pathname === '/') return send(req, res, { type: HTML, body: page('/', pages.home), cache: SHORT });
    if (pathname === '/paket') return redirect(req, res, '/#paket');

    let m = /^\/paket\/([a-z0-9-]+)$/.exec(pathname);
    if (m) {
      const p = findPackage(m[1]);
      if (p && p.slug !== m[1]) return redirect(req, res, `/paket/${p.slug}`); // /paket/una -> slug kanonik
      if (p) return send(req, res, { type: HTML, body: page(pathname, () => pages.packagePage(p)), cache: SHORT });
    }

    if (pathname === '/sitemap.xml') return send(req, res, { type: 'application/xml; charset=utf-8', body: page('sitemap', pages.sitemap), cache: 'public, max-age=3600' });
    if (pathname === '/robots.txt') return send(req, res, { type: 'text/plain; charset=utf-8', body: page('robots', pages.robots), cache: 'public, max-age=3600' });

    if (pathname === '/admin') {
      return (await serveStatic(req, res, '/admin.html', { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' })) ||
        notFound(req, res);
    }

    if (await serveStatic(req, res, pathname)) return;
    return notFound(req, res);
  }

  function notFound(req, res) {
    return send(req, res, { status: 404, type: HTML, body: page('404', pages.notFound), cache: 'no-store', headers: { 'X-Robots-Tag': 'noindex' } });
  }

  const server = http.createServer(async (req, res) => {
    const t0 = process.hrtime.bigint();
    res.on('finish', () => {
      if (req.url === '/api/health') return;
      log({ level: 'info', m: req.method, u: req.url.split('?')[0], s: res.statusCode, ms: Number((process.hrtime.bigint() - t0) / 1000000n) });
    });
    try {
      await route(req, res);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) log({ level: 'error', msg: err.message, stack: err.stack });
      if (res.headersSent) return res.destroy();
      sendJson(req, res, status, { error: status === 500 ? 'Terjadi kesalahan pada server' : err.message });
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 65_000; // > idle timeout load balancer Google (60 dtk)

  // render awal supaya galat template ketahuan saat start, bukan saat ada pengunjung
  page('/', pages.home); packages.forEach((p) => page(`/paket/${p.slug}`, () => pages.packagePage(p)));
  page('404', pages.notFound);

  return { server, store };
}

module.exports = { createApp };
