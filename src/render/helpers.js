'use strict';
const images = require('../data/images.json');

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** 30000000 -> "Rp 30.000.000" (tidak bergantung pada ICU Node). */
const fmt = (n) => 'Rp ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const truncate = (s, max) => (s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…');

/** <img> dengan width/height dari manifest, supaya tidak terjadi layout shift. */
function img(file, alt, { cls = '', loading = 'lazy', priority = false, sizes = '' } = {}) {
  const dim = images[file];
  if (!dim) throw new Error(`Gambar tidak ada di manifest: ${file}`);
  return `<img${cls ? ` class="${cls}"` : ''} src="/images/${file}" alt="${esc(alt)}" width="${dim.w}" height="${dim.h}"` +
    `${sizes ? ` sizes="${sizes}"` : ''} decoding="async"` +
    (priority ? ' fetchpriority="high"' : ` loading="${loading}"`) + '>';
}

module.exports = { esc, fmt, truncate, img, images };
