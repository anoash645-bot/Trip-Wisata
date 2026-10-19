'use strict';
const config = require('../config');
const { site } = require('../data/site');
const { assetUrl } = require('../lib/http');
const { esc, img } = require('./helpers');

const NAV = [['paket', 'Paket'], ['rute', 'Rute'], ['tempat', 'Tempat'], ['penginapan', 'Penginapan'], ['termasuk', 'Termasuk'], ['tentang', 'Tentang']];
const WA_URL = `https://wa.me/${site.whatsapp}`;

const header = (home) => {
  const p = home ? '' : '/';
  return `
<header class="top">
  <div class="wrap top-in">
    <a class="logo" href="/" aria-label="${esc(site.name)}, beranda">
      <img class="logo-img" src="/images/logo-92.webp" width="46" height="52" alt="Logo ${esc(site.name)}">
      <span><b>${esc(site.shortName)}</b><small>Islands Tour &amp; Travel</small></span>
    </a>
    <nav class="menu" id="menu" aria-label="Menu utama">
      ${NAV.map(([id, label]) => `<a href="${p}#${id}">${label}</a>`).join('')}
      <a class="menu-cta" href="${p}#pesan">Pesan sekarang</a>
    </nav>
    <div class="top-actions">
      <a class="btn btn-sun" href="${p}#pesan">Pesan sekarang</a>
      <button class="menu-toggle" id="menuToggle" type="button" aria-expanded="false" aria-controls="menu" aria-label="Buka menu"><span></span></button>
    </div>
  </div>
</header>`;
};

const footer = () => `
<footer>
  <div class="wrap foot">
    <div>${img('logo.webp', `Logo WMF ${site.shortName} Islands`, { cls: 'foot-logo' })}<b>Wulmufikra Togean Islands</b>Tour &amp; Travel, Kepulauan Togean.<br>Berangkat dari Manado.</div>
    <div><b>Hubungi kami</b>WhatsApp: <a href="${WA_URL}" target="_blank" rel="noopener">${esc(site.whatsappDisplay)}</a><br>Email: <a href="mailto:${site.email}">${site.email}</a><br>Instagram: <a href="https://instagram.com/${site.instagram}" target="_blank" rel="noopener">@${site.instagram}</a></div>
    <small>Harga dan jadwal dapat disesuaikan. Hubungi kami untuk konfirmasi terbaru sebelum memesan. &copy; ${new Date().getFullYear()} ${esc(site.name)}.</small>
  </div>
</footer>
<a class="wa" href="${WA_URL}" target="_blank" rel="noopener" aria-label="Chat WhatsApp">
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.200zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8-.2-.1-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100-1.500-.7-2.500-1.300-3.500-2.900-.3-.5.300-.5.800-1.500.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.100-.7.300-.7.700-1 1.500-1 2.400.1 1 .5 2 1.200 2.800 1.300 1.700 3 3 5 3.700 1.800.6 2.400.5 3.200.4.700-.1 1.600-.7 1.800-1.400.2-.6.200-1.200.1-1.300-.1-.1-.3-.2-.5-.3z"/></svg>
  <span>Chat WhatsApp</span>
</a>`;

/**
 * Kerangka halaman HTML lengkap dengan meta SEO, Open Graph, Twitter Card, canonical, dan JSON-LD.
 */
function layout({ title, description, path, image = '/images/og-image.jpg', imageAlt = '', jsonld = '', body, home = false, noindex = false, preload = '', lightbox = false }) {
  const url = `${config.siteUrl}${path}`;
  const ogImage = `${config.siteUrl}${image}`;
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="${site.themeColor}">
${config.gscVerification ? `<meta name="google-site-verification" content="${esc(config.gscVerification)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="id_ID">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt || title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
${preload}
<link rel="stylesheet" href="${assetUrl('/css/style.css')}">
${jsonld}
${config.gaId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${config.gaId}"></script>\n<script defer src="${assetUrl('/js/ga.js')}" data-id="${config.gaId}"></script>` : ''}
</head>
<body>
<a class="skip" href="#utama">Lompat ke konten</a>
${header(home)}
<main id="utama">
${body}
</main>
${footer()}
${lightbox ? `<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Galeri foto penginapan">
  <button class="lb-btn lb-x" id="lbX" type="button" aria-label="Tutup">&#10005;</button>
  <button class="lb-btn lb-p" id="lbP" type="button" aria-label="Foto sebelumnya">&#8249;</button>
  <button class="lb-btn lb-n" id="lbN" type="button" aria-label="Foto berikutnya">&#8250;</button>
  <img id="lbImg" alt="">
  <p id="lbCap"></p>
</div>` : ''}
<script src="${assetUrl('/js/app.js')}" defer></script>
</body>
</html>`;
}

module.exports = { layout, WA_URL };
