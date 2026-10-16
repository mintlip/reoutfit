'use strict';
const $ = s => document.querySelector(s),
  $$ = s => [...document.querySelectorAll(s)];
const money = n => 'Rp' + new Intl.NumberFormat('id-ID').format(n);
const MIN_RENTAL_PRICE = 1000;
const rupiahInputFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const formatRupiahInput = n => rupiahInputFormatter.format(n);
function parseRupiahInput(value) {
  const raw = String(value ?? '').trim().replace(/^rp\s*/i, '').replace(/\s/g, '');
  // Dots are grouping marks only; stripping them also tolerates edits around auto-inserted groups.
  if (!raw || !/^\d+(?:\.\d+)*\.?$/.test(raw)) return null;
  const amount = Number(raw.replace(/\./g, ''));
  return Number.isSafeInteger(amount) ? amount : null
}
function parseValidRentalPrice(value) {
  const amount = parseRupiahInput(value);
  return amount !== null && amount >= MIN_RENTAL_PRICE ? amount : null
}
function rentalPriceError(value) {
  const raw = String(value ?? '').trim(),
    amount = parseRupiahInput(raw);
  if (!raw) return 'Harga sewa wajib diisi.';
  if (amount === null) return 'Gunakan bilangan bulat, misalnya 55.000 atau Rp55.000.';
  if (amount < MIN_RENTAL_PRICE) return 'Harga sewa minimum Rp1.000 per hari.';
  return ''
}
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
const baseProducts = products.slice();
// Preferensi halaman tetap per-tab. Hanya listing, transaksi, bukti, ulasan, dan chat demo yang dibagi.
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
  availabilityMessage: '',
  renterVerificationPassed: false,
  merchantVerificationPassed: false,
  delivery: 'pickup',
  payment: 'qris',
  orders: [],
  chats: {},
  demoMode: null,
  draft: null,
  merchantTab: 'outfit'
};
const activeRole = () => state.demoMode;
const SHARED_DEMO_KEY = 'reoutfit.demo.shared.v1';
const SHARED_DEMO_CHANNEL = 'reoutfit.demo.shared.v1';
const SHARED_IMAGE_PREFIX = /^data:image\/(?:jpeg|png|webp);base64,/i;
const sharedImageFields = ['img', 'photos'];
let sharedChannel = null;
function stableId(prefix) {
  const suffix = globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  return `${prefix}-${suffix}`
}

function safeSharedImage(value) {
  if (typeof value !== 'string') return '';
  if (SHARED_IMAGE_PREFIX.test(value)) return value;
  return /^assets\/[a-z0-9_./-]+\.(?:png|jpe?g|webp)$/i.test(value) ? value : ''
}

function safeSharedProduct(product) {
  if (!product || typeof product !== 'object' || !product.id) return null;
  const fields = ['id', 'custom', 'owner', 'name', 'category', 'price', 'original', 'replacement', 'deposit', 'size', 'chest', 'waist', 'length', 'location', 'description', 'condition', 'material', 'brand', 'terms', 'updatedAt'];
  const clean = {};
  fields.forEach(key => {
    if (product[key] !== undefined) clean[key] = product[key]
  });
  clean.id = String(product.id);
  clean.img = safeSharedImage(product.img);
  clean.photos = Array.isArray(product.photos) ? product.photos.map(safeSharedImage).filter(Boolean).slice(0, 4) : [];
  if (!clean.img && clean.photos.length) clean.img = clean.photos[0];
  return clean
}

function safeEvidenceList(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 4).map(item => ({
    name: String(item?.name || 'Foto').slice(0, 180),
    url: safeSharedImage(item?.url),
    uploadedBy: String(item?.uploadedBy || 'Pengguna').slice(0, 100),
    uploadedAt: String(item?.uploadedAt || '')
  })).filter(item => item.url)
}

function safeSharedOrder(order) {
  if (!order || typeof order !== 'object' || !order.id || !order.product?.id) return null;
  const product = safeSharedProduct(order.product);
  if (!product) return null;
  const result = {
    id: String(order.id), product,
    ownerId: String(order.ownerId || ''), renterId: String(order.renterId || ''),
    start: String(order.start || ''), days: Number(order.days) || 1,
    delivery: String(order.delivery || 'pickup'), payment: String(order.payment || 'qris'),
    total: Number(order.total) || 0, step: Math.max(0, Math.min(3, Number(order.step) || 0)),
    updatedAt: String(order.updatedAt || order.createdAt || '')
  };
  ['initialConditionPhotos', 'finalConditionPhotos', 'receivedEvidence', 'returnEvidence'].forEach(key => result[key] = safeEvidenceList(order[key]));
  if (order.returnNotes !== undefined) result.returnNotes = String(order.returnNotes).slice(0, 2000);
  if (order.issue && typeof order.issue === 'object') result.issue = {
    type: String(order.issue.type || '').slice(0, 160),
    description: String(order.issue.description || '').slice(0, 2000),
    id: String(order.issue.id || `CL-${result.id}`),
    evidence: safeEvidenceList(order.issue.evidence)
  };
  ['renterReview', 'ownerReview'].forEach(key => {
    if (order[key] && Number.isInteger(Number(order[key].rating)) && Number(order[key].rating) >= 1 && Number(order[key].rating) <= 5) result[key] = {
      rating: Number(order[key].rating), text: String(order[key].text || '').slice(0, 500), createdAt: String(order[key].createdAt || '')
    }
  });
  return result
}

function safeSharedChats(chats) {
  const clean = {};
  if (!chats || typeof chats !== 'object') return clean;
  Object.entries(chats).forEach(([key, messages]) => {
    if (!/^(?:order|product):[a-z0-9_-]+$/i.test(key) || !Array.isArray(messages)) return;
    const unique = new Map();
    messages.forEach((message, index) => {
      if (!message || !['renter', 'owner'].includes(message.sender)) return;
      const text = String(message.text || '').trim();
      if (!text || text.length > 1000) return;
      const createdAt = String(message.createdAt || '');
      const id = String(message.id || `${key}-${createdAt}-${index}`);
      unique.set(id, { id, sender: message.sender, text, createdAt })
    });
    clean[key] = [...unique.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
  });
  return clean
}

function emptySharedDemo() {
  return { version: 1, listings: [], orders: [], chats: {} }
}

function readSharedDemo() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHARED_DEMO_KEY) || 'null');
    if (!parsed || parsed.version !== 1) return emptySharedDemo();
    return {
      version: 1,
      listings: Array.isArray(parsed.listings) ? parsed.listings.map(safeSharedProduct).filter(product => product?.custom) : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders.map(safeSharedOrder).filter(Boolean) : [],
      chats: safeSharedChats(parsed.chats)
    }
  } catch (_) {
    return emptySharedDemo()
  }
}

function applySharedDemo(shared) {
  const safe = shared || emptySharedDemo(),
    listings = Array.isArray(safe.listings) ? safe.listings.map(safeSharedProduct).filter(product => product?.custom) : [];
  products.splice(0, products.length, ...baseProducts, ...listings);
  state.orders = Array.isArray(safe.orders) ? safe.orders.map(safeSharedOrder).filter(Boolean) : [];
  state.chats = safeSharedChats(safe.chats);
}

function snapshotSharedDemo() {
  return {
    version: 1,
    listings: products.filter(product => product.custom).map(safeSharedProduct).filter(Boolean),
    orders: state.orders.map(safeSharedOrder).filter(Boolean),
    chats: safeSharedChats(state.chats)
  }
}

function mergeVersionedRecords(remoteRecords, localRecords) {
  const records = new Map((remoteRecords || []).map(record => [record.id, record]));
  (localRecords || []).forEach(local => {
    const remote = records.get(local.id),
      remoteTime = Date.parse(remote?.updatedAt || '') || 0,
      localTime = Date.parse(local.updatedAt || '') || 0;
    if (!remote || localTime >= remoteTime) records.set(local.id, local)
  });
  return [...records.values()]
}

function mergeSharedDemo(remote, local) {
  const chats = {};
  [remote?.chats, local?.chats].forEach(source => Object.entries(source || {}).forEach(([key, messages]) => {
    chats[key] = [...(chats[key] || []), ...(messages || [])]
  }));
  return {
    version: 1,
    listings: mergeVersionedRecords(remote?.listings, local?.listings),
    orders: mergeVersionedRecords(remote?.orders, local?.orders),
    chats: safeSharedChats(chats)
  }
}

function refreshSharedDemo() {
  applySharedDemo(readSharedDemo())
}

function persistSharedDemo() {
  let latest = emptySharedDemo();
  try {
    const stored = JSON.parse(localStorage.getItem(SHARED_DEMO_KEY) || 'null');
    if (stored?.version === 1) latest = {
      version: 1,
      listings: Array.isArray(stored.listings) ? stored.listings.map(safeSharedProduct).filter(Boolean) : [],
      orders: Array.isArray(stored.orders) ? stored.orders.map(safeSharedOrder).filter(Boolean) : [],
      chats: safeSharedChats(stored.chats)
    };
    const merged = mergeSharedDemo(latest, snapshotSharedDemo()),
      serialized = JSON.stringify({ ...merged, updatedAt: new Date().toISOString(), revision: stableId('rev') });
    localStorage.setItem(SHARED_DEMO_KEY, serialized);
    applySharedDemo(merged);
    try { sharedChannel?.postMessage({ type: 'update', revision: Date.now() }) } catch (_) {}
    return true
  } catch (_) {
    toast('Penyimpanan browser penuh atau tidak tersedia. Perubahan belum dibagikan ke tab lain.');
    return false
  }
}

function touchOrder(order) {
  const previous = Date.parse(order.updatedAt || '') || 0;
  order.updatedAt = new Date(Math.max(Date.now(), previous + 1)).toISOString()
}

function renderAfterSharedUpdate() {
  const route = (location.hash.slice(1) || '/').split('?')[0];
  if ($('#modal')?.open || ['/upload', '/checkout', '/pengembalian', '/masalah'].some(prefix => route === prefix || route.startsWith(prefix + '/'))) return;
  const chatInput = route === '/chat' ? $('#chatInput') : null,
    chatDraft = chatInput?.value || '',
    chatScroll = $('#chatMessages')?.scrollTop || 0,
    pageScroll = window.scrollY;
  if (!['/', '/jelajah', '/merchant', '/pesanan', '/chat'].includes(route) && !route.startsWith('/outfit/') && !route.startsWith('/pemilik/')) return;
  render();
  if (chatDraft && $('#chatInput')) {
    $('#chatInput').value = chatDraft;
    $('#chatMessageCount').textContent = `${chatDraft.length.toLocaleString('id-ID')}/1.000`
  }
  if ($('#chatMessages')) $('#chatMessages').scrollTop = Math.max(chatScroll, $('#chatMessages').scrollHeight);
  window.scrollTo({ top: pageScroll, behavior: 'instant' })
}

function resetSharedDemo() {
  let removed = true;
  try { localStorage.removeItem(SHARED_DEMO_KEY) } catch (_) { removed = false }
  applySharedDemo(emptySharedDemo());
  try { sharedChannel?.postMessage({ type: 'reset', revision: Date.now() }) } catch (_) {}
  render();
  toast(removed ? 'Data Reoutfit di browser ini sudah direset.' : 'Data di tab ini sudah direset, tetapi penyimpanan bersama tidak tersedia.')
}

function startSharedDemoSync() {
  refreshSharedDemo();
  try {
    if ('BroadcastChannel' in window) {
      sharedChannel = new BroadcastChannel(SHARED_DEMO_CHANNEL);
      sharedChannel.onmessage = event => {
        if (event.data?.type === 'reset') applySharedDemo(emptySharedDemo());
        else refreshSharedDemo();
        renderAfterSharedUpdate()
      }
    }
  } catch (_) { sharedChannel = null }
  window.addEventListener('storage', event => {
    if (event.key !== SHARED_DEMO_KEY) return;
    if (event.newValue === null) applySharedDemo(emptySharedDemo());
    else refreshSharedDemo();
    renderAfterSharedUpdate()
  });
}
let toastTimer;
const transientObjectUrls = new Set();
function createTransientObjectUrl(file) {
  const url = URL.createObjectURL(file);
  transientObjectUrls.add(url);
  return url
}

function releaseTransientObjectUrl(url) {
  if (!url || !transientObjectUrls.has(url)) return;
  URL.revokeObjectURL(url);
  transientObjectUrls.delete(url)
}

function promoteTransientObjectUrl(url) {
  transientObjectUrls.delete(url)
}

function imageFileToSharedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file),
      image = new Image();
    image.onload = async () => {
      URL.revokeObjectURL(sourceUrl);
      try {
        const canvas = document.createElement('canvas'),
          context = canvas.getContext('2d');
        if (!context || !image.naturalWidth || !image.naturalHeight) throw new Error('Gambar tidak dapat dibaca.');
        let maxDimension = 960,
          result = null;
        for (let pass = 0; pass < 9; pass++) {
          const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const quality = Math.max(.42, .78 - pass * .06),
            blob = await new Promise(done => canvas.toBlob(done, 'image/jpeg', quality));
          if (!blob) throw new Error('Gambar tidak dapat dikompresi.');
          result = blob;
          if (blob.size <= 110 * 1024) break;
          maxDimension = Math.max(480, Math.round(maxDimension * .82))
        }
        if (!result || result.size > 150 * 1024) throw new Error('Gambar terlalu besar untuk dibagikan ke tab lain.');
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Gambar tidak dapat disiapkan.'));
        reader.readAsDataURL(result)
      } catch (error) { reject(error) }
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error('File ini tidak dapat dibaca sebagai gambar.'))
    };
    image.src = sourceUrl
  })
}

function revokeIfObjectUrl(value) {
  if (typeof value === 'string' && value.startsWith('blob:')) URL.revokeObjectURL(value)
}

function releaseTransientObjectUrls() {
  [...transientObjectUrls].forEach(releaseTransientObjectUrl)
}

window.addEventListener('beforeunload', () => {
  releaseTransientObjectUrls();
  state.orders.forEach(order => {
    ['initialConditionPhotos', 'finalConditionPhotos', 'receivedEvidence', 'returnEvidence'].forEach(key => (order[key] || []).forEach(item => revokeIfObjectUrl(item.url)));
    (order.issue?.evidence || []).forEach(item => revokeIfObjectUrl(item.url))
  })
});

let catalogScrollY = 0;
let renderedRoute = location.hash.slice(1) || '/';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

window.addEventListener('scroll', () => {
  if (renderedRoute === '/jelajah' && (location.hash.slice(1) || '/') === '/jelajah') catalogScrollY = window.scrollY
}, { passive: true });

document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#/outfit/"]');
  if (link && renderedRoute === '/jelajah') catalogScrollY = window.scrollY
}, true);

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

const DEMO_RENTER_ID = 'renter-demo';
const ownerId = product => 'owner-' + String(product.owner || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ownerInitials = name => String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
const chatHref = (product, order = null, from = '') => {
  const params = new URLSearchParams({
    product: product.id,
    from: from || (order ? '/pesanan' : '/outfit/' + product.id)
  });
  if (order) params.set('order', order.id);
  return '#/chat?' + params.toString()
};

function ownerRatingSummary(id) {
  const reviews = state.orders.filter(order => order.step === 3 && (order.ownerId || ownerId(order.product)) === id && order.renterReview).map(order => ({
    review: order.renterReview,
    order
  }));
  return {
    reviews,
    count: reviews.length,
    average: reviews.length ? reviews.reduce((sum, item) => sum + Number(item.review.rating), 0) / reviews.length : null
  }
}

function reviewEligibility(order, side) {
  if (side !== 'renter' && side !== 'owner') return 'Peran pemberi ulasan tidak valid.';
  if (!order || order.step !== 3) return 'Ulasan tersedia setelah outfit dikembalikan dan pemeriksaan selesai.';
  const owner = order.ownerId || ownerId(order.product),
    renter = order.renterId || DEMO_RENTER_ID,
    field = side === 'renter' ? 'renterReview' : 'ownerReview';
  if (owner === renter) return 'Kamu tidak dapat memberi ulasan kepada diri sendiri.';
  if (order[field]) return 'Ulasan untuk transaksi ini sudah dikirim.';
  return ''
}

function reviewAction(order, side) {
  const field = side === 'renter' ? 'renterReview' : 'ownerReview',
    label = side === 'renter' ? 'pemilik' : 'penyewa';
  if (order[field]) return `<p class="review-submitted">${side === 'renter' ? 'Ulasan untuk pemilik' : 'Ulasan balasan untuk penyewa'}: <strong>${order[field].rating}/5 ★</strong>${order[field].text ? ` · ${esc(order[field].text)}` : ''}</p>`;
  const blocked = reviewEligibility(order, side);
  if (order.step !== 3) return '';
  if (blocked) return `<p class="hint">${esc(blocked)}</p>`;
  return `<button class="btn secondary" type="button" data-review="${order.id}" data-review-side="${side}">Beri ulasan untuk ${label}</button>`
}

function ownerProfile(id, from) {
  const owned = products.filter(product => ownerId(product) === id);
  if (!owned.length) return notfound();
  const name = owned[0].owner,
    summary = ownerRatingSummary(id),
    location = [...new Set(owned.map(product => product.location))].join(' · '),
    profileCopy = name === 'Lemari Nara' ? 'Mengkurasi outfit untuk momen santai dan acara spesial.' : name === 'Atelier Luna' ? 'Koleksi kostum dan outfit dengan detail pilihan.' : 'Pemilik outfit di Reoutfit.',
    returnProduct = products.find(product => product.id === from && ownerId(product) === id) || owned[0],
    summaryText = summary.count ? `${summary.average.toFixed(1)} dari 5 · ${summary.count} ulasan` : 'Belum ada ulasan';
  return `<div class="container"><div class="page-top"><nav class="crumb" aria-label="Breadcrumb"><a href="#/jelajah">Jelajah outfit</a><span>/</span><span>Profil pemilik</span></nav><a class="btn secondary" href="#/outfit/${encodeURIComponent(returnProduct.id)}">Kembali ke detail outfit</a></div><section class="panel owner-profile"><div class="owner-profile-heading"><span class="owner-profile-avatar" aria-hidden="true">${esc(ownerInitials(name))}</span><div><p class="eyebrow">Profil pemilik outfit</p><h1>${esc(name)}</h1><p class="muted">${esc(location)} · ${esc(profileCopy)}</p><span class="badge neutral">Identitas: ${state.merchantVerificationPassed && name === 'Lemari Kamu' ? 'Terverifikasi (simulasi)' : 'Belum diverifikasi (simulasi)'}</span></div></div><div class="owner-profile-stats"><div><strong>${owned.length}</strong><span>Outfit aktif</span></div><div><strong>${summary.count ? `${summary.average.toFixed(1)} ★` : '—'}</strong><span>${esc(summaryText)}</span></div></div></section><section class="profile-section"><div class="section-heading"><div><p class="eyebrow">Koleksi pemilik</p><h2>Outfit lainnya</h2></div></div><div class="outfits">${owned.map(card).join('')}</div></section><section class="panel profile-section"><div class="section-heading"><div><p class="eyebrow">Pengalaman penyewa</p><h2>Ulasan pemilik</h2></div></div>${summary.count ? `<div class="profile-reviews">${summary.reviews.map(({ review, order }) => `<article class="profile-review"><div class="review-topline"><strong>${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</strong><span class="small muted">${esc(order.id)} · ${formatDate(order.start)} · ${order.days} hari</span></div><p>${review.text ? esc(review.text) : '<span class="muted">Tanpa komentar tertulis.</span>'}</p><small class="muted">Ulasan setelah pengembalian dan pemeriksaan selesai.</small></article>`).join('')}</div>` : '<p class="muted">Belum ada ulasan</p>'}</section><a class="btn secondary" href="#/outfit/${encodeURIComponent(returnProduct.id)}">Kembali ke detail outfit</a></div>`
}

function openReviewForm(orderId, side) {
  const order = state.orders.find(item => item.id === orderId),
    blocked = reviewEligibility(order, side);
  if (activeRole() !== side) {
    toast('Ulasan hanya tersedia untuk peran yang sedang aktif.');
    return
  }
  if (blocked) {
    toast(blocked);
    return
  }
  const recipient = side === 'renter' ? 'pemilik outfit' : 'penyewa',
    m = $('#modal');
  showModal(`Ulas ${recipient}`, '', `<p class="small muted">Transaksi ${esc(order.id)} · ${esc(order.product.name)} · ${formatDate(order.start)} · ${order.days} hari</p><form id="reviewForm" data-review-id="${esc(order.id)}" data-review-side="${side}"><fieldset class="rating-field"><legend>Rating untuk ${recipient}</legend><div class="rating-options">${[1,2,3,4,5].map(n => `<label><input type="radio" name="rating" value="${n}" required><span aria-label="${n} dari 5 bintang">${n} ★</span></label>`).join('')}</div></fieldset><label>Ulasan (opsional)<textarea name="text" maxlength="500" placeholder="Bagikan pengalaman terkait transaksi ini."></textarea></label><p class="hint">Ulasan hanya dapat diberikan setelah outfit dikembalikan dan pemeriksaan selesai. </p><button class="btn full" type="submit">Kirim ulasan</button></form>`);
  $('#reviewForm').onsubmit = event => {
    event.preventDefault();
    refreshSharedDemo();
    const form = event.currentTarget,
      currentOrder = state.orders.find(item => item.id === form.dataset.reviewId),
      currentSide = form.dataset.reviewSide,
      eligibilityError = reviewEligibility(currentOrder, currentSide),
      value = new FormData(form).get('rating'),
      rating = Number(value);
    if (activeRole() !== currentSide || eligibilityError || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      toast(eligibilityError || 'Pilih rating 1–5 bintang sebelum mengirim.');
      return
    }
    currentOrder[currentSide === 'renter' ? 'renterReview' : 'ownerReview'] = {
      rating,
      text: String(new FormData(form).get('text') || '').trim(),
      createdAt: new Date().toISOString()
    };
    touchOrder(currentOrder);
    persistSharedDemo();
    m.close();
    render();
    toast('Ulasan terkirim.');
  }
}

function chatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function chatPage(productId, orderId, from) {
  const product = products.find(item => item.id === productId),
    order = orderId ? state.orders.find(item => item.id === orderId && item.product.id === productId) : null;
  if (!product || (orderId && !order)) return notfound();
  const key = order ? 'order:' + order.id : 'product:' + product.id,
    messages = state.chats[key] || (state.chats[key] = []),
    returnTo = order && from === '/pesanan' ? '/pesanan' : '/outfit/' + product.id,
    role = activeRole(),
    peer = role === 'renter' ? product.owner : 'Penyewa',
    roleLabel = role === 'renter' ? 'Penyewa' : 'Pemilik';
  return `<div class="container chat-page"><div class="page-top chat-page-top"><div><nav class="crumb" aria-label="Breadcrumb"><a href="#${returnTo}">Kembali</a><span>/</span><span>Chat</span></nav><p class="eyebrow">Percakapan</p><h1>Chat dengan ${esc(peer)}</h1></div><a class="btn secondary" href="#${returnTo}">Kembali</a></div><section class="panel chat-outfit"><img src="${esc(product.img)}" alt="${esc(product.name)}"><div class="chat-outfit-info"><span class="eyebrow">Outfit terkait</span><h2>${esc(product.name)}</h2><p class="muted">${esc(product.owner)} · ${esc(product.location)} · ${money(product.price)} / hari</p>${order ? `<p class="small">Pesanan ${esc(order.id)} · ${order.days} hari · ${formatDate(order.start)}</p>` : ''}</div><a class="help-link" href="#/outfit/${encodeURIComponent(product.id)}">Lihat outfit</a></section><section class="chat-demo-note"><p>Pesan dibagikan antar-tab pada browser ini.</p></section><section class="panel chat-panel" aria-label="Percakapan dengan ${esc(peer)}"><div class="chat-panel-heading"><div><span class="small muted">${order ? `Pesanan ${esc(order.id)}` : 'Pertanyaan tentang outfit'}</span><h2>${esc(peer)}</h2></div></div><div class="chat-messages" id="chatMessages" role="log" aria-live="polite" aria-relevant="additions text">${messages.length ? messages.map(message => {
    const own = message.sender === role,
      sender = own ? `Kamu · ${message.sender === 'renter' ? 'Penyewa' : 'Pemilik'}` : peer;
    return `<article class="chat-message ${own ? 'own' : 'other'}"><span class="chat-sender">${esc(sender)}</span><p>${esc(message.text)}</p><time datetime="${esc(message.createdAt)}">${esc(chatTime(message.createdAt))}</time></article>`
  }).join('') : '<div class="chat-empty"><strong>Belum ada pesan</strong><p>Mulai percakapan dengan menulis pesan di bawah.</p></div>'}</div><form class="chat-compose" id="chatForm" data-chat-key="${esc(key)}"><label for="chatInput">Pesan</label><textarea id="chatInput" name="message" rows="3" maxlength="1000" placeholder="Tulis pesan tentang outfit atau transaksi ini…" aria-describedby="chatMessageHint chatMessageError"></textarea><div class="chat-compose-meta"><span class="hint" id="chatMessageHint">Maksimal 1.000 karakter.</span><span class="small muted" id="chatMessageCount">0/1.000</span></div><p class="field-error" id="chatMessageError" role="alert" aria-live="polite"></p><button class="btn" type="submit">Kirim pesan</button></form></section></div>`
}

function dateISO() {
  let d = new Date();
  d.setDate(d.getDate() + 2);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

// Tanggal yang diblokir berulang tiap bulan agar jadwal demo konsisten saat dirender ulang.
const demoUnavailableDays = Object.freeze({
  korean: [8, 9, 18],
  cosplay: [12, 13, 22],
  dress: [5, 6, 17],
  vest: [14, 15, 26]
});

function localDateFromISO(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null
}

function localDateISO(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function todayISO() {
  return localDateISO(new Date())
}

function addDaysISO(value, days) {
  const date = localDateFromISO(value);
  if (!date) return '';
  date.setDate(date.getDate() + Number(days));
  return localDateISO(date)
}

function monthISO(value) {
  return String(value || '').slice(0, 7)
}

function demoDateAvailable(productId, value) {
  const date = localDateFromISO(value);
  if (!date || value < todayISO()) return false;
  return !(demoUnavailableDays[productId] || []).includes(date.getDate())
}

function rentalPeriodIssue(productId, start, days) {
  const startDate = localDateFromISO(start),
    duration = Number(days);
  if (!startDate) return { date: start, reason: 'Pilih tanggal mulai sewa yang valid.' };
  if (start < todayISO()) return { date: start, reason: 'Tanggal yang sudah lewat tidak dapat dipilih.' };
  if (!Number.isInteger(duration) || duration < 1 || duration > 7) return { date: start, reason: 'Durasi sewa harus antara 1–7 hari.' };
  for (let offset = 0; offset < duration; offset++) {
    const date = addDaysISO(start, offset);
    if (!demoDateAvailable(productId, date)) return { date, reason: 'Tanggal ini tidak tersedia.' }
  }
  return null
}

function rentalPeriodAvailable(productId, start, days) {
  return rentalPeriodIssue(productId, start, days) === null
}

function nextAvailableStart(productId, from, days) {
  const base = localDateFromISO(from),
    first = !base || from < todayISO() ? todayISO() : from;
  for (let offset = 0; offset < 740; offset++) {
    const candidate = addDaysISO(first, offset);
    if (rentalPeriodAvailable(productId, candidate, days)) return candidate
  }
  return dateISO()
}

function availabilityCalendarMarkup(productId, month) {
  const [year, monthNumber] = month.split('-').map(Number),
    firstOfMonth = new Date(year, monthNumber - 1, 1, 12),
    daysInMonth = new Date(year, monthNumber, 0, 12).getDate(),
    offset = (firstOfMonth.getDay() + 6) % 7,
    monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(firstOfMonth),
    selectedEnd = state.start ? addDaysISO(state.start, state.days - 1) : '',
    weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  let days = '';
  for (let cell = 0; cell < 42; cell++) {
    const day = cell - offset + 1;
    if (day < 1 || day > daysInMonth) {
      days += '<span class="availability-empty" aria-hidden="true"></span>';
      continue
    }
    const value = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      past = value < todayISO(),
      available = !past && demoDateAvailable(productId, value),
      conflict = available && !!rentalPeriodIssue(productId, value, state.days),
      inRange = !!state.start && value >= state.start && value <= selectedEnd,
      start = value === state.start,
      end = value === selectedEnd,
      status = past ? 'Lewat' : available ? 'Tersedia' : 'Tidak tersedia',
      selectionLabel = start && end ? '; tanggal mulai dan kembali dipilih' : start ? '; tanggal mulai dipilih' : end ? '; tanggal kembali dipilih' : inRange ? '; termasuk periode sewa' : '',
      marker = start && end ? 'M/K' : start ? 'M' : end ? 'K' : inRange ? '•' : past ? '—' : available ? '✓' : '×',
      classes = ['availability-day', past ? 'is-past' : available ? 'is-available' : 'is-unavailable'];
    if (inRange) classes.push('is-in-range');
    if (start) classes.push('is-start');
    if (end) classes.push('is-end');
    if (conflict) classes.push('has-range-conflict');
    const conflictLabel = conflict ? `; rentang ${state.days} hari melewati tanggal tidak tersedia` : '';
    days += `<button type="button" class="${classes.join(' ')}" data-calendar-date="${value}" aria-label="${esc(formatDate(value))}: ${status}${selectionLabel}${conflictLabel}" aria-pressed="${start || end}" ${past ? 'disabled' : available ? '' : 'aria-disabled="true"'} title="${status}${selectionLabel}${conflictLabel}"><span class="availability-number">${day}</span><span class="availability-mark" aria-hidden="true">${marker}</span></button>`
  }
  return `<div class="availability-calendar-head"><button type="button" class="calendar-month-button" data-calendar-nav="-1" aria-label="Bulan sebelumnya">‹</button><h3 aria-live="polite">${monthLabel}</h3><button type="button" class="calendar-month-button" data-calendar-nav="1" aria-label="Bulan berikutnya">›</button></div><div class="availability-weekdays" aria-hidden="true">${weekdays.map(day => `<span>${day}</span>`).join('')}</div><div class="availability-days" aria-label="Tanggal pada ${monthLabel}">${days}</div><div class="availability-legend" aria-label="Keterangan kalender"><span><i class="legend-mark available">✓</i>Tersedia</span><span><i class="legend-mark unavailable">×</i>Tidak tersedia</span><span><i class="legend-mark past">—</i>Lewat</span><span><i class="legend-mark selected">M</i>Mulai sewa</span><span><i class="legend-mark return">K</i>Tanggal kembali</span><span><i class="legend-mark conflict">!</i>Durasi berbenturan</span></div>`
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
  if (!activeRole() || route === '/mode') {
    $('#header').innerHTML = `<nav class="nav mode-nav" aria-label="Navigasi utama"><a class="logo" href="#/mode">reoutfit</a><button class="btn secondary" type="button" data-reset-demo>Reset data</button></nav>`;
    return
  }
  const isRenter = activeRole() === 'renter',
    root = isRenter ? '/' : '/merchant',
    links = isRenter ? [
      ['/', 'Beranda'], ['/jelajah', 'Jelajah outfit'], ['/pesanan', 'Pesanan saya'], ['/panduan', 'Cara sewa']
    ] : [
      ['/merchant', 'Dashboard'], ['/pesanan', 'Pesanan masuk'], ['/upload', 'Tambah outfit']
    ],
    chatHrefForMode = availableChatHref();
  if (chatHrefForMode) links.splice(links.length - 1, 0, [chatHrefForMode.slice(1), 'Chat']);
  $('#header').innerHTML = `<nav class="nav" aria-label="Navigasi utama"><a class="logo" href="#${root}">reoutfit</a><div class="navlinks">${links.map(([path, label]) => `<a class="${route===path.split('?')[0]?'active':''}" href="#${path}">${label}</a>`).join('')}</div><div class="navright"><span class="badge neutral nav-mode-label">Mode ${isRenter ? 'penyewa' : 'pemilik'}</span><a class="btn secondary" href="#/mode">Ganti mode</a><button class="btn ghost" type="button" data-reset-demo>Reset data</button></div></nav>`
}

function availableChatHref() {
  const order = state.orders.find(item => state.chats['order:' + item.id]);
  if (order) return chatHref(order.product, order, '/pesanan');
  const productKey = Object.keys(state.chats).find(key => key.startsWith('product:')),
    product = productKey && products.find(item => item.id === productKey.slice('product:'.length));
  return product ? chatHref(product) : ''
}

function modeChooser() {
  return `<div class="mode-chooser narrow"><h1>Pilih peran</h1><p class="mode-intro">Pilih peran untuk melanjutkan.</p><div class="mode-options"><article class="panel mode-option"><span class="icon-tile">${icon('search')}</span><h2>Saya ingin menyewa</h2><p>Jelajahi katalog, pilih jadwal, lanjutkan ke checkout, dan kelola pesanan penyewa.</p><button class="btn full" type="button" data-select-mode="renter">Masuk sebagai penyewa</button></article><article class="panel mode-option"><span class="icon-tile">${icon('shirt')}</span><h2>Saya ingin menyewakan</h2><p>Kelola outfit, lihat pesanan masuk, dokumentasi kondisi, pengembalian, dan percakapan.</p><button class="btn full" type="button" data-select-mode="owner">Masuk sebagai pemilik outfit</button></article></div><p class="small muted">Data tersimpan di browser ini, bukan di server.</p></div>`
}

function modeRestrictedPage(role) {
  const isRenter = role === 'renter';
  return `<div class="narrow"><div class="empty mode-restricted" style="margin:40px 0"><h1>Halaman ini tersedia di mode ${isRenter ? 'penyewa' : 'pemilik outfit'}</h1><p>Mode aktif tetap ${activeRole() === 'renter' ? 'penyewa' : 'pemilik outfit'}. Data tetap tersedia saat berpindah halaman.</p><a class="btn" href="#${isRenter ? '/' : '/merchant'}">Kembali ke ${isRenter ? 'beranda' : 'dashboard'}</a></div></div>`
}

function showModal(title, body, actions = '') {
  const m = $('#modal');
  m.innerHTML = `<div class="dialog-head"><h2>${title}</h2><button class="icon-btn" aria-label="Tutup dialog" id="closeModal">${icon('close')}</button></div><p>${body}</p>${actions}`;
  m.showModal();
  $('#closeModal').onclick = () => m.close()
}

function requestIdentityVerification(role, onSuccess) {
  const m = $('#modal'),
    isRenter = role === 'renter',
    roleName = isRenter ? 'penyewa' : 'pemilik outfit',
    statusKey = isRenter ? 'renterVerificationPassed' : 'merchantVerificationPassed';
  m.innerHTML = `<div class="dialog-head"><h2>Verifikasi ${roleName}</h2><button class="icon-btn" aria-label="Tutup dialog" id="verificationClose">${icon('close')}</button></div><p>Verifikasi ini hanya simulasi. Jangan unggah dokumen identitas asli.</p><section class="verification-image-upload" aria-labelledby="verificationImageLabel"><label class="verification-image-label" id="verificationImageLabel" for="verificationImageInput">Gambar simulasi</label><input id="verificationImageInput" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="verificationImageHint verificationImageError"><p class="verification-image-hint" id="verificationImageHint">Gambar dummy boleh. Pratinjau lokal saja; maksimal 5 MB.</p><div class="verification-image-preview" id="verificationImagePreview" hidden><img id="verificationImageThumb" alt="Pratinjau lokal gambar simulasi"><div class="verification-image-details"><strong id="verificationImageName"></strong><span id="verificationImageStatus" class="small muted"></span><div class="verification-image-buttons"><button class="btn secondary" id="verificationImageReplace" type="button">Ganti gambar</button><button class="btn ghost" id="verificationImageRemove" type="button">Hapus gambar</button></div></div></div><p class="verification-image-error" id="verificationImageError" role="alert" aria-live="polite"></p></section><div class="verification-actions"><button class="btn full" type="button" data-verification="success" disabled>Simulasikan berhasil</button><button class="btn secondary full" type="button" data-verification="failure">Simulasikan gagal</button><button class="btn ghost full" type="button" data-verification="cancel">Batal</button></div>`;
  const fileInput = $('#verificationImageInput'),
    preview = $('#verificationImagePreview'),
    previewImage = $('#verificationImageThumb'),
    fileName = $('#verificationImageName'),
    imageStatus = $('#verificationImageStatus'),
    imageError = $('#verificationImageError'),
    successButton = m.querySelector('[data-verification="success"]');
  let selectedFile = null,
    previewUrl = '';
  const releasePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    previewImage.onload = null;
    previewImage.onerror = null;
    previewImage.removeAttribute('src')
  };
  const clearSelection = () => {
    selectedFile = null;
    successButton.disabled = true;
    fileInput.value = '';
    preview.hidden = true;
    fileName.textContent = '';
    imageStatus.textContent = '';
    imageError.textContent = '';
    releasePreview()
  };
  const close = () => {
    clearSelection();
    m.close()
  };
  m.addEventListener('close', clearSelection, { once: true });
  m.showModal();
  $('#verificationClose').onclick = close;
  fileInput.onchange = () => {
    const file = fileInput.files && fileInput.files[0];
    clearSelection();
    if (!file) return;
    const expectedTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' },
      extension = file.name.split('.').pop().toLowerCase(),
      mimeType = String(file.type || '').toLowerCase();
    if (!expectedTypes[extension] || expectedTypes[extension] !== mimeType) {
      imageError.textContent = 'Format tidak didukung. Pilih gambar JPEG, PNG, atau WebP.';
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      imageError.textContent = 'Ukuran gambar melebihi 5 MB. Pilih file yang lebih kecil.';
      return
    }
    const url = URL.createObjectURL(file);
    previewUrl = url;
    preview.hidden = false;
    fileName.textContent = file.name;
    imageStatus.textContent = 'Memeriksa pratinjau lokal…';
    previewImage.onload = () => {
      if (previewUrl !== url) return;
      selectedFile = file;
      successButton.disabled = false;
      imageStatus.textContent = 'Gambar siap untuk simulasi.'
    };
    previewImage.onerror = () => {
      if (previewUrl !== url) return;
      clearSelection();
      imageError.textContent = 'File ini tidak dapat dibaca sebagai gambar. Pilih JPEG, PNG, atau WebP yang valid.'
    };
    previewImage.src = url
  };
  $('#verificationImageReplace').onclick = () => fileInput.click();
  $('#verificationImageRemove').onclick = clearSelection;
  $$('[data-verification]').forEach(button => button.onclick = () => {
    const outcome = button.dataset.verification;
    if (outcome === 'failure') {
      close();
      toast('Simulasi verifikasi gagal. Status belum berubah dan isian tetap tersimpan.');
      return
    }
    if (outcome === 'cancel') {
      close();
      toast('Simulasi verifikasi dibatalkan. Isian tetap tersimpan.');
      return
    }
    if (!selectedFile) {
      imageError.textContent = 'Pilih gambar JPEG, PNG, atau WebP yang valid sebelum simulasi berhasil.';
      return
    }
    state[statusKey] = true;
    close();
    toast(`Status ${roleName}: Terverifikasi (simulasi).`);
    if (onSuccess) onSuccess()
  })
}

function card(p) {
  return `<article class="product"><a class="product-photo" href="#/outfit/${p.id}" aria-label="Lihat ${esc(p.name)}"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"><span class="badge">Ukuran ${esc(p.size)}</span></a><div class="product-body"><div class="eyebrow">${esc(p.category)}</div><h3><a href="#/outfit/${p.id}">${esc(p.name)}</a></h3><span class="meta">${icon('pin')} ${esc(p.location)}</span><div class="price num">${money(p.price)} <small>/ hari · min. 1 hari</small></div><span class="meta">Deposit ${money(p.deposit)}</span><a class="btn secondary" href="#/outfit/${p.id}">Lihat detail</a></div></article>`
}

function home() {
  return `<div class="container"><section class="hero"><div class="hero-copy"><h1>Sewa outfit untuk<br><span>setiap acara.</span></h1><p>Temukan dan sewa outfit sesuai kebutuhanmu.</p><a href="#/jelajah" class="btn">Jelajahi outfit ${icon('search')}</a></div><a class="hero-image" href="#/outfit/korean" aria-label="Lihat Blue Hour Korean Set"><img src="assets/korean.webp" alt="Korean style dengan cardigan biru dan atasan putih"><div class="hero-tag"><div><small>KOREAN STYLE</small><strong>Blue Hour Korean Set</strong></div><div><strong class="num">Rp55.000</strong><small>per hari</small></div></div></a></section><div class="trust"><div class="trust-item"><span class="icon-tile">${icon('wallet')}</span><div><strong>Biaya terlihat sejak awal</strong><small>Sewa, layanan, dan deposit terpisah.</small></div></div><div class="trust-item"><span class="icon-tile">${icon('shirt')}</span><div><strong>Cek ukuran, lebih yakin</strong><small>Ukuran dalam cm & detail kelengkapan.</small></div></div><div class="trust-item"><span class="icon-tile">${icon('shield')}</span><div><strong>Ketentuan sebelum transaksi</strong><small>Baca aturan pemilik sebelum menyewa.</small></div></div></div><section class="section"><div class="section-heading"><div><h2>Pilihan outfit</h2></div><a class="btn ghost" href="#/jelajah">Lihat semua outfit</a></div><div class="chips"><button class="chip active" data-home-cat="Semua">Semua outfit</button><button class="chip" data-home-cat="Korean style">Korean style</button><button class="chip" data-home-cat="Cosplay">Cosplay</button><button class="chip" data-home-cat="Dress">Dress</button><button class="chip" data-home-cat="Vest & formal">Vest & formal</button></div><div class="outfits" id="home-products">${products.map(card).join('')}</div><p class="small muted" style="margin-top:17px"></p></section><section class="section" style="border-top:1px solid var(--border)"><h2>Cara sewa</h2><div class="steps">${[['01','Pilih outfit','Pilih gaya, cek ukuran dan kelengkapan.'],['02','Atur jadwal','Pilih tanggal, baca syarat, cek total biaya.'],['03','Terima & pakai','Cek dan foto kondisi saat outfit diterima.'],['04','Kembalikan outfit','Upload bukti; deposit ditinjau setelah pemeriksaan.']].map(a=>`<div class="step"><b>${a[0]}</b><h3>${a[1]}</h3><p>${a[2]}</p></div>`).join('')}</div></section><section class="merchant-banner"><div><h2>Sewakan outfit</h2><p>Upload foto, isi detail, dan tentukan harga sewa.</p></div><a class="btn" href="#/merchant">Mulai sewakan ${icon('plus')}</a></section></div>`
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
  return `<div class="summary-row"><span>Sewa (${days} hari × ${money(p.price)})</span><strong class="num">${money(rent)}</strong></div><div class="summary-row"><span>Biaya platform (10%)</span><strong class="num">${money(fee)}</strong></div><div class="summary-row"><span>Deposit yang dapat dikembalikan</span><strong class="num">${money(p.deposit)}</strong></div><div class="summary-row"><span>${delivery==='courier'?'Kurir pulang-pergi':'Ambil & kembali langsung'}</span><strong class="num">${money(ship)}</strong></div><div class="summary-row total"><span>Total termasuk deposit</span><strong class="num">${money(rent+fee+p.deposit+ship)}</strong></div>`
}

function outfitPhotoSources(product) {
  const sources = [product.img, ...(Array.isArray(product.photos) ? product.photos : [])];
  return [...new Set(sources.filter(source => typeof source === 'string' && source.trim()))]
}

function outfitGalleryMarkup(product) {
  const photos = outfitPhotoSources(product),
    hasMany = photos.length > 1;
  if (!photos.length) return '<section class="outfit-gallery"><div class="gallery-empty" role="status">Foto outfit belum tersedia.</div></section>';
  return `<section class="outfit-gallery" aria-label="Galeri ${esc(product.name)}"><div class="gallery-main-frame"><button class="gallery-image-trigger" type="button" aria-label="Perbesar foto outfit" aria-haspopup="dialog"><img class="detail-photo" id="mainPhoto" src="${esc(photos[0])}" alt="${esc(product.name)}" data-gallery-main><span class="gallery-image-hint">Perbesar gambar</span></button><div class="gallery-image-fallback" role="status" hidden>Foto ini tidak dapat dimuat.</div>${hasMany ? `<button class="gallery-arrow gallery-arrow-prev" type="button" data-gallery-prev aria-label="Foto sebelumnya">‹</button><button class="gallery-arrow gallery-arrow-next" type="button" data-gallery-next aria-label="Foto berikutnya">›</button>` : ''}</div><div class="gallery-toolbar"><span class="gallery-counter" data-gallery-counter aria-live="polite">1 dari ${photos.length}</span>${hasMany ? '<span class="small muted">Gunakan panah kiri/kanan atau pilih thumbnail.</span>' : ''}</div>${hasMany ? `<div class="gallery-thumbnails" aria-label="Pilih foto outfit">${photos.map((source, index) => `<button class="gallery-thumbnail${index === 0 ? ' is-active' : ''}" type="button" data-gallery-index="${index}" aria-label="Lihat foto ${index + 1} dari ${photos.length}" aria-pressed="${index === 0}"><img src="${esc(source)}" alt="" loading="lazy"><span>${index + 1}</span></button>`).join('')}</div>` : ''}<dialog class="gallery-lightbox" aria-label="Tampilan gambar outfit" data-gallery-lightbox><div class="gallery-lightbox-head"><span data-lightbox-counter>1 dari ${photos.length}</span><button class="btn secondary" type="button" data-lightbox-close>Tutup gambar</button></div><div class="gallery-lightbox-frame"><img src="${esc(photos[0])}" alt="${esc(product.name)}" data-lightbox-image><div class="gallery-lightbox-empty" data-lightbox-fallback hidden>Foto ini tidak dapat dimuat.</div>${hasMany ? '<button class="gallery-arrow gallery-arrow-prev" type="button" data-lightbox-prev aria-label="Foto sebelumnya">‹</button><button class="gallery-arrow gallery-arrow-next" type="button" data-lightbox-next aria-label="Foto berikutnya">›</button>' : ''}</div></dialog></section>`
}

function bindOutfitGallery() {
  const photos = outfitPhotoSources(current()),
    trigger = $('.gallery-image-trigger'),
    mainImage = $('[data-gallery-main]'),
    fallback = $('.gallery-image-fallback'),
    counter = $('[data-gallery-counter]'),
    lightbox = $('[data-gallery-lightbox]'),
    largeFallback = $('[data-lightbox-fallback]');
  if (!photos.length || !trigger || !mainImage || !lightbox) return;
  let index = 0;
  const update = next => {
    index = (next + photos.length) % photos.length;
    mainImage.hidden = false;
    fallback.hidden = true;
    mainImage.removeAttribute('srcset');
    mainImage.src = photos[index];
    mainImage.alt = `${current().name} — foto ${index + 1} dari ${photos.length}`;
    trigger.setAttribute('aria-label', `Perbesar foto ${index + 1} dari ${photos.length}`);
    if (counter) counter.textContent = `${index + 1} dari ${photos.length}`;
    const large = $('[data-lightbox-image]');
    large.hidden = false;
    largeFallback.hidden = true;
    large.removeAttribute('srcset');
    large.src = photos[index];
    large.alt = mainImage.alt;
    $('[data-lightbox-counter]').textContent = `${index + 1} dari ${photos.length}`;
    $$('[data-gallery-index]').forEach(button => {
      const active = Number(button.dataset.galleryIndex) === index;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active))
    })
  };
  const show = () => {
    update(index);
    lightbox.showModal()
  };
  mainImage.onerror = () => {
    mainImage.hidden = true;
    fallback.hidden = false
  };
  $('[data-lightbox-image]').onerror = event => {
    event.currentTarget.hidden = true;
    largeFallback.hidden = false
  };
  $('[data-lightbox-image]').onload = event => {
    event.currentTarget.hidden = false;
    largeFallback.hidden = true
  };
  $$('.gallery-thumbnail img').forEach(image => image.onerror = () => {
    image.hidden = true;
    const fallbackThumb = document.createElement('span');
    fallbackThumb.className = 'gallery-thumbnail-fallback';
    fallbackThumb.textContent = 'Foto tidak tersedia';
    image.parentElement.appendChild(fallbackThumb)
  });
  trigger.onclick = show;
  trigger.onkeydown = event => {
    if (photos.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    update(index + (event.key === 'ArrowRight' ? 1 : -1))
  };
  $$('[data-gallery-index]').forEach(button => button.onclick = () => update(Number(button.dataset.galleryIndex)));
  $$('[data-gallery-prev]').forEach(button => button.onclick = () => update(index - 1));
  $$('[data-gallery-next]').forEach(button => button.onclick = () => update(index + 1));
  $('[data-lightbox-close]').onclick = () => lightbox.close();
  lightbox.onclose = () => trigger.focus({ preventScroll: true });
  lightbox.onkeydown = event => {
    if (photos.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    update(index + (event.key === 'ArrowRight' ? 1 : -1))
  }
}

function detail(p) {
  state.selected = p.id;
  if (!state.start) state.start = dateISO();
  return `<div class="container"><div class="page-top"><nav class="crumb" aria-label="Breadcrumb"><a href="#/">Beranda</a><span>/</span><a href="#/jelajah">Jelajah outfit</a><span>/</span><span>${esc(p.name)}</span></nav></div><div class="detail-grid"><div>${outfitGalleryMarkup(p)}<div class="panel" style="margin-top:24px"><h2>Detail outfit</h2><div class="summary-row"><span class="muted">Brand</span><strong>${esc(p.brand)}</strong></div><div class="summary-row"><span class="muted">Bahan</span><strong>${esc(p.material)}</strong></div><div class="summary-row"><span class="muted">Harga beli pemilik</span><strong class="num">${money(p.original)}</strong></div><p class="small muted">Harga beli bukan nominal denda.</p><details class="accordion" open><summary>Kondisi outfit</summary><p>${esc(p.condition)}</p></details><details class="accordion"><summary>Syarat dari pemilik outfit</summary><p>${esc(p.terms)}</p><p>Nilai penggantian maksimum yang diajukan: <strong>${money(p.replacement)}</strong>. Klaim harus didukung bukti dan ditinjau; bukan biaya otomatis.</p><a class="help-link" href="#/syarat">Pelajari deposit & penanganan masalah</a></details></div></div><div class="detail-info"><div class="eyebrow">${esc(p.category)}</div><h1>${esc(p.name)}</h1><div class="detail-price num">${money(p.price)} <small>/ hari · minimum 1 hari</small></div><p class="muted">${esc(p.description)}</p><div class="owner"><span class="avatar">${icon('user')}</span><div><strong>${esc(p.owner)}</strong><small>${esc(p.location)} · Pemilik outfit</small></div></div><div class="owner-profile-link"><span class="small muted">${ownerRatingSummary(ownerId(p)).count ? `${ownerRatingSummary(ownerId(p)).average.toFixed(1)} ★ · ${ownerRatingSummary(ownerId(p)).count} ulasan` : 'Belum ada ulasan'}</span><a class="help-link" href="#/pemilik/${encodeURIComponent(ownerId(p))}?from=${encodeURIComponent('/outfit/' + p.id)}">Lihat profil pemilik</a></div><div style="margin-top:24px"><h3>Ukuran</h3><div class="table-wrap"><table class="measurements"><thead><tr><th>Ukuran</th><th>Lingkar dada</th><th>Pinggang</th><th>Panjang</th></tr></thead><tbody><tr><td>${esc(p.size)}</td><td>${p.chest} cm</td><td>${p.waist} cm</td><td>${p.length} cm</td></tr></tbody></table></div><p class="small muted">Bandingkan ukuran dalam cm dengan pakaianmu.</p></div><form class="panel booking" id="booking"><h2>Jadwal sewa</h2><div class="form-grid"><label>Tanggal mulai<input id="start" type="date" min="${dateISO()}" value="${state.start}" required></label><label>Durasi sewa<select id="days">${[1,2,3,4,5,6,7].map(n=>`<option value="${n}" ${state.days===n?'selected':''}>${n} hari</option>`).join('')}</select></label></div><p class="hint" id="datehint"></p><div id="detail-costs">${costRows(p,state.days,'pickup')}</div><p class="note">Deposit <b>${money(p.deposit)}</b> dikembalikan setelah pemeriksaan kondisi dan penyelesaian klaim, jika ada.</p><button class="btn full" type="submit">Lanjut ke syarat & checkout</button><p class="hint" style="text-align:center;margin-top:12px">Belum ada pembayaran pada langkah ini.</p></form></div></div></div>`
}

function checkout() {
  let p = current();
  if (!state.start) state.start = dateISO();
  return `<div class="container"><div class="page-top"><nav class="crumb"><a href="#/outfit/${p.id}">Detail outfit</a><span>/</span><span>Checkout</span></nav><h1>Checkout</h1></div><div class="progress-steps"><span><b>1</b> Pilih outfit</span><span class="current"><b>2</b> Syarat & checkout</span><span><b>3</b> Pesanan</span></div><form id="checkoutForm" class="checkout-grid"><div><section class="panel"><h2>01 · Outfit & jadwal</h2><div class="order-mini"><img src="${esc(p.img)}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><p class="small muted">Ukuran ${esc(p.size)} · ${esc(p.owner)}</p><p class="small">${formatDate(state.start)} – ${endDate(state.start,state.days)} · ${state.days} hari</p></div></div><a class="help-link" href="#/outfit/${p.id}">Ubah jadwal</a></section><section class="panel"><h2>02 · Cara menerima outfit</h2><label class="option"><input type="radio" name="delivery" value="pickup" ${state.delivery==='pickup'?'checked':''}><span><strong>Ambil langsung</strong><small>Serah terima di ${esc(p.location)}. Lokasi tepat disepakati dengan pemilik.</small></span><b class="num">Rp0</b></label><label class="option"><input type="radio" name="delivery" value="courier" ${state.delivery==='courier'?'checked':''}><span><strong>Kurir reguler</strong><small>Ongkir pulang-pergi contoh. Atur pengiriman agar tiba sebelum tanggal mulai.</small></span><b class="num">Rp40.000</b></label><div class="form-grid" style="margin-top:22px"><label>Nama penerima <input name="receiver" placeholder="Contoh: Nara" required autocomplete="off"></label><label>Nomor telepon <input name="phone" type="tel" placeholder="Contoh: 081234567890" pattern="[0-9+ ()-]{8,18}" required autocomplete="off"></label><label class="span2" id="addressField" ${state.delivery==='pickup'?'hidden':''}>Alamat pengiriman <textarea name="address" id="address" ${state.delivery==='courier'?'required':''} placeholder="Contoh: Jalan Melati No. 10."></textarea></label></div></section><section class="panel"><h2>03 · Metode pembayaran</h2><label class="option"><input type="radio" name="payment" value="qris" ${state.payment==='qris'?'checked':''}><span><strong>QRIS</strong><small>Pembayaran digital.</small></span></label><label class="option"><input type="radio" name="payment" value="va" ${state.payment==='va'?'checked':''}><span><strong>Virtual account</strong><small>Transfer bank.</small></span></label><label class="option" id="codOption"><input type="radio" name="payment" value="cod" ${state.payment==='cod'?'checked':''} ${state.delivery==='courier'?'disabled':''}><span><strong>COD · bayar saat serah terima</strong><small>Hanya untuk ambil langsung. Sewa dibayar saat bertemu; deposit dan biaya platform dibayar di awal.</small></span></label></section><section class="panel"><h2>04 · Syarat pemilik & deposit</h2><p>${esc(p.terms)}</p><div class="note neutral">Nilai penggantian maksimum yang disepakati: <strong>${money(p.replacement)}</strong>. Noda atau kerusakan ditangani berdasarkan bukti kondisi serta biaya perbaikan yang wajar. Deposit tidak otomatis hangus.</div><a class="help-link" href="#/syarat" target="_blank" rel="noopener">Baca ketentuan lengkap (tab baru)</a></section></div><aside class="sticky"><div class="panel"><h2>Ringkasan biaya</h2><div id="checkout-costs">${costRows(p)}</div><p class="hint">Pencucian normal termasuk harga sewa.</p><div id="payment-split"></div><p class="note">Biaya platform untuk reoutfit. Deposit ditahan sebagai jaminan dan dapat dikembalikan.</p><label class="checkline"><input name="agree" type="checkbox" required><span>Saya sudah membaca dan menyetujui syarat pemilik, nilai penggantian, serta aturan deposit dan penanganan klaim.</span></label><p class="hint">Isi data wajib dan setujui syarat untuk membuat pesanan.</p><button class="btn full" type="submit">Buat pesanan</button><p class="hint" style="text-align:center;margin-top:12px">Pembayaran masih simulasi dan tidak diproses.</p></div></aside></form></div>`
}

function orderPage() {
  const isRenter = activeRole() === 'renter',
    title = isRenter ? 'Pesanan saya' : 'Pesanan masuk';
  if (!state.orders.length) return `<div class="container"><div class="page-top"><h1>${title}</h1></div><div class="empty" style="margin-bottom:55px"><span class="icon-tile" style="margin:0 auto 18px">${icon('bag')}</span><h2>${isRenter ? 'Belum ada pesanan' : 'Belum ada pesanan masuk'}</h2><p>${isRenter ? 'Pesanan akan muncul setelah checkout.' : 'Pesanan dari penyewa akan tampil di sini.'}</p>${isRenter ? '<a class="btn" href="#/jelajah">Jelajahi outfit</a>' : '<a class="btn" href="#/merchant">Kembali ke dashboard</a>'}</div></div>`;
  return `<div class="container"><div class="page-top"><h1>${title}</h1><p class="hint">Ulasan tersedia setelah outfit dikembalikan dan pemeriksaan selesai.</p></div>${state.orders.map(o=>orderCard(o)).join('')}</div>`
}
const statuses = ['Menunggu serah terima', 'Sedang disewa', 'Menunggu pemeriksaan', 'Selesai'];

const conditionImageTypes = Object.freeze({
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
});

function conditionImageError(file) {
  const extension = String(file.name || '').split('.').pop().toLowerCase(),
    mime = String(file.type || '').toLowerCase();
  if (!conditionImageTypes[extension] || conditionImageTypes[extension] !== mime) return 'Format tidak didukung. Pilih JPEG, PNG, atau WebP.';
  if (file.size > 5 * 1024 * 1024) return 'Ukuran setiap gambar maksimal 5 MB.';
  return ''
}

function conditionEvidenceList(order, stage, canRemove = false) {
  const evidence = order[stage] || [];
  if (!evidence.length) return '<p class="small muted">Belum ada foto pada tahap ini.</p>';
  return `<div class="condition-evidence-list">${evidence.map((item, index) => `<figure class="condition-evidence-item"><img src="${esc(item.url)}" alt="Foto ${esc(item.name)}" loading="lazy"><figcaption><strong>${esc(item.name)}</strong><span>Diunggah oleh ${esc(item.uploadedBy || 'Pengguna')}</span><time datetime="${esc(item.uploadedAt || '')}">${esc(formatEvidenceTime(item.uploadedAt))}</time>${canRemove ? `<button class="btn ghost" type="button" data-evidence-remove="${stage}" data-order-id="${esc(order.id)}" data-evidence-index="${index}">Hapus foto</button>` : ''}</figcaption></figure>`).join('')}</div>`
}

function formatEvidenceTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Waktu tidak tersedia' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function conditionUploadMarkup(order, stage) {
  const isInitial = stage === 'initialConditionPhotos',
    label = isInitial ? 'kondisi sebelum diserahkan' : 'kondisi setelah pengembalian',
    saved = order[stage] || [],
    disabled = saved.length >= 4;
  return `<form class="condition-upload" data-condition-upload data-stage="${stage}" data-order-id="${esc(order.id)}"><label>Tambah foto ${label}<input type="file" accept="image/jpeg,image/png,image/webp" multiple data-condition-input ${disabled ? 'disabled' : ''}></label><p class="hint">JPEG, PNG, atau WebP · maks. 5 MB per foto · hingga 4 foto pada tahap ini. </p><div class="condition-pending-list" data-condition-pending></div><p class="field-error" data-condition-error role="alert" aria-live="polite"></p><button class="btn secondary" type="submit" data-condition-save disabled>Simpan foto kondisi</button></form>`
}

function conditionStageMarkup(order, stage, canRemove, canUpload) {
  const initial = stage === 'initialConditionPhotos',
    title = initial ? 'Kondisi awal sebelum diserahkan' : 'Kondisi akhir setelah pengembalian';
  return `<section class="condition-stage"><h3>${title}</h3>${conditionEvidenceList(order, stage, canRemove)}${canUpload ? conditionUploadMarkup(order, stage) : ''}</section>`
}

function conditionDocumentationMarkup(order) {
  const role = activeRole(),
    canUploadInitial = role === 'owner' && order.step === 0,
    canUploadFinal = role === 'owner' && order.step === 2,
    canRemoveInitial = canUploadInitial,
    canRemoveFinal = canUploadFinal,
    temporaryNote = '<p class="small muted condition-temporary-note">Foto tersimpan di browser ini dan bukan bukti resmi.</p>';
  let stages = conditionStageMarkup(order, 'initialConditionPhotos', canRemoveInitial, canUploadInitial);
  if (order.step >= 2) {
    stages = `<div class="condition-comparison">${stages}${conditionStageMarkup(order, 'finalConditionPhotos', canRemoveFinal, canUploadFinal)}</div>`;
    if (order.returnEvidence && order.returnEvidence.length) stages += `<section class="condition-renter-evidence"><h3>Foto yang dikirim penyewa saat pengembalian</h3>${conditionEvidenceList({ returnEvidence: order.returnEvidence }, 'returnEvidence')}</section>`;
    if (order.step < 3) stages += `<p class="hint">Jika kondisi berbeda, gunakan <a class="help-link" href="#/masalah/${encodeURIComponent(order.id)}">laporkan masalah pada pesanan ini</a> agar bukti tercatat pada transaksi yang sama.</p>`
  }
  if (order.step === 1 && order.receivedEvidence && order.receivedEvidence.length) stages += `<section class="condition-renter-evidence"><h3>Foto saat penyewa menerima outfit</h3>${conditionEvidenceList({ receivedEvidence: order.receivedEvidence }, 'receivedEvidence')}</section>`;
  return `<section class="condition-documentation" aria-label="Dokumentasi kondisi pesanan ${esc(order.id)}"><div class="condition-documentation-heading"><h2>Dokumentasi kondisi</h2><span class="badge neutral">${esc(order.id)}</span></div>${stages}${temporaryNote}</section>`
}

function bindConditionEvidenceUploads() {
  $$('[data-condition-upload]').forEach(form => {
    const orderId = form.dataset.orderId,
      stage = form.dataset.stage,
      input = form.querySelector('[data-condition-input]'),
      preview = form.querySelector('[data-condition-pending]'),
      error = form.querySelector('[data-condition-error]'),
      save = form.querySelector('[data-condition-save]');
    let pending = [];
    const releasePending = () => {
      pending.forEach(item => releaseTransientObjectUrl(item.url));
      pending = []
    };
    const paintPending = () => {
      preview.innerHTML = pending.map((item, index) => `<figure class="condition-evidence-item condition-pending-item"><img src="${esc(item.url)}" alt="Pratinjau ${esc(item.name)}"><figcaption><strong>${esc(item.name)}</strong><button class="btn ghost" type="button" data-pending-remove="${index}">Hapus foto</button></figcaption></figure>`).join('');
      save.disabled = pending.length === 0
    };
    input.onchange = () => {
      releasePending();
      error.textContent = '';
      const order = state.orders.find(item => item.id === orderId),
        currentCount = order && Array.isArray(order[stage]) ? order[stage].length : 0,
        files = [...input.files];
      if (!order || activeRole() !== 'owner' || (stage === 'initialConditionPhotos' ? order.step !== 0 : order.step !== 2)) {
        error.textContent = 'Unggahan ini tidak tersedia pada tahap pesanan sekarang.';
        input.value = '';
        paintPending();
        return
      }
      if (files.length + currentCount > 4) {
        error.textContent = 'Maksimal 4 foto untuk tahap ini. Hapus foto yang ada atau pilih lebih sedikit.';
        input.value = '';
        paintPending();
        return
      }
      const invalid = files.map(conditionImageError).find(Boolean);
      if (invalid) {
        error.textContent = invalid;
        input.value = '';
        paintPending();
        return
      }
      pending = files.map(file => ({ file, name: file.name, url: createTransientObjectUrl(file) }));
      paintPending()
    };
    preview.onclick = event => {
      const remove = event.target.closest('[data-pending-remove]');
      if (!remove) return;
      const [item] = pending.splice(Number(remove.dataset.pendingRemove), 1);
      if (item) releaseTransientObjectUrl(item.url);
      paintPending()
    };
    form.onsubmit = async event => {
      event.preventDefault();
      refreshSharedDemo();
      const order = state.orders.find(item => item.id === orderId),
        allowed = order && activeRole() === 'owner' && (stage === 'initialConditionPhotos' ? order.step === 0 : order.step === 2),
        currentCount = order && Array.isArray(order[stage]) ? order[stage].length : 0;
      if (!allowed) {
        error.textContent = 'Unggahan ini tidak tersedia pada tahap pesanan sekarang.';
        return
      }
      if (!pending.length) {
        error.textContent = 'Pilih setidaknya satu gambar yang valid terlebih dahulu.';
        return
      }
      if (pending.length + currentCount > 4) {
        error.textContent = 'Maksimal 4 foto untuk tahap ini.';
        return
      }
      const uploadedAt = new Date().toISOString(),
        uploadedBy = `${order.product.owner} (pemilik)`;
      save.disabled = true;
      let sharedSaved = false;
      try {
        const sharedPhotos = await Promise.all(pending.map(async item => ({ name: item.name, url: await imageFileToSharedDataUrl(item.file), uploadedBy, uploadedAt })));
        refreshSharedDemo();
        const latestOrder = state.orders.find(item => item.id === orderId),
          latestCount = latestOrder && Array.isArray(latestOrder[stage]) ? latestOrder[stage].length : 0,
          stillAllowed = latestOrder && activeRole() === 'owner' && (stage === 'initialConditionPhotos' ? latestOrder.step === 0 : latestOrder.step === 2);
        if (!stillAllowed || latestCount + sharedPhotos.length > 4) {
          error.textContent = stillAllowed ? 'Batas foto pada tahap ini berubah di tab lain. Muat ulang daftar sebelum menyimpan.' : 'Status pesanan berubah di tab lain; foto belum disimpan.';
          save.disabled = false;
          return
        }
        if (!Array.isArray(latestOrder[stage])) latestOrder[stage] = [];
        latestOrder[stage].push(...sharedPhotos);
        touchOrder(latestOrder);
        releasePending();
        sharedSaved = persistSharedDemo()
      } catch (conversionError) {
        error.textContent = conversionError.message || 'Foto tidak dapat disiapkan untuk dibagikan.';
        save.disabled = false;
        return
      }
      pending = [];
      const scrollY = window.scrollY;
      render();
      window.scrollTo(0, scrollY);
      toast(sharedSaved ? 'Foto kondisi dibagikan ke tab lain. Status transaksi tidak berubah.' : 'Foto kondisi tersimpan di tab ini, tetapi tidak dibagikan ke tab lain.')
    }
  });
  $$('[data-evidence-remove]').forEach(button => button.onclick = () => {
    const order = state.orders.find(item => item.id === button.dataset.orderId),
      stage = button.dataset.evidenceRemove,
      allowed = order && activeRole() === 'owner' && (stage === 'initialConditionPhotos' ? order.step === 0 : stage === 'finalConditionPhotos' && order.step === 2);
    if (!allowed) {
      toast('Foto tidak dapat dihapus pada tahap pesanan ini.');
      return
    }
    const items = order[stage],
      [removed] = items.splice(Number(button.dataset.evidenceIndex), 1);
    if (removed) revokeIfObjectUrl(removed.url);
      touchOrder(order);
      persistSharedDemo();
    const scrollY = window.scrollY;
    render();
    window.scrollTo(0, scrollY);
    toast('Foto dihapus dari dokumentasi pesanan.')
  })
}

function orderCard(o) {
  const p = o.product;
  return `<div class="checkout-grid"><section class="panel"><div class="status-header"><span class="small muted">${o.id} · Pesanan</span><span class="badge ${o.step===3?'green':'pink'}">${o.issue?'Ada laporan · sedang ditinjau':statuses[o.step]}</span></div><div class="order-mini"><img src="${esc(p.img)}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.owner)} · Ukuran ${esc(p.size)}</p><p class="small">${formatDate(o.start)} – ${endDate(o.start,o.days)}</p></div></div><div class="summary-row"><span>Serah terima</span><strong>${o.delivery==='pickup'?'Ambil langsung':'Kurir reguler'}</strong></div><div class="summary-row"><span>Pembayaran</span><strong>${o.payment==='cod'?'COD + deposit awal ':o.payment.toUpperCase()+' '}</strong></div><div class="summary-row"><span>Status deposit</span><strong>${o.step===3?'Pengembalian disimulasikan':'Ditahan (simulasi)'}</strong></div><div class="note neutral">${o.step===0?'Saat menerima outfit, cocokkan kelengkapan dan ambil foto kondisinya.':o.step===1?'Simpan bukti kondisi dan kembalikan paling lambat '+endDate(o.start,o.days)+'.':o.step===2?'Pemilik memeriksa kondisi dan kelengkapan. Deposit belum dilepas sebelum pemeriksaan selesai.':'Sewa selesai. Deposit '+money(p.deposit)+' disimulasikan kembali penuh.'}</div><div class="row-actions">${o.step===0?`<button class="btn" data-receive="${o.id}">Konfirmasi penerimaan</button>`:o.step===1?`<a class="btn" href="#/pengembalian/${o.id}">Kembalikan outfit</a>`:''}${o.step<3?`<a class="btn secondary" href="#/masalah/${o.id}">Laporkan masalah</a>`:''}${o.step===2?`<button class="btn secondary" data-inspect="${o.id}">Simulasikan pemeriksaan selesai</button>`:''}</div>${o.issue?`<p class="note">Laporan: ${esc(o.issue.type)}. Laporan sedang ditinjau; deposit ditahan sampai selesai. Referensi ${o.issue.id}.</p>`:''}</section><aside class="panel"><h2>Status pesanan</h2><ol class="timeline">${[['Pesanan dibuat','Jadwal dan biaya disetujui.'],['Outfit diterima','Kondisi awal dicatat.'],['Outfit dikembalikan','Bukti pengembalian dikirim.'],['Pemeriksaan selesai','Deposit diselesaikan.']].map((s,i)=>`<li class="${i<=o.step?'done':''}"><strong>${s[0]}</strong><small>${s[1]}</small></li>`).join('')}</ol><div class="summary-row total"><span>Total pesanan</span><strong class="num">${money(o.total)}</strong></div><p class="hint">Termasuk deposit ${money(p.deposit)}.</p></aside></div>`
}

function returns(o) {
  return `<div class="narrow"><div class="page-top"><nav class="crumb"><a href="#/pesanan">Pesanan saya</a><span>/</span><span>Pengembalian</span></nav><h1>Pengembalian outfit</h1><p>Upload foto kondisi akhir dan bukti pengembalian.</p></div><form class="panel" id="returnForm" data-id="${o.id}"><div class="order-mini"><img src="${esc(o.product.img)}" alt="${esc(o.product.name)}"><div><h3>${esc(o.product.name)}</h3><p class="small">Batas kembali: ${endDate(o.start,o.days)}</p></div></div><label>Kondisi saat dikembalikan<select name="condition" required><option value="">Pilih kondisi</option><option>Baik, sesuai kondisi awal</option><option>Ada noda atau kerusakan</option><option>Ada bagian yang hilang</option></select></label><label style="margin-top:22px">Catatan kondisi<textarea name="notes" placeholder="Jelaskan perubahan kondisi atau kelengkapan, jika ada."></textarea></label><div class="upload-area" style="margin-top:22px"><label>Foto kondisi & bukti pengembalian<input type="file" name="evidence" id="evidence" accept="image/jpeg,image/png,image/webp" multiple required></label><p class="hint">Sertakan foto depan, belakang, dan kelengkapan. Maks. 4 foto, 5 MB per foto. </p><div class="upload-previews" id="evidencePreview"></div></div>${o.delivery==='courier'?'<label style="margin-top:22px">Nomor resi pengembalian<input name="tracking" required placeholder="Masukkan resi contoh"></label>':''}<label class="checkline"><input type="checkbox" required><span>Saya sudah mengirim atau menyerahkan kembali outfit, dan bukti ini sesuai kondisinya.</span></label><p class="note">Deposit belum langsung dikembalikan. Pemilik akan memeriksa outfit; jika ada perbedaan, kedua pihak dapat mengajukan bukti.</p><button type="submit" class="btn full">Kirim bukti pengembalian</button></form></div>`
}

function problem(o) {
  return `<div class="narrow"><div class="page-top"><nav class="crumb"><a href="#/pesanan">Pesanan saya</a><span>/</span><span>Laporkan masalah</span></nav><h1>Laporkan masalah</h1><p>Sertakan kronologi dan bukti, jika tersedia.</p></div><form class="panel" id="issueForm" data-id="${o.id}"><h2>Pesanan ${o.id}</h2><label>Jenis masalah<select name="type" required><option value="">Pilih masalah</option><option>Outfit berbeda dari deskripsi</option><option>Outfit rusak atau kotor</option><option>Kelengkapan hilang</option><option>Belum diterima / tidak dikembalikan</option><option>Pembayaran atau deposit</option><option>Lainnya</option></select></label><label style="margin-top:22px">Ceritakan yang terjadi<textarea name="description" minlength="15" required placeholder="Minimal 15 karakter. Jelaskan kondisi, waktu, dan penyelesaian yang kamu harapkan."></textarea></label><div class="upload-area" style="margin-top:22px"><label>Tambahkan bukti (opsional)<input type="file" name="evidence" id="evidence" multiple accept="image/*"></label><p class="hint">Maks. 4 foto, 5 MB per foto. Untuk outfit yang belum diterima, laporan boleh tanpa foto.</p><div class="upload-previews" id="evidencePreview"></div></div><p class="note">Pelaporan tidak otomatis mengenakan denda. Deposit ditahan selama peninjauan; keputusan memerlukan bukti dari kedua pihak.</p><button type="submit" class="btn full">Kirim laporan</button></form></div>`
}

function merchant() {
  const newListings = products.filter(p => p.custom);
  return `<div class="container"><div class="page-top page-actions"><div><h1>Ruang merchant</h1><p>Kelola outfit, pesanan, dan pendapatan.</p></div><a class="btn" href="#/upload">${icon('plus')} Tambah outfit</a></div><div class="tabs"><a class="${state.merchantTab==='outfit'?'active':''}" href="#/merchant" data-tab="outfit">Outfit saya</a><a class="${state.merchantTab==='orders'?'active':''}" href="#/merchant" data-tab="orders">Pesanan masuk</a><a class="${state.merchantTab==='revenue'?'active':''}" href="#/merchant" data-tab="revenue">Pendapatan & biaya</a></div><div class="stats"><div class="stat"><span class="muted">Outfit contoh & unggahan</span><strong>${products.length}</strong></div><div class="stat"><span class="muted">Pesanan</span><strong>${state.orders.length}</strong></div><div class="stat"><span class="muted">Pendapatan sewa selesai</span><strong>${money(state.orders.filter(o=>o.step===3).reduce((a,o)=>a+o.product.price*o.days,0))}</strong></div></div>${state.merchantTab==='outfit'?`<section class="panel"><h2>Listing outfit</h2><p class="small muted">Contoh listing dan listing yang kamu terbitkan.</p>${products.map(p=>`<article class="listing-row"><img src="${esc(p.img)}" alt="${esc(p.name)}"><div class="grow"><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.category)} · ${money(p.price)} / hari</p></div><span class="badge green">${p.custom?'Terbit':'Contoh aktif'}</span><a class="btn secondary" href="#/outfit/${p.id}">Lihat listing</a></article>`).join('')}</section>`:state.merchantTab==='orders'?`<section class="panel"><h2>Pesanan masuk</h2>${state.orders.length?state.orders.map(o=>`<div class="listing-row"><img src="${esc(o.product.img)}" alt="${esc(o.product.name)}"><div class="grow"><h3>${esc(o.product.name)}</h3><p class="small muted">${o.id} · ${o.days} hari · ${statuses[o.step]}</p></div><a class="btn secondary" href="#/pesanan">Kelola pesanan</a></div>`).join(''):'<p class="muted">Belum ada pesanan. Coba buat pesanan melalui halaman customer.</p>'}</section>`:`<section class="panel"><h2>Pembagian biaya</h2><p>Pemilik menerima harga sewa penuh. Penyewa membayar biaya platform 10% secara terpisah.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Contoh: Rp55.000 × 3 hari</th><th>Nominal</th><th>Tujuan dana</th></tr></thead><tbody><tr><td>Harga sewa</td><td>Rp165.000</td><td>Pendapatan pemilik</td></tr><tr><td>Biaya platform 10%</td><td>Rp16.500</td><td>Pendapatan kotor reoutfit</td></tr><tr><td>Deposit</td><td>Rp100.000</td><td>Ditahan sementara, bukan revenue</td></tr></tbody></table></div><p class="note">10% adalah asumsi model bisnis awal, bukan tarif final. Biaya payment gateway, operasional, dan penanganan sengketa masih perlu divalidasi.</p><p class="small muted">Tidak ada saldo atau pencairan dana sungguhan dalam prototipe.</p></section>`}</div>`
}

function upload() {
  return `<div class="container"><div class="page-top"><nav class="crumb"><a href="#/merchant">Ruang merchant</a><span>/</span><span>Tambah outfit</span></nav><h1>Tambah outfit</h1></div><form id="uploadForm" class="checkout-grid"><div><section class="panel"><h2>01 · Foto & informasi outfit</h2><div class="upload-area"><label>Foto outfit<input id="outfitPhotos" name="photos" type="file" accept="image/*" multiple required></label><p class="hint">Maks. 4 foto, 5 MB per foto. Foto pertama menjadi sampul. Sertakan bagian depan, belakang, dan detail.</p><div id="photoPreview" class="upload-previews"></div></div><div class="form-grid" style="margin-top:24px"><label class="span2">Nama outfit<input name="name" maxlength="65" required placeholder="Contoh: Blue Hour Korean Set"></label><label>Kategori<select name="category"><option>Korean style</option><option>Cosplay</option><option>Dress</option><option>Vest &amp; formal</option></select></label><label>Brand<input name="brand" required placeholder="Nama brand / custom / tanpa brand"></label><label>Bahan<input name="material" required placeholder="Contoh: katun, rajut"></label><label>Lokasi<select name="location"><option>Bekasi</option><option>Jakarta Selatan</option></select></label><label class="span2">Deskripsi & kelengkapan<textarea name="description" minlength="30" required placeholder="Jelaskan bahan, detail pengerjaan, kondisi, dan item yang termasuk atau tidak termasuk dalam sewa. Minimal 30 karakter."></textarea></label><label class="span2">Kondisi saat ini<input name="condition" required placeholder="Contoh: baik; sedikit aus pada ujung lengan"></label></div></section><section class="panel"><h2>02 · Ukuran (cm)</h2><div class="form-grid"><label>Label ukuran<select name="size"><option>S</option><option>S–M</option><option>M</option><option>L</option><option>XL</option></select></label><label>Lingkar dada (cm)<input name="chest" type="number" min="40" max="200" required></label><label>Lingkar pinggang (cm)<input name="waist" type="number" min="40" max="200" required></label><label>Panjang baju (cm)<input name="length" type="number" min="10" max="220" required></label></div><p class="hint">Untuk set, tuliskan ukuran setiap potongan tambahan di deskripsi.</p></section><section class="panel"><h2>03 · Harga & ketentuan</h2><div class="form-grid"><label>Harga beli asli (Rp)<input name="original" type="number" min="1000" step="1000" required><span class="hint">Referensi kualitas, bukan denda otomatis.</span></label><label>Harga sewa / hari (Rp)<input name="price" id="merchantPrice" type="text" inputmode="numeric" autocomplete="off" placeholder="Contoh: 55.000" required aria-describedby="merchantPriceHint merchantPriceError"><span class="hint" id="merchantPriceHint">Minimum harga sewa Rp1.000 per hari.</span><span class="field-error" id="merchantPriceError" role="status" aria-live="polite"></span></label><label>Deposit jaminan (Rp)<input name="deposit" type="number" min="0" step="1000" required><span class="hint">Dikembalikan setelah pemeriksaan.</span></label><label>Nilai penggantian maks. (Rp)<input name="replacement" type="number" min="1000" step="1000" required><span class="hint">Pertimbangkan usia dan kondisi outfit.</span></label><label class="span2">Syarat khusus pemilik<textarea name="terms" required minlength="15" placeholder="Contoh: jangan mencuci sendiri; pencucian normal termasuk harga sewa."></textarea></label></div><p id="uploadError" class="field-error" role="alert"></p></section></div><aside class="sticky"><section class="panel"><h2>Terbitkan listing</h2><div class="note neutral" id="merchantEstimate">Isi harga sewa untuk melihat estimasi biaya.</div><label class="checkline"><input type="checkbox" required><span>Saya berhak menyewakan outfit ini dan informasi kondisi serta kelengkapannya sesuai.</span></label><button type="submit" class="btn full">Terbitkan listing</button></section></aside></form></div>`
}

function policy() {
  return `<div class="narrow"><div class="page-top"><h1>Syarat & deposit</h1><p>Syarat pemilik dan rincian biaya disetujui saat checkout.</p></div><div class="policy-grid"><div class="panel"><span class="icon-tile" style="margin-bottom:18px">${icon('wallet')}</span><h3>Sewa, biaya platform & deposit</h3><p><b>Harga sewa</b> untuk pemilik. <b>Biaya platform 10%</b> untuk reoutfit. <b>Deposit</b> ditahan sementara dan bukan pendapatan.</p></div><div class="panel"><span class="icon-tile" style="margin-bottom:18px">${icon('shield')}</span><h3>Deposit bukan asuransi</h3><p>Deposit tidak menjamin seluruh kerugian tertutup. Nilai penggantian maksimum harus dijelaskan dan disetujui sebelum pemesanan.</p></div></div><div class="panel" style="margin-top:22px"><h2>Jika outfit kotor, rusak, atau hilang</h2><ol class="policy-list"><li><b>Catat kondisi awal.</b> Pemilik dan penyewa menyimpan foto serta daftar kelengkapan saat serah terima.</li><li><b>Laporkan perbedaannya.</b> Lampirkan foto, kronologi, dan biaya perbaikan atau penggantian yang diajukan.</li><li><b>Tinjau bukti kedua pihak.</b> Pemakaian normal tidak otomatis dikenakan denda. Klaim noda atau kerusakan mengacu pada biaya yang dapat dijelaskan.</li><li><b>Selesaikan klaim sebelum melepas deposit.</b> Potongan yang disetujui dan sisa pengembalian ditampilkan terpisah. Jika masih berselisih, gunakan proses peninjauan.</li></ol><p class="note">Kehilangan atau tidak dikembalikan dapat memerlukan penggantian hingga nilai maksimum yang disepakati, setelah peninjauan. Harga beli asli bukan denda otomatis. Tidak ada penagihan otomatis.</p></div><div class="panel"><h2>Jadwal, pencucian & pembayaran</h2><details class="accordion" open><summary>Bagaimana durasi dihitung?</summary><p>Sewa tersedia mulai 1 hari. Tanggal mulai adalah hari pertama pemakaian; sewa 1 hari dikembalikan pada tanggal yang sama, sesuai jam serah terima yang disepakati. Sewa 3 hari mulai tanggal 10 berakhir tanggal 12. Waktu dan lokasi serah terima disepakati bersama; pengiriman harus diatur sebelum jadwal mulai.</p></details><details class="accordion"><summary>Apa bedanya COD dan ambil langsung?</summary><p>Ambil langsung adalah cara menerima outfit. COD adalah cara membayar sewa saat serah terima. COD tersedia untuk ambil langsung. Deposit dan biaya platform dibayar di awal.</p></details><details class="accordion"><summary>Apakah pencucian termasuk?</summary><p>Pencucian normal termasuk harga sewa. Kerusakan atau noda di luar pemakaian normal perlu bukti dan peninjauan; tidak ada potongan otomatis.</p></details><details class="accordion"><summary>Kapan deposit kembali?</summary><p>Setelah kondisi diperiksa dan klaim selesai, jika ada. Waktu pengembalian bergantung pada proses operasional dan penyedia pembayaran.</p></details><details class="accordion"><summary>Bagaimana pembatalan atau keterlambatan?</summary><p>Rincian tenggat pembatalan, pengembalian dana, dan tarif keterlambatan masih perlu disepakati sebelum peluncuran. Hubungi pemilik melalui proses laporan. Tidak ada denda otomatis atau pembatalan berbayar.</p></details></div><a href="#/jelajah" class="btn">Kembali jelajahi outfit</a></div>`
}

function guide() {
  return `<div class="narrow"><div class="page-top"><h1>Cara sewa</h1></div>${[['01','Pilih outfit','Gunakan pencarian dan filter. Cek ukuran cm, kondisi, kelengkapan, dan lokasi pemilik. Harga asli membantu memahami kualitas; harga sewa ditentukan pemilik.'],['02','Jadwal & pembayaran','Pilih tanggal serta durasi. Baca syarat, nilai penggantian, harga sewa, biaya platform, ongkir, dan deposit. Pilih cara menerima serta membayar secara terpisah.'],['03','Terima outfit','Saat menerima outfit, cek kelengkapan dan foto kondisi awal. Laporkan ketidaksesuaian melalui pesanan sebelum melanjutkan pemakaian.'],['04','Pengembalian & deposit','Upload foto kondisi akhir dan bukti pengembalian. Setelah pemeriksaan dan penyelesaian klaim, sisa deposit dikembalikan.']].map(a=>`<section class="panel"><div class="big-number">${a[0]}</div><h2>${a[1]}</h2><p class="muted">${a[2]}</p></section>`).join('')}<div class="row-actions"><a class="btn" href="#/jelajah">Cari outfit</a><a class="btn secondary" href="#/syarat">Pelajari ketentuan</a></div></div>`
}

function filePreview(input, holder, strictConditionFormats = false) {
  let previewUrls = [];
  const clearPreviews = () => {
    previewUrls.forEach(releaseTransientObjectUrl);
    previewUrls = []
  };
  const dialog = input.closest('dialog');
  if (dialog) dialog.addEventListener('close', clearPreviews, { once: true });
  input.onchange = () => {
    const files = [...input.files];
    clearPreviews();
    const issue = files.length > 4 ? 'Maksimal 4 foto.' : files.map(file => strictConditionFormats ? conditionImageError(file) : file.size > 5 * 1024 * 1024 ? 'Ukuran setiap gambar maksimal 5 MB.' : !file.type.startsWith('image/') ? 'Pilih file gambar yang valid.' : '').find(Boolean);
    if (issue) {
      input.setCustomValidity(issue);
      input.reportValidity();
      holder.innerHTML = '';
      return
    }
    input.setCustomValidity('');
    previewUrls = files.map(createTransientObjectUrl);
    holder.innerHTML = files.map((file, index) => `<figure class="upload-preview-item"><img src="${esc(previewUrls[index])}" alt="Pratinjau ${esc(file.name)}"><figcaption><span>${esc(file.name)}</span><button class="btn ghost" type="button" data-preview-remove="${index}">Hapus</button></figcaption></figure>`).join('')
  };
  holder.onclick = event => {
    const remove = event.target.closest('[data-preview-remove]');
    if (!remove) return;
    const removedIndex = Number(remove.dataset.previewRemove),
      transfer = new DataTransfer();
    [...input.files].forEach((file, index) => {
      if (index !== removedIndex) transfer.items.add(file)
    });
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
}
// Pasang event setelah isi halaman dirender.
function bind(route) {
  $$('[data-reset-demo]').forEach(button => button.onclick = () => {
    showModal('Reset data?', 'Tindakan ini menghapus listing, pesanan, chat, bukti kondisi, dan ulasan Reoutfit di browser ini. Tab Reoutfit lain yang terbuka ikut diperbarui; data browser lainnya tetap aman.', '<div class="row-actions"><button class="btn danger" id="confirmDemoReset" type="button">Reset data</button><button class="btn secondary" id="cancelDemoReset" type="button">Batal</button></div>');
    $('#confirmDemoReset').onclick = () => {
      $('#modal').close();
      resetSharedDemo()
    };
    $('#cancelDemoReset').onclick = () => $('#modal').close()
  });
  if (route === '/mode') {
    $$('[data-select-mode]').forEach(button => button.onclick = () => {
      state.demoMode = button.dataset.selectMode;
      go(state.demoMode === 'renter' ? '/' : '/merchant')
    });
    return
  }
  if (route === '/' && activeRole() === 'renter') {
    const merchantBanner = $('.merchant-banner');
    if (merchantBanner) merchantBanner.remove()
  }
  if (route === '/pesanan') {
    $$('#main .checkout-grid').forEach((card, index) => {
      const order = state.orders[index],
        panel = card.querySelector('.panel'),
        actions = card.querySelector('.row-actions');
      if (order && panel) {
        panel.insertAdjacentHTML('beforeend', conditionDocumentationMarkup(order));
        const receive = panel.querySelector('[data-receive]'),
          returnLink = panel.querySelector('a[href^="#/pengembalian/"]'),
          inspect = panel.querySelector('[data-inspect]');
        if (receive && activeRole() !== 'renter') receive.remove();
        else if (receive && !(order.initialConditionPhotos && order.initialConditionPhotos.length)) {
          receive.disabled = true;
          receive.title = 'Pemilik perlu mengunggah foto kondisi awal sebelum penyewa menerima outfit.'
        }
        if (returnLink && activeRole() !== 'renter') returnLink.remove();
        if (inspect && activeRole() !== 'owner') inspect.remove()
      }
      if (order && actions) actions.insertAdjacentHTML('beforeend', `<a class="btn secondary" href="${chatHref(order.product, order, '/pesanan')}">Chat terkait pesanan</a>`);
      if (order && panel && order.step === 3) panel.insertAdjacentHTML('beforeend', `<section class="order-reviews"><h3>Ulasan transaksi</h3><div class="row-actions">${reviewAction(order, activeRole())}</div></section>`)
    });
    bindConditionEvidenceUploads()
  }
  if (route === '/merchant' && state.merchantTab === 'orders') {
    $$('#main .listing-row').forEach((row, index) => {
      const order = state.orders[index],
        action = order && order.step === 3 ? reviewAction(order, 'owner') : '';
      if (action) row.insertAdjacentHTML('beforeend', `<div class="merchant-review-control">${action}</div>`)
    })
  }
  $$('[data-review]').forEach(button => button.onclick = () => openReviewForm(button.dataset.review, button.dataset.reviewSide));
  if (route.startsWith('/outfit/')) {
    bindOutfitGallery();
    const ownerLinks = $('#main .owner-profile-link');
    if (activeRole() === 'renter' && ownerLinks) ownerLinks.insertAdjacentHTML('beforeend', `<a class="btn secondary" href="${chatHref(current())}">Hubungi Pemilik</a>`);
    if (activeRole() === 'owner') {
      const booking = $('#booking');
      if (booking) booking.remove();
      const crumb = $('#main .page-top .crumb');
      if (crumb) crumb.innerHTML = '<a href="#/merchant">Dashboard</a><span>/</span><span>Pratinjau listing</span>';
      $('.detail-info').insertAdjacentHTML('beforeend', '<p class="note neutral">Mode pemilik: ini pratinjau listing. Pengaturan listing tersedia di dashboard.</p>')
    }
  }
  if (route === '/chat') {
    const form = $('#chatForm'),
      input = $('#chatInput'),
      count = $('#chatMessageCount'),
      error = $('#chatMessageError');
    const outfitCard = $('.chat-outfit'),
      originalImage = outfitCard && outfitCard.querySelector(':scope > img');
    if (originalImage) {
      const imageColumn = document.createElement('div'),
        preview = document.createElement('div'),
        toggle = document.createElement('button');
      imageColumn.className = 'chat-image-column';
      preview.className = 'chat-outfit-image';
      preview.id = 'chatOutfitImage';
      toggle.className = 'chat-image-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', preview.id);
      toggle.innerHTML = '<svg class="chevron-down" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg><svg class="chevron-up" viewBox="0 0 24 24" aria-hidden="true" hidden><path d="m6 15 6-6 6 6"/></svg><span>Lihat gambar asli</span>';
      outfitCard.insertBefore(imageColumn, originalImage);
      preview.appendChild(originalImage);
      imageColumn.append(preview, toggle);
      toggle.onclick = () => {
        const expanded = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(expanded));
        preview.classList.toggle('is-expanded', expanded);
        outfitCard.classList.toggle('is-expanded', expanded);
        toggle.querySelector('.chevron-down').hidden = expanded;
        toggle.querySelector('.chevron-up').hidden = !expanded;
        toggle.querySelector('span').textContent = expanded ? 'Sembunyikan gambar' : 'Lihat gambar asli'
      }
    }
    input.oninput = () => {
      count.textContent = `${input.value.length.toLocaleString('id-ID')}/1.000`;
      error.textContent = ''
    };
    form.onsubmit = event => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) {
        error.textContent = 'Tulis pesan terlebih dahulu.';
        input.focus();
        return
      }
      if (text.length > 1000) {
        error.textContent = 'Pesan maksimal 1.000 karakter.';
        input.focus();
        return
      }
      const key = form.dataset.chatKey;
      refreshSharedDemo();
      if (!Array.isArray(state.chats[key])) state.chats[key] = [];
      state.chats[key].push({ id: stableId('msg'), sender: activeRole(), text, createdAt: new Date().toISOString() });
      persistSharedDemo();
      render();
      const messages = $('#chatMessages');
      messages.scrollTop = messages.scrollHeight;
      $('#chatInput').focus({ preventScroll: true })
    };
    const messages = $('#chatMessages');
    messages.scrollTop = messages.scrollHeight
  }
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
  if (route === '/checkout' && $('#renterVerificationGate')) {
    $('#renterVerificationGate').onclick = () => requestIdentityVerification('renter', () => render())
  }
  if ($('#booking')) {
    const product = current(),
      dateInput = $('#start'),
      daysInput = $('#days'),
      calendar = document.createElement('div');
    if (!rentalPeriodAvailable(product.id, state.start, state.days)) {
      state.start = nextAvailableStart(product.id, state.start || dateISO(), state.days)
    }
    dateInput.value = state.start;
    dateInput.min = todayISO();
    calendar.id = 'availabilityCalendar';
    calendar.className = 'availability-calendar';
    calendar.dataset.month = monthISO(state.start);
    calendar.innerHTML = availabilityCalendarMarkup(product.id, calendar.dataset.month);
    $('#booking h2').insertAdjacentElement('afterend', calendar);
    calendar.insertAdjacentHTML('afterend', '<p class="hint calendar-simulation">Jadwal pada kalender masih simulasi.</p><p class="availability-feedback" id="availabilityFeedback" role="status" aria-live="polite"></p>');
    const showAvailabilityMessage = message => {
      state.availabilityMessage = message;
      $('#availabilityFeedback').textContent = message;
      $('#availabilityFeedback').classList.toggle('has-error', !!message)
    };
    const update = () => {
      dateInput.value = state.start;
      daysInput.value = String(state.days);
      $('#datehint').textContent = `Tanggal mulai ${formatDate(state.start)} · tanggal kembali ${endDate(state.start, state.days)} (hari terakhir pemakaian). Hari mulai dihitung sebagai hari pertama.`;
      $('#detail-costs').innerHTML = costRows(product, state.days, 'pickup');
      $('#availabilityFeedback').textContent = state.availabilityMessage;
      $('#availabilityFeedback').classList.toggle('has-error', !!state.availabilityMessage);
      calendar.innerHTML = availabilityCalendarMarkup(product.id, calendar.dataset.month || monthISO(state.start))
    };
    calendar.onclick = e => {
      const nav = e.target.closest('[data-calendar-nav]');
      if (nav) {
        const [year, month] = calendar.dataset.month.split('-').map(Number),
          next = new Date(year, month - 1 + Number(nav.dataset.calendarNav), 1, 12);
        calendar.dataset.month = monthISO(localDateISO(next));
        calendar.innerHTML = availabilityCalendarMarkup(product.id, calendar.dataset.month);
        return
      }
      const day = e.target.closest('[data-calendar-date]');
      if (!day) return;
      const candidate = day.dataset.calendarDate;
      if (day.getAttribute('aria-disabled') === 'true') {
        const issue = rentalPeriodIssue(product.id, candidate, state.days);
        showAvailabilityMessage(issue && issue.date !== candidate ? `Periode ${state.days} hari dari ${formatDate(candidate)} melewati ${formatDate(issue.date)} yang tidak tersedia. Ubah tanggal mulai atau durasi.` : `Tanggal ${formatDate(candidate)} tidak tersedia pada jadwal simulasi.`);
        return
      }
      const issue = rentalPeriodIssue(product.id, candidate, state.days);
      if (issue) {
        showAvailabilityMessage(`Periode ${state.days} hari dari ${formatDate(candidate)} melewati ${formatDate(issue.date)} yang tidak tersedia. Ubah tanggal mulai atau durasi.`);
        return
      }
      state.start = candidate;
      state.availabilityMessage = '';
      calendar.dataset.month = monthISO(candidate);
      update()
    };
    daysInput.onchange = () => {
      const nextDays = Number(daysInput.value),
        issue = rentalPeriodIssue(product.id, state.start, nextDays);
      if (issue) {
        showAvailabilityMessage(`Periode ${nextDays} hari tidak tersedia karena ${formatDate(issue.date)} sudah lewat atau tidak tersedia. Pilih tanggal mulai lain atau durasi lebih pendek.`);
        daysInput.value = String(state.days);
        return
      }
      state.days = nextDays;
      state.availabilityMessage = '';
      update()
    };
    dateInput.onchange = () => {
      const candidate = dateInput.value,
        issue = rentalPeriodIssue(product.id, candidate, state.days);
      if (issue) {
        showAvailabilityMessage(issue.reason === 'Tanggal ini tidak tersedia.' ? `Periode ${state.days} hari dari ${formatDate(candidate)} melewati ${formatDate(issue.date)} yang tidak tersedia. Pilih tanggal mulai lain atau durasi lebih pendek.` : issue.reason);
        dateInput.value = state.start;
        return
      }
      state.start = candidate;
      state.availabilityMessage = '';
      calendar.dataset.month = monthISO(candidate);
      update()
    };
    $('#availabilityFeedback').textContent = state.availabilityMessage;
    update();
    $('#booking').onsubmit = e => {
      e.preventDefault();
      const issue = rentalPeriodIssue(product.id, state.start, state.days);
      if (issue) {
        showAvailabilityMessage(`Jadwal tidak tersedia: ${formatDate(issue.date)}. Pilih tanggal dan durasi lain sebelum melanjutkan.`);
        $('#availabilityCalendar').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return
      }
      if (!state.renterVerificationPassed) {
        requestIdentityVerification('renter', () => {
          const retryIssue = rentalPeriodIssue(product.id, state.start, state.days);
          if (retryIssue) {
            showAvailabilityMessage(`Jadwal tidak tersedia: ${formatDate(retryIssue.date)}. Pilih tanggal dan durasi lain sebelum melanjutkan.`);
            return
          }
          go('/checkout')
        });
        return
      }
      go('/checkout')
    }
  }
  if ($('#checkoutForm')) {
    const scheduleSummary = $('#checkoutForm .order-mini .small:last-child');
    scheduleSummary.textContent = `Mulai ${formatDate(state.start)} · kembali ${endDate(state.start, state.days)} (hari terakhir pemakaian) · ${state.days} hari`;
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
      if (!state.renterVerificationPassed) {
        requestIdentityVerification('renter', () => render());
        return
      }
      refreshSharedDemo();
      const p = {
          ...current()
        },
        issue = rentalPeriodIssue(p.id, state.start, state.days);
      if (issue) {
        state.availabilityMessage = `Jadwal tidak tersedia: ${formatDate(issue.date)}. Pilih tanggal dan durasi lain sebelum melanjutkan.`;
        go('/outfit/' + p.id);
        return
      }
      const total = p.price * state.days + Math.round(p.price * state.days * .1) + p.deposit + (state.delivery === 'courier' ? 40000 : 0);
      const order = {
        id: stableId('RO-DEMO'),
        product: p,
        ownerId: ownerId(p),
        renterId: DEMO_RENTER_ID,
        start: state.start,
        days: state.days,
        delivery: state.delivery,
        payment: state.payment,
        total,
        step: 0,
        initialConditionPhotos: [],
        finalConditionPhotos: []
      };
      touchOrder(order);
      state.orders.unshift(order);
      const saved = persistSharedDemo();
      go('/pesanan');
      toast(saved ? 'Pesanan dibuat dan dibagikan ke tab lain.' : 'Pesanan dibuat, tetapi gagal dibagikan ke tab lain.')
    }
  }
  $$('[data-receive]').forEach(b => b.onclick = () => {
    refreshSharedDemo();
    const o = state.orders.find(o => o.id === b.dataset.receive);
      if (!o || activeRole() !== 'renter' || o.step !== 0) {
      toast('Konfirmasi penerimaan hanya tersedia untuk penyewa pada tahap serah terima.');
      return
    }
    if (!o.initialConditionPhotos || !o.initialConditionPhotos.length) {
      toast('Tunggu pemilik mengunggah foto kondisi awal sebelum menerima outfit.');
      return
    }
    showModal('Konfirmasi kondisi awal', 'Lihat foto kondisi awal dari pemilik, periksa kelengkapan, lalu tambahkan foto saat menerima. Tambahkan foto kondisi setelah menerima outfit. Foto ini bukan bukti resmi.', `<form id="receiveForm" novalidate><label>Foto saat diterima<input type="file" id="evidence" accept="image/jpeg,image/png,image/webp" multiple required></label><p class="hint">Maks. 4 foto; JPEG, PNG, atau WebP; 5 MB per foto.</p><div class="upload-previews" id="evidencePreview"></div><label class="checkline"><input type="checkbox" name="conditionAgree" required><span>Outfit sudah diterima dan kondisi awal sudah diperiksa.</span></label><p class="field-error" id="receiveError" role="alert" aria-live="polite"></p><button type="submit" class="btn full">Konfirmasi penerimaan</button></form>`);
    const evidenceInput = $('#evidence'),
      receiveForm = $('#receiveForm'),
      receiveError = $('#receiveError'),
      conditionAgree = receiveForm.querySelector('[name="conditionAgree"]');
    filePreview(evidenceInput, $('#evidencePreview'), true);
    evidenceInput.addEventListener('change', () => { receiveError.textContent = '' });
    conditionAgree.addEventListener('change', () => { receiveError.textContent = '' });
    receiveForm.onsubmit = async e => {
      e.preventDefault();
      refreshSharedDemo();
      let currentOrder = state.orders.find(item => item.id === b.dataset.receive);
      const form = e.currentTarget,
        submit = form.querySelector('button[type="submit"]'),
        files = [...evidenceInput.files],
        invalidPhoto = files.map(conditionImageError).find(Boolean);
      receiveError.textContent = '';
      if (activeRole() !== 'renter' || !currentOrder || currentOrder.step !== 0 || !currentOrder.initialConditionPhotos?.length) {
        receiveError.textContent = 'Penerimaan tidak tersedia pada status pesanan sekarang.';
        return
      }
      if (!files.length) {
        receiveError.textContent = 'Pilih setidaknya satu foto kondisi yang valid.';
        evidenceInput.focus();
        return
      }
      if (files.length > 4) {
        receiveError.textContent = 'Maksimal 4 foto untuk kondisi penerimaan.';
        evidenceInput.focus();
        return
      }
      if (invalidPhoto) {
        receiveError.textContent = invalidPhoto;
        evidenceInput.focus();
        return
      }
      if (!conditionAgree.checked) {
        receiveError.textContent = 'Centang persetujuan setelah memeriksa kondisi awal outfit.';
        conditionAgree.focus();
        return
      }
      if (!submit) {
        receiveError.textContent = 'Tombol konfirmasi tidak tersedia. Tutup lalu buka kembali dialog ini.';
        return
      }
      submit.disabled = true;
      let sharedSaved = false;
      try {
        const uploadedAt = new Date().toISOString(),
          evidence = await Promise.all([...$('#evidence').files].map(async file => ({ name: file.name, url: await imageFileToSharedDataUrl(file), uploadedBy: 'Penyewa', uploadedAt })));
        refreshSharedDemo();
        currentOrder = state.orders.find(item => item.id === b.dataset.receive);
        if (!currentOrder || currentOrder.step !== 0 || !currentOrder.initialConditionPhotos?.length) {
          receiveError.textContent = 'Status pesanan berubah di tab lain; penerimaan belum dicatat.';
          submit.disabled = false;
          return
        }
        currentOrder.receivedEvidence = evidence;
        currentOrder.step = 1;
        touchOrder(currentOrder);
        sharedSaved = persistSharedDemo()
      } catch (conversionError) {
        receiveError.textContent = conversionError.message || 'Foto tidak dapat disiapkan untuk dibagikan.';
        submit.disabled = false;
        return
      }
      $('#modal').close();
      render();
      toast(sharedSaved ? 'Penerimaan dicatat dan dibagikan ke tab lain.' : 'Penerimaan tersimpan di tab ini, tetapi tidak dibagikan ke tab lain.')
    }
  });
  $$('[data-inspect]').forEach(b => b.onclick = () => {
    refreshSharedDemo();
    const o = state.orders.find(o => o.id === b.dataset.inspect);
    if (!o || activeRole() !== 'owner' || o.step !== 2) {
      toast('Pemeriksaan hanya tersedia untuk pemilik setelah pengembalian.');
      return
    }
    if (!o.finalConditionPhotos || !o.finalConditionPhotos.length) {
      toast('Unggah setidaknya satu foto kondisi akhir sebelum menyelesaikan pemeriksaan.');
      return
    }
    if (o.issue) {
      toast('Laporan masih terbuka. Selesaikan peninjauan lebih dulu.');
      showModal('Peninjauan laporan', 'Simulasi ini mencatat kesepakatan tanpa potongan deposit.', `<button class="btn" id="resolveIssue">Simulasikan sepakat tanpa potongan</button>`);
      $('#resolveIssue').onclick = () => {
        refreshSharedDemo();
        const latestOrder = state.orders.find(item => item.id === b.dataset.inspect);
        if (!latestOrder || latestOrder.step !== 2 || !latestOrder.issue) {
          toast('Laporan pesanan sudah berubah di tab lain.');
          return
        }
        delete latestOrder.issue;
        touchOrder(latestOrder);
        const saved = persistSharedDemo();
        $('#modal').close();
        render();
        toast(saved ? 'Kesepakatan dicatat dan dibagikan ke tab lain. Pemeriksaan dapat dilanjutkan.' : 'Kesepakatan dicatat di tab ini, tetapi tidak dibagikan ke tab lain.')
      }
    } else {
      o.step = 3;
      touchOrder(o);
      const saved = persistSharedDemo();
      render();
      toast(saved ? 'Pemeriksaan selesai dan status dibagikan ke tab lain; pengembalian deposit disimulasikan.' : 'Pemeriksaan selesai di tab ini, tetapi tidak dibagikan ke tab lain.')
    }
  });
  if ($('#returnForm')) {
    filePreview($('#evidence'), $('#evidencePreview'), true);
    $('#returnForm').onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      refreshSharedDemo();
      let o = state.orders.find(o => o.id === e.target.dataset.id);
      const submit = e.currentTarget.querySelector('button[type="submit"]');
      if (!o || activeRole() !== 'renter' || o.step !== 1) {
        toast('Pengembalian hanya dapat dikirim oleh penyewa pada status sewa aktif.');
        return
      }
      submit.disabled = true;
      const uploadedAt = new Date().toISOString();
      try {
        const returnEvidence = await Promise.all([...$('#evidence').files].map(async file => ({
          name: file.name,
          url: await imageFileToSharedDataUrl(file),
          uploadedBy: 'Penyewa',
          uploadedAt
        })));
        refreshSharedDemo();
        o = state.orders.find(order => order.id === e.target.dataset.id);
        if (!o || activeRole() !== 'renter' || o.step !== 1) {
          toast('Status pesanan berubah di tab lain; pengembalian belum dicatat.');
          submit.disabled = false;
          return
        }
        o.returnEvidence = returnEvidence
      } catch (conversionError) {
        toast(conversionError.message || 'Foto tidak dapat disiapkan untuk dibagikan.');
        submit.disabled = false;
        return
      }
      o.returnNotes = f.get('notes');
      o.step = 2;
      if (f.get('condition') !== 'Baik, sesuai kondisi awal') o.issue = {
        type: f.get('condition'),
        id: 'CL-' + o.id
      };
      touchOrder(o);
      const saved = persistSharedDemo();
      go('/pesanan');
      toast(saved ? 'Bukti dikirim dan dibagikan ke tab pemilik. Menunggu pemeriksaan.' : 'Bukti diterima di tab ini, tetapi tidak dibagikan ke tab lain.')
    }
  }
  if ($('#issueForm')) {
    filePreview($('#evidence'), $('#evidencePreview'));
    $('#issueForm').onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      refreshSharedDemo();
      let o = state.orders.find(o => o.id === e.target.dataset.id);
      const submit = e.currentTarget.querySelector('button[type="submit"]');
      if (!o) {
        toast('Pesanan tidak ditemukan.');
        return
      }
      submit.disabled = true;
      let evidence;
      try {
        evidence = await Promise.all([...$('#evidence').files].map(async file => ({ name: file.name, url: await imageFileToSharedDataUrl(file) })))
        refreshSharedDemo();
        o = state.orders.find(order => order.id === e.target.dataset.id);
        if (!o) {
          toast('Pesanan berubah atau sudah direset di tab lain.');
          submit.disabled = false;
          return
        }
      } catch (conversionError) {
        toast(conversionError.message || 'Foto tidak dapat disiapkan untuk dibagikan.');
        submit.disabled = false;
        return
      }
      o.issue = {
        type: f.get('type'),
        description: f.get('description'),
        evidence,
        id: 'CL-' + o.id
      };
      touchOrder(o);
      const saved = persistSharedDemo();
      go('/pesanan');
      toast(saved ? 'Laporan dicatat dan dibagikan ke tab lain. Deposit menunggu peninjauan.' : 'Laporan dicatat di tab ini, tetapi tidak dibagikan ke tab lain.')
    }
  }
  $$('[data-tab]').forEach(a => a.onclick = e => {
    e.preventDefault();
    state.merchantTab = a.dataset.tab;
    render()
  });
  if ($('#uploadForm')) {
    filePreview($('#outfitPhotos'), $('#photoPreview'));
    const priceInput = $('#merchantPrice'),
      priceError = $('#merchantPriceError'),
      merchantEstimate = $('#merchantEstimate');
    const updatePriceFeedback = () => {
      const raw = priceInput.value,
        price = parseValidRentalPrice(raw),
        error = rentalPriceError(raw);
      if (error) {
        priceError.textContent = error;
        merchantEstimate.textContent = 'Isi harga sewa untuk melihat estimasi biaya.'
      } else {
        const subtotal = price * 3;
        priceError.textContent = '';
        merchantEstimate.innerHTML = `Contoh sewa 3 hari:<br>Subtotal sewa: <b>${money(subtotal)}</b><br>Biaya platform ke customer (10%): <b>${money(Math.round(subtotal*.1))}</b><br><small>Deposit dan ongkir dihitung terpisah.</small>`
      }
    };
    priceInput.oninput = e => {
      const input = e.target,
        raw = input.value,
        price = parseRupiahInput(raw);
      if (price !== null) {
        const caret = input.selectionStart ?? raw.length,
          digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length,
          formatted = formatRupiahInput(price);
        if (formatted !== raw) {
          input.value = formatted;
          let position = 0,
            digits = 0;
          while (position < formatted.length && digits < digitsBeforeCaret) {
            if (/\d/.test(formatted[position])) digits++;
            position++
          }
          input.setSelectionRange(position, position)
        }
      }
      input.setCustomValidity('');
      updatePriceFeedback()
    };
    priceInput.oninvalid = () => {
      priceError.textContent = rentalPriceError(priceInput.value)
    };
    const publishListing = async form => {
      if (activeRole() !== 'owner') {
        toast('Penerbitan listing hanya tersedia dalam mode pemilik outfit.');
        return
      }
      if (!form.reportValidity()) return;
      const price = parseValidRentalPrice(priceInput.value);
      if (price === null) {
        const message = rentalPriceError(priceInput.value);
        priceError.textContent = message;
        priceInput.setCustomValidity(message);
        priceInput.reportValidity();
        return
      }
      const f = new FormData(form),
        original = Number(f.get('original')),
        replacement = Number(f.get('replacement')),
        deposit = Number(f.get('deposit'));
      if (replacement > original || deposit > replacement) {
        $('#uploadError').textContent = 'Nilai penggantian tidak boleh melebihi harga asli, dan deposit tidak boleh melebihi nilai penggantian.';
        $('#uploadError').scrollIntoView({
          block: 'center'
        });
        return
      }
      $('#uploadError').textContent = '';
      if (!state.merchantVerificationPassed) {
        requestIdentityVerification('merchant', () => publishListing(form));
        return
      }
      refreshSharedDemo();
      const files = [...$('#outfitPhotos').files],
        submit = form.querySelector('[type=submit]');
      if (!files.length) {
        $('#uploadError').textContent = 'Pilih setidaknya satu foto outfit.';
        return
      }
      submit.disabled = true;
      let photos;
      try {
        photos = await Promise.all(files.map(imageFileToSharedDataUrl))
      } catch (conversionError) {
        $('#uploadError').textContent = conversionError.message || 'Foto tidak dapat disiapkan untuk dibagikan.';
        submit.disabled = false;
        return
      }
      const p = {
        id: stableId('outfit'),
        custom: true,
        owner: 'Lemari Kamu',
        img: photos[0],
        photos,
        updatedAt: new Date().toISOString()
      };
      for (const k of ['name', 'category', 'brand', 'material', 'location', 'description', 'condition', 'size', 'terms']) p[k] = f.get(k);
      for (const k of ['original', 'deposit', 'replacement', 'chest', 'waist', 'length']) p[k] = Number(f.get(k));
      p.price = price;
      products.push(p);
      const saved = persistSharedDemo();
      state.merchantTab = 'outfit';
      go('/merchant');
      toast(saved ? 'Listing diterbitkan dan dibagikan ke tab lain. Status pemilik: Terverifikasi (simulasi).' : 'Listing diterbitkan, tetapi gagal dibagikan ke tab lain.')
    };
    $('#uploadForm').onsubmit = e => {
      e.preventDefault();
      publishListing(e.currentTarget)
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
  const routeHash = location.hash.slice(1) || '/',
    [requestedRoute, queryString = ''] = routeHash.split('?');
  let route = (activeRole() || requestedRoute === '/mode') ? requestedRoute : '/mode';
  if (activeRole() === 'owner' && route === '/') {
    go('/merchant');
    return
  }
  header(route);
  let html,
    bindRoute = route;
  const ownerRoutes = ['/merchant', '/upload'],
    renterRoutes = ['/', '/jelajah', '/checkout', '/panduan'];
  if (route === '/mode') html = modeChooser();
  else if (activeRole() === 'renter' && ownerRoutes.includes(route)) {
    html = modeRestrictedPage('owner');
    bindRoute = '/restricted'
  }
  else if (activeRole() === 'owner' && renterRoutes.includes(route)) {
    html = modeRestrictedPage('renter');
    bindRoute = '/restricted'
  }
  else if (route === '/') html = home();
  else if (route === '/jelajah') html = catalog();
  else if (route.startsWith('/outfit/')) {
    let p = products.find(p => p.id === route.split('/')[2]);
    html = p ? detail(p) : notfound()
  } else if (route.startsWith('/pemilik/')) {
    let profileId = decodeURIComponent(route.split('/')[2] || ''),
      from = new URLSearchParams(queryString).get('from') || '',
      fromId = from.startsWith('/outfit/') ? from.split('/')[2] : '';
    html = ownerProfile(profileId, fromId)
  } else if (route === '/checkout') html = !state.renterVerificationPassed ? `<div class="narrow"><div class="empty identity-gate" style="margin:40px 0"><h2>Verifikasi penyewa diperlukan</h2><p>Selesaikan verifikasi simulasi untuk melanjutkan ke checkout. Outfit dan jadwalmu tetap tersimpan.</p><button class="btn" id="renterVerificationGate" type="button">Verifikasi identitas</button></div></div>` : rentalPeriodAvailable(current().id, state.start, state.days) ? checkout() : `<div class="narrow"><div class="empty" style="margin:40px 0"><h2>Pilih jadwal yang tersedia</h2><p>Periksa kembali tanggal dan durasi sewa sebelum melanjutkan.</p><a class="btn" href="#/outfit/${current().id}">Kembali ke detail outfit</a></div></div>`;
  else if (route === '/pesanan') html = orderPage();
  else if (route === '/chat') {
    const params = new URLSearchParams(queryString);
    html = chatPage(params.get('product') || '', params.get('order') || '', params.get('from') || '')
  }
  else if (route === '/merchant') html = merchant();
  else if (route === '/upload') html = upload();
  else if (route === '/syarat') html = policy();
  else if (route === '/panduan') html = guide();
  else if (route.startsWith('/pengembalian/') || route.startsWith('/masalah/')) {
    let o = state.orders.find(o => o.id === route.split('/')[2]);
    html = o ? (route.startsWith('/pengembalian/') ? activeRole() === 'renter' && o.step === 1 ? returns(o) : `<div class="narrow"><div class="empty"><h2>Pengembalian belum tersedia</h2><p>Pengembalian hanya dapat dikirim oleh penyewa ketika status pesanan masih aktif. Pilih mode penyewa melalui navigasi utama.</p><a class="btn" href="#/pesanan">Kembali ke pesanan</a></div></div>` : problem(o)) : notfound()
  } else html = notfound();
  releaseTransientObjectUrls();
  $('#main').innerHTML = html;
  bind(bindRoute);
  enhancePresentation();
  document.title = (route === '/' ? 'Sewa outfit' : route.startsWith('/outfit/') ? current().name : route.startsWith('/pemilik/') ? 'Profil pemilik' : route === '/chat' ? 'Chat' : route.slice(1).split('/')[0].replace(/^./, x => x.toUpperCase())) + ' — reoutfit'
}

function notfound() {
  return '<div class="narrow"><div class="empty" style="margin:40px 0"><h2>Halaman tidak ditemukan.</h2><p>Halaman yang kamu cari tidak tersedia.</p><a href="#/" class="btn">Kembali ke beranda</a></div></div>'
}
window.addEventListener('hashchange', () => {
  const previousRoute = renderedRoute;
  if ($('#modal').open) $('#modal').close();
  render();
  renderedRoute = location.hash.slice(1) || '/';
  window.scrollTo({
    top: renderedRoute === '/jelajah' && previousRoute.startsWith('/outfit/') ? catalogScrollY : 0,
    behavior: 'instant'
  });
  animatePage();
  $('#main').focus({
    preventScroll: true
  })
});
startSharedDemoSync();
render();
