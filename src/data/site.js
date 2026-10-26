'use strict';
/** Konten situs non-paket. Semua teks diambil dari halaman asli. */

const site = {
  name: 'Wulmufikra Togean Islands Tour & Travel',
  shortName: 'Wulmufikra Togean',
  tagline: 'Paket wisata Kepulauan Togean dari Manado',
  whatsapp: '6285189659384',
  whatsappDisplay: '0851 8965 9384',
  phone: '+6285189659384',
  email: 'wulmufikra@gmail.com',
  instagram: 'WMF_tourtravel',
  themeColor: '#0B7F8C',
};

const facts = [
  ['Dijemput di Bandara Sam Ratulangi', 'Manado, lalu diantar ke hotel pilihan Anda saat pulang'],
  ['Pemandu berbahasa Inggris dan Jepang', 'Wans mendampingi sepanjang perjalanan'],
  ['Perorangan maupun grup', 'Wisatawan domestik, mancanegara, peneliti, dan mahasiswa'],
  ['Harga net, tanpa biaya tersembunyi', 'Transportasi, kapal, kabin, dan makan sudah termasuk'],
];

const routes = [
  {
    title: 'Lewat Gorontalo, darat dan kapal',
    intro: 'Jalur panjang yang santai. Semua ongkos dan makan kami yang urus.',
    legs: [
      {
        title: 'Berangkat',
        steps: [
          ['Manado', 'Dijemput di Bandara Sam Ratulangi, sarapan di restoran atau kafe.'],
          ['Perjalanan darat ke Gorontalo', 'Mobil dengan sopir, makan siang di jalan.'],
          ['Pelabuhan Gorontalo', 'Makan malam, lalu naik Ferry Tuna Tomini dan tidur di kamar kabin.'],
          ['Pelabuhan Wakai, Togean', 'Sarapan, lalu lanjut dengan speedboat ke tempat menginap.'],
        ],
      },
      {
        title: 'Pulang',
        steps: [
          ['Speedboat ke Wakai', 'Makan malam di rumah makan pelabuhan, naik ferry dan kabin ke Gorontalo.'],
          ['Gorontalo', 'Sarapan di restoran atau kafe, lalu perjalanan darat sekitar delapan jam.'],
          ['Manado', 'Makan siang di Bintauna, lalu diantar ke hotel pilihan Anda.'],
        ],
      },
    ],
  },
  {
    title: 'Lewat udara, Luwuk atau Ampana',
    intro: 'Pilihan yang lebih cepat bila waktu Anda terbatas.',
    photo: {
      file: 'rute-ampana.webp',
      alt: 'Bandara Tanjung Api, Ampana, dilihat dari udara',
      cap: 'Bandara Tanjung Api, Ampana: tempat Anda mendarat sebelum lanjut dengan speedboat ke Togean',
    },
    legs: [
      {
        title: 'Berangkat',
        steps: [
          ['Manado ke Luwuk Banggai', 'Terbang dari Bandara Sam Ratulangi Manado.'],
          ['Atau Palu ke Tanjung Api, Ampana', 'Terbang lewat Bandara Sis Al-Jufri Palu.'],
          ['Ampana', 'Sarapan, makan siang, tiket speedboat, dan menginap satu malam di hotel atau resor sambil menunggu kapal.'],
          ['Speedboat ke Togean', 'Langsung ke tempat menginap sesuai paket.'],
        ],
      },
      {
        title: 'Pulang',
        steps: [
          ['Bandara Luwuk Banggai', 'Atau Bandara Tanjung Api Ampana, transit di Palu.'],
          ['Diantar sampai tujuan', 'Tiket speedboat, mobil, sarapan, makan siang, dan makan malam kami siapkan.'],
        ],
      },
    ],
  },
];

const routeOptions = [
  'Darat dan ferry lewat Gorontalo',
  'Udara lewat Luwuk Banggai',
  'Udara lewat Palu dan Ampana',
  'Belum tahu, mohon saran',
];

/** Tile "Tempat yang akan Anda datangi". span = kelas grid (s3..s7). */
const places = [
  { name: 'Danau Ubur-ubur', span: 's6', a: '#7A2F9E', b: '#1E1F5C', img: 'danau-ubur-ubur.webp', pos: 'center 62%', alt: 'Snorkeling bersama ubur-ubur di Danau Ubur-ubur',
    text: 'Desa Lembanato. Foto pemandangan dari jembatan, lalu snorkeling untuk melihat ubur-ubur dari dekat. Anda diberi waktu sekitar tiga jam.' },
  { name: 'Burung Alo', span: 's3', a: '#B5651D', b: '#4A2A10', img: 'burung-alo.webp', pos: 'center 15%', alt: 'Burung rangkong (Alo) bertengger di pohon',
    text: 'Desa Tumbulawa. Mengamati burung rangkong bersama pemandu, sore hari.' },
  { name: 'Jembatan Mangrove', span: 's3', a: '#2E8B57', b: '#0D3B2A', img: 'jembatan-mangrove.webp', pos: 'center 55%', alt: 'Jembatan kayu menembus hutan mangrove',
    text: 'Hutan mangrove dan burung-burung endemik di Lembanato.' },
  { name: 'Pulau Papan', span: 's4', a: '#0B7F8C', b: '#06303F', img: 'pulau-papan.webp', pos: 'center 55%', alt: 'Jembatan kayu 950 meter di Pulau Papan',
    text: 'Desa Kadoda. Jembatan 950 meter yang menghubungkan dua pulau, dilewati warga dan anak sekolah setiap hari.' },
  { name: 'Kabalutan', span: 's4', a: '#C0603A', b: '#4B1E3C', img: 'kabalutan-1.webp', pos: 'center', alt: 'Kampung Bajo Kabalutan dilihat dari udara',
    text: 'Kampung suku Bajo, rumah di atas laut. Lihat kerajinan, budaya, dan keseharian para nelayan.' },
  { name: 'Pulau Layang', span: 's4', a: '#1AA6A0', b: '#0A3D5C',
    text: 'Warga Kabalutan menyebutnya Pulau Seribu. Susuri dengan perahu, snorkeling, minum kelapa muda.' },
  { name: 'Bomber Belanda', span: 's5', a: '#44607A', b: '#13212F', img: 'bomber-belanda.webp', pos: 'center 40%', alt: 'Bangkai pesawat tempur Belanda di dasar laut',
    text: 'Desa Lebiti, di depan Pulau Anam. Snorkeling di situs pesawat tempur Belanda yang jatuh di laut.' },
  { name: 'Gunung Colo, Una-Una', span: 's7', a: '#D2543B', b: '#3B1B2E', img: 'una-kawah.webp', pos: 'center 50%', alt: 'Gunung Colo dengan danau toska di kawahnya',
    text: 'Naik ojek ke kaki gunung, mendaki satu sampai dua jam, mencium hawa belerang, dan melihat danau di sekitar kawah. Turunnya mampir ke situs peninggalan Portugis, Belanda, Jepang, dan Kerajaan Togean.' },
  { name: 'Walea', span: 's6', a: '#0E9BB0', b: '#08344A', img: 'walea-bungalow.webp', pos: 'center', alt: 'Bungalow di atas air di Walea',
    text: 'Perahu keliling Pulau Tiga, melihat lumba-lumba, dan snorkeling di laut Lumpatan yang jernih.' },
  { name: 'Poyalisa, Pangempa, Malenge, Kadidiri', span: 's6', a: '#E0A93C', b: '#0E5A6A',
    text: 'Pantai pasir putih, terumbu karang, kelapa muda, dan matahari terbit serta terbenam dari depan bungalow.' },
];

const gallery = [
  'Teluk saat senja, lampu resor mulai menyala',
  'Teras bungalow menghadap pantai pasir putih',
  'Kamar berkelambu dengan hammock dan pemandangan laut',
  'Bungalow panggung di atas pasir putih',
  'Kamar anyaman bambu dengan kelambu',
  'Pantai pasir putih di bawah pohon kelapa',
  'Deretan bungalow di balik kebun kelapa',
  'Makan malam bersama di rumah makan resor',
  'Ruang bungalow berjendela lebar, laut biru di depan mata',
  'Bungalow kayu dengan tangga dan teras luas',
  'Teluk berpasir putih dengan air sebening kaca',
  'Teluk dan terumbu karang dilihat dari udara',
  'Matahari terbenam dari tebing di tepi laut',
].map((alt, i) => ({ file: `penginapan-${String(i + 1).padStart(2, '0')}.webp`, alt }));

const included = [
  'Penjemputan di Bandara Sam Ratulangi Manado dan pengantaran kembali ke hotel di Manado',
  'Mobil dan sopir untuk perjalanan darat Manado, Gorontalo, dan sebaliknya',
  'Tiket Ferry Tuna Tomini beserta kamar kabin, pergi dan pulang',
  'Carter speedboat dan perahu lokal antar pulau',
  'Sarapan, makan siang, dan makan malam selama perjalanan',
  'Menginap di resor, bungalow, atau homestay sesuai jadwal paket',
  'Pemandu perjalanan, termasuk pemandu lokasi untuk paket tertentu',
  'Tiket dan retribusi masuk objek wisata di paket 6 hari, termasuk Taman Laut Togean',
];
const notIncluded = ['Penginapan hotel di Manado setelah perjalanan selesai'];
const notIncludedNote = 'Setelah Anda check in di hotel Manado, perjalanan dinyatakan selesai. Biaya hotel menjadi tanggungan tamu.';

const extras = [
  ['Bunaken', 'Paket satu malam satu hari di Taman Laut Bunaken.'],
  ['Tur Minahasa', 'Paket satu hari mengunjungi beberapa objek wisata di Minahasa.'],
  ['Tangkoko', 'Paket satu malam satu hari di Taman Nasional Tangkoko, Desa Batu Putih, Kota Bitung.'],
];

const team = [
  ['R', 'Ridwan I. Djaelani', 'Direktur. A.Md.Par, SE, MM.Par, MM.Tourism'],
  ['P', 'Murniyanti Putri R. Djaelani, SH', 'Tour Leader, akrab disapa Putri'],
  ['W', 'Wans', 'Pemandu wisata berbahasa Inggris dan Jepang'],
];

const bookingSteps = [
  'Pilih paket, jumlah tamu, dan perkiraan tanggal berangkat.',
  'Kirim lewat WhatsApp. Tim kami membalas dan memastikan jadwal.',
  'Setelah perjalanan dipastikan, Anda membayar lewat transfer dan kami siapkan semuanya.',
];

/** FAQ: dirangkum dari informasi yang sudah ada di halaman, tidak ada klaim baru. */
/** Layanan pemandu saja (tanpa paket perjalanan). Harga dari pemilik usaha. */
const guideService = {
  name: 'Jasa pemandu wisata Kepulauan Togean',
  intro: 'Menerima dan melayani jasa informasi serta pemandu wisata selama kegiatan mengunjungi objek wisata di Kepulauan Togean.',
  prices: [
    { days: 1, label: '1 hari', price: 2000000 },
    { days: 2, label: '2 hari', price: 3000000 },
    { days: 3, label: '3 hari', price: 5000000 },
    { days: 5, label: '5 hari', price: 6000000 },
  ],
  guestPays: [
    'Biaya penginapan',
    'Biaya transportasi',
    'Uang masuk ke objek wisata',
    'Transportasi lokal ke objek wisata',
    'Fasilitas snorkeling',
    'Biaya lain yang dibutuhkan tamu selama kegiatan di objek wisata di Kepulauan Togean',
  ],
};

const faq = [
  ['Apakah harga paket sudah termasuk transportasi dan makan?',
    'Ya. Harga bersifat net: transportasi darat, tiket ferry dan kabin, speedboat, makan, penginapan sesuai jadwal, dan pemandu sudah termasuk. Yang di luar paket hanya hotel di Manado setelah perjalanan selesai.'],
  ['Harga paket untuk berapa orang?',
    'Semua harga di situs ini untuk dua orang, setara setengahnya per orang. Untuk jumlah tamu lain, admin kami akan mengonfirmasi tarifnya.'],
  ['Bagaimana cara menuju Kepulauan Togean dari Manado?',
    'Ada dua jalur. Jalur darat lewat Gorontalo lalu naik Ferry Tuna Tomini ke Pelabuhan Wakai, atau jalur udara lewat Luwuk Banggai atau Palu dan Ampana lalu speedboat. Jalur berangkat dan pulang boleh berbeda.'],
  ['Bagaimana cara memesan dan membayar?',
    'Isi formulir pemesanan, pesan Anda terbuka di WhatsApp dan tinggal dikirim. Tim kami memastikan jadwal, lalu pembayaran lewat transfer ke rekening perusahaan setelah perjalanan dipastikan.'],
  ['Apakah ada pemandu yang berbahasa Inggris atau Jepang?',
    'Ada. Wans, pemandu wisata kami, berbahasa Inggris dan Jepang dan mendampingi sepanjang perjalanan.'],
  ['Bisakah menyewa pemandu saja, tanpa paket perjalanan?',
    'Bisa. Jasa pemandu wisata kami tersedia mulai Rp 2.000.000 untuk 1 hari, Rp 3.000.000 untuk 2 hari, Rp 5.000.000 untuk 3 hari, dan Rp 6.000.000 untuk 5 hari. Biaya penginapan, transportasi, tiket masuk objek wisata, transportasi lokal, fasilitas snorkeling, dan kebutuhan lain selama kegiatan ditanggung tamu.'],
  ['Bisakah menambah tur di sekitar Manado?',
    'Bisa. Kami juga melayani tur tambahan ke Bunaken, Minahasa, dan Taman Nasional Tangkoko.'],
];

module.exports = {
  site, facts, routes, routeOptions, places, gallery, included, notIncluded, notIncludedNote,
  extras, team, bookingSteps, faq, guideService,
};
  
