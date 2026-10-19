'use strict';
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { pipeline } = require('node:stream');
const config = require('../config');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.csv': 'text/csv; charset=utf-8',
};
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml|manifest\+json)|image\/svg\+xml)/;

/* ------------------------------------------------------------------ keamanan */

function csp() {
  const ga = config.gaId;
  const script = ["'self'", ga && 'https://www.googletagmanager.com'].filter(Boolean).join(' ');
  const img = ["'self'", 'data:', ga && 'https://www.google-analytics.com', ga && 'https://www.googletagmanager.com'].filter(Boolean).join(' ');
  const connect = ["'self'", ga && 'https://*.google-analytics.com', ga && 'https://*.analytics.google.com', ga && 'https://www.googletagmanager.com'].filter(Boolean).join(' ');
  return [
    "default-src 'self'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src ${img}`,
    `connect-src ${connect}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}
const CSP = csp();

function isHttps(req) {
  return Boolean(req.socket.encrypted) || (config.trustProxy && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https');
}

function baseHeaders(req) {
  const h = {
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
  };
  if (isHttps(req)) h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return h;
}

function clientIp(req) {
  if (config.trustProxy) {
    const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (xff) return xff;
  }
  return req.socket.remoteAddress || 'unknown';
}

/* ------------------------------------------------------------------ kompresi */

const zcache = new Map();
function pickEncoding(req, type) {
  if (!COMPRESSIBLE.test(type)) return null;
  const ae = String(req.headers['accept-encoding'] || '');
  if (/\bbr\b/.test(ae)) return 'br';
  if (/\bgzip\b/.test(ae)) return 'gzip';
  return null;
}
function compress(buf, enc, key) {
  const k = `${key}:${enc}`;
  let out = zcache.get(k);
  if (!out) {
    out = enc === 'br'
      ? zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
      : zlib.gzipSync(buf, { level: 9 });
    if (zcache.size > 400) zcache.clear();
    zcache.set(k, out);
  }
  return out;
}

/* ------------------------------------------------------------------ respons */

/**
 * Kirim body di memori dengan ETag, 304, kompresi, dan dukungan HEAD.
 * `etag` sebaiknya stabil per isi (dipakai juga sebagai kunci cache kompresi).
 */
function send(req, res, { status = 200, type, body, cache = 'no-cache', etag, headers = {} }) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const tag = etag || `"${crypto.createHash('sha1').update(buf).digest('base64url').slice(0, 20)}"`;
  const h = { ...baseHeaders(req), 'Content-Type': type, 'Cache-Control': cache, ETag: tag, Vary: 'Accept-Encoding', ...headers };

  if (status === 200 && req.headers['if-none-match'] === tag) {
    res.writeHead(304, h);
    return res.end();
  }
  const enc = pickEncoding(req, type);
  let out = buf;
  if (enc && buf.length > 512) {
    out = compress(buf, enc, tag);
    h['Content-Encoding'] = enc;
  }
  h['Content-Length'] = out.length;
  res.writeHead(status, h);
  if (req.method === 'HEAD') return res.end();
  return res.end(out);
}

function sendJson(req, res, status, data, headers = {}) {
  return send(req, res, {
    status, type: MIME['.json'], body: JSON.stringify(data),
    cache: 'no-store', etag: `"j${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}"`, headers,
  });
}

function redirect(req, res, location, status = 301) {
  res.writeHead(status, { ...baseHeaders(req), Location: location, 'Cache-Control': 'public, max-age=3600' });
  res.end();
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function readJson(req, limit = 20 * 1024) {
  return new Promise((resolve, reject) => {
    const type = String(req.headers['content-type'] || '');
    if (!/^application\/json\b/i.test(type)) return reject(new HttpError(415, 'Gunakan Content-Type: application/json'));
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, 'Data terlalu besar')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new HttpError(400, 'JSON tidak valid')); }
    });
    req.on('error', reject);
  });
}

/* ------------------------------------------------------------------ file statis */

const fileCache = new Map(); // path -> {mtimeMs, size, buf}
const versionCache = new Map();

/** Hash isi file untuk cache-busting: /css/style.css?v=abc123 */
function assetUrl(urlPath) {
  let v = versionCache.get(urlPath);
  if (!v) {
    try {
      const buf = fs.readFileSync(path.join(config.publicDir, urlPath));
      v = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
    } catch { v = 'dev'; }
    versionCache.set(urlPath, v);
  }
  return `${urlPath}?v=${v}`;
}

async function serveStatic(req, res, urlPath, extraHeaders = {}) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch { return false; }
  if (rel.includes('\0') || rel.split('/').some((s) => s.startsWith('.'))) return false;

  const abs = path.resolve(config.publicDir, '.' + path.posix.normalize('/' + rel));
  if (!abs.startsWith(config.publicDir + path.sep)) return false;

  let st;
  try { st = await fsp.stat(abs); } catch { return false; }
  if (!st.isFile()) return false;

  const ext = path.extname(abs).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const hasV = /(^|&)v=/.test(String(req.url.split('?')[1] || ''));
  const immutable = hasV || /\.(woff2)$/.test(ext);
  const cache = immutable
    ? 'public, max-age=31536000, immutable'
    : /\.(webp|png|jpe?g|ico)$/.test(ext) ? 'public, max-age=2592000' : 'public, max-age=3600';
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;

  if (COMPRESSIBLE.test(type)) {
    let c = fileCache.get(abs);
    if (!c || c.mtimeMs !== st.mtimeMs) {
      c = { mtimeMs: st.mtimeMs, buf: await fsp.readFile(abs) };
      fileCache.set(abs, c);
    }
    send(req, res, { type, body: c.buf, cache, etag, headers: extraHeaders });
    return true;
  }

  const headers = { ...baseHeaders(req), 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': cache, ETag: etag, ...extraHeaders };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); res.end(); return true; }
  res.writeHead(200, headers);
  if (req.method === 'HEAD') { res.end(); return true; }
  pipeline(fs.createReadStream(abs), res, () => {});
  return true;
}

module.exports = { send, sendJson, redirect, readJson, serveStatic, assetUrl, clientIp, isHttps, baseHeaders, HttpError, MIME };
