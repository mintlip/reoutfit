# Panduan pengembangan Reoutfit

## Cara membaca kode

Reoutfit tetap memakai HTML, CSS, dan Vanilla JavaScript. Pemisahan modul membantu tugas mahasiswa tetap mudah ditelusuri tanpa perlu framework atau pola MVC yang kaku.

| Bagian | Isi dan alasan dipisahkan |
| --- | --- |
| `dist/core/state.mjs` | Katalog awal, filter, jadwal pilihan, pesanan, chat, dan draft. Menjadi tempat keadaan aplikasi dibaca bersama. |
| `dist/core/rules.mjs` | Fungsi perhitungan dan validasi tanpa tampilan: rupiah, biaya, tanggal, ketersediaan, foto, checkout, akses, dan ulasan. Dapat diuji dengan Node.js. |
| `dist/core/storage.mjs` | Membaca, membersihkan, menggabungkan, dan menyimpan data demo; mengirim perubahan ke tab lain. |
| `dist/core/id.mjs` | Membuat ID listing, pesanan, dan pesan. |
| `dist/ui/account.mjs` | Alias akun, sesi per tab, verifikasi dummy, dan kelanjutan aksi setelah masuk. |
| `dist/ui/checkout.mjs` | Ringkasan biaya, isian penerima, validasi, dan pembuatan pesanan. |
| `dist/ui/listing.mjs` | Form listing, draft foto/isian, validasi harga, dan penerbitan. |
| `dist/ui/reviews.mjs` | Form ulasan, balasan pemilik, dan ringkasan nilai. |
| `dist/ui/home.mjs` | Beranda dan interaksi karusel. |
| `dist/app.js` | Menghubungkan modul, memilih halaman dari hash URL, serta menangani katalog, pesanan, foto kondisi, chat, dan pengembalian. |

Alur umumnya: event pengguna mengubah state, aturan memeriksa input, penyimpanan mencatat data yang boleh disimpan, lalu UI diperbarui. URL seperti `#/jelajah`, `#/outfit/korean`, dan `#/pesanan` dipilih oleh `render()`. Halaman memasang event melalui `bind()` atau fungsi `bind()` modul terkait.

Saat menambah fitur, letakkan perhitungan di `core/rules.mjs`, data sementara di state, penyimpanan bersama di `core/storage.mjs`, dan tampilan/interaksi di modul UI yang sesuai. `app.js` masih mengandung beberapa halaman lama; pemisahan ini bertahap. Sumber Tailwind ada di `styles/tailwind.css` dan `styles/components.css`; aturan fitur ada di `dist/ui/*.css`. `dist/styles.css` adalah hasil build, jangan diedit langsung. Modul `auth.mjs`, `chat.mjs`, `photo-picker.mjs`, dan `motion.mjs` menangani komponen baru; GSAP dan Preline disajikan lokal dari `dist/vendor`.

## Akun dan verifikasi

Alias tersedia untuk dua penyewa serta pemilik Lemari Nara, Atelier Luna, dan Lemari Kamu. Halaman Masuk/Daftar mengaktifkan alias dengan kata sandi demo publik `reoutfit123`. Kata sandi tidak disimpan; tidak ada autentikasi server, email, atau nama pribadi yang dikumpulkan. Login berhasil menawarkan verifikasi pada setiap alias belum terverifikasi, dengan pilihan “Lewati untuk sekarang”.

Verifikasi menampilkan kartu fiktif bawaan bertanda **CONTOH / TIDAK BERLAKU**, tanpa unggah dokumen atau input NIK. Statusnya:

| Status internal | Perilaku |
| --- | --- |
| `unverified` | Belum diajukan; pengguna masih boleh menjelajah dan menyiapkan draft. |
| `pending` | Pengajuan simulasi menunggu pilihan hasil. |
| `verified` | Aksi yang memerlukan verifikasi dapat dilanjutkan sesuai peran. |
| `rejected` | Aksi tetap tertahan; pengguna boleh mencoba verifikasi lagi. |

`ensureAccount()` meminta akun yang sesuai; `ensureVerified()` juga meminta verifikasi. Konfirmasi sewa memakai peran penyewa, sedangkan penerbitan listing memakai peran pemilik. Aksi dilanjutkan setelah syarat terpenuhi. Batal, menutup dialog, atau memilih “Nanti saja” membatalkan aksi tertunda dan mempertahankan isian form. Perubahan status dari tab lain tidak otomatis menyetujui aksi atas nama pengguna.

## Apa yang disimpan

| Tempat | Data | Masa simpan |
| --- | --- | --- |
| Memori halaman | Filter, jadwal pilihan, draft listing/foto, serta isian penerima, telepon, dan alamat checkout | Hilang saat reload atau halaman ditutup. Navigasi dalam aplikasi dan pembatalan dialog mempertahankan draft. |
| `sessionStorage`: `reoutfit.demo.account.session.v1` | ID alias yang masuk | Sesi tab; tab lain dapat memakai alias berbeda. |
| `localStorage`: `reoutfit.demo.accounts.v1` | Status aktivasi dan verifikasi alias bawaan | Bertahan setelah reload; bukan penyimpanan dokumen identitas. |
| `localStorage`: `reoutfit.demo.shared.v1` | Listing terbit, pesanan, foto, laporan, ulasan/balasan, dan chat demo | Bertahan setelah reload sampai direset/dihapus atau penyimpanan browser tidak tersedia. |

Data penerima checkout tidak disalin ke pesanan yang tersimpan. Modul penyimpanan mengambil field yang diizinkan dan mengabaikan field kontak/identitas tambahan. Tetap gunakan data dan foto contoh: komentar, catatan, pesan, serta foto outfit yang dikirim memang tersimpan di browser.

Foto yang diterima aplikasi dikompresi untuk penyimpanan lokal. `BroadcastChannel` dan event `storage` menyampaikan perubahan antar-tab pada origin yang sama: protokol, host, dan port harus sama. `localhost:5500` dan `127.0.0.1:5500` mempunyai penyimpanan berbeda. Sinkronisasi ini bukan komunikasi antarperangkat atau akun pengguna nyata.

Chat sebelum pemesanan dipisahkan berdasarkan outfit dan alias penyewa melalui kunci `product:id:renterId`. Chat lama dengan kunci `product:id` tetap disimpan, tetapi tidak ditampilkan karena identitas penyewanya tidak diketahui. Chat pesanan tetap mengikuti pihak yang tercantum pada pesanan.

Penyimpanan yang penuh/tidak tersedia menampilkan pesan. Checkout dan penerbitan listing tidak dianggap berhasil ketika penyimpanan gagal; isian tetap dapat diperbaiki atau dicoba kembali. Sebagian alur lama dapat melaporkan perubahan hanya tersimpan di tab tersebut. Reset data bersama menghapus listing tambahan, pesanan, foto, chat, dan ulasan; metadata akun/sesi memiliki penyimpanan terpisah.

## Aturan transaksi

- Durasi 1–7 hari dengan tanggal inklusif: mulai tanggal 10 selama 1 hari berakhir tanggal 10, selama 3 hari berakhir tanggal 12. Hari ini boleh dipilih jika tersedia; nilai awal dua hari ke depan hanya bantuan pengisian.
- Ketersediaan mempertimbangkan tanggal contoh yang diblokir dan pesanan aktif yang bertumpang tindih. Ini kalender demo, belum data operasional pemilik.
- Tarif sewa minimum Rp1.000/hari. Input rupiah menerima pemisah ribuan lalu disimpan sebagai angka; nilai negatif, pecahan, kosong, atau terlalu besar ditolak.
- Subtotal = tarif × hari. Biaya platform = 10% subtotal, dibulatkan satu kali. Deposit terpisah dari pendapatan; kurir menambah Rp40.000 pulang-pergi. COD hanya tersedia untuk ambil langsung.
- Tombol konfirmasi membuat pesanan berstatus pembayaran `unpaid-demo`. Login, verifikasi, jadwal, dan biaya diperiksa kembali sebelum menyimpan; pencegahan klik ganda dan penguncian browser bila tersedia membantu demo satu browser.
- Tahap pesanan: `0` dibuat, `1` diterima, `2` dikembalikan, `3` pemeriksaan selesai. Pemilik memasukkan foto kondisi awal; penyewa memasukkan bukti penerimaan/pengembalian; pemilik memasukkan foto akhir sebelum menyelesaikan pemeriksaan.
- Laporan terbuka menahan penyelesaian pemeriksaan. Penyelesaian laporan hanya simulasi kesepakatan tanpa potongan, bukan arbitrase atau penagihan nyata.
- Ulasan hanya untuk penyewa yang tercantum pada transaksi selesai, satu per transaksi, nilai bulat 1–5, komentar opsional maksimal 500 karakter. Pemilik tidak dapat mengulas listing sendiri sebagai penyewa. Balasan pemilik dicatat terpisah dan tidak menambah rata-rata nilai outfit; tanpa ulasan, tampil “Belum ada ulasan”.

Foto listing serta kondisi memakai JPEG, PNG, atau WebP, maksimal 4 file dan 5 MB per file. Listing juga memeriksa ukuran, deskripsi, syarat, persetujuan kepemilikan, harga beli, deposit, dan nilai penggantian. Deposit tidak boleh melebihi nilai penggantian; nilai penggantian tidak boleh melebihi harga beli asli.

## Menjalankan pemeriksaan

Dari folder utama proyek, jalankan:

```bash
node --test tests/*.test.mjs
```

Tes unit mencakup format rupiah dan minimum sewa, biaya/deposit/ongkir, tanggal inklusif dan bentrok jadwal, batas/format foto, data checkout kosong, batas akses konfirmasi/publikasi, kelayakan dan duplikasi ulasan, penyaringan data pribadi, data penyimpanan rusak, serta penggabungan perubahan tab.

Untuk alur browser di Windows, jalankan server di terminal pertama:

```powershell
npm.cmd run serve
```

Lalu di terminal lain:

```powershell
npm.cmd run test:browser
npm.cmd run test:visual
```

Jalankan dahulu Chrome/Edge dengan profil uji terpisah dan port CDP9222 sesuai README. Suite memakai WebSocket bawaan Node22+, tanpa Playwright. `REOUTFIT_TEST_URL` dan `REOUTFIT_CDP_URL` mengubah alamat server/browser. Script Python lama tetap menjadi referensi dan belum disesuaikan untuk UI baru; tidak dijalankan pada audit Windows ini.

Skenario browser yang tersedia meliputi katalog tamu, ringkasan biaya, daftar/masuk, verifikasi ditunda/ditolak/dicoba ulang, pembatalan yang mempertahankan isian, klik konfirmasi ganda, kegagalan penyimpanan, draft listing dan foto invalid, siklus sewa dua peran, ulasan, pemisahan akun dan chat antar-alias, reload, tampilan mobile, keyboard, dan preferensi pengurangan animasi. Setiap tes memakai konteks browser terpisah dan data dummy. Daftar ini menjelaskan cakupan script; status lulus mengikuti hasil eksekusi, bukan janji bahwa semua perangkat atau browser sudah diperiksa.

## Sebelum menjadi produk nyata

Aturan, verifikasi, dan pembatasan peran saat ini berjalan di browser dan dapat dilewati melalui developer tools. Backend perlu mengautentikasi pengguna, memeriksa hak akses setiap aksi, serta menghitung ulang harga, status, dan ketersediaan. Pencegahan bentrok jadwal harus memakai transaksi database yang atomik; sinkronisasi localStorage tidak cukup.

Berikutnya diperlukan database dan penyimpanan foto, kebijakan penanganan data identitas, pembayaran sandbox, verifikasi callback pembayaran, serta proses sengketa/refund yang jelas. Salin harga dan syarat ke pesanan agar perubahan listing tidak mengubah transaksi lama. Jangan menyimpan API secret dalam JavaScript publik. Saat ini tidak ada backend atau kredensial API yang diperlukan.

Hosting tetap statis: Vercel preset **Other**, install `npm ci`, build `npm run build`, output `dist`. Branch kerja `feat/ui-polish`; `vercel.json` mencatat konfigurasi. Tidak ada deployment yang dilakukan dalam perubahan ini. Verifikasi URL terbit setelah deployment terpisah; tes lokal tidak membuktikan deployment eksternal berhasil.

Logo kaus senyum dari `logos.png` dan aset ZIP telah tersedia di `dist/assets/brand`. Sumber foto/ikon dicatat di `docs/ASET-DAN-UI.md`. Masukan wawancara awal terbatas pada 4 calon customer dan 1 calon seller; perbandingan dengan Facebook dan klaim tiga klik perlu pengujian pengguna tersendiri.
