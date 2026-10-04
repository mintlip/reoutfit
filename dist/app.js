'use strict';
const $ = s => document.querySelector(s),
  $$ = s => [...document.querySelectorAll(s)];
const money = n => 'Rp' + new Intl.NumberFormat('id-ID').format(n);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
} [c]));
const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
  bag: '<path d="M5 7h14l1 14H4zM9 7V5a3 3 0 0 1 6 0v2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  pin: '<path d="M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shirt: '<path d="m8 3-6 5 4 4 2-2v11h8V10l2 2 4-4-6-5c-1 3-7 3-8 0Z"/>',
  wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M21 10h-7v5h7M5 5V3h13"/>'
};
const icon = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[n]||icons.shirt}</svg>`;
// Data awal katalog. Ganti detail contoh setelah dikonfirmasi pemilik.
const products = [{
  id: 'korean',
  name: 'Blue Hour Korean Set',
  category: 'Korean style',
  price: 55000,
  original: 350000,
  replacement: 300000,
  deposit: 100000,
  size: 'S–M',
  chest: 90,
  waist: 70,
  length: 48,
  location: 'Bekasi',
  owner: 'Lemari Nara',
  img: 'assets/korean.webp',
  description: 'Cardigan biru lembut dan atasan putih untuk jalan santai atau membuat konten. Harga sewa mencakup dua potong atasan; jeans, tas, dan aksesori pada foto tidak termasuk.',
  condition: 'Baik · tanpa noda pada contoh listing',
  material: 'Rajut & katun (contoh)',
  brand: 'Brand lokal (contoh)',
  terms: 'Kembalikan dalam keadaan kering. Jangan gunakan pemutih atau mencuci sendiri. Pencucian normal sudah termasuk biaya sewa.'
}, {
  id: 'cosplay',
  name: 'Midnight Royal Costume',
  category: 'Cosplay',
  price: 125000,
  original: 1400000,
  replacement: 1100000,
  deposit: 300000,
  size: 'M',
  chest: 96,
  waist: 78,
  length: 95,
  location: 'Jakarta Selatan',
  owner: 'Atelier Luna',
  img: 'assets/cosplay.webp',
  description: 'Kostum bernuansa royal navy dengan detail bordir emas dan ruffle putih. Harga sewa mencakup coat, atasan, celana, dan sarung tangan. Wig, sepatu, serta properti tidak termasuk.',
  condition: 'Baik · aksesori lengkap pada contoh listing',
  material: 'Twill & satin (contoh)',
  brand: 'Custom atelier (contoh)',
  terms: 'Jangan menyetrika bordir secara langsung atau melepas aksesori. Pencucian normal sudah termasuk biaya sewa. Foto kelengkapan sebelum dan sesudah pemakaian.'
}];
products.push(...[{
  "id": "dress",
  "name": "Moonlight Bow Dress",
  "category": "Dress",
  "price": 135000,
  "original": 1200000,
  "replacement": 950000,
  "deposit": 250000,
  "size": "S–M",
  "chest": 88,
  "waist": 68,
  "length": 125,
  "location": "Bekasi",
  "owner": "Lemari Nara",
  "img": "assets/dress.webp",
  "description": "Dress navy dan putih dengan pita besar, detail rantai dekoratif, dan rok high-low. Listing contoh mencakup dress dan ornamen yang terpasang; sepatu, choker, dan aksesori terpisah tidak termasuk.",
  "condition": "Baik · ornamen lengkap pada contoh listing",
  "material": "Satin & sifon (contoh; perlu konfirmasi pemilik)",
  "brand": "Custom atelier (contoh)",
  "terms": "Jaga pita dan ornamen agar tidak tersangkut. Jangan melepas hiasan atau mencuci sendiri. Pencucian normal termasuk harga sewa."
}, {
  "id": "vest",
  "name": "Deep Blue Brocade Vest",
  "category": "Vest & formal",
  "price": 85000,
  "original": 650000,
  "replacement": 500000,
  "deposit": 150000,
  "size": "M",
  "chest": 96,
  "waist": 84,
  "length": 58,
  "location": "Jakarta Selatan",
  "owner": "Atelier Luna",
  "img": "assets/vest.webp",
  "description": "Vest deep blue bermotif dengan nuansa vintage untuk acara formal, photoshoot, atau styling karakter. Listing contoh hanya mencakup vest; kemeja, cravat, bros, rantai, dan celana pada foto tidak termasuk.",
  "condition": "Baik · kancing lengkap pada contoh listing",
  "material": "Kain motif brokat (contoh; perlu konfirmasi pemilik)",
  "brand": "Brand independen (contoh)",
  "terms": "Jangan menyetrika permukaan motif secara langsung. Kembalikan semua kancing dan bagian vest dalam kondisi lengkap. Pencucian normal termasuk harga sewa."
}]);
// State sementara; muat ulang halaman akan menghapus perubahan.
const state = {
  search: '',
  category: 'Semua',
  size: 'Semua',
  location: 'Semua',
  max: '',
  sort: 'default',
  selected: 'korean',
  days: 1,
  start: '',
  delivery: 'pickup',
  payment: 'qris',
  orders: [],
  draft: null,
  merchantTab: 'outfit'
};
let toastTimer;

function toast(t) {
  $('#toast').textContent = t;
  $('#toast').style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').style.display = 'none', 3800)
}

function go(path) {
  location.hash = path
}

function current() {
  return products.find(p => p.id === state.selected) || products[0]
}

function dateISO() {
  let d = new Date();
  d.setDate(d.getDate() + 2);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function endDate(start, days) {
  const d = new Date(start + 'T12:00:00');
  d.setDate(d.getDate() + Number(days) - 1);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d)
}

function formatDate(start) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(start + 'T12:00:00'))
}

function header(route) {
  $('#header').innerHTML = `<nav class="nav" aria-label="Navigasi utama"><a class="logo" href="#/">reoutfit</a><div class="navlinks"><a class="${route==='/'?'active':''}" href="#/">Beranda</a><a class="${route==='/jelajah'?'active':''}" href="#/jelajah">Jelajah outfit</a><a class="${route==='/panduan'?'active':''}" href="#/panduan">Cara sewa</a><a class="${route==='/pesanan'?'active':''}" href="#/pesanan">Pesanan saya</a></div><div class="navright"><a class="btn secondary" href="#/merchant">Sewakan outfit</a><button class="avatar" id="profile" aria-label="Profil demo">${icon('user')}</button></div></nav>`;
  $('#profile').onclick = () => showModal('Akun demo', 'Kamu sedang mencoba alur customer dan merchant. Data pesanan dan unggahan hanya tersedia selama sesi ini; muat ulang halaman akan meresetnya. Tidak perlu memasukkan data pribadi asli.', `<a class="btn" href="#/merchant" onclick="document.querySelector('dialog').close()">Buka ruang merchant</a>`)
}

function showModal(title, body, actions = '') {
  const m = $('#modal');
  m.innerHTML = `<div class="dialog-head"><h2>${title}</h2><button class="icon-btn" aria-label="Tutup dialog" id="closeModal">${icon('close')}</button></div><p>${body}</p>${actions}`;
  m.showModal();
  $('#closeModal').onclick = () => m.close()
}

function card(p) {
  return `<article class="product"><a class="product-photo" href="#/outfit/${p.id}" aria-label="Lihat ${esc(p.name)}"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"><span class="badge">Ukuran ${esc(p.size)}</span></a><div class="product-body"><div class="eyebrow">${esc(p.category)}</div><h3><a href="#/outfit/${p.id}">${esc(p.name)}</a></h3><span class="meta">${icon('pin')} ${esc(p.location)}</span><div class="price num">${money(p.price)} <small>/ hari · min. 1 hari</small></div><span class="meta">Deposit ${money(p.deposit)}</span><a class="btn secondary" href="#/outfit/${p.id}">Lihat detail</a></div></article>`
}

function home() {
  return `<div class="container"><section class="hero"><div class="hero-copy"><h1>Sewa outfit untuk<br><span>setiap acara.</span></h1><p>Temukan dan sewa outfit sesuai kebutuhanmu.</p><a href="#/jelajah" class="btn">Jelajahi outfit ${icon('search')}</a></div><a class="hero-image" href="#/outfit/korean" aria-label="Lihat Blue Hour Korean Set"><img src="assets/korean.webp" alt="Korean style dengan cardigan biru dan atasan putih"><div class="hero-tag"><div><small>KOREAN STYLE</small><strong>Blue Hour Korean Set</strong></div><div><strong class="num">Rp55.000</strong><small>per hari</small></div></div></a></section><div class="trust"><div class="trust-item"><span class="icon-tile">${icon('wallet')}</span><div><strong>Biaya terlihat sejak awal</strong><small>Sewa, layanan, dan deposit terpisah.</small></div></div><div class="trust-item"><span class="icon-tile">${icon('shirt')}</span><div><strong>Cek ukuran, lebih yakin</strong><small>Ukuran dalam cm & detail kelengkapan.</small></div></div><div class="trust-item"><span class="icon-tile">${icon('shield')}</span><div><strong>Ketentuan sebelum transaksi</strong><small>Baca aturan pemilik sebelum menyewa.</small></div></div></div><section class="section"><div class="section-heading"><div><h2>Pilihan outfit</h2></div><a class="btn ghost" href="#/jelajah">Lihat semua outfit</a></div><div class="chips"><button class="chip active" data-home-cat="Semua">Semua outfit</button><button class="chip" data-home-cat="Korean style">Korean style</button><button class="chip" data-home-cat="Cosplay">Cosplay</button><button class="chip" data-home-cat="Dress">Dress</button><button class="chip" data-home-cat="Vest & formal">Vest & formal</button></div><div class="outfits" id="home-products">${products.map(card).join('')}</div><p class="small muted" style="margin-top:17px">Koleksi demo · Harga, ukuran, bahan, dan identitas pemilik adalah contoh.</p></section><section class="section" style="border-top:1px solid var(--border)"><h2>Cara sewa</h2><div class="steps">${[['01','Pilih outfit','Pilih gaya, cek ukuran dan kelengkapan.'],['02','Atur jadwal','Pilih tanggal, baca syarat, cek total biaya.'],['03','Terima & pakai','Cek dan foto kondisi saat outfit diterima.'],['04','Kembalikan outfit','Upload bukti; deposit ditinjau setelah pemeriksaan.']].map(a=>`<div class="step"><b>${a[0]}</b><h3>${a[1]}</h3><p>${a[2]}</p></div>`).join('')}</div></section><section class="merchant-banner"><div><h2>Sewakan outfit</h2><p>Upload foto, isi detail, dan tentukan harga sewa.</p></div><a class="btn" href="#/merchant">Mulai sewakan ${icon('plus')}</a></section></div>`
}

function filtered() {
  let a = products.filter(p => (state.category === 'Semua' || p.category === state.category) && (state.size === 'Semua' || p.size.includes(state.size)) && (state.location === 'Semua' || p.location === state.location) && (!state.max || p.price <= Number(state.max)) && (p.name + ' ' + p.category + ' ' + p.description).toLowerCase().includes(state.search.toLowerCase()));
  if (state.sort === 'low') a.sort((a, b) => a.price - b.price);
  if (state.sort === 'high') a.sort((a, b) => b.price - a.price);
  return a
}

function options(list, value) {
  return list.map(x => `<option ${x===value?'selected':''}>${esc(x)}</option>`).join('')
}

function catalog() {
  return `<div class="container"><div class="page-top"><h1>Jelajah outfit</h1><p>Filter kategori, ukuran, harga, dan lokasi.</p></div><div class="toolbar"><label class="search"><span class="sr-only" hidden>Cari outfit</span>${icon('search')}<input aria-label="Cari outfit" id="search" placeholder="Cari Korean set, dress, vest, cosplay…" value="${esc(state.search)}"></label><select id="sort" aria-label="Urutkan outfit"><option value="default">Urutan pilihan</option><option value="low" ${state.sort==='low'?'selected':''}>Harga terendah</option><option value="high" ${state.sort==='high'?'selected':''}>Harga tertinggi</option></select></div><div class="catalog-layout"><aside class="filters" aria-label="Filter outfit"><div class="filter-head"><strong>Filter outfit</strong><button id="reset">Reset</button></div><label>Kategori<select id="category">${options(['Semua','Korean style','Cosplay','Dress','Vest & formal'],state.category)}</select></label><label>Ukuran<select id="size">${options(['Semua','S','M','L','XL'],state.size)}</select></label><label>Harga maks. / hari<input id="max" type="number" min="0" step="1000" placeholder="Contoh: 100000" value="${esc(state.max)}"></label><label>Lokasi pemilik<select id="location">${options(['Semua','Bekasi','Jakarta Selatan'],state.location)}</select></label></aside><section><p id="result-count" class="result-count"></p><div class="outfits" id="catalog-products"></div></section></div></div>`
}

function renderResults() {
  const p = filtered();
  $('#result-count').textContent = `${p.length} outfit ditemukan · Harga sewa belum termasuk biaya platform & deposit`;
  $('#catalog-products').innerHTML = p.length ? p.map(card).join('') : `<div class="empty"><h2>Outfit tidak ditemukan</h2><p>Coba kategori lain atau naikkan batas harga.</p><button class="btn secondary" id="resetEmpty">Reset filter</button></div>`;
  if ($('#resetEmpty')) $('#resetEmpty').onclick = resetFilters;
  enhancePresentation()
}

function resetFilters() {
  Object.assign(state, {
    search: '',
    category: 'Semua',
    size: 'Semua',
    location: 'Semua',
    max: '',
    sort: 'default'
  });
  render()
}
// Biaya platform dihitung dari subtotal sewa. Deposit dipisahkan.
function costRows(p, days = state.days, delivery = state.delivery) {
  const rent = p.price * days,
    fee = Math.round(rent * .1),
    ship = delivery === 'courier' ? 40000 : 0;
  return `<div class="summary-row"><span>Sewa (${days} hari × ${money(p.price)})</span><strong class="num">${money(rent)}</strong></div><div class="summary-row"><span>Biaya platform (10%)</span><strong class="num">${money(fee)}</strong></div><div class="summary-row"><span>Deposit yang dapat dikembalikan</span><strong class="num">${money(p.deposit)}</strong></div><div class="summary-row"><span>${delivery==='courier'?'Kurir pulang-pergi (demo)':'Ambil & kembali langsung'}</span><strong class="num">${money(ship)}</strong></div><div class="summary-row total"><span>Total termasuk deposit</span><strong class="num">${money(rent+fee+p.deposit+ship)}</strong></div>`
}

function detail(p) {
  state.selected = p.id;
  if (!state.start) state.start = dateISO();
  return `<div class="container"><div class="page-top"><nav class="crumb" aria-label="Breadcrumb"><a href="#/">Beranda</a><span>/</span><a href="#/jelajah">Jelajah outfit</a><span>/</span><span>${esc(p.name)}</span></nav></div><div class="detail-grid"><div><img class="detail-photo" id="mainPhoto" src="${esc(p.img)}" alt="${esc(p.name)}">${p.photos&&p.photos.length>1?`<div class="upload-previews">${p.photos.map((src,i)=>`<button type="button" data-photo="${esc(src)}" aria-label="Lihat foto outfit ${i+1}"><img src="${esc(src)}" alt="Foto ${i+1}"></button>`).join('')}</div>`:''}<p class="photo-caption">Harga, ukuran, dan detail listing adalah contoh.</p><div class="panel" style="margin-top:24px"><h2>Detail outfit</h2><div class="summary-row"><span class="muted">Brand</span><strong>${esc(p.brand)}</strong></div><div class="summary-row"><span class="muted">Bahan</span><strong>${esc(p.material)}</strong></div><div class="summary-row"><span class="muted">Harga beli pemilik</span><strong class="num">${money(p.original)}</strong></div><p class="small muted">Harga beli bukan nominal denda.</p><details class="accordion" open><summary>Kondisi outfit</summary><p>${esc(p.condition)}</p></details><details class="accordion"><summary>Syarat dari pemilik outfit</summary><p>${esc(p.terms)}</p><p>Nilai penggantian maksimum yang diajukan: <strong>${money(p.replacement)}</strong>. Klaim harus didukung bukti dan ditinjau; bukan biaya otomatis.</p><a class="help-link" href="#/syarat">Pelajari deposit & penanganan masalah</a></details></div></div><div class="detail-info"><div class="eyebrow">${esc(p.category)} · Koleksi demo</div><h1>${esc(p.name)}</h1><div class="detail-price num">${money(p.price)} <small>/ hari · minimum 1 hari</small></div><p class="muted">${esc(p.description)}</p><div class="owner"><span class="avatar">${icon('user')}</span><div><strong>${esc(p.owner)}</strong><small>${esc(p.location)} · Pemilik outfit contoh</small></div></div><div style="margin-top:24px"><h3>Ukuran</h3><div class="table-wrap"><table class="measurements"><thead><tr><th>Ukuran</th><th>Lingkar dada</th><th>Pinggang</th><th>Panjang</th></tr></thead><tbody><tr><td>${esc(p.size)}</td><td>${p.chest} cm</td><td>${p.waist} cm</td><td>${p.length} cm</td></tr></tbody></table></div><p class="small muted">Bandingkan ukuran dalam cm dengan pakaianmu.</p></div><form class="panel booking" id="booking"><h2>Jadwal sewa</h2><div class="form-grid"><label>Tanggal mulai<input id="start" type="date" min="${dateISO()}" value="${state.start}" required></label><label>Durasi sewa<select id="days">${[1,2,3,4,5,6,7].map(n=>`<option value="${n}" ${state.days===n?'selected':''}>${n} hari</option>`).join('')}</select></label></div><p class="hint" id="datehint"></p><div id="detail-costs">${costRows(p,state.days,'pickup')}</div><p class="note">Deposit <b>${money(p.deposit)}</b> dikembalikan setelah pemeriksaan kondisi dan penyelesaian klaim, jika ada.</p><button class="btn full" type="submit">Lanjut ke syarat & checkout</button><p class="hint" style="text-align:center;margin-top:12px">Belum ada pembayaran pada langkah ini.</p></form></div></div></div>`
}

function checkout() {
  let p = current();
  if (!state.start) state.start = dateISO();
  return `<div class="container"><div class="page-top"><nav class="crumb"><a href="#/outfit/${p.id}">Detail outfit</a><span>/</span><span>Checkout</span></nav><h1>Checkout</h1></div><div class="progress-steps"><span><b>1</b> Pilih outfit</span><span class="current"><b>2</b> Syarat & checkout</span><span><b>3</b> Pesanan</span></div><form id="checkoutForm" class="checkout-grid"><div><section class="panel"><h2>01 · Outfit & jadwal</h2><div class="order-mini"><img src="${esc(p.img)}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><p class="small muted">Ukuran ${esc(p.size)} · ${esc(p.owner)}</p><p class="small">${formatDate(state.start)} – ${endDate(state.start,state.days)} · ${state.days} hari</p></div></div><a class="help-link" href="#/outfit/${p.id}">Ubah jadwal</a></section><section class="panel"><h2>02 · Cara menerima outfit</h2><label class="option"><input type="radio" name="delivery" value="pickup" ${state.delivery==='pickup'?'checked':''}><span><strong>Ambil langsung</strong><small>Serah terima di ${esc(p.location)}. Lokasi tepat disepakati dengan pemilik.</small></span><b class="num">Rp0</b></label><label class="option"><input type="radio" name="delivery" value="courier" ${state.delivery==='courier'?'checked':''}><span><strong>Kurir reguler</strong><small>Ongkir pulang-pergi contoh. Atur pengiriman agar tiba sebelum tanggal mulai.</small></span><b class="num">Rp40.000</b></label><div class="form-grid" style="margin-top:22px"><label>Nama penerima (demo)<input name="receiver" placeholder="Contoh: Nara" required autocomplete="off"></label><label>Nomor telepon (demo)<input name="phone" type="tel" placeholder="Contoh: 081234567890" pattern="[0-9+ ()-]{8,18}" required autocomplete="off"></label><label class="span2" id="addressField" ${state.delivery==='pickup'?'hidden':''}>Alamat pengiriman (demo)<textarea name="address" id="address" ${state.delivery==='courier'?'required':''} placeholder="Gunakan alamat contoh untuk mencoba prototipe."></textarea></label></div></section><section class="panel"><h2>03 · Metode pembayaran</h2><label class="option"><input type="radio" name="payment" value="qris" ${state.payment==='qris'?'checked':''}><span><strong>QRIS</strong><small>Simulasi pembayaran digital.</small></span></label><label class="option"><input type="radio" name="payment" value="va" ${state.payment==='va'?'checked':''}><span><strong>Virtual account</strong><small>Simulasi transfer bank.</small></span></label><label class="option" id="codOption"><input type="radio" name="payment" value="cod" ${state.payment==='cod'?'checked':''} ${state.delivery==='courier'?'disabled':''}><span><strong>COD · bayar saat serah terima</strong><small>Hanya untuk ambil langsung. Sewa dibayar saat bertemu; deposit dan biaya platform dibayar di awal.</small></span></label></section><section class="panel"><h2>04 · Syarat pemilik & deposit</h2><p>${esc(p.terms)}</p><div class="note neutral">Nilai penggantian maksimum yang disepakati: <strong>${money(p.replacement)}</strong>. Noda atau kerusakan ditangani berdasarkan bukti kondisi serta biaya perbaikan yang wajar. Deposit tidak otomatis hangus.</div><a class="help-link" href="#/syarat" target="_blank" rel="noopener">Baca ketentuan lengkap (tab baru)</a></section></div><aside class="sticky"><div class="panel"><h2>Ringkasan biaya</h2><div id="checkout-costs">${costRows(p)}</div><p class="hint">Pencucian normal termasuk harga sewa.</p><div id="payment-split"></div><p class="note">Biaya platform untuk reoutfit. Deposit ditahan sebagai jaminan dan dapat dikembalikan.</p><label class="checkline"><input name="agree" type="checkbox" required><span>Saya sudah membaca dan menyetujui syarat pemilik, nilai penggantian, serta aturan deposit dan penanganan klaim.</span></label><button class="btn full" type="submit">Buat pesanan demo</button><p class="hint" style="text-align:center;margin-top:12px">Simulasi saja. Tidak ada uang yang ditagihkan.</p></div></aside></form></div>`
}

function orderPage() {
  if (!state.orders.length) return `<div class="container"><div class="page-top"><h1>Pesanan saya</h1></div><div class="empty" style="margin-bottom:55px"><span class="icon-tile" style="margin:0 auto 18px">${icon('bag')}</span><h2>Belum ada pesanan</h2><p>Pesanan akan muncul setelah checkout.</p><a class="btn" href="#/jelajah">Jelajahi outfit</a></div></div>`;
  return `<div class="container"><div class="page-top"><h1>Pesanan saya</h1></div>${state.orders.map(o=>orderCard(o)).join('')}</div>`
}
const statuses = ['Menunggu serah terima', 'Sedang disewa', 'Menunggu pemeriksaan', 'Selesai'];

function orderCard(o) {
  const p = o.product;
  return `<div class="checkout-grid"><section class="panel"><div class="status-header"><span class="small muted">${o.id} · Pesanan demo</span><span class="badge ${o.step===3?'green':'pink'}">${o.issue?'Ada laporan · sedang ditinjau':statuses[o.step]}</span></div><div class="order-mini"><img src="${esc(p.img)}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.owner)} · Ukuran ${esc(p.size)}</p><p class="small">${formatDate(o.start)} – ${endDate(o.start,o.days)}</p></div></div><div class="summary-row"><span>Serah terima</span><strong>${o.delivery==='pickup'?'Ambil langsung':'Kurir reguler'}</strong></div><div class="summary-row"><span>Pembayaran</span><strong>${o.payment==='cod'?'COD + deposit awal (demo)':o.payment.toUpperCase()+' (demo)'}</strong></div><div class="summary-row"><span>Status deposit</span><strong>${o.step===3?'Pengembalian disimulasikan':'Ditahan (simulasi)'}</strong></div><div class="note neutral">${o.step===0?'Saat menerima outfit, cocokkan kelengkapan dan ambil foto kondisinya.':o.step===1?'Simpan bukti kondisi dan kembalikan paling lambat '+endDate(o.start,o.days)+'.':o.step===2?'Pemilik memeriksa kondisi dan kelengkapan. Deposit belum dilepas sebelum pemeriksaan selesai.':'Sewa selesai. Deposit '+money(p.deposit)+' disimulasikan kembali penuh.'}</div><div class="row-actions">${o.step===0?`<button class="btn" data-receive="${o.id}">Konfirmasi penerimaan</button>`:o.step===1?`<a class="btn" href="#/pengembalian/${o.id}">Kembalikan outfit</a>`:''}${o.step<3?`<a class="btn secondary" href="#/masalah/${o.id}">Laporkan masalah</a>`:''}${o.step===2?`<button class="btn secondary" data-inspect="${o.id}">Simulasikan pemeriksaan selesai</button>`:''}</div>${o.issue?`<p class="note">Laporan: ${esc(o.issue.type)}. Tim demo sedang meninjau bukti; deposit ditahan hingga penyelesaian. Referensi ${o.issue.id}.</p>`:''}</section><aside class="panel"><h2>Status pesanan</h2><ol class="timeline">${[['Pesanan dibuat','Jadwal dan biaya disetujui.'],['Outfit diterima','Kondisi awal dicatat.'],['Outfit dikembalikan','Bukti pengembalian dikirim.'],['Pemeriksaan selesai','Deposit diselesaikan.']].map((s,i)=>`<li class="${i<=o.step?'done':''}"><strong>${s[0]}</strong><small>${s[1]}</small></li>`).join('')}</ol><div class="summary-row total"><span>Total pesanan</span><strong class="num">${money(o.total)}</strong></div><p class="hint">Termasuk deposit ${money(p.deposit)}.</p></aside></div>`
}

function returns(o) {
  return `<div class="narrow"><div class="page-top"><nav class="crumb"><a href="#/pesanan">Pesanan saya</a><span>/</span><span>Pengembalian</span></nav><h1>Pengembalian outfit</h1><p>Upload foto kondisi akhir dan bukti pengembalian.</p></div><form class="panel" id="returnForm" data-id="${o.id}"><div class="order-mini"><img src="${esc(o.product.img)}" alt="${esc(o.product.name)}"><div><h3>${esc(o.product.name)}</h3><p class="small">Batas kembali: ${endDate(o.start,o.days)}</p></div></div><label>Kondisi saat dikembalikan<select name="condition" required><option value="">Pilih kondisi</option><option>Baik, sesuai kondisi awal</option><option>Ada noda atau kerusakan</option><option>Ada bagian yang hilang</option></select></label><label style="margin-top:22px">Catatan kondisi<textarea name="notes" placeholder="Jelaskan perubahan kondisi atau kelengkapan, jika ada."></textarea></label><div class="upload-area" style="margin-top:22px"><label>Foto kondisi & bukti pengembalian<input type="file" name="evidence" id="evidence" accept="image/*" multiple required></label><p class="hint">Sertakan foto depan, belakang, dan kelengkapan. Maks. 4 foto, 5 MB per foto. Diproses sementara di sesi ini.</p><div class="upload-previews" id="evidencePreview"></div></div>${o.delivery==='courier'?'<label style="margin-top:22px">Nomor resi pengembalian<input name="tracking" required placeholder="Masukkan resi contoh"></label>':''}<label class="checkline"><input type="checkbox" required><span>Saya sudah mengirim atau menyerahkan kembali outfit, dan bukti ini sesuai kondisinya.</span></label><p class="note">Deposit belum langsung dikembalikan. Pemilik akan memeriksa outfit; jika ada perbedaan, kedua pihak dapat mengajukan bukti.</p><button class="btn full">Kirim bukti pengembalian demo</button></form></div>`
}

function problem(o) {
  return `<div class="narrow"><div class="page-top"><nav class="crumb"><a href="#/pesanan">Pesanan saya</a><span>/</span><span>Laporkan masalah</span></nav><h1>Laporkan masalah</h1><p>Sertakan kronologi dan bukti, jika tersedia.</p></div><form class="panel" id="issueForm" data-id="${o.id}"><h2>Pesanan ${o.id}</h2><label>Jenis masalah<select name="type" required><option value="">Pilih masalah</option><option>Outfit berbeda dari deskripsi</option><option>Outfit rusak atau kotor</option><option>Kelengkapan hilang</option><option>Belum diterima / tidak dikembalikan</option><option>Pembayaran atau deposit</option><option>Lainnya</option></select></label><label style="margin-top:22px">Ceritakan yang terjadi<textarea name="description" minlength="15" required placeholder="Minimal 15 karakter. Jelaskan kondisi, waktu, dan penyelesaian yang kamu harapkan."></textarea></label><div class="upload-area" style="margin-top:22px"><label>Tambahkan bukti (opsional)<input type="file" name="evidence" id="evidence" multiple accept="image/*"></label><p class="hint">Maks. 4 foto, 5 MB per foto. Untuk outfit yang belum diterima, laporan boleh tanpa foto.</p><div class="upload-previews" id="evidencePreview"></div></div><p class="note">Pelaporan tidak otomatis mengenakan denda. Deposit ditahan selama peninjauan; keputusan memerlukan bukti dari kedua pihak.</p><button class="btn full">Kirim laporan demo</button></form></div>`
}

function merchant() {
  const newListings = products.filter(p => p.custom);
  return `<div class="container"><div class="page-top page-actions"><div><h1>Ruang merchant</h1><p>Kelola outfit, pesanan, dan pendapatan.</p></div><a class="btn" href="#/upload">${icon('plus')} Tambah outfit</a></div><div class="tabs"><a class="${state.merchantTab==='outfit'?'active':''}" href="#/merchant" data-tab="outfit">Outfit saya</a><a class="${state.merchantTab==='orders'?'active':''}" href="#/merchant" data-tab="orders">Pesanan masuk</a><a class="${state.merchantTab==='revenue'?'active':''}" href="#/merchant" data-tab="revenue">Pendapatan & biaya</a></div><div class="stats"><div class="stat"><span class="muted">Outfit contoh & unggahan</span><strong>${products.length}</strong></div><div class="stat"><span class="muted">Pesanan demo</span><strong>${state.orders.length}</strong></div><div class="stat"><span class="muted">Pendapatan sewa selesai</span><strong>${money(state.orders.filter(o=>o.step===3).reduce((a,o)=>a+o.product.price*o.days,0))}</strong></div></div>${state.merchantTab==='outfit'?`<section class="panel"><h2>Listing outfit</h2><p class="small muted">Listing contoh · Unggahan baru tersimpan selama sesi ini.</p>${products.map(p=>`<article class="listing-row"><img src="${esc(p.img)}" alt="${esc(p.name)}"><div class="grow"><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.category)} · ${money(p.price)} / hari</p></div><span class="badge green">${p.custom?'Demo diterbitkan':'Contoh aktif'}</span><a class="btn secondary" href="#/outfit/${p.id}">Lihat listing</a></article>`).join('')}</section>`:state.merchantTab==='orders'?`<section class="panel"><h2>Pesanan masuk</h2>${state.orders.length?state.orders.map(o=>`<div class="listing-row"><img src="${esc(o.product.img)}" alt="${esc(o.product.name)}"><div class="grow"><h3>${esc(o.product.name)}</h3><p class="small muted">${o.id} · ${o.days} hari · ${statuses[o.step]}</p></div><a class="btn secondary" href="#/pesanan">Kelola demo</a></div>`).join(''):'<p class="muted">Belum ada pesanan. Coba buat pesanan melalui halaman customer.</p>'}</section>`:`<section class="panel"><h2>Pembagian biaya</h2><p>Pemilik menerima harga sewa penuh. Penyewa membayar biaya platform 10% secara terpisah.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Contoh: Rp55.000 × 3 hari</th><th>Nominal</th><th>Tujuan dana</th></tr></thead><tbody><tr><td>Harga sewa</td><td>Rp165.000</td><td>Pendapatan pemilik</td></tr><tr><td>Biaya platform 10%</td><td>Rp16.500</td><td>Pendapatan kotor reoutfit</td></tr><tr><td>Deposit</td><td>Rp100.000</td><td>Ditahan sementara, bukan revenue</td></tr></tbody></table></div><p class="note">10% adalah asumsi model bisnis awal, bukan tarif final. Biaya payment gateway, operasional, dan penanganan sengketa masih perlu divalidasi.</p><p class="small muted">Tidak ada saldo atau pencairan dana sungguhan dalam prototipe.</p></section>`}</div>`
}

function upload() {
  return `<div class="container"><div class="page-top"><nav class="crumb"><a href="#/merchant">Ruang merchant</a><span>/</span><span>Tambah outfit</span></nav><h1>Tambah outfit</h1></div><form id="uploadForm" class="checkout-grid"><div><section class="panel"><h2>01 · Foto & informasi outfit</h2><div class="upload-area"><label>Foto outfit<input id="outfitPhotos" name="photos" type="file" accept="image/*" multiple required></label><p class="hint">Maks. 4 foto, 5 MB per foto. Foto pertama menjadi sampul. Sertakan bagian depan, belakang, dan detail.</p><div id="photoPreview" class="upload-previews"></div></div><div class="form-grid" style="margin-top:24px"><label class="span2">Nama outfit<input name="name" maxlength="65" required placeholder="Contoh: Blue Hour Korean Set"></label><label>Kategori<select name="category"><option>Korean style</option><option>Cosplay</option><option>Dress</option><option>Vest &amp; formal</option></select></label><label>Brand<input name="brand" required placeholder="Nama brand / custom / tanpa brand"></label><label>Bahan<input name="material" required placeholder="Contoh: katun, rajut"></label><label>Lokasi<select name="location"><option>Bekasi</option><option>Jakarta Selatan</option></select></label><label class="span2">Deskripsi & kelengkapan<textarea name="description" minlength="30" required placeholder="Jelaskan bahan, detail pengerjaan, kondisi, dan item yang termasuk atau tidak termasuk dalam sewa. Minimal 30 karakter."></textarea></label><label class="span2">Kondisi saat ini<input name="condition" required placeholder="Contoh: baik; sedikit aus pada ujung lengan"></label></div></section><section class="panel"><h2>02 · Ukuran (cm)</h2><div class="form-grid"><label>Label ukuran<select name="size"><option>S</option><option>S–M</option><option>M</option><option>L</option><option>XL</option></select></label><label>Lingkar dada (cm)<input name="chest" type="number" min="40" max="200" required></label><label>Lingkar pinggang (cm)<input name="waist" type="number" min="40" max="200" required></label><label>Panjang baju (cm)<input name="length" type="number" min="10" max="220" required></label></div><p class="hint">Untuk set, tuliskan ukuran setiap potongan tambahan di deskripsi.</p></section><section class="panel"><h2>03 · Harga & ketentuan</h2><div class="form-grid"><label>Harga beli asli (Rp)<input name="original" type="number" min="1000" step="1000" required><span class="hint">Referensi kualitas, bukan denda otomatis.</span></label><label>Harga sewa / hari (Rp)<input name="price" id="merchantPrice" type="number" min="1000" step="1000" required><span class="hint">Kamu menentukan harga; minimum sewa demo 1 hari.</span></label><label>Deposit jaminan (Rp)<input name="deposit" type="number" min="0" step="1000" required><span class="hint">Dikembalikan setelah pemeriksaan.</span></label><label>Nilai penggantian maks. (Rp)<input name="replacement" type="number" min="1000" step="1000" required><span class="hint">Pertimbangkan usia dan kondisi outfit.</span></label><label class="span2">Syarat khusus pemilik<textarea name="terms" required minlength="15" placeholder="Contoh: jangan mencuci sendiri; pencucian normal termasuk harga sewa."></textarea></label></div><p id="uploadError" class="field-error" role="alert"></p></section></div><aside class="sticky"><section class="panel"><h2>Terbitkan listing</h2><div class="note neutral" id="merchantEstimate">Isi harga sewa untuk melihat pembagian biaya contoh.</div><label class="checkline"><input type="checkbox" required><span>Saya berhak menyewakan outfit ini dan informasi kondisi serta kelengkapannya sesuai.</span></label><button type="submit" class="btn full">Terbitkan listing demo</button><p class="hint" style="margin-top:12px">Foto dan listing tersimpan sementara di sesi browser ini. Tidak diunggah ke layanan publik.</p></section></aside></form></div>`
}

function policy() {
  return `<div class="narrow"><div class="page-top"><h1>Syarat & deposit</h1><p>Ketentuan demo. Syarat pemilik dan rincian biaya disetujui saat checkout.</p></div><div class="policy-grid"><div class="panel"><span class="icon-tile" style="margin-bottom:18px">${icon('wallet')}</span><h3>Sewa, biaya platform & deposit</h3><p><b>Harga sewa</b> untuk pemilik. <b>Biaya platform 10%</b> untuk reoutfit. <b>Deposit</b> ditahan sementara dan bukan pendapatan.</p></div><div class="panel"><span class="icon-tile" style="margin-bottom:18px">${icon('shield')}</span><h3>Deposit bukan asuransi</h3><p>Deposit tidak menjamin seluruh kerugian tertutup. Nilai penggantian maksimum harus dijelaskan dan disetujui sebelum pemesanan.</p></div></div><div class="panel" style="margin-top:22px"><h2>Jika outfit kotor, rusak, atau hilang</h2><ol class="policy-list"><li><b>Catat kondisi awal.</b> Pemilik dan penyewa menyimpan foto serta daftar kelengkapan saat serah terima.</li><li><b>Laporkan perbedaannya.</b> Lampirkan foto, kronologi, dan biaya perbaikan atau penggantian yang diajukan.</li><li><b>Tinjau bukti kedua pihak.</b> Pemakaian normal tidak otomatis dikenakan denda. Klaim noda atau kerusakan mengacu pada biaya yang dapat dijelaskan.</li><li><b>Selesaikan klaim sebelum melepas deposit.</b> Potongan yang disetujui dan sisa pengembalian ditampilkan terpisah. Jika masih berselisih, gunakan proses peninjauan.</li></ol><p class="note">Kehilangan atau tidak dikembalikan dapat memerlukan penggantian hingga nilai maksimum yang disepakati, setelah peninjauan. Harga beli asli bukan denda otomatis, dan tidak ada penagihan otomatis dalam demo.</p></div><div class="panel"><h2>Jadwal, pencucian & pembayaran</h2><details class="accordion" open><summary>Bagaimana durasi dihitung?</summary><p>Sewa tersedia mulai 1 hari. Tanggal mulai adalah hari pertama pemakaian; sewa 1 hari dikembalikan pada tanggal yang sama, sesuai jam serah terima yang disepakati. Sewa 3 hari mulai tanggal 10 berakhir tanggal 12. Waktu dan lokasi serah terima disepakati bersama; pengiriman harus diatur sebelum jadwal mulai.</p></details><details class="accordion"><summary>Apa bedanya COD dan ambil langsung?</summary><p>Ambil langsung adalah cara menerima outfit. COD adalah cara membayar sewa saat serah terima. Di model demo ini, COD hanya tersedia untuk ambil langsung; deposit dan biaya platform dibayar di awal.</p></details><details class="accordion"><summary>Apakah pencucian termasuk?</summary><p>Pada listing demo, pencucian normal termasuk harga sewa. Kerusakan atau noda di luar pemakaian normal perlu bukti dan peninjauan; tidak ada potongan otomatis.</p></details><details class="accordion"><summary>Kapan deposit kembali?</summary><p>Setelah kondisi diperiksa dan klaim selesai, jika ada. Waktu pencairan nyata bergantung pada proses operasional dan penyedia pembayaran; demo ini tidak menjanjikan pencairan 1×24 jam.</p></details><details class="accordion"><summary>Bagaimana pembatalan atau keterlambatan?</summary><p>Rincian tenggat pembatalan, pengembalian dana, dan tarif keterlambatan masih perlu disepakati sebelum peluncuran. Dalam demo, hubungi pemilik melalui proses laporan; tidak ada denda otomatis atau pembatalan berbayar.</p></details></div><a href="#/jelajah" class="btn">Kembali jelajahi outfit</a></div>`
}

function guide() {
  return `<div class="narrow"><div class="page-top"><h1>Cara sewa</h1></div>${[['01','Pilih outfit','Gunakan pencarian dan filter. Cek ukuran cm, kondisi, kelengkapan, dan lokasi pemilik. Harga asli membantu memahami kualitas; harga sewa ditentukan pemilik.'],['02','Jadwal & pembayaran','Pilih tanggal serta durasi. Baca syarat, nilai penggantian, harga sewa, biaya platform, ongkir, dan deposit. Pilih cara menerima serta membayar secara terpisah.'],['03','Terima outfit','Saat menerima outfit, cek kelengkapan dan foto kondisi awal. Laporkan ketidaksesuaian melalui pesanan sebelum melanjutkan pemakaian.'],['04','Pengembalian & deposit','Upload foto kondisi akhir dan bukti pengembalian. Setelah pemeriksaan dan penyelesaian klaim, sisa deposit dikembalikan.']].map(a=>`<section class="panel"><div class="big-number">${a[0]}</div><h2>${a[1]}</h2><p class="muted">${a[2]}</p></section>`).join('')}<div class="row-actions"><a class="btn" href="#/jelajah">Cari outfit</a><a class="btn secondary" href="#/syarat">Pelajari ketentuan</a></div></div>`
}

function filePreview(input, holder) {
  input.onchange = () => {
    const files = [...input.files];
    if (files.length > 4 || files.some(f => f.size > 5 * 1024 * 1024 || !f.type.startsWith('image/'))) {
      input.setCustomValidity('Pilih maksimal 4 foto, format gambar, dan maksimal 5 MB per foto.');
      input.reportValidity();
      holder.innerHTML = '';
      return
    }
    input.setCustomValidity('');
    holder.innerHTML = files.map(f => `<img src="${URL.createObjectURL(f)}" alt="Pratinjau foto yang dipilih">`).join('')
  }
}
// Pasang event setelah isi halaman dirender.
function bind(route) {
  $$('[data-photo]').forEach(b => b.onclick = () => {
    $('#mainPhoto').src = b.dataset.photo
  });
  if (route === '/') $$('[data-home-cat]').forEach(b => b.onclick = () => {
    $$('[data-home-cat]').forEach(x => x.classList.toggle('active', x === b));
    $('#home-products').innerHTML = products.filter(p => b.dataset.homeCat === 'Semua' || p.category === b.dataset.homeCat).map(card).join('');
    enhancePresentation()
  });
  if (route === '/jelajah') {
    renderResults();
    ['category', 'size', 'location', 'max', 'sort', 'search'].forEach(k => $('#' + k).addEventListener(k === 'search' || k === 'max' ? 'input' : 'change', e => {
      state[k] = e.target.value;
      renderResults()
    }));
    $('#reset').onclick = resetFilters
  }
  if ($('#booking')) {
    const update = () => {
      state.days = Number($('#days').value);
      state.start = $('#start').value;
      if (state.start) $('#datehint').textContent = 'Kembali paling lambat ' + endDate(state.start, state.days) + '. Hari mulai dihitung sebagai hari pertama.';
      $('#detail-costs').innerHTML = costRows(current(), state.days, 'pickup')
    };
    $('#days').onchange = update;
    $('#start').onchange = update;
    update();
    $('#booking').onsubmit = e => {
      e.preventDefault();
      go('/checkout')
    }
  }
  if ($('#checkoutForm')) {
    const update = () => {
      state.delivery = $('[name=delivery]:checked').value;
      if (state.delivery === 'courier' && state.payment === 'cod') {
        state.payment = 'qris';
        $('[name=payment][value=qris]').checked = true
      }
      state.payment = $('[name=payment]:checked').value;
      $('[name=payment][value=cod]').disabled = state.delivery === 'courier';
      $('#addressField').hidden = state.delivery !== 'courier';
      $('#address').required = state.delivery === 'courier';
      $('#checkout-costs').innerHTML = costRows(current());
      const p = current();
      $('#payment-split').innerHTML = state.payment === 'cod' ? `<div class="note neutral"><strong>Dibayar di awal: ${money(p.deposit+Math.round(p.price*state.days*.1))}</strong><br>Sewa saat serah terima: ${money(p.price*state.days)}</div>` : ''
    };
    $$('[name=delivery],[name=payment]').forEach(x => x.onchange = update);
    update();
    $('#checkoutForm').onsubmit = e => {
      e.preventDefault();
      const p = {
          ...current()
        },
        total = p.price * state.days + Math.round(p.price * state.days * .1) + p.deposit + (state.delivery === 'courier' ? 40000 : 0);
      state.orders.unshift({
        id: 'RO-DEMO-' + String(state.orders.length + 1).padStart(3, '0'),
        product: p,
        start: state.start,
        days: state.days,
        delivery: state.delivery,
        payment: state.payment,
        total,
        step: 0
      });
      go('/pesanan');
      toast('Pesanan demo dibuat. Tidak ada pembayaran sungguhan.')
    }
  }
  $$('[data-receive]').forEach(b => b.onclick = () => {
    const o = state.orders.find(o => o.id === b.dataset.receive);
    showModal('Konfirmasi kondisi awal', 'Periksa kelengkapan dan sertakan foto kondisi awal. Foto hanya dipakai untuk simulasi sesi ini.', `<form id="receiveForm"><label>Foto saat diterima<input type="file" id="evidence" accept="image/*" multiple required></label><p class="hint">Maks. 4 foto; 5 MB per foto.</p><div class="upload-previews" id="evidencePreview"></div><label class="checkline"><input type="checkbox" required><span>Outfit sudah diterima dan kondisi awal sudah diperiksa.</span></label><button class="btn full">Konfirmasi penerimaan demo</button></form>`);
    filePreview($('#evidence'), $('#evidencePreview'));
    $('#receiveForm').onsubmit = e => {
      e.preventDefault();
      o.receivedEvidence = [...$('#evidence').files].map(f => ({
        name: f.name,
        url: URL.createObjectURL(f)
      }));
      o.step = 1;
      $('#modal').close();
      render();
      toast('Penerimaan dicatat untuk demo.')
    }
  });
  $$('[data-inspect]').forEach(b => b.onclick = () => {
    const o = state.orders.find(o => o.id === b.dataset.inspect);
    if (o.issue) {
      toast('Laporan masih terbuka. Selesaikan peninjauan lebih dulu.');
      showModal('Simulasi peninjauan laporan', 'Dalam layanan nyata, admin menilai bukti dari kedua pihak. Tombol ini hanya menyimulasikan kesepakatan tanpa potongan deposit.', `<button class="btn" id="resolveIssue">Simulasikan sepakat tanpa potongan</button>`);
      $('#resolveIssue').onclick = () => {
        o.issue = null;
        $('#modal').close();
        render();
        toast('Kesepakatan demo dicatat. Pemeriksaan dapat dilanjutkan.')
      }
    } else {
      o.step = 3;
      render();
      toast('Pemeriksaan selesai; pengembalian deposit disimulasikan.')
    }
  });
  if ($('#returnForm')) {
    filePreview($('#evidence'), $('#evidencePreview'));
    $('#returnForm').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target),
        o = state.orders.find(o => o.id === e.target.dataset.id);
      o.returnEvidence = [...$('#evidence').files].map(f => ({
        name: f.name,
        url: URL.createObjectURL(f)
      }));
      o.returnNotes = f.get('notes');
      o.step = 2;
      if (f.get('condition') !== 'Baik, sesuai kondisi awal') o.issue = {
        type: f.get('condition'),
        id: 'CL-' + o.id
      };
      go('/pesanan');
      toast('Bukti diterima. Menunggu pemeriksaan pemilik.')
    }
  }
  if ($('#issueForm')) {
    filePreview($('#evidence'), $('#evidencePreview'));
    $('#issueForm').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target),
        o = state.orders.find(o => o.id === e.target.dataset.id);
      o.issue = {
        type: f.get('type'),
        description: f.get('description'),
        evidence: [...$('#evidence').files].map(f => ({
          name: f.name,
          url: URL.createObjectURL(f)
        })),
        id: 'CL-' + o.id
      };
      go('/pesanan');
      toast('Laporan demo dicatat. Deposit menunggu peninjauan.')
    }
  }
  $$('[data-tab]').forEach(a => a.onclick = e => {
    e.preventDefault();
    state.merchantTab = a.dataset.tab;
    render()
  });
  if ($('#uploadForm')) {
    filePreview($('#outfitPhotos'), $('#photoPreview'));
    $('#merchantPrice').oninput = e => {
      const v = Number(e.target.value) * 3;
      $('#merchantEstimate').innerHTML = `Contoh sewa 3 hari:<br>Pendapatan pemilik: <b>${money(v)}</b><br>Biaya platform ke customer: <b>${money(Math.round(v*.1))}</b><br><small>Deposit dan ongkir dihitung terpisah.</small>`
    };
    $('#uploadForm').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target),
        original = Number(f.get('original')),
        replacement = Number(f.get('replacement')),
        deposit = Number(f.get('deposit'));
      if (replacement > original || deposit > replacement) {
        $('#uploadError').textContent = 'Untuk demo ini, nilai penggantian tidak boleh melebihi harga asli, dan deposit tidak boleh melebihi nilai penggantian.';
        $('#uploadError').scrollIntoView({
          block: 'center'
        });
        return
      }
      const p = {
        id: 'outfit-' + Date.now(),
        custom: true,
        owner: 'Lemari Kamu',
        img: URL.createObjectURL($('#outfitPhotos').files[0]),
        photos: [...$('#outfitPhotos').files].map(f => URL.createObjectURL(f))
      };
      for (const k of ['name', 'category', 'brand', 'material', 'location', 'description', 'condition', 'size', 'terms']) p[k] = f.get(k);
      for (const k of ['original', 'price', 'deposit', 'replacement', 'chest', 'waist', 'length']) p[k] = Number(f.get(k));
      products.push(p);
      state.merchantTab = 'outfit';
      go('/merchant');
      toast('Listing demo diterbitkan dan muncul di katalog.')
    }
  }
}
let revealObserver;

function enhancePresentation() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (revealObserver) revealObserver.disconnect();
  $$('#main .reveal-pending').forEach(el => el.classList.remove('reveal-pending'));
  $$('#main img').forEach(img => {
    img.decoding = 'async';
    const src = img.getAttribute('src');
    const dimensions = {
      "assets/dress.webp": [960, 1440],
      "assets/vest.webp": [960, 934],
      "assets/korean.webp": [960, 1280],
      "assets/cosplay.webp": [736, 981]
    };
    if (dimensions[src]) {
      const [width, height] = dimensions[src];
      img.width = width;
      img.height = height;
      img.srcset = src.replace('.webp', '-480.webp') + ' 480w, ' + src + ' ' + width + 'w';
      img.sizes = img.classList.contains('detail-photo') ? '(max-width: 760px) calc(100vw - 40px), 560px' : img.closest('.hero-image') ? '(max-width: 760px) calc(100vw - 40px), 560px' : img.closest('.order-mini,.listing-row') ? '112px' : '(max-width: 390px) calc(100vw - 40px), (max-width: 760px) 44vw, (max-width: 1050px) 42vw, 380px';
    }
    if (img.closest('.hero-image') || img.classList.contains('detail-photo')) {
      img.loading = 'eager';
      img.fetchPriority = 'high'
    } else img.loading = 'lazy';
  });
  if (reduced) return;
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('reveal-ready');
        revealObserver.unobserve(entry.target)
      }
    }), {
      threshold: 0.06,
      rootMargin: '0px 0px 24px 0px'
    });
    $$('#main .section,#main .merchant-banner,#main .checkout-grid>.panel,#main .policy-grid').forEach(section => {
      if (section.getBoundingClientRect().top > window.innerHeight) {
        section.classList.add('reveal-pending');
        revealObserver.observe(section)
      }
    });
  }
}

function animatePage() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !$('#main').animate) return;
  $('#main').animate([{
    opacity: .65,
    transform: 'translateY(6px)'
  }, {
    opacity: 1,
    transform: 'translateY(0)'
  }], {
    duration: 240,
    easing: 'cubic-bezier(.2,.7,.3,1)'
  });
}
// Hash URL menentukan halaman yang ditampilkan.
function render() {
  const route = location.hash.slice(1) || '/';
  header(route);
  let html;
  if (route === '/') html = home();
  else if (route === '/jelajah') html = catalog();
  else if (route.startsWith('/outfit/')) {
    let p = products.find(p => p.id === route.split('/')[2]);
    html = p ? detail(p) : notfound()
  } else if (route === '/checkout') html = checkout();
  else if (route === '/pesanan') html = orderPage();
  else if (route === '/merchant') html = merchant();
  else if (route === '/upload') html = upload();
  else if (route === '/syarat') html = policy();
  else if (route === '/panduan') html = guide();
  else if (route.startsWith('/pengembalian/') || route.startsWith('/masalah/')) {
    let o = state.orders.find(o => o.id === route.split('/')[2]);
    html = o ? (route.startsWith('/pengembalian/') ? (o.step === 1 ? returns(o) : orderPage()) : problem(o)) : notfound()
  } else html = notfound();
  $('#main').innerHTML = html;
  bind(route);
  enhancePresentation();
  document.title = (route === '/' ? 'Sewa outfit' : route.startsWith('/outfit/') ? current().name : route.slice(1).split('/')[0].replace(/^./, x => x.toUpperCase())) + ' — reoutfit'
}

function notfound() {
  return '<div class="narrow"><div class="empty" style="margin:40px 0"><h2>Halaman tidak ditemukan.</h2><p>Data demo mungkin sudah terhapus setelah halaman dimuat ulang.</p><a href="#/" class="btn">Kembali ke beranda</a></div></div>'
}
window.addEventListener('hashchange', () => {
  if ($('#modal').open) $('#modal').close();
  render();
  window.scrollTo({
    top: 0,
    behavior: 'instant'
  });
  animatePage();
  $('#main').focus({
    preventScroll: true
  })
});
render();
