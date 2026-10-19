'use strict';
/**
 * Penyimpanan pesanan di Google Cloud Firestore (mode Native) lewat REST API, tanpa dependensi.
 * Autentikasi memakai service account bawaan Cloud Run / App Engine (metadata server),
 * jadi tidak ada kunci rahasia yang perlu disimpan. Untuk uji lokal pakai FIRESTORE_EMULATOR_HOST.
 */
const { REF_RE } = require('./validate');
const { STATUSES, makeRef, newBooking } = require('./booking-model');

const COLLECTION = 'bookings';
const META = 'http://metadata.google.internal/computeMetadata/v1';

const enc = (v) => (typeof v === 'number' ? { integerValue: String(v) } : { stringValue: String(v ?? '') });
const dec = (fields = {}) =>
  Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, 'integerValue' in v ? Number(v.integerValue) : v.stringValue ?? '']));

function createFirestoreStore(env = process.env) {
  const emulator = env.FIRESTORE_EMULATOR_HOST;
  const api = emulator ? `http://${emulator}/v1` : 'https://firestore.googleapis.com/v1';
  let projectId = env.GOOGLE_CLOUD_PROJECT || env.GCLOUD_PROJECT || '';
  let tok = { v: '', exp: 0 };

  const meta = (p) => fetch(`${META}/${p}`, { headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(3000) })
    .then((r) => { if (!r.ok) throw new Error(`metadata ${r.status}`); return r; });

  async function token() {
    if (emulator) return 'owner';
    if (Date.now() < tok.exp - 60_000) return tok.v;
    const j = await (await meta('instance/service-accounts/default/token')).json();
    tok = { v: j.access_token, exp: Date.now() + j.expires_in * 1000 };
    return tok.v;
  }
  async function project() {
    if (!projectId) projectId = (await (await meta('project/project-id')).text()).trim();
    return projectId;
  }
  async function call(method, suffix, body) {
    const url = `${api}/projects/${await project()}/databases/(default)/documents${suffix}`;
    const res = await fetch(url, {
      method,
      headers: { authorization: `Bearer ${await token()}`, 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Firestore ${method} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }
  const toDoc = (b) => ({ fields: Object.fromEntries(Object.entries(b).map(([k, v]) => [k, enc(v)])) });
  const fromDoc = (d) => ({ ...dec(d.fields), id: d.name.split('/').pop() });

  async function all() {
    const out = [];
    let pageToken = '';
    for (let i = 0; i < 20; i++) { // maks 20 x 300 = 6000 pesanan di panel admin
      const q = `?pageSize=300&orderBy=${encodeURIComponent('createdAt desc')}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
      const r = await call('GET', `/${COLLECTION}${q}`);
      (r.documents || []).forEach((d) => out.push(fromDoc(d)));
      if (!r.nextPageToken) break;
      pageToken = r.nextPageToken;
    }
    return out;
  }

  return {
    async create(value, meta = {}) {
      const ref = REF_RE.test(value.ref) ? value.ref : makeRef(); // peluang bentrok 1:10^9, diabaikan
      const booking = newBooking({ ...value, ref }, meta);
      await call('POST', `/${COLLECTION}?documentId=${booking.id}`, toDoc(booking));
      return booking;
    },
    async list({ status } = {}) {
      const rows = await all();
      return status ? rows.filter((b) => b.status === status) : rows;
    },
    async updateStatus(id, status) {
      if (!STATUSES.includes(status)) return null;
      const updatedAt = new Date().toISOString();
      try {
        const d = await call('PATCH', `/${COLLECTION}/${encodeURIComponent(id)}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt&currentDocument.exists=true`, toDoc({ status, updatedAt }));
        return fromDoc(d);
      } catch (err) {
        if (/ 404:| 400:/.test(err.message)) return null;
        throw err;
      }
    },
    flush: async () => {},
    count: async () => (await all()).length,
  };
}

module.exports = { createFirestoreStore };
