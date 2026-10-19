'use strict';
const { site, routeOptions, bookingSteps } = require('../data/site');
const { packages } = require('../data/packages');
const { esc, fmt, img } = require('./helpers');
const { WA_URL } = require('./layout');

/** Kartu paket: tautan ke halaman paket sendiri (URL unik per paket, bagus untuk SEO). */
const packageCard = (p, { eager = false } = {}) => `
    <a class="pkg" href="/paket/${p.slug}" aria-label="Lihat jadwal ${esc(p.name)}, ${p.days} hari, ${fmt(p.price)}">
      <div class="pkg-art">${img(p.cover.file, p.cover.alt, { cls: 'cover', loading: eager ? 'eager' : 'lazy', sizes: '(max-width:640px) 100vw, 33vw' })}<span class="dur">${p.days} hari</span>${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}</div>
      <div class="pkg-body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.tagline)}</p>
        <div class="price"><strong>${fmt(p.price)}</strong><span>untuk 2 orang, net</span></div>
        <div class="pick">Lihat jadwal lengkap</div>
      </div>
    </a>`;

const packageGrid = (list = packages) => `<div class="pkg-grid">${list.map((p, i) => packageCard(p, { eager: i < 2 })).join('')}</div>`;

const compareTable = () => {
  const head = `<thead><tr><th scope="col"><span class="sr">Paket</span></th>${packages.map((p) => `<th scope="col"><a href="/paket/${p.slug}">${esc(p.name)}</a></th>`).join('')}</tr></thead>`;
  const row = (label, fn, cls = '') => `<tr><th scope="row">${label}</th>${packages.map((p) => `<td${cls ? ` class="${cls}"` : ''}>${esc(fn(p))}</td>`).join('')}</tr>`;
  return `<table class="cmp">${head}<tbody>
    ${row('Lama', (p) => `${p.days} hari`)}
    ${row('Harga untuk 2 orang', (p) => fmt(p.price), 'hl')}
    ${row('Setara per orang', (p) => fmt(p.price / 2))}
    ${row('Cocok untuk', (p) => p.focus)}
    ${row('Yang dilakukan', (p) => p.main)}
    ${row('Menginap di', (p) => p.stay)}
  </tbody></table>`;
};

const options = (arr, selected) => arr.map((o) => `<option${o === selected ? ' selected' : ''}>${esc(o)}</option>`).join('');

/** Formulir pemesanan. JS (app.js) menambah estimasi harga, validasi, penyimpanan ke server, dan tautan WhatsApp. */
const bookingSection = (selectedId) => `
<section id="pesan" class="book">
  <div class="wrap book-grid">
    <div>
      <h2>Pesan perjalanan Anda</h2>
      <p class="sub">Isi data singkat di samping. Pesan Anda akan terbuka di WhatsApp, tinggal dikirim. Lebih suka email? Tulis ke <a href="mailto:${site.email}" class="mail">${site.email}</a>.</p>
      <ol class="steps">${bookingSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    </div>
    <form class="form" id="bookingForm" method="post" action="/api/bookings" data-wa="${site.whatsapp}" novalidate>
      <label>Nama Anda<input id="fNama" name="nama" type="text" placeholder="Nama lengkap" autocomplete="name" maxlength="80" required></label>
      <label>Paket<select id="fPaket" name="paket">${packages.map((p) => `<option value="${p.id}" data-price="${p.price}" data-name="${esc(p.name)}" data-days="${p.days}" data-slug="${p.slug}"${p.id === selectedId ? ' selected' : ''}>${esc(p.name)}, ${p.days} hari</option>`).join('')}</select></label>
      <div class="row">
        <label>Jumlah tamu<input id="fTamu" name="tamu" type="number" min="1" max="50" value="2" inputmode="numeric"></label>
        <label>Perkiraan tanggal berangkat<input id="fTgl" name="tanggal" type="date"></label>
      </div>
      <div class="row">
        <label>Jalur berangkat<select id="fBerangkat" name="berangkat">${options(routeOptions)}</select></label>
        <label>Jalur pulang<select id="fPulang" name="pulang">${options(routeOptions)}</select></label>
      </div>
      <label>Kontak Anda (opsional)<input id="fKontak" name="kontak" type="text" placeholder="Nomor WhatsApp atau email" autocomplete="email" maxlength="120"></label>
      <label>Catatan<textarea id="fCatatan" name="catatan" maxlength="1000" placeholder="Misalnya: bulan madu, ada anak kecil, ingin tambah tur Bunaken"></textarea></label>
      <div class="hp" aria-hidden="true"><label>Jangan diisi<input id="fWebsite" name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
      <div class="est" id="est" aria-live="polite"></div>
      <div class="err" id="err" role="alert"></div>
      <button class="btn btn-sun" id="sendWa" type="submit">Kirim lewat WhatsApp</button>
      <p class="form-status" id="formStatus" role="status" aria-live="polite"></p>
      <noscript><a class="btn btn-line" href="${WA_URL}">Tanpa JavaScript: chat langsung lewat WhatsApp</a></noscript>
    </form>
  </div>
</section>`;

module.exports = { packageCard, packageGrid, compareTable, bookingSection };
