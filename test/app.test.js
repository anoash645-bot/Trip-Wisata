'use strict';
process.env.SITE_URL = 'https://togean.example.com';
process.env.ADMIN_TOKEN = 'rahasia-test';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

const { createApp } = require('../src/app');
const { createStore } = require('../src/lib/store');
const { validateBooking } = require('../src/lib/validate');

let server, base, dir;
const J = { 'content-type': 'application/json' };
const AUTH = { authorization: 'Bearer rahasia-test' };
const post = (body, headers = {}) => fetch(`${base}/api/bookings`, { method: 'POST', headers: { ...J, ...headers }, body: JSON.stringify(body) });
const nextYear = `${new Date().getUTCFullYear() + 1}-06-15`;

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'togean-'));
  ({ server } = createApp({ store: createStore(dir) }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); fs.rmSync(dir, { recursive: true, force: true }); });

/* ---------------------------------------------------------------- halaman & SEO */

test('beranda: SSR lengkap dengan meta SEO dan JSON-LD', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<h1>Togean, kepulauan/);
  assert.match(html, /<link rel="canonical" href="https:\/\/togean\.example\.com\/">/);
  assert.match(html, /property="og:image" content="https:\/\/togean\.example\.com\/images\/og-image\.jpg"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /Rp 35\.000\.000/);
  assert.equal((html.match(/<h1/g) || []).length, 1, 'harus tepat satu <h1>');
  assert.match(html, /id="pemandu"/);
  for (const rp of ['Rp 2.000.000', 'Rp 3.000.000', 'Rp 5.000.000', 'Rp 6.000.000']) assert.ok(html.includes(rp), rp);
  assert.ok(!/<img(?![^>]*\balt=)/.test(html), 'semua <img> punya alt');
});

test('JSON-LD valid dan memuat TravelAgency, TouristTrip, FAQPage', async () => {
  const html = await (await fetch(`${base}/`)).text();
  const raw = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)[1];
  const types = JSON.parse(raw)['@graph'].map((n) => n['@type']);
  for (const t of ['TravelAgency', 'WebSite', 'ItemList', 'TouristTrip', 'FAQPage']) assert.ok(types.includes(t), t);
});

test('setiap paket punya halaman sendiri dengan canonical & breadcrumb', async () => {
  const { packages } = require('../src/data/packages');
  for (const p of packages) {
    const res = await fetch(`${base}/paket/${p.slug}`);
    assert.equal(res.status, 200, p.slug);
    const html = await res.text();
    assert.ok(html.includes(`<link rel="canonical" href="https://togean.example.com/paket/${p.slug}">`));
    assert.ok(html.includes('BreadcrumbList'));
    assert.ok(html.includes(`og-${p.id}.jpg`));
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', 'images', `og-${p.id}.jpg`)));
  }
});

test('id lama dialihkan 301 ke slug kanonik; garis miring akhir dibuang', async () => {
  let r = await fetch(`${base}/paket/una`, { redirect: 'manual' });
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), '/paket/una-una-gunung-colo');
  r = await fetch(`${base}/paket/walea/`, { redirect: 'manual' });
  assert.equal(r.status, 301);
});

test('404 memakai noindex', async () => {
  const r = await fetch(`${base}/halaman-hilang`);
  assert.equal(r.status, 404);
  assert.match(r.headers.get('x-robots-tag'), /noindex/);
});

test('sitemap.xml dan robots.txt', async () => {
  const sm = await (await fetch(`${base}/sitemap.xml`)).text();
  assert.equal((sm.match(/<url>/g) || []).length, 6);
  assert.ok(sm.includes('https://togean.example.com/paket/grand-tour-togean'));
  const rb = await (await fetch(`${base}/robots.txt`)).text();
  assert.match(rb, /Sitemap: https:\/\/togean\.example\.com\/sitemap\.xml/);
  assert.match(rb, /Disallow: \/admin/);
});

test('header keamanan, kompresi, dan ETag/304', async () => {
  const r = await fetch(`${base}/`, { headers: { 'accept-encoding': 'gzip' } });
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  const etag = r.headers.get('etag');
  const r2 = await fetch(`${base}/`, { headers: { 'if-none-match': etag } });
  assert.equal(r2.status, 304);
});

test('file statis aman dari path traversal & dotfile', async () => {
  for (const p of ['/..%2f..%2fserver.js', '/%2e%2e/server.js', '/.env', '/css/../../package.json']) {
    const r = await fetch(`${base}${p}`);
    assert.equal(r.status, 404, p);
  }
  assert.equal((await fetch(`${base}/css/style.css`)).status, 200);
  assert.equal((await fetch(`${base}/images/hero.webp`)).status, 200);
});

/* ---------------------------------------------------------------- API */

test('GET /api/packages dan /api/packages/:slug', async () => {
  const list = await (await fetch(`${base}/api/packages`)).json();
  assert.equal(list.packages.length, 5);
  const one = await (await fetch(`${base}/api/packages/walea`)).json();
  assert.equal(one.package.price, 30000000);
  assert.equal((await fetch(`${base}/api/packages/nope`)).status, 404);
});

test('POST /api/bookings: sukses, tersimpan, dan ref klien dipakai', async () => {
  const r = await post({ nama: 'Budi Santoso', paket: 'bisnis', tamu: 2, tanggal: nextYear, berangkat: 'Darat dan ferry lewat Gorontalo', pulang: 'Udara lewat Luwuk Banggai', catatan: 'bulan madu', ref: 'WTG-ABC234' });
  assert.equal(r.status, 201);
  assert.deepEqual(await r.json(), { ok: true, ref: 'WTG-ABC234' });
});

test('POST /api/bookings: validasi menolak data buruk dengan pesan per kolom', async () => {
  const r = await post({ nama: 'B', paket: 'xx', tamu: 99, tanggal: '2020-01-01' });
  assert.equal(r.status, 422);
  const { errors } = await r.json();
  for (const k of ['nama', 'paket', 'tamu', 'tanggal']) assert.ok(errors[k], k);
});

test('POST /api/bookings: content-type salah, JSON rusak, dan body terlalu besar', async () => {
  assert.equal((await fetch(`${base}/api/bookings`, { method: 'POST', body: 'a=b' })).status, 415);
  assert.equal((await fetch(`${base}/api/bookings`, { method: 'POST', headers: J, body: '{oops' })).status, 400);
  const big = await fetch(`${base}/api/bookings`, { method: 'POST', headers: J, body: JSON.stringify({ nama: 'a'.repeat(40000) }) }).catch(() => ({ status: 413 }));
  assert.equal(big.status, 413);
});

test('honeypot: bot dikira sukses tapi tidak ada yang tersimpan', async () => {
  const before = (await (await fetch(`${base}/api/admin/bookings`, { headers: AUTH })).json()).bookings.length;
  const r = await post({ nama: 'Bot Bot', paket: 'una', tamu: 2, website: 'http://spam' });
  assert.equal(r.status, 201);
  const after = (await (await fetch(`${base}/api/admin/bookings`, { headers: AUTH })).json()).bookings.length;
  assert.equal(after, before);
});

test('admin: tanpa/salah token ditolak; token benar bisa lihat, ubah status, ekspor CSV', async () => {
  assert.equal((await fetch(`${base}/api/admin/bookings`)).status, 401);
  assert.equal((await fetch(`${base}/api/admin/bookings`, { headers: { authorization: 'Bearer salah' } })).status, 401);

  const { bookings } = await (await fetch(`${base}/api/admin/bookings`, { headers: AUTH })).json();
  assert.ok(bookings.length >= 1);
  const b = bookings.find((x) => x.ref === 'WTG-ABC234');
  assert.equal(b.status, 'baru');

  const up = await fetch(`${base}/api/admin/bookings/${b.id}`, { method: 'PATCH', headers: { ...J, ...AUTH }, body: JSON.stringify({ status: 'dikonfirmasi' }) });
  assert.equal((await up.json()).booking.status, 'dikonfirmasi');
  const bad = await fetch(`${base}/api/admin/bookings/${b.id}`, { method: 'PATCH', headers: { ...J, ...AUTH }, body: JSON.stringify({ status: 'hack' }) });
  assert.equal(bad.status, 404);

  const csv = await (await fetch(`${base}/api/admin/bookings.csv`, { headers: AUTH })).text();
  assert.match(csv, /WTG-ABC234/);
});

test('rate limit: permintaan berlebih dijawab 429 + Retry-After', async () => {
  let last;
  for (let i = 0; i < 8; i++) last = await post({ nama: 'Rate Test', paket: 'una', tamu: 2 });
  assert.equal(last.status, 429);
  assert.ok(Number(last.headers.get('retry-after')) > 0);
});

/* ---------------------------------------------------------------- unit */

test('validateBooking: normalisasi & pembersihan', () => {
  const { ok, value } = validateBooking({ nama: '  Siti\u0000   Aminah ', paket: 'walea', tamu: '3', berangkat: 'Udara lewat Luwuk Banggai', ref: 'bukan-ref' });
  assert.ok(ok);
  assert.equal(value.nama, 'Siti Aminah');
  assert.equal(value.tamu, 3);
  assert.equal(value.ref, '');
});

test('store: file JSON bertahan setelah dimuat ulang', async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'togean-s-'));
  const s1 = createStore(d);
  await s1.create({ nama: 'Uji', paket: 'una', tamu: 2, tanggal: '', berangkat: 'x', pulang: 'y', kontak: '', catatan: '', ref: '' });
  const s2 = createStore(d);
  assert.equal(await s2.count(), 1);
  fs.rmSync(d, { recursive: true, force: true });
});

/* ---------------------------------------------------------------- Firestore (fetch dipalsukan) */

test('firestore store: create, list (terurut), updateStatus lewat REST palsu', async () => {
  const { createFirestoreStore } = require('../src/lib/firestore-store');
  const docs = new Map();
  const realFetch = global.fetch;
  global.fetch = async (url, opts = {}) => {
    const u = new URL(url);
    const json = (status, body) => ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) });
    if (u.host !== 'fs.test') return realFetch(url, opts);
    const m = /documents\/bookings\/?(.*)$/.exec(u.pathname);
    if (opts.method === 'POST') {
      const id = u.searchParams.get('documentId');
      docs.set(id, JSON.parse(opts.body).fields);
      return json(200, { name: `x/bookings/${id}`, fields: docs.get(id) });
    }
    if (opts.method === 'PATCH') {
      const id = m[1];
      if (!docs.has(id)) return json(404, { error: 'nf' });
      Object.assign(docs.get(id), JSON.parse(opts.body).fields);
      return json(200, { name: `x/bookings/${id}`, fields: docs.get(id) });
    }
    const documents = [...docs].map(([id, fields]) => ({ name: `x/bookings/${id}`, fields }))
      .sort((a, b) => b.fields.createdAt.stringValue.localeCompare(a.fields.createdAt.stringValue));
    return json(200, { documents });
  };
  try {
    const s = createFirestoreStore({ FIRESTORE_EMULATOR_HOST: 'fs.test', GOOGLE_CLOUD_PROJECT: 'demo' });
    const a = await s.create({ nama: 'A', paket: 'una', tamu: 2, tanggal: '', berangkat: 'x', pulang: 'y', kontak: '', catatan: '', ref: 'WTG-AAAAA2' });
    await new Promise((r) => setTimeout(r, 5));
    const b = await s.create({ nama: 'B', paket: 'walea', tamu: 3, tanggal: '', berangkat: 'x', pulang: 'y', kontak: '', catatan: '', ref: '' });
    const rows = await s.list();
    assert.equal(rows.length, 2);
    assert.equal(rows[0].nama, 'B', 'terbaru di atas');
    assert.equal(rows[1].tamu, 2, 'integer ter-decode');
    assert.match(b.ref, /^WTG-[A-HJ-NP-Z2-9]{6}$/);
    assert.equal((await s.updateStatus(a.id, 'dibayar')).status, 'dibayar');
    assert.equal(await s.updateStatus('tidak-ada', 'dibayar'), null);
    assert.equal(await s.updateStatus(a.id, 'hack'), null);
    assert.equal((await s.list({ status: 'dibayar' })).length, 1);
  } finally {
    global.fetch = realFetch;
  }
});
