'use strict';
const config = require('../config');
const { findPackage } = require('../data/packages');

const fmt = (n) => 'Rp ' + n.toLocaleString('id-ID');

function bookingText(b) {
  const p = findPackage(b.paket);
  return [
    `Pesanan baru ${b.ref}`,
    `Paket: ${p ? `${p.name} (${p.days} hari, ${fmt(p.price)})` : b.paket}`,
    `Nama: ${b.nama}`,
    `Tamu: ${b.tamu}`,
    `Berangkat: ${b.tanggal || '-'}`,
    `Jalur: ${b.berangkat} / ${b.pulang}`,
    `Kontak: ${b.kontak || '-'}`,
    `Catatan: ${b.catatan || '-'}`,
  ].join('\n');
}

/** Kirim notifikasi ke Telegram dan/atau webhook. Tidak pernah melempar error ke pemanggil. */
async function notifyBooking(b) {
  const jobs = [];
  const text = bookingText(b);

  if (config.telegram.token && config.telegram.chatId) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${config.telegram.token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: config.telegram.chatId, text }),
        signal: AbortSignal.timeout(6000),
      }),
    );
  }
  if (config.webhookUrl) {
    jobs.push(
      fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, booking: b }),
        signal: AbortSignal.timeout(6000),
      }),
    );
  }
  const results = await Promise.allSettled(jobs);
  results.forEach((r) => {
    if (r.status === 'rejected' || (r.value && !r.value.ok)) {
      console.error(JSON.stringify({ level: 'warn', msg: 'notifikasi gagal', err: r.reason?.message || r.value?.status }));
    }
  });
}

module.exports = { notifyBooking, bookingText };
