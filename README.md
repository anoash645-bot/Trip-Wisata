# Wulmufikra Togean Islands: situs paket wisata (Node.js full stack)

Situs paket wisata Kepulauan Togean, dibangun ulang dari satu file HTML menjadi aplikasi full stack
JavaScript **tanpa dependensi npm** (hanya Node.js bawaan, versi 20 ke atas). Tidak ada `npm install`.

## Isi

| Lapisan | Apa yang ada |
|---|---|
| Frontend | HTML dirender di server (SSR), CSS asli Anda, JS vanilla untuk menu, form, dan lightbox |
| Backend | Server HTTP Node.js: halaman, REST API, panel admin, file statis ber-cache |
| SEO Google | Satu URL per paket, `sitemap.xml`, `robots.txt`, canonical, Open Graph, JSON-LD (TravelAgency, TouristTrip, FAQPage, BreadcrumbList) |
| Keamanan | CSP, HSTS, rate limit, honeypot anti-bot, validasi sisi server, token admin |
| Data | File JSON (VPS) atau Google Firestore (Cloud Run / App Engine) |

## Jalankan di komputer

```bash
node server.js          # buka http://localhost:3000
npm test                # 18 tes otomatis
ADMIN_TOKEN=rahasia node server.js   # mengaktifkan /admin
```

## Struktur

```
server.js              titik masuk, graceful shutdown
src/app.js             router, API, halaman
src/data/              packages.json (jadwal paket), packages.js (slug, foto), site.js (teks situs)
src/render/            template HTML, JSON-LD, sitemap
src/lib/               http, validasi, store file & Firestore, rate limit, notifikasi
public/                css, js, images (WebP), admin.html, ikon, manifest
test/                  tes otomatis (node:test)
```

**Mengubah isi:** harga, jadwal, dan teks paket ada di `src/data/packages.json`; teks lain di
`src/data/site.js`. Setelah diubah, restart server.

## API

| Metode | Path | Keterangan |
|---|---|---|
| GET | `/api/packages`, `/api/packages/:slug` | Data paket |
| POST | `/api/bookings` | Simpan pesanan (maks 6 per 10 menit per IP) |
| GET | `/api/admin/bookings?status=` | Daftar pesanan (Bearer `ADMIN_TOKEN`) |
| PATCH | `/api/admin/bookings/:id` | Ubah status |
| GET | `/api/admin/bookings.csv` | Ekspor CSV |
| GET | `/api/health` | Cek kesehatan |

Alur pemesanan: tamu mengisi form, WhatsApp terbuka dengan pesan berisi **kode pesanan**
(mis. `WTG-K4P9XM`), dan pesanan yang sama tersimpan di server. Jika server bermasalah, pemesanan
lewat WhatsApp tetap jalan. Admin melihatnya di `/admin`, dan Telegram/webhook bisa memberi notifikasi.

## Publikasi ke Google Cloud Run (disarankan)

Prasyarat: akun Google Cloud dengan penagihan aktif dan [gcloud CLI](https://cloud.google.com/sdk).

```bash
gcloud config set project ID_PROYEK_ANDA
gcloud services enable run.googleapis.com firestore.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com

# 1. Database pesanan (sekali saja), lokasi Jakarta
gcloud firestore databases create --location=asia-southeast2

# 2. Token admin di Secret Manager
openssl rand -hex 24 | gcloud secrets create togean-admin-token --data-file=-

# 3. Deploy dari folder ini (Cloud Build membuat image dari Dockerfile)
gcloud run deploy togean-wisata --source . --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,STORAGE=firestore,SITE_URL=https://www.domain-anda.com \
  --set-secrets ADMIN_TOKEN=togean-admin-token:latest
```

Beri akses Secret Manager ke service account Cloud Run bila diminta, dan pastikan service account
tersebut punya peran **Cloud Datastore User** agar bisa menulis ke Firestore.

**Domain:** Cloud Run, menu *Manage custom domains*, lalu ikuti petunjuk DNS. Setelah domain aktif,
perbarui `SITE_URL` (`gcloud run services update togean-wisata --update-env-vars SITE_URL=...`).
`SITE_URL` harus sama persis dengan alamat yang dibuka pengunjung; kalau salah, canonical dan sitemap menunjuk ke alamat yang salah.

Catatan biaya dan kecepatan: dengan `min-instances=0` (default) server "tidur" saat sepi dan permintaan
pertama bisa lambat beberapa detik. Untuk SEO yang lebih baik, pertimbangkan `--min-instances=1`
(berbayar). Alternatif: App Engine (`gcloud app deploy`, lihat `app.yaml`) atau VPS biasa dengan
`STORAGE=file`, dijalankan lewat systemd/PM2 di belakang Nginx + HTTPS.

## Agar muncul di Google

1. **Search Console** (search.google.com/search-console): tambahkan properti, verifikasi lewat DNS
   atau isi `GSC_VERIFICATION` dengan isi meta tag yang diberikan.
2. Kirim sitemap: `https://domain-anda.com/sitemap.xml`. Lalu *URL Inspection*, *Request indexing* untuk
   beranda dan lima halaman paket.
3. **Google Business Profile**: daftarkan bisnis, cantumkan alamat situs. Untuk pencarian lokal
   ("wisata Togean dari Manado") ini sering lebih berpengaruh daripada pengaturan teknis.
4. Cek tampilan tautan di WhatsApp/Facebook dan validasi data terstruktur di
   [Rich Results Test](https://search.google.com/test/rich-results) dan
   [Schema Validator](https://validator.schema.org).
5. Isi `GA_ID` bila ingin Google Analytics 4. Cek kecepatan di PageSpeed Insights.

Yang perlu jujur diketahui: kode ini menyiapkan fondasi teknis SEO, tetapi **peringkat tidak bisa dijamin**.
Peringkat bergantung pada usia domain, tautan dari situs lain, ulasan, dan persaingan. Tampilan khusus
FAQ di hasil Google kini hanya untuk situs tertentu; markup-nya tetap tidak merugikan.

## Variabel lingkungan

Lihat `.env.example`. Yang terpenting: `SITE_URL`, `ADMIN_TOKEN`, `STORAGE`.

## Hal yang perlu Anda cek sebelum tayang

- Harga, jadwal, nomor WhatsApp, dan email di `src/data/` sudah sesuai kondisi terbaru.
- Adapter Firestore diuji dengan REST tiruan, belum dengan Firestore sungguhan. Uji satu pesanan
  setelah deploy pertama lalu cek di `/admin`.
- Foto asli dari file HTML Anda dipertahankan (dikonversi ke WebP). Pastikan Anda berhak memakainya.
