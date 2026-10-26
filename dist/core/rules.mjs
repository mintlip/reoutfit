// Aturan murni: dipakai UI dan tes tanpa mengakses DOM atau penyimpanan browser.
export const MIN_RENTAL_PRICE = 1000;
const rupiahFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
export const money = value => 'Rp' + rupiahFormatter.format(value);
export const formatRupiahInput = value => rupiahFormatter.format(value);

export function parseRupiahInput(value) {
  const raw = String(value ?? '').trim().replace(/^rp\s*/i, '').replace(/\s/g, '');
  // Titik adalah pemisah ribuan, bukan desimal; koma tidak diterima.
  if (!raw || !/^\d+(?:\.\d+)*\.?$/.test(raw)) return null;
  const amount = Number(raw.replace(/\./g, ''));
  return Number.isSafeInteger(amount) ? amount : null;
}

export function parseValidRentalPrice(value) {
  const amount = parseRupiahInput(value);
  return amount !== null && amount >= MIN_RENTAL_PRICE ? amount : null;
}

export function rentalPriceError(value) {
  if (!String(value ?? '').trim()) return 'Harga sewa wajib diisi.';
  const amount = parseRupiahInput(value);
  if (amount === null) return 'Gunakan bilangan bulat, misalnya Rp55.000.';
  if (amount === 0) return 'Harga harus lebih dari Rp0.';
  if (amount < MIN_RENTAL_PRICE) return 'Harga sewa minimum Rp1.000 per hari.';
  return '';
}

function validDuration(days) {
  return typeof days === 'number' && Number.isInteger(days) && days >= 1 && days <= 7;
}

export function calculateCosts(product, days, delivery = 'pickup') {
  if (!validDuration(days)) throw new RangeError('Durasi sewa harus antara 1–7 hari.');
  if (!['pickup', 'courier'].includes(delivery)) throw new RangeError('Cara menerima outfit tidak valid.');
  const { price, deposit } = product || {};
  if (!Number.isSafeInteger(price) || price < MIN_RENTAL_PRICE) throw new RangeError('Harga sewa minimum Rp1.000 per hari.');
  if (!Number.isSafeInteger(deposit) || deposit < 0) throw new RangeError('Deposit harus berupa rupiah bulat, minimal Rp0.');
  const rent = price * days;
  const fee = Math.round(rent * .1);
  const shipping = delivery === 'courier' ? 40000 : 0;
  const total = rent + fee + deposit + shipping;
  if (![rent, fee, total].every(Number.isSafeInteger)) throw new RangeError('Nominal terlalu besar untuk dihitung.');
  return { rent, fee, deposit, shipping, total };
}

export function localDateFromISO(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  // Siang lokal menghindari pergeseran hari saat melintasi DST.
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function localDateISO(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  if (date.getFullYear() < 100 || date.getFullYear() > 9999) return '';
  return [String(date.getFullYear()).padStart(4, '0'), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export const todayISO = () => localDateISO(new Date());

export function addDaysISO(value, days) {
  const date = localDateFromISO(value);
  if (!date || !Number.isInteger(days)) return '';
  date.setDate(date.getDate() + days);
  return localDateISO(date);
}

export const demoUnavailableDays = Object.freeze({
  korean: Object.freeze([8, 9, 18]),
  cosplay: Object.freeze([12, 13, 22]),
  dress: Object.freeze([5, 6, 17]),
  vest: Object.freeze([14, 15, 26])
});

export function rentalPeriodIssue(productId, start, days, orders = [], today = todayISO()) {
  if (!localDateFromISO(start)) return { date: start, reason: 'Pilih tanggal mulai sewa yang valid.' };
  if (start < today) return { date: start, reason: 'Tanggal yang sudah lewat tidak dapat dipilih.' };
  if (!validDuration(days)) return { date: start, reason: 'Durasi sewa harus antara 1–7 hari.' };
  const activeOrders = (Array.isArray(orders) ? orders : []).filter(order =>
    order?.product?.id === productId && Number.isInteger(order.step) && order.step >= 0 && order.step < 3 &&
    localDateFromISO(order.start) && validDuration(order.days)
  );
  for (let offset = 0; offset < days; offset++) {
    const date = addDaysISO(start, offset);
    if (!date) return { date: start, reason: 'Pilih rentang tanggal yang valid.' };
    if ((demoUnavailableDays[productId] || []).includes(localDateFromISO(date).getDate())) {
      return { date, reason: 'Tanggal ini tidak tersedia.' };
    }
    if (activeOrders.some(order => date >= order.start && date <= addDaysISO(order.start, order.days - 1))) {
      return { date, reason: 'Tanggal ini sudah dipesan. Pilih jadwal lain.' };
    }
  }
  return null;
}

export function accessRequirement(user, action) {
  if (action === 'browse' || action === 'draft') return null;
  if (action !== 'confirm' && action !== 'publish') throw new RangeError('Tindakan tidak dikenal.');
  if (!user?.id || !['renter', 'owner'].includes(user.role)) return 'account';
  return user.verification === 'verified' ? null : 'verification';
}

function productOwnerId(product) {
  if (product?.ownerId) return product.ownerId;
  return 'owner-' + String(product?.owner || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function reviewEligibility(order, user, side = 'renter') {
  if (side !== 'renter' && side !== 'owner') return 'Peran pemberi ulasan tidak valid.';
  if (!order || order.step !== 3) return 'Ulasan tersedia setelah outfit dikembalikan dan pemeriksaan selesai.';
  if (!user?.id || user.role !== side) return 'Masuk dengan akun yang mengikuti transaksi ini.';
  const owner = order.ownerId || productOwnerId(order.product);
  const renter = order.renterId;
  if (!renter || !owner || renter === owner || renter === productOwnerId(order.product)) return 'Kamu tidak dapat memberi ulasan pada listing sendiri.';
  if (user.id !== (side === 'renter' ? renter : owner)) return 'Hanya pihak pada transaksi ini yang dapat memberi ulasan.';
  if (order[side === 'renter' ? 'renterReview' : 'ownerReview']) return 'Ulasan untuk transaksi ini sudah dikirim.';
  return '';
}

export function validateReview(rating, text = '') {
  const value = typeof rating === 'string' && /^[1-5]$/.test(rating) ? Number(rating) : rating;
  if (!Number.isInteger(value) || value < 1 || value > 5) return 'Pilih rating 1–5 bintang.';
  if (typeof text !== 'string' || text.length > 500) return 'Komentar maksimal 500 karakter.';
  return '';
}

export function ratingSummary(orders, productId) {
  const seen = new Set();
  const reviews = [];
  for (const order of Array.isArray(orders) ? orders : []) {
    if (!order?.id || seen.has(order.id) || order.product?.id !== productId || order.step !== 3 || !order.renterReview) continue;
    if (validateReview(order.renterReview.rating, order.renterReview.text ?? '')) continue;
    // Cek kelayakan dengan mengabaikan satu ulasan yang sedang dihitung.
    if (reviewEligibility({ ...order, renterReview: null }, { id: order.renterId, role: 'renter' })) continue;
    seen.add(order.id);
    reviews.push({ order, review: order.renterReview });
  }
  return { count: reviews.length, average: reviews.length ? reviews.reduce((sum, item) => sum + Number(item.review.rating), 0) / reviews.length : null, reviews };
}

const PHOTO_TYPES = Object.freeze({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' });
export function validatePhotos(files, { required = true } = {}) {
  const selected = Array.from(files || []);
  if (required && !selected.length) return 'Pilih setidaknya satu foto outfit.';
  if (selected.length > 4) return 'Maksimal 4 foto.';
  for (const file of selected) {
    const extension = String(file?.name || '').split('.').pop().toLowerCase();
    if (!PHOTO_TYPES[extension] || PHOTO_TYPES[extension] !== String(file?.type || '').toLowerCase()) return 'Pilih foto JPEG, PNG, atau WebP.';
    if (!Number.isFinite(file.size) || file.size <= 0) return 'File foto kosong atau tidak valid.';
    if (file.size > 5 * 1024 * 1024) return 'Ukuran setiap foto maksimal 5 MB.';
  }
  return '';
}

export function validateCheckout(data = {}) {
  const errors = {};
  const receiver = String(data.receiver ?? '').trim();
  const phone = String(data.phone ?? '').trim();
  const address = String(data.address ?? '').trim();
  if (!receiver) errors.receiver = 'Nama penerima wajib diisi.';
  if (!phone) errors.phone = 'Nomor telepon wajib diisi.';
  else if (!/^[+\d][\d ()-]{7,17}$/.test(phone) || phone.replace(/\D/g, '').length < 8) errors.phone = 'Masukkan nomor telepon yang valid (8–18 karakter).';
  if (!['pickup', 'courier'].includes(data.delivery)) errors.delivery = 'Pilih cara menerima outfit.';
  if (data.delivery === 'courier' && !address) errors.address = 'Alamat pengiriman wajib diisi untuk kurir.';
  if (data.agree !== true && data.agree !== 'on') errors.agree = 'Setujui syarat penyewaan sebelum melanjutkan.';
  return errors;
}
