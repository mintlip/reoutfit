# Reoutfit

Prototipe website sewa outfit untuk proyek mahasiswa Venture Creation. Aplikasi memakai HTML, CSS, dan Vanilla JavaScript dengan modul terpisah. Tidak membutuhkan framework, backend, API key, `npm install`, atau proses build.

## Menjalankan aplikasi

Buka folder proyek di VS Code. Jalankan perintah berikut dari folder utama:

```bash
python3 -m http.server 5500 --directory dist
```

Buka `http://localhost:5500`. Alternatifnya, gunakan ekstensi **Live Server** pada `dist/index.html`. Gunakan server lokal agar modul JavaScript dapat dimuat; jangan membuka HTML langsung lewat `file://`.

## Fitur dan batas demo

- Pengunjung dapat membuka katalog, memakai filter, melihat detail outfit, memilih tanggal, dan menyiapkan ringkasan sewa tanpa masuk.
- Masuk/daftar memakai **alias demo bawaan**, tanpa email atau kata sandi. Ini bukan autentikasi nyata.
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

Jalankan tes unit dengan Node.js:

```bash
node --test tests/*.test.mjs
```

Dengan server lokal tetap berjalan, jalankan pemeriksaan alur browser:

```bash
python3 tests/browser_smoke.py
```

Tes browser memakai Python Playwright dan Chromium yang tersedia di lingkungan pengujian. Keduanya adalah alat uji opsional, bukan dependensi aplikasi. Cakupannya dijelaskan di [panduan pengembangan](docs/PENGEMBANGAN.md); hasil tes mengikuti keluaran perintah saat dijalankan.

## Vercel

Untuk deployment manual, buka proyek Vercel yang terhubung ke `mintlip/reoutfit`, lalu pilih branch `feat/demo-rental-flow` sebagai sumber deployment. Gunakan preset **Other**, root directory folder utama repository, **Output Directory `dist`**, dan **Build Command kosong**. Pengaturan yang sama tersedia di `vercel.json`. Jika membuat proyek baru, import repository dengan pengaturan tersebut.

Deployment melalui dashboard Vercel tidak memerlukan `VERCEL_TOKEN` di cloud environment atau di kode aplikasi. Setelah deployment selesai, periksa katalog, ringkasan sewa, dan dialog verifikasi pada URL hasil deployment. Hasil pengujian lokal tidak menggantikan pemeriksaan situs yang sudah terbit.

Harga, identitas pemilik, ukuran, dan ketentuan listing awal adalah contoh. Masukan awal proyek berasal dari wawancara **4 calon customer dan 1 calon seller**; sampel ini belum membuktikan permintaan pasar atau klaim kemudahan tiga klik. Sebelum menjadi produk nyata, aplikasi memerlukan backend, autentikasi, pemeriksaan hak akses di server, serta transaksi database yang mencegah pemesanan bentrok. Aturan di browser dapat diubah atau dilewati pengguna.
