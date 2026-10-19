'use strict';
const config = require('../config');
const { site, facts, routes, places, gallery, included, notIncluded, notIncludedNote, extras, team, faq } = require('../data/site');
const { packages, findPackage } = require('../data/packages');
const { esc, fmt, truncate, img } = require('./helpers');
const { layout, WA_URL } = require('./layout');
const { packageGrid, packageCard, compareTable, bookingSection } = require('./components');
const ld = require('./jsonld');

/* ------------------------------------------------------------------ BERANDA */

function home() {
  const tile = (t) => `
      <article class="tile ${t.span}${t.img ? ' ph' : ''}" style="--a:${t.a};--b:${t.b}">${t.img ? img(t.img, t.alt, { cls: 'tile-img', sizes: '(max-width:900px) 100vw, 50vw' }).replace('class="tile-img"', `class="tile-img" style="object-position:${t.pos}"`) : ''}<h3>${esc(t.name)}</h3><p>${esc(t.text)}</p></article>`;

  const route = (r) => `
      <div class="route">
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.intro)}</p>${r.photo ? `<figure class="route-photo">${img(r.photo.file, r.photo.alt)}<figcaption>${esc(r.photo.cap)}</figcaption></figure>` : ''}
        ${r.legs.map((l) => `<h4>${l.title}</h4><ol>${l.steps.map(([b, s]) => `<li><b>${esc(b)}</b><span>${esc(s)}</span></li>`).join('')}</ol>`).join('')}
      </div>`;

  const body = `
<section class="hero" aria-label="Pembuka" id="atas">
  <div class="hero-art"><img src="/images/hero.webp" srcset="/images/hero-1100.webp 1100w, /images/hero.webp 1600w" sizes="100vw" alt="Pulau-pulau hijau dan laut toska Kepulauan Togean dilihat dari udara" width="1600" height="1068" fetchpriority="high" decoding="async"></div>
  <div class="wrap">
    <div class="hero-copy">
      <h1>Togean, kepulauan yang masih terasa seperti rahasia.</h1>
      <p class="lead">Berenang di Danau Ubur-ubur, menginap di kampung Bajo yang berdiri di atas laut, mendaki gunung api Una-Una. Lima paket perjalanan, dijemput di Manado dan diantar kembali ke Manado.</p>
      <div class="cta">
        <a class="btn btn-sun" href="#paket">Pilih paket</a>
        <a class="btn btn-ghost" href="${WA_URL}" target="_blank" rel="noopener">Tanya lewat WhatsApp</a>
      </div>
    </div>
  </div>
</section>

<div class="facts"><div class="wrap"><ul>
${facts.map(([b, s]) => `  <li>${esc(b)}<span>${esc(s)}</span></li>`).join('\n')}
</ul></div></div>

<section id="paket">
  <div class="wrap">
    <div class="sec-head">
      <h2>Pilih paket perjalanan Anda</h2>
      <p>Ketuk salah satu paket untuk melihat jadwal harian dan apa saja yang sudah termasuk. Semua harga untuk dua orang.</p>
    </div>
    ${packageGrid()}
  </div>
</section>

<section class="tight" aria-labelledby="bandingkan">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="bandingkan">Bandingkan kelima paket</h2>
      <p>Geser tabel ke samping di layar kecil.</p>
    </div>
    <div class="cmp-wrap" tabindex="0" role="region" aria-label="Tabel perbandingan paket">${compareTable()}</div>
  </div>
</section>

<section id="rute" class="alt">
  <div class="wrap">
    <div class="sec-head">
      <h2>Dua jalan menuju Togean</h2>
      <p>Anda bebas memilih jalur untuk berangkat dan pulang. Boleh berbeda, misalnya berangkat lewat Gorontalo dan pulang lewat udara.</p>
    </div>
    <div class="routes">${routes.map(route).join('')}
    </div>
  </div>
</section>

<section id="tempat" class="places">
  <div class="wrap">
    <div class="sec-head">
      <h2>Tempat yang akan Anda datangi</h2>
      <p>Setiap paket mengambil rangkaian tempat yang berbeda. Inilah yang menanti di sepanjang jalur.</p>
    </div>
    <div class="mosaic">${places.map(tile).join('')}
    </div>
  </div>
</section>

<section id="penginapan" class="stay">
  <div class="wrap">
    <div class="sec-head">
      <h2>Tempat Anda menginap</h2>
      <p>Bungalow kayu di tepi pantai pasir putih, kamar berkelambu, dan teras yang langsung menghadap laut. Ketuk foto untuk memperbesar.</p>
    </div>
    <div class="gallery" id="gallery">
      ${gallery.map((g) => `<button class="g" type="button" aria-label="Perbesar foto: ${esc(g.alt)}">${img(g.file, g.alt)}<span>${esc(g.alt)}</span></button>`).join('')}
    </div>
  </div>
</section>

<section id="termasuk">
  <div class="wrap">
    <div class="sec-head">
      <h2>Apa saja yang sudah termasuk</h2>
      <p>Cukup siapkan diri. Biaya perjalanan sepanjang paket kami yang urus.</p>
    </div>
    <div class="inc">
      <div class="box">
        <h3>Sudah dibayar dalam paket</h3>
        <ul>${included.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>
      <div class="box no">
        <h3>Di luar paket</h3>
        <ul>${notIncluded.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
        <p>${esc(notIncludedNote)}</p>
      </div>
    </div>
    <h3 class="extra-title">Ingin menambah hari di sekitar Manado?</h3>
    <p class="extra-sub">Kami juga melayani tur tambahan berikut.</p>
    <div class="extra" style="margin-top:18px">
      ${extras.map(([h, p]) => `<div><h4>${esc(h)}</h4><p>${esc(p)}</p></div>`).join('')}
    </div>
  </div>
</section>

<section id="faq" class="alt" aria-labelledby="faq-h">
  <div class="wrap faq-wrap">
    <div class="sec-head">
      <h2 id="faq-h">Pertanyaan yang sering diajukan</h2>
      <p>Jawaban singkat sebelum Anda memesan. Butuh yang lain? Tanya langsung lewat WhatsApp.</p>
    </div>
    <div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
</section>

<section id="tentang" class="about">
  <div class="wrap about-grid">
    <div>
      <h2>Dipandu orang yang tumbuh di Togean</h2>
      <p>Wulmufikra Togean Islands Tour &amp; Travel mengantar wisatawan domestik dan mancanegara, peneliti, mahasiswa, serta karyawan yang sedang cuti. Boleh sendiri, berdua, atau rombongan.</p>
      <p>Kami berprinsip bahwa tamu adalah raja. Kepuasan dan kenyamanan Anda kami jaga dari penjemputan sampai Anda tiba kembali di Manado.</p>
      <p>Pembayaran lewat transfer ke rekening perusahaan. Detailnya kami kirim saat Anda memesan.</p>
    </div>
    <div class="team">
      ${team.map(([a, n, r]) => `<div class="person"><div class="avatar" aria-hidden="true">${esc(a)}</div><div><b>${esc(n)}</b><span>${esc(r)}</span></div></div>`).join('')}
    </div>
  </div>
</section>

${bookingSection('bisnis')}`;

  return layout({
    title: 'Paket Wisata Kepulauan Togean | Wulmufikra Togean Islands Tour & Travel',
    description: 'Lima paket wisata Kepulauan Togean dari Manado: Una-Una, Walea, suku Bajo Kabalutan, Kelas Bisnis 5 hari, dan Grand Tour 6 hari.',
    path: '/',
    imageAlt: 'Pulau-pulau hijau dan laut toska Kepulauan Togean dilihat dari udara',
    home: true,
    lightbox: true,
    preload: '<link rel="preload" as="image" imagesrcset="/images/hero-1100.webp 1100w, /images/hero.webp 1600w" imagesizes="100vw" fetchpriority="high">',
    jsonld: ld.toScript([ld.organization(), ld.website(), ld.itemList(), ...packages.map((p) => ld.trip(p)), ld.faqPage()]),
    body,
  });
}

/* ------------------------------------------------------------------ HALAMAN PAKET */

function packagePage(p) {
  const path = `/paket/${p.slug}`;
  const others = packages.filter((x) => x.id !== p.id);
  const timeline = p.schedule.map((d) => {
    const mark = p.stops ? `<div class="mark">${esc(d.label)}</div>` : `<div class="mark"><span>Hari<b>${esc(d.label.split(' ')[1])}</b></span></div>`;
    return `<li>${mark}<div class="tl-body"><h3>${esc(d.title)}</h3><ul>${d.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div></li>`;
  }).join('');

  const body = `
<section class="phero" aria-label="${esc(p.name)}">
  ${img(p.cover.file, p.cover.alt, { cls: 'phero-img', priority: true })}
  <div class="phero-shade"></div>
  <div class="wrap"><div class="phero-copy">
    <nav class="crumbs" aria-label="Jejak halaman"><a href="/">Beranda</a><span aria-hidden="true">/</span><a href="/#paket">Paket</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.name)}</span></nav>
    <h1>Paket Wisata ${esc(p.name)}, ${p.days} hari dari Manado</h1>
    <p class="lead">${esc(p.tagline)}</p>
  </div></div>
</section>

<section class="pdetail">
  <div class="wrap">
    <div class="detail-grid">
      <aside class="summary" aria-label="Ringkasan paket">
        <h2>Ringkasan paket</h2>
        <p>${esc(p.tagline)}</p>
        <div class="chips">${p.chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
        <div class="d-price"><span>Harga paket ${p.days} hari</span><strong>${fmt(p.price)}</strong><small>net untuk 2 orang, setara ${fmt(p.price / 2)} per orang</small></div>
        <ul class="d-facts">
          <li><b>Menginap</b><span>${esc(p.stay)}. <a href="/#penginapan" class="gold">Lihat foto penginapan</a></span></li>
          <li><b>Jalur ke Togean</b><span>Pilih sendiri: darat dan ferry lewat Gorontalo, atau udara lewat Luwuk Banggai atau Ampana</span></li>
        </ul>
        <a class="btn btn-sun" href="#pesan">Pesan paket ini</a>
      </aside>
      <div>
        <div class="p-photos">${p.photos.map((f) => `<figure>${img(f.file, f.cap)}<figcaption>${esc(f.cap)}</figcaption></figure>`).join('')}</div>
        <h2 class="tl-h">Jadwal perjalanan</h2>
        <ol class="timeline">${timeline}</ol>
        ${p.note ? `<div class="tl-note">${esc(p.note)}</div>` : ''}
        <div class="tl-note">Setelah Anda check in di hotel Manado, perjalanan selesai. Biaya hotel di Manado menjadi tanggungan tamu.</div>
      </div>
    </div>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <div class="sec-head">
      <h2>Paket lainnya</h2>
      <p>Bandingkan dengan paket lain sebelum memutuskan. <a href="/#rute">Lihat dua jalur menuju Togean</a>.</p>
    </div>
    <div class="pkg-grid pkg-grid-4">${others.map((x) => packageCard(x)).join('')}</div>
  </div>
</section>

${bookingSection(p.id)}`;

  return layout({
    title: `Paket Wisata ${p.name} ${p.days} Hari dari Manado | ${site.shortName}`,
    description: truncate(`${p.tagline} Paket ${p.days} hari dari Manado, ${fmt(p.price)} untuk 2 orang (net). Dijemput di Bandara Sam Ratulangi.`, 158),
    path,
    image: `/images/og-${p.id}.jpg`,
    imageAlt: p.cover.alt,
    preload: `<link rel="preload" as="image" href="/images/${p.cover.file}" fetchpriority="high">`,
    jsonld: ld.toScript([ld.organization(), ld.website(), ld.trip(p, { full: true }), ld.breadcrumb([['Beranda', '/'], ['Paket', '/#paket'], [p.name, path]])]),
    body,
  });
}

/* ------------------------------------------------------------------ 404 */

function notFound() {
  return layout({
    title: `Halaman tidak ditemukan | ${site.shortName}`,
    description: 'Halaman yang Anda cari tidak ditemukan.',
    path: '/404',
    noindex: true,
    body: `
<section class="nf">
  <div class="wrap">
    <h1>Halaman ini hanyut terbawa arus.</h1>
    <p>Alamat yang Anda buka tidak ada. Mungkin salah ketik, atau paketnya sudah berpindah.</p>
    <div class="cta"><a class="btn btn-sun" href="/#paket">Lihat semua paket</a><a class="btn btn-line" href="/">Ke beranda</a></div>
  </div>
</section>`,
  });
}

/* ------------------------------------------------------------------ sitemap & robots */

function sitemap() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const abs = (p) => `${config.siteUrl}${p}`;
  const url = (loc, prio, imgs) => `  <url>
    <loc>${esc(abs(loc))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${prio}</priority>
${imgs.map((i) => `    <image:image><image:loc>${esc(abs('/images/' + i))}</image:loc></image:image>`).join('\n')}
  </url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${url('/', '1.0', ['hero.webp', ...gallery.slice(0, 3).map((g) => g.file)])}
${packages.map((p) => url(`/paket/${p.slug}`, '0.9', p.photos.slice(0, 4).map((f) => f.file))).join('\n')}
</urlset>
`;
}

function robots() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${config.siteUrl}/sitemap.xml
`;
}

module.exports = { home, packagePage, notFound, sitemap, robots, findPackage };
