'use strict';
const crypto = require('node:crypto');

const STATUSES = ['baru', 'dihubungi', 'dikonfirmasi', 'dibayar', 'selesai', 'batal'];
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0/O/1/I agar mudah dibaca

const makeRef = () => 'WTG-' + Array.from(crypto.randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('');

function newBooking(value, meta = {}) {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), ...value, status: 'baru', createdAt: now, updatedAt: now, ...meta };
}

module.exports = { STATUSES, makeRef, newBooking };
