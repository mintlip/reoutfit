# reoutfit

Website sewa outfit untuk proyek Venture Creation. Dibuat dengan HTML, CSS, dan JavaScript.

## Menjalankan di VS Code

1. Ekstrak ZIP, lalu buka folder `reoutfit` lewat **File > Open Folder**.
2. Pasang ekstensi **Live Server**.
3. Klik kanan `dist/index.html`, pilih **Open with Live Server**.
4. Edit file, simpan, lalu cek perubahan di browser.

Alternatif jika Python sudah tersedia:

```bash
python -m http.server 5500 --directory dist
```

Buka `http://localhost:5500`. Tidak perlu `npm install` atau build.

## Struktur file

| File | Isi |
| --- | --- |
| `dist/index.html` | Kerangka halaman, header, footer, dan dialog |
| `dist/styles.css` | Font, warna, layout, tampilan mobile, dan animasi |
| `dist/app.js` | Data outfit, halaman, filter, checkout, dan event |
| `dist/assets/` | Foto outfit dan font Aileron |
| `vercel.json` | Konfigurasi output untuk Vercel |
| `docs/PENGEMBANGAN.md` | Alur kode dan pekerjaan berikutnya |

## GitHub

Buat repository kosong bernama `reoutfit`, tanpa menambahkan README dari GitHub. Jalankan dari folder proyek:

```bash
git init
git add .
git commit -m "Initial reoutfit website"
git branch -M main
```

Tambahkan remote menggunakan URL repository milikmu:

```bash
git remote add origin https://github.com/USERNAME/reoutfit.git
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub kamu. Git harus sudah terpasang dan login GitHub dilakukan saat diminta.

Untuk perubahan berikutnya:

```bash
git add .
git commit -m "Update outfit catalog"
git push
```

Sesuaikan pesan commit dengan perubahan yang dibuat.

## Vercel

1. Hubungkan akun GitHub di Vercel dan import repository `reoutfit`.
2. Pilih preset **Other** bila diminta.
3. Root directory: folder utama repository.
4. Output directory: `dist`. Build command: kosong.
5. Deploy. Konfigurasi juga sudah tersedia di `vercel.json`.

Setelah terhubung, push ke branch produksi akan memicu deployment baru. Website ini belum dipasang ke akun GitHub/Vercel pengguna oleh paket ini.

## Status saat ini

Sudah ada katalog, filter, detail outfit, durasi 1–7 hari, perhitungan biaya, pesanan, pengembalian, laporan masalah, dan penambahan outfit oleh merchant.

Data masih berada di memori browser. Muat ulang halaman akan menghapus listing tambahan, pesanan, dan bukti foto. Belum ada login, database, pembayaran, pengiriman, atau pengembalian deposit sungguhan. Foto unggahan dipratinjau di browser; tidak dikirim ke server.

Harga, ukuran, bahan, identitas pemilik, dan ketentuan listing awal adalah data contoh. Biaya platform 10% masih asumsi model bisnis. Deposit bukan pendapatan.

## Sebelum presentasi

- Coba filter dan detail keempat outfit.
- Coba sewa 1 hari dan beberapa hari; cek total biaya.
- Pilih kurir: COD harus nonaktif dan alamat wajib diisi.
- Buat pesanan, konfirmasi penerimaan, lalu coba pengembalian.
- Tambah outfit dan cek kemunculannya di katalog.
- Periksa desktop dan mobile. Jangan reload saat ingin mempertahankan data sesi demo.

## Hosting

GitHub menyimpan kode, Vercel menjalankan website. GitHub Pages dapat digunakan untuk demo statis; jangan mengandalkannya sebagai hosting marketplace komersial. Vercel Hobby ditujukan untuk penggunaan personal nonkomersial. Sesuaikan paket ketika proyek mulai beroperasi sebagai bisnis.

Referensi: [Vercel Git](https://vercel.com/docs/git), [Vercel Hobby](https://vercel.com/docs/plans/hobby), [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
