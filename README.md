# TerraSiklus

Aplikasi berbahasa Indonesia untuk pengelolaan kebun, rotasi tanaman, riwayat tanam, dan pelacakan kesehatan tanah.

## Fondasi teknis

- React 19, TypeScript, Tailwind CSS 4, Lucide React.
- **Next.js App Router**, mengikuti fondasi full-stack lingkungan proyek. Next.js digunakan sebagai pengganti Vite agar React, rendering server, dan endpoint API terintegrasi dalam satu deployment.
- PostgreSQL dengan Drizzle ORM dan koneksi `node-postgres`. Kompatibel dengan Neon PostgreSQL melalui koneksi TCP/TLS standar.
- React Hooks untuk navigasi, formulir, filter, pencarian, dan sinkronisasi hasil mutasi API.
- Font dan gambar di `public/` disajikan secara lokal.

## Menjalankan proyek

1. Siapkan PostgreSQL dan atur `DATABASE_URL` pada `.env.local` (lihat `.env.example`). Jangan memasukkan kredensial ke Git — `.env` dan `.env.local` sudah masuk `.gitignore`.
2. Pasang dependensi dengan `npm install`.
3. Terapkan migrasi dengan `npm run db:migrate` (perintah ini membaca `.env.local` lalu `.env`).
4. Jalankan `npm run dev` untuk pengembangan, atau `npm run build` && `npm start` untuk build produksi.

Koneksi database dibuat secara **lazy**: modul `src/db/index.ts` baru membuka koneksi PostgreSQL saat query pertama dijalankan. Karena itu `npm run build` tetap berhasil di lingkungan build yang belum punya `DATABASE_URL` (misalnya build di Vercel), dan pesan "DATABASE_URL is required" hanya muncul ketika aplikasi benar-benar membutuhkan database.

Pada lingkungan preview terkelola, runtime akan menyediakan database dan menjalankan server produksi. Migrasi awal sudah tersedia di `drizzle/`.

## Menggunakan Neon

1. Buat proyek Neon dan salin connection string dari panel **Connect**.
2. Set `DATABASE_URL` ke URL pooled untuk aplikasi, dengan `sslmode=require`.
3. Set `DATABASE_URL_UNPOOLED` ke URL direct/non-pooled untuk migrasi (beda host: tanpa awalan `-pooler`).
4. Jalankan `npm run db:migrate`.
5. Deploy sebagai aplikasi Next.js Node.js dan set kedua variabel tersebut di sisi server. Tidak ada kredensial database di bundle peramban.

Contoh isi `.env.local`:

```bash
# URL pooled (runtime aplikasi)
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require

# URL direct (migrasi) — host tanpa "-pooler"
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require
```

Konfigurasi Drizzle memakai `DATABASE_URL_UNPOOLED` jika tersedia, lalu menggunakan `DATABASE_URL` sebagai fallback. Koneksi runtime berada di `src/db/index.ts`.

> Penting: URL pooled Neon memakai mode PgBouncer _transaction_. Kode ini tetap aman karena transaksi Drizzle memakai satu koneksi khusus (`pool.connect()`), dan advisory lock dipakai untuk menjaga integritas data.

## Deploy ke Vercel

1. Push repositori ke GitHub lalu import ke Vercel (framework terdeteksi otomatis: Next.js).
2. Di **Project Settings → Environment Variables**, tambahkan untuk **Production**, **Preview**, dan **Development**:
   - `DATABASE_URL` → URL pooled Neon (wajib ada di runtime).
   - `DATABASE_URL_UNPOOLED` → URL direct Neon (dipakai saat migrasi manual).
3. **Build Command** biarkan `npm run build`, **Output Directory** biarkan `.next` (default Next.js di Vercel).
4. Jalankan migrasi sekali sebelum/− setelah deploy pertama, dari mesin lokal dengan kredensial Neon:
   ```bash
   npm run db:migrate
   ```
   atau jalankan perintah yang sama di Vercel Shell / CI.
5. Verifikasi deploy:
   - `https://YOUR-APP.vercel.app/api/health` → `{"ok":true}`
   - `https://YOUR-APP.vercel.app/` → dashboard terisi data contoh.

Tidak ada build step yang butuh kredensial database, dan `DATABASE_URL` hanya dipakai di server (runtime Node.js), bukan di bundle peramban.

## Skema dan migrasi

Sumber skema: `src/db/schema.ts`.

- `profiles`: profil ruang kerja.
- `farms`: kebun dan lokasi, terkait profil pemilik.
- `plots`: petak, luas dalam m², jenis tanah, terkait kebun.
- `plant_families`: keluarga botani.
- `crops`: katalog tanaman, keluarga, kebutuhan hara, estimasi hari panen, gambar.
- `plantings`: petak, tanaman, tanggal tanam, tanggal panen aktual, perkiraan panen, catatan.
- `soil_tests`: tanggal, pH, nitrogen, fosfor, kalium, persentase bahan organik, dan waktu pencatatan untuk mengurutkan beberapa hasil pada hari yang sama.

Foreign key, indeks tanggal/petak, constraint luas positif, tanggal panen, rentang pH, dan nilai hara didefinisikan di skema dan migrasi SQL. Penghapusan kebun/petak menghapus catatan terkait melalui cascade dan selalu dikonfirmasi di UI.

Setelah perubahan skema: `npm run db:generate`, tinjau SQL, lalu `npm run db:migrate`.

## Data contoh

Akses pertama mengisi satu ruang kerja contoh dengan Andi Pratama, satu kebun, empat petak, dua belas tanaman, delapan keluarga botani, tujuh catatan penanaman, dan dua belas hasil uji tanah. Tanggal contoh relatif terhadap waktu pengisian awal, bukan tanggal yang berubah pada setiap render.

Pengisian menggunakan transaksi dan advisory lock PostgreSQL sehingga aman dari permintaan awal bersamaan. Profil penanda mencegah kebun contoh dibuat kembali setelah dihapus.

**Batasan autentikasi:** versi ini adalah ruang kerja contoh bersama tanpa login. ID pemilik ditetapkan di sisi server. Jangan gunakan untuk data pribadi sensitif. Sebelum membuka produk multi-pengguna, tambahkan autentikasi, isolasi tenant per sesi, rate limiting, dan otorisasi pemilik di setiap query. API tidak mengklaim autentikasi yang belum diimplementasikan.

## Halaman

- `/`: dashboard interaktif.
- `/?halaman=gardens`: kebun dan petak.
- `/?halaman=rotation`: rekomendasi rotasi.
- `/?halaman=history`: riwayat, pencarian, filter, ekspor CSV.
- `/?halaman=soil`: hasil uji dan grafik pH.
- `/?halaman=catalog`: katalog dengan filter keluarga dan kebutuhan hara.
- `/tentang`: landing page pengenalan, terhubung dari panduan.

Navigasi mendukung tombol kembali/maju browser, tautan halaman langsung, pencarian global, dialog keyboard, dan menu seluler.

## API

Handler: `src/app/api/[resource]/route.ts`.

| Endpoint                    | Metode                   | Kegunaan                              |
| --------------------------- | ------------------------ | ------------------------------------- |
| `/api/health`               | GET                      | Kesehatan aplikasi dan database       |
| `/api/workspace`            | GET                      | Semua data ruang kerja                |
| `/api/profiles`             | GET, PATCH               | Membaca/mengubah nama tampilan        |
| `/api/farms`                | GET, POST, PATCH, DELETE | CRUD kebun                            |
| `/api/plots`                | GET, POST, PATCH, DELETE | CRUD petak                            |
| `/api/plant-families`       | GET                      | Keluarga botani                       |
| `/api/crops`                | GET                      | Katalog tanaman                       |
| `/api/plantings`            | GET, POST, PATCH, DELETE | Penanaman, rencana, panen, catatan    |
| `/api/soil-tests`           | GET, POST, DELETE        | Hasil pengujian tanah                 |
| `/api/rotation?plotId=UUID` | GET                      | Rekomendasi yang dianalisis di server |

Semua badan permintaan menggunakan JSON dan nama field camelCase yang sesuai tipe di `src/lib/types.ts`. PATCH dan DELETE memerlukan `id` (kecuali profil ruang kerja). Tanggal berformat `YYYY-MM-DD`. Respons kegagalan berbentuk `{ "error": "Pesan Bahasa Indonesia" }` dengan status 400, 404, 409, atau 500. POST berhasil mengembalikan data baru dengan status 201.

Untuk membuat penanaman, kirim `plotId`, `cropId`, `plantedOn`, `expectedHarvestOn`, `notes`, opsional `harvestedOn` dan `allowRepeat`. Untuk panen aktual, PATCH dengan `id`, `harvestedOn`, dan `notes`. Rencana tanam adalah penanaman dengan tanggal di masa depan; tidak dihitung sebagai tanaman aktif saat ini.

Hasil uji menggunakan pH 0–14, N/P/K dalam mg/kg (ppm), dan `organicMatter` dalam persen 0–100. Semua nilai diverifikasi di server dan database. Tanggal uji serta panen aktual tidak boleh di masa depan.

## Mesin rotasi

Logika murni: `src/lib/garden.ts`. Komponen: `src/components/rotation-engine.tsx`.

- Mengidentifikasi penanaman terakhir di petak (atau sebelum tanggal rencana yang dikirim).
- Merekomendasikan keluarga botani berbeda.
- Memprioritaskan Fabaceae sesudah tanaman berkebutuhan hara tinggi.
- Memberikan alasan spesifik untuk setiap tanaman.
- Menampilkan peringatan keluarga sama dan membutuhkan konfirmasi eksplisit `allowRepeat` sebelum penyimpanan. API memeriksa ulang aturan ini; checkbox bukan satu-satunya pengaman.
- Memeriksa tumpang tindih periode tanam di petak yang sama.
- Memberi catatan kondisi pH asam bila diperlukan.

Ini adalah panduan agronomi umum, bukan jaminan bebas hama. Kebutuhan hara dan pH bergantung pada varietas, iklim, tekstur tanah, dan metode laboratorium.

## Komponen utama

- `layout.tsx`: sidebar, topbar, pencarian global, notifikasi.
- `dashboard.tsx`: statistik dan agenda berbasis data nyata.
- `plot-card.tsx` / `plot-detail.tsx`: kartu petak dan detail bertab.
- `rotation-engine.tsx`: mengambil rekomendasi server dan menyusun rencana.
- `planting-form.tsx`: penanaman, rencana, riwayat, peringatan rotasi.
- `soil-form.tsx` / `soil-tracker.tsx`: uji tanah dan grafik.
- `pages.tsx`: pengelolaan kebun, katalog, riwayat, panduan.
- `forms.tsx`: formulir CRUD, panen, profil, konfirmasi penghapusan.
- `ui.tsx`: dialog dengan focus trap dan Escape, badge, status kosong, error.
- `trakteer-widget.tsx`: gelembung dukungan Trakteer di pojok kanan bawah beserta QR code.
- `support.ts` (`src/lib/support.ts`): konstanta halaman Trakteer, nominal, dan tautan unduh source code.

## Widget dukungan Trakteer

Tombol bulat merah di pojok kanan bawah (khas overlay Trakteer) membuka panel dukungan **tanpa berpindah halaman**. Isinya:

- Teks: "Web app ini gratis & bebas iklan. Kopi kecil, server tetap jalan".
- Pilihan nominal kelipatan dua mulai dari Rp6.000: Rp6.000, Rp12.000, Rp24.000, Rp48.000, Rp96.000, Rp192.000.
- QR code yang digenerate di sisi peramban (`qrcode-generator`, lisensi MIT, tanpa dependensi tambahan) berisi tautan Trakteer dengan nominal terpilih, jadi nominal bisa langsung dipindai.
- Tombol "Buka Trakteer" dan "Salin tautan" untuk aplikasi pembayaran lain.

Semua nominal adalah kelipatan dari unit "Kopi" Rp6.000 milik kreator, sehingga jumlah kopi di Trakteer selalu bulat. Target halaman Trakteer diatur di `src/lib/support.ts`:

```ts
export const TRAKTEER_PROFILE = "https://trakteer.id/perpus_opera";
export const TRAKTEER_TIP = "https://trakteer.id/perpus_opera/tip";
```

Panel bisa ditutup dengan tombol tutup, klik di luar, atau tombol Escape, dan fokus dikembalikan ke tombol pemicu.

## Unduh source code

Tombol "Unduh Source Code" di footer aplikasi, footer landing page, dan panel dukungan mengunduh arsip `terrasiklus-source.zip` yang berisi seluruh source project (folder `src/`, `public/`, `scripts/`, `drizzle/`, konfigurasi, `LICENSE`, dan `README.md`).

Arsip dibuat oleh `scripts/package-source.mjs` — penulis ZIP kecil tanpa dependensi tambahan, memakai `node:zlib` (`deflateRaw` + `crc32`). Perintah:

```bash
npm run source:package
```

Skrip tersebut juga dijalankan otomatis oleh `prebuild` dan `predev`, jadi file zip selalu tersedia saat build produksi maupun saat pengembangan lokal. File rahasia tidak pernah ikut: `.env`, `.env.local`, dan berkas `.env.*` lain dikecualikan, `node_modules/`, `.next/`, dan `artifacts/` juga tidak disertakan.

## Lisensi

MIT — lihat berkas `LICENSE`.

**Open Source oleh MZF - 2026.**

## Validasi

Jalankan dari root:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

Ketiganya harus lolos tanpa error. `npm run build` sengaja tetap berjalan tanpa `DATABASE_URL` untuk mencerminkan kondisi build di Vercel.

Setelah itu gunakan runtime preview terkelola untuk memeriksa bootstrap dan `/api/health`.

Pengujian end-to-end tersedia di `scripts/smoke.mjs`. Setelah server aktif, siapkan Chromium dengan `npx playwright install --with-deps chromium`, lalu jalankan `npm run smoke`. Gunakan `TEST_BASE_URL` jika server bukan `http://127.0.0.1:3000`. Tes memeriksa navigasi, pencarian, CRUD kebun/petak,planting, panen, uji tanah, rekomendasi, peringatan, konkurensi, ekspor CSV, persistensi setelah reload, tampilan seluler, widget dukungan Trakteer, dan unduh source code. Kebun sementara dihapus pada akhir tes; data contoh tetap utuh.

Untuk menjaga format kode, jalankan `npx prettier --write src scripts drizzle.config.ts README.md`.

## Aset

- Foto tanaman dan hero kebun berada di `public/images/`. Ilustrasi dibuat oleh `scripts/generate-assets.mjs` (SVG → JPEG memakai `sharp`), jalankan `npm run assets` untuk membuat ulang.
- Font Plus Jakarta Sans (lisensi SIL Open Font License, `public/fonts/OFL.txt`) memakai subset latin dan latin-ext di `public/fonts/`.
- Ikon Lucide berlisensi ISC.
- Pustaka `qrcode-generator` (MIT) membuat QR code widget dukungan.
