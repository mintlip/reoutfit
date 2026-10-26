# Aset dan antarmuka Reoutfit

Logo kaus senyum `dist/assets/brand/reoutfit-mark.png` disalin tanpa perubahan dari `logos.png` yang diberikan pengguna. Wordmark tetap huruf kecil `reoutfit` dengan Aileron. Aset logo tambahan dari ZIP tetap tersedia di direktori brand. Teks instruksi lama dalam ZIP tidak dipakai sebagai instruksi pengembangan.

## Foto halaman akun

Foto diunduh sebagai WebP berukuran 1000 × 1400 melalui layanan gambar Unsplash (fit crop, quality 78), kemudian disajikan lokal agar preview tidak tergantung jaringan. Ketiganya berada di bawah [Unsplash License](https://unsplash.com/license) menurut halaman sumber ketika dipilih.

| File lokal | Fotografer | Sumber |
| --- | --- | --- |
| `dist/assets/auth/friends.webp` | Katie Treadway | [Dua teman berkacamata hitam](https://unsplash.com/photos/2OOiqCrrGbQ) |
| `dist/assets/auth/style.webp` | Dwayne joe | [Dua teman dengan gaya personal](https://unsplash.com/photos/tWTsMVAwF0s) |
| `dist/assets/auth/city.webp` | Haley Hydorn | [Gaya kasual di kota](https://unsplash.com/photos/rmwotJuTRIw) |

Foto hanya inspirasi lifestyle, bukan identitas akun atau pengguna Reoutfit. Jika gagal dimuat, slideshow memakai foto outfit Korean lokal. Foto listing, ukuran, harga, dan ulasan tetap berasal dari data aplikasi.

## Ikon dan dependensi UI

- [Preline Styled Icons](https://preline.co/docs/components/static-icons.html) menggunakan Lucide sebagai set ikon utama. SVG resmi yang dipakai disimpan di `dist/assets/icons`; lisensi upstream disertakan dalam `LICENSE.txt`. `scripts/prepare-vendor.mjs` menghasilkan `dist/ui/icons.mjs` dari SVG tersebut.
- Preline 4.2 menyediakan plugin password non-auto yang dipakai form akun. Hanya modul ini yang disalin ke output statis, bersama lisensi Preline. Tidak ada framework tambahan.
- [Tailwind CLI](https://tailwindcss.com/docs/installation/tailwind-cli) menghasilkan CSS statis. Versi terpasang dikunci melalui `package-lock.json`.
- [Tailwind Forms](https://github.com/tailwindlabs/tailwindcss-forms) memakai strategi class untuk integrasi bertahap tanpa reset global form yang tidak disengaja.
- [GSAP 3](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/) dipasang lewat npm. Core UMD disalin lokal, dimuat sebagai script klasik sebelum modul aplikasi; informasi lisensi upstream ada di `dist/vendor/GSAP-README.md` dan header file. `dist/ui/motion.mjs` mengelola reduced motion dan cleanup per route.
- Aileron lokal tetap digunakan; lisensi font tersedia di direktori font asli.

## Interaksi dan gerakan

[Jitter](https://jitter.video/) menjadi referensi kualitas transisi, bukan dependensi runtime. Tombol merespons hover/pressed; konten masuk ringan melalui opacity/transform. Scroll halaman tetap native. Carousel outfit dan foto akun berganti setiap 3 detik; foto memakai crossfade 650 ms. Hover dan scroll halaman biasa tidak menghentikan carousel. Navigasi slide manual dan fokus keyboard menjeda autoplay; kontrol keyboard untuk melanjutkan tersedia saat fokus. Dots tetap terlihat, sementara pill Jeda dan angka slide dihilangkan dari tampilan biasa sesuai revisi pengguna. Reduced motion memakai navigasi manual.

## Batas MVP

Autentikasi, verifikasi KTP dummy, pembayaran, deposit, pesanan, chat, dan ulasan merupakan simulasi lokal. Password contoh tidak disimpan. Verifikasi hanya menyimpan metadata status per alias, bukan gambar identitas atau NIK. Chat dibatasi berdasarkan peserta percakapan dalam UI, tetapi penyimpanan dan aturan browser bukan batas keamanan server. Situs ini siap dibangun sebagai demonstrasi statis, bukan layanan transaksi uang atau identitas nyata.
