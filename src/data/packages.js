'use strict';
const raw = require('./packages.json');

/**
 * Metadata tambahan per paket: slug URL (untuk SEO), foto sampul, dan galeri.
 * Teks jadwal sendiri ada di packages.json (sumber tunggal kebenaran).
 */
const meta = {
  una: {
    slug: 'una-una-gunung-colo',
    cover: { file: 'una-danau.webp', alt: 'Danau dan perbukitan hijau di Una-Una' },
    photos: [
      { file: 'una-kawah.webp', cap: 'Danau-danau berwarna toska di sekitar kawah gunung api' },
      { file: 'una-danau.webp', cap: 'Danau dan perbukitan hijau di Una-Una' },
      { file: 'masjid-tua-1.webp', cap: 'Masjid Tua Una-Una, bangunan bersejarah beratap seng merah dan bermenara' },
      { file: 'masjid-tua-2.webp', cap: 'Masjid Tua di tengah kebun kelapa dan hutan Una-Una' },
      { file: 'rumah-adat-1.webp', cap: 'Rumah adat panggung Banua Oge, situs cagar budaya peninggalan masa lampau' },
      { file: 'rumah-adat-2.webp', cap: 'Rumah adat panggung berukir dari kayu dengan tangga dan beranda luas' },
      { file: 'benteng.webp', cap: 'Benteng bersejarah berbentuk segi lima di kaki gunung, menghadap teluk' },
      { file: 'dermaga-una.webp', cap: 'Dermaga kayu dan penginapan di tepi pantai berpohon kelapa' },
    ],
  },
  walea: {
    slug: 'walea',
    cover: { file: 'walea-bungalow.webp', alt: 'Bungalow di atas air dan terumbu karang Walea dilihat dari udara' },
    photos: [{ file: 'walea-bungalow.webp', cap: 'Bungalow di atas air, dikelilingi terumbu karang' }],
  },
  bajau: {
    slug: 'kampung-bajo-kabalutan',
    cover: { file: 'kabalutan-1.webp', alt: 'Kampung suku Bajo Kabalutan di atas karang, dilihat dari udara' },
    photos: [
      { file: 'kabalutan-1.webp', cap: 'Kabalutan, kampung suku Bajo yang dibangun di atas karang di tengah laut' },
      { file: 'kabalutan-2.webp', cap: 'Warga suku Bajo berkumpul di dermaga kayu kampung mereka' },
      { file: 'bomber-belanda.webp', cap: 'Situs bomber Belanda di depan Pulau Anam dan Desa Lebiti' },
    ],
  },
  bisnis: {
    slug: 'kelas-bisnis-keliling-togean',
    cover: { file: 'danau-ubur-ubur.webp', alt: 'Snorkeling bersama ubur-ubur di Danau Ubur-ubur, Togean' },
    photos: [
      { file: 'danau-ubur-ubur.webp', cap: 'Snorkeling bersama ubur-ubur di Danau Ubur-ubur, Togean' },
      { file: 'jembatan-mangrove.webp', cap: 'Jembatan Mangrove: berjalan di atas jembatan kayu menembus hutan mangrove' },
      { file: 'pulau-papan.webp', cap: 'Pulau Papan, Desa Kadoda: jembatan kayu sepanjang 950 meter yang menghubungkan dua pulau di atas terumbu karang' },
      { file: 'burung-alo.webp', cap: 'Burung Alo (rangkong) yang diamati di Desa Tumbulawa' },
    ],
  },
  grand: {
    slug: 'grand-tour-togean',
    cover: { file: 'hero-1100.webp', alt: 'Pulau-pulau hijau dan laut toska Kepulauan Togean dilihat dari udara' },
    photos: [
      { file: 'danau-ubur-ubur.webp', cap: 'Snorkeling bersama ubur-ubur di Danau Ubur-ubur, Togean' },
      { file: 'burung-alo.webp', cap: 'Burung Alo (rangkong) yang diamati di Desa Tumbulawa' },
      { file: 'jembatan-mangrove.webp', cap: 'Jembatan Mangrove: berjalan di atas jembatan kayu menembus hutan mangrove' },
      { file: 'pulau-papan.webp', cap: 'Pulau Papan, Desa Kadoda: jembatan kayu sepanjang 950 meter yang menghubungkan dua pulau di atas terumbu karang' },
      { file: 'kabalutan-1.webp', cap: 'Kabalutan, kampung suku Bajo yang dibangun di atas karang di tengah laut' },
      { file: 'bomber-belanda.webp', cap: 'Situs bomber Belanda di depan Pulau Anam dan Desa Lebiti' },
    ],
  },
};

const packages = raw.map((p) => {
  const m = meta[p.id];
  if (!m) throw new Error(`Metadata paket "${p.id}" belum dibuat`);
  const { days_: schedule, ...rest } = p;
  return { ...rest, ...m, schedule };
});

const bySlug = new Map(packages.map((p) => [p.slug, p]));
const byId = new Map(packages.map((p) => [p.id, p]));

module.exports = {
  packages,
  findPackage: (key) => bySlug.get(key) || byId.get(key) || null,
  packageIds: packages.map((p) => p.id),
};
