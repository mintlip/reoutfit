# Catatan pengembangan

## Alur kode

`app.js` menggunakan hash URL, misalnya `#/jelajah` atau `#/outfit/dress`.

1. `render()` membaca URL dan memilih fungsi halaman.
2. Fungsi seperti `home()`, `detail()`, dan `checkout()` menghasilkan HTML.
3. `bind()` memasang event untuk halaman tersebut.
4. `enhancePresentation()` mengatur gambar responsif dan animasi.

Bagian yang sering diedit:

| Bagian | Fungsi |
| --- | --- |
| `products` | Data awal outfit |
| `state` | Filter, pilihan sewa, dan pesanan sementara |
| `filtered()` | Pencarian dan filter katalog |
| `costRows()` | Rincian harga sewa, layanan, deposit, dan ongkir |
| `endDate()` | Tanggal kembali; hari pertama ikut dihitung |
| `esc()` | Mengamankan teks input sebelum masuk ke HTML |
| `filePreview()` | Batas jumlah/ukuran foto dan pratinjau |

CSS memakai pendekatan desktop lalu media query untuk layar kecil. Aturan revisi berada di bagian bawah file. Saat menambah style, periksa aturan sebelumnya agar tidak saling menimpa tanpa sengaja.

## Aturan demo

- Sewa 1–7 hari. Mulai tanggal 10 selama 1 hari berarti kembali tanggal 10; 3 hari berarti kembali tanggal 12.
- Pemesanan paling cepat dua hari ke depan; ini belum terhubung dengan ketersediaan nyata.
- Subtotal = tarif per hari × durasi.
- Biaya platform = 10% subtotal, dibayar penyewa.
- Deposit terpisah dan tidak dihitung sebagai pendapatan.
- COD hanya untuk ambil langsung. Sewa dibayar saat bertemu; deposit dan biaya platform di awal, masih simulasi.
- Kurir memakai biaya contoh Rp40.000 pulang-pergi.
- Foto: maksimal 4 file, masing-masing 5 MB.

## Tahap berikutnya

1. **Akun:** daftar/login dan peran customer, merchant, serta admin.
2. **Database:** simpan outfit, ukuran, harga, tanggal tersedia, dan pesanan.
3. **Foto:** gunakan penyimpanan file; simpan URL-nya di database.
4. **Pesanan:** cegah bentrok tanggal dan batasi perubahan status sesuai peran.
5. **Klaim:** bukti kondisi, pemeriksaan pengembalian, dan keputusan admin.
6. **Pembayaran sandbox:** uji status bayar dan refund tanpa uang sungguhan.
7. **Pembayaran nyata:** setelah alur, aturan, dan operasional siap.

Entitas utama: User, MerchantProfile, Outfit, OutfitImage, Availability, RentalOrder, Payment, Deposit, ConditionEvidence, Dispute.

Saat backend dibuat, validasi harga, hak akses, dan ketersediaan harus dilakukan lagi di server. Salin harga serta ketentuan ke pesanan agar transaksi lama tidak berubah saat listing diedit. Pencegahan bentrok jadwal perlu transaksi database. Callback pembayaran harus diverifikasi dan aman diproses ulang.

Jangan memakai data browser sebagai sumber kebenaran untuk saldo, deposit, atau transaksi nyata. Jangan menyimpan API secret di JavaScript yang dikirim ke browser.

## Batas pengujian

Sintaks JavaScript, render halaman, filter, perhitungan biaya, dan tanggal sudah diperiksa. Pengujian visual serta interaksi di browser/perangkat nyata masih perlu dilakukan. Belum ada pengujian backend karena backend belum dibuat.
