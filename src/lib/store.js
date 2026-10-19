'use strict';
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const config = require('../config');
const { REF_RE } = require('./validate');
const { STATUSES, makeRef, newBooking } = require('./booking-model');

/**
 * Penyimpanan pesanan berbasis file JSON dengan tulis atomik (tulis ke file sementara lalu rename).
 * Cocok untuk satu server/VPS. Di Cloud Run / App Engine disk bersifat sementara:
 * gunakan STORAGE=firestore (lihat firestore-store.js dan README).
 *
 * Antarmuka store (semua async): create(value, meta), list({status}), updateStatus(id, status), count(), flush().
 */
function createStore(dir = config.dataDir) {
  const file = path.join(dir, 'bookings.json');
  let items = [];
  let chain = Promise.resolve();

  try {
    fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(file)) items = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'gagal memuat bookings', err: err.message }));
    items = [];
  }

  const persist = () => {
    chain = chain.then(async () => {
      const tmp = `${file}.${process.pid}.tmp`;
      await fsp.writeFile(tmp, JSON.stringify(items, null, 2));
      await fsp.rename(tmp, file);
    }).catch((err) => console.error(JSON.stringify({ level: 'error', msg: 'gagal menyimpan', err: err.message })));
    return chain;
  };

  return {
    async create(value, meta = {}) {
      let ref = value.ref;
      if (!REF_RE.test(ref) || items.some((b) => b.ref === ref)) {
        do ref = makeRef(); while (items.some((b) => b.ref === ref));
      }
      const booking = newBooking({ ...value, ref }, meta);
      items.push(booking);
      await persist();
      return booking;
    },
    async list({ status } = {}) {
      const rows = status ? items.filter((b) => b.status === status) : items;
      return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async updateStatus(id, status) {
      const b = items.find((x) => x.id === id);
      if (!b || !STATUSES.includes(status)) return null;
      b.status = status;
      b.updatedAt = new Date().toISOString();
      await persist();
      return b;
    },
    flush: () => chain,
    count: async () => items.length,
  };
}

module.exports = { createStore, STATUSES };
