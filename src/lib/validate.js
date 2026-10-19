'use strict';
const { packageIds } = require('../data/packages');
const { routeOptions } = require('../data/site');

const REF_RE = /^WTG-[A-HJ-NP-Z2-9]{6}$/;
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const clean = (v, max) =>
  String(v ?? '').replace(CONTROL_RE, '').replace(/[ \t]+/g, ' ').trim().slice(0, max);

/** Tanggal hari ini di zona WITA (UTC+8), format YYYY-MM-DD. */
const todayWita = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);

function validateBooking(input) {
  const errors = {};
  const src = input && typeof input === 'object' ? input : {};

  const nama = clean(src.nama, 80);
  if (nama.length < 2) errors.nama = 'Isi nama Anda dulu supaya kami tahu siapa yang memesan.';

  const paket = clean(src.paket, 40);
  if (!packageIds.includes(paket)) errors.paket = 'Paket tidak dikenal.';

  const tamu = Number.parseInt(src.tamu, 10);
  if (!Number.isInteger(tamu) || tamu < 1 || tamu > 50) errors.tamu = 'Jumlah tamu antara 1 sampai 50.';

  let tanggal = clean(src.tanggal, 10);
  if (tanggal) {
    const d = new Date(`${tanggal}T00:00:00Z`);
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(tanggal) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === tanggal;
    const max = new Date(Date.now() + 3 * 365 * 864e5).toISOString().slice(0, 10);
    if (!valid) errors.tanggal = 'Format tanggal tidak valid.';
    else if (tanggal < todayWita()) errors.tanggal = 'Tanggal berangkat sudah lewat.';
    else if (tanggal > max) errors.tanggal = 'Tanggal berangkat terlalu jauh.';
  } else tanggal = '';

  const berangkat = clean(src.berangkat || routeOptions[3], 60);
  const pulang = clean(src.pulang || routeOptions[3], 60);
  if (!routeOptions.includes(berangkat)) errors.berangkat = 'Jalur berangkat tidak dikenal.';
  if (!routeOptions.includes(pulang)) errors.pulang = 'Jalur pulang tidak dikenal.';

  const kontak = clean(src.kontak, 120);
  const catatan = String(src.catatan ?? '').replace(CONTROL_RE, '').trim().slice(0, 1000);

  const ref = REF_RE.test(String(src.ref || '')) ? String(src.ref) : '';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { nama, paket, tamu, tanggal, berangkat, pulang, kontak, catatan, ref },
  };
}

module.exports = { validateBooking, REF_RE };
