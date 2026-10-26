# Reoutfit

Prototipe website sewa outfit untuk proyek mahasiswa Venture Creation. HTML dan Vanilla JavaScript tetap menjadi aplikasi utama; Tailwind CSS 4 dan Preline UI menghasilkan styling statis, dengan GSAP untuk transisi ringan. Tidak ada backend, API key, atau autentikasi sungguhan.

## Development di Windows

Gunakan Node.js 22 atau lebih baru (pengujian saat ini memakai Node 24) dan Python 3. Jalankan dari PowerShell di folder proyek:

```powershell
Set-Location D:\Projects\reoutfit
npm.cmd ci
npm.cmd run build
npm.cmd run serve
```

Buka **http://127.0.0.1:8000/**. Jika server dari sesi sebelumnya masih aktif, cukup buka alamat tersebut; jangan jalankan server kedua pada port yang sama. Pengguna baru masuk ke halaman Login. Gunakan alias demo yang tersedia dan kata sandi publik **reoutfit123**. Jangan gunakan kata sandi pribadi. Akun yang belum terverifikasi mendapat tawaran verifikasi dan pilihan **Lewati untuk sekarang**.

Untuk mengubah styling, buka terminal PowerShell kedua:

```powershell
Set-Location D:\Projects\reoutfit
npm.cmd run watch
```

`npm.cmd run dev` juga menjalankan watch. Segarkan browser setelah perubahan HTML/JS/CSS; tidak ada bundler atau hot reload. `npm.cmd` menghindari kendala execution policy pada `npm.ps1`. Hentikan server/watch dengan Ctrl+C. Jangan membuka HTML melalui `file://`, karena aplikasi memakai modul ES.

## Build CSS dan aset

- `styles/tailwind.css` memuat Tailwind, variants Preline, plugin Forms, font, dan token desain bersama. Plugin Forms memakai strategi class agar reset tidak mengubah form lama tanpa kendali; native select menggunakan normalisasi `form-select`.
- Scanner secara eksplisit mencakup `dist/**/*.html`, `dist/**/*.js`, dan `dist/**/*.mjs`, serta JavaScript Preline. Variasi class ditulis sebagai nama lengkap atau mapping statis.
- `styles/components.css` berisi komponen bersama berbasis `@apply`. `styles/legacy.css` mempertahankan layout domain yang belum perlu ditulis ulang (detail, pesanan, pengembalian, dashboard). Aturan navbar, tombol, form, kartu, chat, dan hero lama yang digantikan telah dihapus.
- CSS lama berada di layer `components`; utility Tailwind dapat menimpanya dengan urutan yang jelas. Hanya **satu** stylesheet hasil build dimuat oleh HTML.
- `npm.cmd run build` menulis `dist/styles.css` yang diminifikasi. `scripts/prepare-vendor.mjs` menyalin plugin password Preline non-auto, GSAP core, dan atribusinya ke `dist/vendor`, serta menghasilkan helper ikon dari SVG Lucide lokal. Build **tidak menghapus folder dist**, modul aplikasi, foto outfit, atau logo.
- Plugin Preline diinisialisasi hanya pada form password yang aktif dan dilepas ketika form/dialog berganti. Tidak ada referensi runtime ke `node_modules` atau CDN. Preline menggunakan Lucide sebagai set ikon utamanya; SVG lokal dan lisensinya ada di `dist/assets/icons`.
- Token berry/pink, font Aileron, ukuran teks, spacing, radius, shadow, serta durasi 180/380/900 ms ada pada sumber Tailwind. Foto dan carousel menghormati reduced motion; dots tetap terlihat, kontrol jeda hanya muncul saat fokus keyboard. Spasi pada carousel mengubah status putar/jeda.
- `dist/ui/motion.mjs` memakai GSAP untuk entrance 400 ms dan feedback pilihan 180 ms. `gsap.matchMedia()` menonaktifkan animasi saat reduced motion dan membersihkan tween/listener saat route berubah. Scroll tetap native; tidak ada scroll hijacking atau plugin animasi tambahan.

## Fitur dan batas demo

- Pengunjung dapat membuka katalog, memakai filter, melihat detail outfit, memilih tanggal, dan menyiapkan ringkasan sewa tanpa masuk.
- Masuk/daftar memakai **alias demo bawaan** dan kode publik `reoutfit123`, tanpa email atau kredensial tersimpan. Ini bukan autentikasi nyata.
- Konfirmasi pesanan memerlukan akun penyewa terverifikasi; penerbitan listing memerlukan akun pemilik terverifikasi. Login dan verifikasi dilanjutkan dari aksi yang sedang dikerjakan. Membatalkan dialog tetap mempertahankan isian form.
- Verifikasi memakai kartu **contoh KTP dummy bawaan**. Tidak ada unggahan KTP, input NIK, atau pemeriksaan identitas nyata. Statusnya `unverified`, `pending`, `verified`, dan `rejected`; hasil dapat disimulasikan sendiri.
- Listing, pesanan, foto kondisi, pengembalian, laporan masalah, chat, dan ulasan tersimpan secara lokal. Tab pada browser dan alamat situs yang sama dapat berbagi perubahan. Ini belum menghubungkan pengguna atau perangkat berbeda.
- Pilihan pembayaran, pemeriksaan, dan pengembalian deposit masih simulasi. Konfirmasi membuat pesanan baru; transaksi baru selesai setelah outfit dikembalikan dan pemeriksaan selesai. Tidak ada uang yang ditagih atau dipindahkan.

Pemesanan mempunyai tiga tahap: **pilih outfit dan tanggal → periksa ringkasan → konfirmasi pesanan**. Pengguna baru masih perlu masuk/daftar dan verifikasi. Tiga tahap bukan janji selesai dalam tiga klik.

## Aturan sewa

| Aturan | Perilaku demo |
| --- | --- |
| Durasi | 1–7 hari; hari pertama ikut dihitung. Mulai tanggal 10 selama 3 hari berarti kembali tanggal 12. |
| Tanggal mulai | Hari ini boleh dipilih jika tersedia. Pilihan awal dua hari ke depan, bukan batas minimum pemesanan. |
| Harga sewa | Minimal Rp1.000 per hari. Subtotal = tarif per hari × durasi. |
| Biaya platform | 10% subtotal sewa, terpisah dari deposit dan ongkir. Ini asumsi model bisnis awal. |
| Deposit | Dicatat terpisah; bukan pendapatan dan tidak otomatis hangus. |
| Kurir | Ongkir contoh Rp40.000 pulang-pergi; alamat wajib. |
| COD | Hanya untuk ambil langsung. Simulasi sewa dibayar saat bertemu; deposit dan biaya platform di awal. |
| Foto listing/kondisi | JPEG, PNG, atau WebP; maksimal 4 foto dan 5 MB per foto. Gunakan foto outfit contoh. |
| Ulasan | Nilai bulat 1–5, komentar opsional maksimal 500 karakter, satu ulasan per transaksi selesai milik penyewa. Balasan pemilik terpisah dari nilai outfit. |

Contoh Korean set Rp55.000 × 3 hari: sewa Rp165.000 + biaya platform Rp16.500 + deposit Rp100.000 = **Rp281.500** untuk ambil langsung, atau **Rp321.500** dengan kurir.

## Panduan demo dua tab

Gunakan dua tab pada browser yang sama dengan alamat yang sama, misalnya keduanya `http://localhost:5500`. Siapkan foto outfit contoh seperti `dist/assets/korean.webp`.

1. **Tab penyewa:** buka Korean set, pilih tanggal tersedia dan durasi, lalu **Periksa ringkasan**. Klik **Isi data contoh**, pilih cara menerima/pembayaran, dan setujui syarat. Hindari nama, nomor telepon, dan alamat nyata.
2. Klik **Konfirmasi pesanan**. Masuk atau daftar sebagai **Penyewa Demo**, ajukan verifikasi simulasi, lalu pilih **Simulasikan disetujui**. Aksi dilanjutkan dan pesanan muncul. Coba **Batal**, **Nanti saja**, atau hasil ditolak untuk melihat bahwa pesanan belum dibuat dan isian tetap ada.
3. **Tab pemilik:** buka menu akun dan masuk sebagai **Lemari Nara**, pemilik Korean set. Buka **Pesanan**, temukan pesanan tadi, pilih foto kondisi awal, lalu klik **Simpan foto kondisi**. Sesi tab penyewa tetap memakai Penyewa Demo.
4. **Tab penyewa:** buka pesanan, periksa foto awal, lalu **Konfirmasi penerimaan** dengan foto saat diterima dan persetujuan kondisi. Coba chat pesanan dari kedua tab.
5. **Tab penyewa:** klik **Kembalikan outfit**, isi kondisi dan bukti foto, setujui pernyataan pengembalian, lalu kirim. **Tab pemilik:** pilih foto kondisi akhir, klik **Simpan foto kondisi**, lalu **Simulasikan pemeriksaan selesai**. Jika ada laporan terbuka, selesaikan simulasi kesepakatan tanpa potongan sebelum melanjutkan pemeriksaan.
6. Setelah selesai, penyewa dapat memberi ulasan outfit dan pemilik dapat memberi balasan. Nilai outfit hanya berasal dari ulasan penyewa atas transaksi selesai.
7. Untuk listing baru, masuk sebagai pemilik, buka **Tambah outfit**, isi foto, ukuran, harga, dan syarat. **Simpan draft** boleh dilakukan sebelum verifikasi; **Terbitkan listing** memerlukan akun pemilik terverifikasi. Listing terbit dapat dilihat di tab lain.

Data terbit dan transaksi bertahan setelah reload selama penyimpanan browser tersedia. **Draft listing dan isian penerima hanya ada di memori halaman; reload menghapusnya.** Menu reset data menghapus data demo bersama dan memperbarui tab lain. Keluar akun hanya mengakhiri sesi tab tersebut, bukan menghapus data demo.

## Struktur proyek

| Lokasi | Tanggung jawab |
| --- | --- |
| `dist/index.html`, `dist/styles.css` | Kerangka halaman dan tampilan bersama |
| `dist/app.js` | Navigasi hash, penghubung modul, katalog, pesanan, chat, dan pengembalian |
| `dist/core/state.mjs` | Data awal dan keadaan halaman sementara |
| `dist/core/rules.mjs` | Aturan harga, tanggal, foto, checkout, dan ulasan |
| `dist/core/storage.mjs`, `dist/core/id.mjs` | Penyimpanan/sinkronisasi demo dan pembuatan ID |
| `dist/ui/` | Tampilan serta interaksi beranda, akun, checkout, listing, dan ulasan |
| `dist/assets/` | Foto outfit dan font lokal |
| `tests/` | Pengujian aturan, penyimpanan, dan alur browser |
| `docs/PENGEMBANGAN.md` | Penjelasan kode, penyimpanan, dan batas teknis |

## Pengujian

```powershell
npm.cmd test
npm.cmd run build
```

Tes unit mencakup aturan harga/tanggal/transaksi, penyimpanan lama, tujuan kembali autentikasi, dan pemilihan foto campuran. Pengujian browser baru memakai Chrome/Edge lokal melalui CDP dan WebSocket bawaan Node; tidak perlu memasang Playwright. Jalankan Chrome headless dengan **profil uji terpisah**:

```powershell
$testProfile = Join-Path $env:TEMP 'reoutfit-browser-tests'
$testArgs = @('--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9222', ('--user-data-dir="' + $testProfile + '"'), 'about:blank')
$testBrowser = Start-Process -FilePath 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' -ArgumentList $testArgs -WindowStyle Hidden -PassThru
npm.cmd run test:browser
npm.cmd run test:browser:extra
npm.cmd run test:motion
npm.cmd run test:visual
Stop-Process -Id $testBrowser.Id
```

Sesuaikan executable bila Chrome/Edge berada di lokasi lain. Jika browser uji sudah berjalan di 9222, cukup jalankan script pengujian. `REOUTFIT_TEST_URL` dan `REOUTFIT_CDP_URL` dapat mengubah alamat aplikasi/browser. Tiap tes membuat konteks browser terisolasi dan menutupnya sesudah selesai; data browser pengguna tidak disentuh. `REOUTFIT_TEST_FILTER` dapat membatasi nama skenario saat menelusuri kegagalan.

Screenshot dan laporan pengujian dihasilkan lokal dalam `artifacts/ui-review/`; direktori ini diabaikan Git dan tidak ikut publikasi. `node tests/record-motion.mjs` menghasilkan rekaman `motion-preview.webm` menggunakan Chrome uji yang sama. `tests/capture-baseline.mjs` merekam UI lama dan disimpan sebagai alat dokumentasi; jangan jalankan pada UI baru untuk menimpa bukti awal. Suite Python lama `tests/browser_smoke.py` tetap tersedia sebagai referensi alur sebelum refactor; membutuhkan Playwright dan belum disesuaikan dengan halaman auth baru. Gunakan suite CDP untuk regresi UI saat ini.

## Vercel

Konfigurasi lokal sudah disiapkan di `vercel.json`:

| Pengaturan | Nilai |
| --- | --- |
| Framework preset | Other |
| Root Directory | Root repository |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | 22 atau lebih baru |

Branch kerja adalah `feat/ui-polish`. Routing memakai hash (`#/login`, `#/outfit/korean`, dan seterusnya), sehingga tidak membutuhkan rewrite SPA. Semua aset runtime berada di `dist`; folder `node_modules`, sumber styling, tes, dan screenshot tidak menjadi output situs. Tidak ada env var rahasia yang diperlukan.

Sebelum memublikasikan branch ini, jalankan build dan tes di atas. Gunakan lingkungan **Preview** untuk memeriksa `feat/ui-polish`; jangan mempromosikannya ke Production tanpa persetujuan terpisah. Sesudah deployment dilakukan, periksa kembali URL terbit: login, verifikasi, upload, dan konfirmasi sewa. Hasil lokal tidak membuktikan deployment eksternal yang belum dijalankan. Data demo mengikuti origin browser; data dari localhost tidak pindah ke URL Vercel.

Sumber dan lisensi logo, foto, serta ikon dicatat di [ASET-DAN-UI.md](docs/ASET-DAN-UI.md).

Harga, identitas pemilik, ukuran, dan ketentuan listing awal adalah contoh. Masukan awal proyek berasal dari wawancara **4 calon customer dan 1 calon seller**; sampel ini belum membuktikan permintaan pasar atau klaim kemudahan tiga klik. Sebelum menjadi produk nyata, aplikasi memerlukan backend, autentikasi, pemeriksaan hak akses di server, serta transaksi database yang mencegah pemesanan bentrok. Aturan di browser dapat diubah atau dilewati pengguna.
