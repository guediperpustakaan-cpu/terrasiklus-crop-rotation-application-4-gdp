# TerraSiklus

Aplikasi berbahasa Indonesia untuk pengelolaan kebun, rotasi tanaman, riwayat tanam, dan pelacakan kesehatan tanah.

## Fondasi teknis

- React 19, TypeScript, Tailwind CSS 4, Lucide React.
- **Next.js App Router**, mengikuti fondasi full-stack lingkungan proyek. Next.js digunakan sebagai pengganti Vite agar React, rendering server, dan endpoint API terintegrasi dalam satu deployment.
- PostgreSQL dengan Drizzle ORM dan koneksi `node-postgres`. Kompatibel dengan Neon PostgreSQL melalui koneksi TCP/TLS standar.
- React Hooks untuk navigasi, formulir, filter, pencarian, dan sinkronisasi hasil mutasi API.
- Font dan gambar di `public/` disajikan secara lokal.

## Menjalankan proyek

1. Siapkan PostgreSQL dan atur `DATABASE_URL` pada `.env` (lihat `.env.example`). Jangan memasukkan kredensial ke Git.
2. Pasang dependensi dengan `npm install`.
3. Terapkan migrasi dengan `npx drizzle-kit migrate`.
4. Jalankan `npm run dev` untuk pengembangan, atau `npm run build` untuk build produksi.

Pada lingkungan preview terkelola, runtime akan menyediakan database dan menjalankan server produksi. Migrasi awal sudah tersedia di `drizzle/`.

## Menggunakan Neon

1. Buat proyek Neon dan salin connection string dari panel **Connect**.
2. Set `DATABASE_URL` ke URL pooled untuk aplikasi, dengan `sslmode=require`.
3. Set `DATABASE_URL_UNPOOLED` ke URL direct/non-pooled untuk migrasi.
4. Jalankan `npx drizzle-kit migrate`.
5. Deploy sebagai aplikasi Next.js Node.js dan set kedua variabel tersebut di sisi server. Tidak ada kredensial database di bundle peramban.

Konfigurasi Drizzle memakai `DATABASE_URL_UNPOOLED` jika tersedia, lalu menggunakan `DATABASE_URL` sebagai fallback. Koneksi runtime berada di `src/db/index.ts`.

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

Setelah perubahan skema: `npx drizzle-kit generate`, tinjau SQL, lalu `npx drizzle-kit migrate`.

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

## Validasi

Jalankan dari root:

- `npx next typegen`
- `npm exec tsc -- --noEmit --pretty false`
- `npm run build`

Setelah itu gunakan runtime preview terkelola untuk memeriksa bootstrap dan `/api/health`.

Pengujian end-to-end tersedia di `scripts/smoke.mjs`. Setelah server aktif, siapkan Chromium dengan `npx playwright install --with-deps chromium`, lalu jalankan `node scripts/smoke.mjs`. Gunakan `TEST_BASE_URL` jika server bukan `http://127.0.0.1:3000`. Tes memeriksa navigasi, pencarian, CRUD kebun/petak, penanaman, panen, uji tanah, rekomendasi, peringatan, konkurensi, ekspor CSV, persistensi setelah reload, dan tampilan seluler. Kebun sementara dihapus pada akhir tes; data contoh tetap utuh.

Untuk menjaga format kode, jalankan `npx prettier --write src scripts drizzle.config.ts README.md`.

## Aset

Foto tanaman dari Pexels (Thể Phạm, Bagus Prabangkara, Helena Lopes, Boys in Bristol Photography). Hero kebun dibuat khusus untuk TerraSiklus. Plus Jakarta Sans dilisensikan dengan SIL Open Font License. Ikon Lucide berlisensi ISC.
