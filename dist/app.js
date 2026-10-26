import { products, baseProducts, state } from './core/state.mjs';
import { stableId } from './core/id.mjs';
import { createSharedStore } from './core/storage.mjs';
import { money, parseRupiahInput, formatRupiahInput, calculateCosts, localDateFromISO, localDateISO, todayISO, addDaysISO, rentalPeriodIssue as checkRentalPeriod, ratingSummary } from './core/rules.mjs';
import { createAccountFlow } from './ui/account.mjs';
import { createCheckoutFlow } from './ui/checkout.mjs';
import { createListingFlow } from './ui/listing.mjs';
import { createReviewFlow } from './ui/reviews.mjs';
import { homePage, bindFeatured } from './ui/home.mjs';
import { icon } from './ui/icons.mjs';
import { safeAuthReturnPath } from './ui/auth.mjs';
import { createChatUI } from './ui/chat.mjs';
import { enhanceFilePickers } from './ui/photo-picker.mjs';
import { bindPageMotion } from './ui/motion.mjs';

'use strict';
const $ = s => document.querySelector(s),
  $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
} [c]));
const activeRole = () => account.user?.role || null;
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
const ownerId = product => product.ownerId || 'owner-' + String(product.owner || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ownerInitials = name => String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
const chatHref = (product, order = null, from = '', renterId = account.user?.id) => {
  const params = new URLSearchParams({
    product: product.id,
    from: from || (order ? '/pesanan' : '/outfit/' + product.id)
  });
  if (order) params.set('order', order.id);
  else if (renterId) params.set('renter', renterId);
  return '#/chat?' + params.toString()
};

function ownerRatingSummary(id) {
  const owned = new Set(state.orders.filter(o => (o.ownerId || ownerId(o.product)) === id).map(o => o.product.id));
  const reviews = [...owned].flatMap(productId => ratingSummary(state.orders, productId).reviews);
  return { reviews, count: reviews.length, average: reviews.length ? reviews.reduce((sum, item) => sum + Number(item.review.rating), 0) / reviews.length : null }
}

function ownerProfile(id, from) {
  const owned = products.filter(product => ownerId(product) === id);
  if (!owned.length) return notfound();
  const name = owned[0].owner,
    summary = ownerRatingSummary(id),
    location = [...new Set(owned.map(product => product.location))].join(' · '),
    profileCopy = 'Pemilik outfit',
    returnProduct = products.find(product => product.id === from && ownerId(product) === id) || owned[0],
    summaryText = summary.count ? `${summary.average.toFixed(1)} dari 5 · ${summary.count} ulasan` : 'Belum ada ulasan';
  return `<div class="page-shell"><div class="page-top"><nav class="crumb" aria-label="Breadcrumb"><a href="#/jelajah">Jelajah outfit</a><span>/</span><span>Profil pemilik</span></nav><a class="btn secondary" href="#/outfit/${encodeURIComponent(returnProduct.id)}">Kembali ke detail outfit</a></div><section class="panel owner-profile"><div class="owner-profile-heading"><span class="owner-profile-avatar" aria-hidden="true">${esc(ownerInitials(name))}</span><div><p class="eyebrow">Profil pemilik outfit</p><h1>${esc(name)}</h1><p class="muted">${esc(location)} · ${esc(profileCopy)}</p><span class="badge neutral">Identitas: ${owned.some(product => product.verification === 'verified') ? 'Terverifikasi (simulasi)' : 'Belum diverifikasi (simulasi)'}</span></div></div><div class="owner-profile-stats"><div><strong>${owned.length}</strong><span>Outfit aktif</span></div><div><strong>${summary.count ? `${summary.average.toFixed(1)} ${icon('star')}` : '—'}</strong><span>${esc(summaryText)}</span></div></div></section><section class="profile-section"><div class="section-heading"><div><p class="eyebrow">Koleksi pemilik</p><h2>Outfit lainnya</h2></div></div><div class="outfits">${owned.map(card).join('')}</div></section><section class="panel profile-section"><div class="section-heading"><div><p class="eyebrow">Pengalaman penyewa</p><h2>Ulasan outfit pemilik</h2></div></div>${summary.count ? `<div class="profile-reviews">${summary.reviews.map(({ review, order }) => `<article class="profile-review"><div class="review-topline"><strong>${Number(review.rating)} / 5 ${icon('star')}</strong><span class="small muted">${esc(order.id)} · ${formatDate(order.start)} · ${order.days} hari</span></div><p>${review.text ? esc(review.text) : '<span class="muted">Tanpa komentar tertulis.</span>'}</p><small class="muted">Ulasan setelah pengembalian dan pemeriksaan selesai.</small></article>`).join('')}</div>` : '<p class="muted">Belum ada ulasan</p>'}</section><a class="btn secondary" href="#/outfit/${encodeURIComponent(returnProduct.id)}">Kembali ke detail outfit</a></div>`
}

function chatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function chatPage(productId, orderId, from, renterId) { return chatUI.page(productId, orderId, renterId) }

function dateISO() {
  let d = new Date();
  d.setDate(d.getDate() + 2);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function monthISO(value) { return String(value || '').slice(0, 7) }
function demoDateAvailable(productId, value) {
  return rentalPeriodIssue(productId, value, 1) === null
}
function rentalPeriodIssue(productId, start, days) {
  return checkRentalPeriod(productId, start, days, state.orders)
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
      marker = start && end ? 'M/K' : start ? 'M' : end ? 'K' : inRange ? '•' : past ? '—' : available ? icon('check') : icon('close'),
      classes = ['availability-day', past ? 'is-past' : available ? 'is-available' : 'is-unavailable'];
    if (inRange) classes.push('is-in-range');
    if (start) classes.push('is-start');
    if (end) classes.push('is-end');
    if (conflict) classes.push('has-range-conflict');
    const conflictLabel = conflict ? `; rentang ${state.days} hari melewati tanggal tidak tersedia` : '';
    days += `<button type="button" class="${classes.join(' ')}" data-calendar-date="${value}" aria-label="${esc(formatDate(value))}: ${status}${selectionLabel}${conflictLabel}" aria-pressed="${start || end}" ${past ? 'disabled' : available ? '' : 'aria-disabled="true"'} title="${status}${selectionLabel}${conflictLabel}"><span class="availability-number">${day}</span><span class="availability-mark" aria-hidden="true">${marker}</span></button>`
  }
  return `<div class="availability-calendar-head"><button type="button" class="calendar-month-button" data-calendar-nav="-1" aria-label="Bulan sebelumnya">${icon('chevron-left')}</button><h3 aria-live="polite">${monthLabel}</h3><button type="button" class="calendar-month-button" data-calendar-nav="1" aria-label="Bulan berikutnya">${icon('chevron-right')}</button></div><div class="availability-weekdays" aria-hidden="true">${weekdays.map(day => `<span>${day}</span>`).join('')}</div><div class="availability-days" aria-label="Tanggal pada ${monthLabel}">${days}</div><div class="availability-legend" aria-label="Keterangan kalender"><span><i class="legend-mark available">${icon('check')}</i>Tersedia</span><span><i class="legend-mark unavailable">${icon('close')}</i>Tidak tersedia</span><span><i class="legend-mark past">—</i>Lewat</span><span><i class="legend-mark selected">M</i>Mulai sewa</span><span><i class="legend-mark return">K</i>Tanggal kembali</span><span><i class="legend-mark conflict">!</i>Durasi berbenturan</span></div>`
}

function endDate(start, days) { return formatDate(addDaysISO(start, Number(days) - 1)) }
function formatDate(start) {
  const date = localDateFromISO(start);
  return date ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date) : 'Tanggal belum valid'
}

function header(route) {
  const user = account.user;
  const links = [['/jelajah', 'Sewa'], ['/upload', 'Sewakan outfit'], ['/pesanan', 'Pesanan']];
  $('#header').innerHTML = `<nav class="site-nav" aria-label="Navigasi utama"><a class="brand" href="#/" aria-label="reoutfit, beranda"><img class="brand-mark" src="assets/brand/reoutfit-mark.png" alt="" width="213" height="213"><span class="brand-name">reoutfit</span></a><div class="nav-pill glass">${links.map(([path,label]) => {
    const active = path === '/jelajah' ? route === '/' || route === '/jelajah' || route.startsWith('/outfit/') : path === '/upload' ? ['/upload','/merchant'].includes(route) : route === path;
    return `<a class="${active ? 'active' : ''}" ${active ? 'aria-current="page"' : ''} href="#${path}">${path === '/pesanan' ? icon('cart') : ''}${label}</a>`;
  }).join('')}</div><div class="nav-actions"><a href="#/chat" class="icon-btn" aria-label="Chat" ${route === '/chat' ? 'aria-current="page"' : ''}>${icon('chat')}</a>${user ? `<button class="nav-account" type="button" data-account aria-label="Akun ${esc(user.name)}">${icon('user')}<span>${esc(user.name)}</span></button>` : `<button class="nav-account" type="button" data-login aria-label="Masuk atau daftar">${icon('user')}<span>Masuk</span></button>`}</div></nav>`;
  bindAccountButtons($('#header'));
}

function bindAccountButtons(holder) {
  holder.querySelectorAll('[data-login]').forEach(button => button.onclick = () => go('/login?next=' + encodeURIComponent(location.hash.slice(1) || '/')));
  holder.querySelectorAll('[data-account]').forEach(button => button.onclick = () => account.openAccount());
  holder.querySelectorAll('[data-require-account]').forEach(button => button.onclick = () => account.ensureAccount(() => render(), { role: button.dataset.requireAccount || undefined }));
}

function accessPage(role) {
  return `<div class="narrow"><section class="panel account-gate"><h1>${account.user ? 'Pilih akun yang sesuai' : 'Masuk untuk melanjutkan'}</h1><p>${role==='owner'?'Kelola listing dan pesanan melalui akun pemilik.':'Lihat dan kelola pesanan melalui akun penyewa.'}</p><button type="button" class="btn" data-require-account="${role || ''}">${account.user?'Ganti akun demo':'Masuk / Daftar'}</button><a class="btn ghost" href="#/jelajah">Lihat katalog</a></section></div>`
}

function canAccessOrder(order, side = activeRole()) {
  if (!order || !account.user || account.user.role !== side) return false;
  return account.user.id === (side === 'owner' ? (order.ownerId || ownerId(order.product)) : (order.renterId || DEMO_RENTER_ID))
}
function visibleOrders() { return state.orders.filter(order => canAccessOrder(order)) }

function canAccessChat(key) {
  if (!account.user) return false;
  const parts = String(key || '').split(':'), [kind, id, renterId] = parts;
  if (kind === 'order') return parts.length === 2 && visibleOrders().some(order => order.id === id);
  const product = kind === 'product' && parts.length === 3 && renterId && products.find(item => item.id === id);
  if (!product) return false;
  return activeRole() === 'renter'
    ? account.user.id === renterId && account.user.id !== ownerId(product)
    : account.user.id === ownerId(product) && Array.isArray(state.chats[key]);
}


function showModal(title, body, actions = '') {
  const m = $('#modal');
  m.innerHTML = `<div class="dialog-head"><h2>${title}</h2><button class="icon-btn" aria-label="Tutup dialog" id="closeModal">${icon('close')}</button></div><p>${body}</p>${actions}`;
  m.showModal();
  $('#closeModal').onclick = () => m.close()
}

function card(p) {
  const rating = ratingSummary(state.orders, p.id);
  return `<article class="product group"><a class="product-photo" href="#/outfit/${encodeURIComponent(p.id)}" aria-label="Lihat ${esc(p.name)}"><img class="${p.id === 'dress' ? 'object-contain' : 'object-cover'}" src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"><span class="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold">Ukuran ${esc(p.size)}</span></a><div class="product-body"><p class="text-xs font-semibold text-berry">${esc(p.category)}</p><h3 class="text-lg leading-snug"><a href="#/outfit/${encodeURIComponent(p.id)}" class="hover:text-berry">${esc(p.name)}</a></h3><span class="flex items-center gap-1 text-xs text-muted">${icon('pin')} ${esc(p.location)}</span><p class="mt-1 text-lg font-semibold tabular-nums text-berry">${money(p.price)} <span class="text-sm font-normal text-muted">/ hari</span></p><p class="text-xs text-muted">Deposit ${money(p.deposit)}</p>${rating.count ? `<p class="text-xs text-muted">${rating.average.toFixed(1)} dari 5 · ${rating.count} ulasan</p>` : ''}<a class="btn secondary mt-auto w-full" href="#/outfit/${encodeURIComponent(p.id)}">Lihat detail ${icon('arrow-up-right')}</a></div></article>`;
}

function home() { return homePage({ products, card, icon }) }

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
  return `<div class="page-shell"><div class="page-top"><h1>Jelajah outfit</h1><p>Filter kategori, ukuran, harga, dan lokasi.</p></div><div class="toolbar"><label class="search"><span class="sr-only" hidden>Cari outfit</span>${icon('search')}<input aria-label="Cari outfit" id="search" placeholder="Cari Korean set, dress, vest, cosplay…" value="${esc(state.search)}"></label><select id="sort" aria-label="Urutkan outfit"><option value="default">Urutan pilihan</option><option value="low" ${state.sort==='low'?'selected':''}>Harga terendah</option><option value="high" ${state.sort==='high'?'selected':''}>Harga tertinggi</option></select></div><div class="catalog-layout"><aside class="filters" aria-label="Filter outfit"><div class="filter-head"><strong class="flex items-center gap-2">${icon('filter')} Filter outfit</strong><button id="reset">Reset</button></div><label>Kategori<select id="category">${options(['Semua','Korean style','Cosplay','Dress','Vest & formal'],state.category)}</select></label><label>Ukuran<select id="size">${options(['Semua','S','M','L','XL'],state.size)}</select></label><label>Harga maks. / hari<input id="max" type="text" inputmode="numeric" autocomplete="off" placeholder="Rp100.000" value="${state.max ? formatRupiahInput(Number(state.max)) : ''}"></label><label>Lokasi pemilik<select id="location">${options(['Semua','Bekasi','Jakarta Selatan'],state.location)}</select></label></aside><section><p id="result-count" class="result-count"></p><div class="outfits" id="catalog-products"></div></section></div></div>`
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
  const { rent, fee, shipping, total } = calculateCosts(p, days, delivery);
  return `<div class="summary-row"><span>Sewa (${days} hari × ${money(p.price)})</span><strong class="num">${money(rent)}</strong></div><div class="summary-row"><span>Biaya layanan (10%)</span><strong class="num">${money(fee)}</strong></div><div class="summary-row"><span>Deposit yang dapat dikembalikan</span><strong class="num">${money(p.deposit)}</strong></div><div class="summary-row"><span>${delivery==='courier'?'Kurir pulang-pergi':'Ambil & kembali langsung'}</span><strong class="num">${money(shipping)}</strong></div><div class="summary-row total"><span>Total termasuk deposit</span><strong class="num">${money(total)}</strong></div>`
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
  return `<div class="page-shell"><div class="page-top"><nav class="crumb" aria-label="Breadcrumb"><a href="#/">Beranda</a><span>/</span><a href="#/jelajah">Jelajah outfit</a><span>/</span><span>${esc(p.name)}</span></nav></div><div class="detail-grid"><div>${outfitGalleryMarkup(p)}<div class="panel" style="margin-top:24px"><h2>Detail outfit</h2><div class="summary-row"><span class="muted">Brand</span><strong>${esc(p.brand)}</strong></div><div class="summary-row"><span class="muted">Bahan</span><strong>${esc(p.material)}</strong></div><div class="summary-row"><span class="muted">Harga beli pemilik</span><strong class="num">${money(p.original)}</strong></div><p class="small muted">Harga beli bukan nominal denda.</p><details class="accordion" open><summary>Kondisi outfit</summary><p>${esc(p.condition)}</p></details><details class="accordion"><summary>Syarat dari pemilik outfit</summary><p>${esc(p.terms)}</p><p>Nilai penggantian maksimum yang diajukan: <strong>${money(p.replacement)}</strong>. Klaim harus didukung bukti dan ditinjau; bukan biaya otomatis.</p><a class="help-link" href="#/syarat">Pelajari deposit & penanganan masalah</a></details></div></div><div class="detail-info"><div class="eyebrow">${esc(p.category)}</div><h1>${esc(p.name)}</h1><div class="detail-price num">${money(p.price)} <small>/ hari · minimum 1 hari</small></div><p class="muted">${esc(p.description)}</p><div class="owner"><span class="avatar">${icon('user')}</span><div><strong>${esc(p.owner)}</strong><small>${esc(p.location)} · Pemilik outfit</small></div></div><div class="owner-profile-link"><span class="small muted">${ownerRatingSummary(ownerId(p)).count ? `${ownerRatingSummary(ownerId(p)).average.toFixed(1)} ${icon('star')} · ${ownerRatingSummary(ownerId(p)).count} ulasan` : 'Belum ada ulasan'}</span><a class="help-link" href="#/pemilik/${encodeURIComponent(ownerId(p))}?from=${encodeURIComponent('/outfit/' + p.id)}">Lihat profil pemilik</a></div><div style="margin-top:24px"><h3>Ukuran</h3><div class="table-wrap"><table class="measurements"><thead><tr><th>Ukuran</th><th>Lingkar dada</th><th>Pinggang</th><th>Panjang</th></tr></thead><tbody><tr><td>${esc(p.size)}</td><td>${p.chest} cm</td><td>${p.waist} cm</td><td>${p.length} cm</td></tr></tbody></table></div><p class="small muted">Bandingkan ukuran dalam cm dengan pakaianmu.</p></div><form class="panel booking" id="booking" novalidate><h2>1 · Pilih tanggal</h2><div class="form-grid"><label>Tanggal mulai<input id="start" aria-describedby="availabilityFeedback" type="date" min="${dateISO()}" value="${state.start}" required></label><label>Durasi sewa<select id="days" aria-describedby="availabilityFeedback">${[1,2,3,4,5,6,7].map(n=>`<option value="${n}" ${state.days===n?'selected':''}>${n} hari</option>`).join('')}</select></label></div><p class="hint" id="datehint"></p><div id="detail-costs">${costRows(p,state.days,'pickup')}</div><p class="note">Deposit <b>${money(p.deposit)}</b> dikembalikan setelah pemeriksaan kondisi dan penyelesaian klaim, jika ada.</p><button class="btn full" type="submit">Periksa ringkasan</button><p class="hint" style="text-align:center;margin-top:12px">Belum ada pembayaran pada langkah ini.</p></form></div></div>${reviewFlow.outfitSection(p.id)}</div>`
}

function checkout() { return checkoutFlow.page() }

function orderPage() {
  const orders = visibleOrders();
  const isRenter = activeRole() === 'renter',
    title = isRenter ? 'Pesanan saya' : 'Pesanan masuk';
  if (!orders.length) return `<div class="page-shell"><div class="page-top"><h1>${title}</h1></div><div class="empty" style="margin-bottom:55px"><span class="icon-tile" style="margin:0 auto 18px">${icon('bag')}</span><h2>${isRenter ? 'Belum ada pesanan' : 'Belum ada pesanan masuk'}</h2><p>${isRenter ? 'Pesanan akan muncul setelah checkout.' : 'Pesanan dari penyewa akan tampil di sini.'}</p>${isRenter ? '<a class="btn" href="#/jelajah">Jelajahi outfit</a>' : '<a class="btn" href="#/merchant">Kembali ke dashboard</a>'}</div></div>`;
  return `<div class="page-shell"><div class="page-top"><h1>${title}</h1><p class="hint">Ulasan tersedia setelah outfit dikembalikan dan pemeriksaan selesai.</p></div>${orders.map(o=>orderCard(o)).join('')}</div>`
}
const statuses = ['Pesanan dibuat', 'Sedang disewa', 'Menunggu pemeriksaan', 'Selesai'];

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
      const order = visibleOrders().find(item => item.id === orderId),
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
      const order = visibleOrders().find(item => item.id === orderId),
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
        const latestOrder = visibleOrders().find(item => item.id === orderId),
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
    const order = visibleOrders().find(item => item.id === button.dataset.orderId),
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
  return `<div class="checkout-grid"><section class="panel"><div class="status-header"><span class="small muted">${o.id} · Pesanan</span><span class="badge ${o.step===3?'green':'pink'}">${o.issue?'Ada laporan · sedang ditinjau':statuses[o.step]}</span></div><div class="order-mini"><img src="${esc(p.img)}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.owner)} · Ukuran ${esc(p.size)}</p><p class="small">${formatDate(o.start)} – ${endDate(o.start,o.days)}</p></div></div><div class="summary-row"><span>Serah terima</span><strong>${o.delivery==='pickup'?'Ambil langsung':'Kurir reguler'}</strong></div><div class="summary-row"><span>Pembayaran</span><strong>${o.payment==='cod'?'COD + deposit awal ':o.payment.toUpperCase()+' '}</strong></div><div class="summary-row"><span>Status pembayaran</span><strong>Belum diproses · simulasi</strong></div>${activeRole()==='owner'?`<div class="summary-row"><span>Status penyewa</span><strong>${o.renterVerification==='verified'?'Terverifikasi (simulasi)':'Belum diverifikasi (simulasi)'}</strong></div>`:''}<div class="summary-row"><span>Status deposit</span><strong>${o.step===3?'Pengembalian disimulasikan':'Ditahan (simulasi)'}</strong></div><div class="note neutral">${o.step===0?'Saat menerima outfit, cocokkan kelengkapan dan ambil foto kondisinya.':o.step===1?'Simpan bukti kondisi dan kembalikan paling lambat '+endDate(o.start,o.days)+'.':o.step===2?'Pemilik memeriksa kondisi dan kelengkapan. Deposit belum dilepas sebelum pemeriksaan selesai.':'Sewa selesai. Deposit '+money(p.deposit)+' disimulasikan kembali penuh.'}</div><div class="row-actions">${o.step===0?`<button class="btn" data-receive="${o.id}">Konfirmasi penerimaan</button>`:o.step===1?`<a class="btn" href="#/pengembalian/${o.id}">Kembalikan outfit</a>`:''}${o.step<3?`<a class="btn secondary" href="#/masalah/${o.id}">Laporkan masalah</a>`:''}${o.step===2?`<button class="btn secondary" data-inspect="${o.id}">Simulasikan pemeriksaan selesai</button>`:''}</div>${o.issue?`<p class="note">Laporan: ${esc(o.issue.type)}. Laporan sedang ditinjau; deposit ditahan sampai selesai. Referensi ${o.issue.id}.</p>`:''}</section><aside class="panel"><h2>Status pesanan</h2><ol class="timeline">${[['Pesanan dibuat','Jadwal dan biaya disetujui.'],['Outfit diterima','Kondisi awal dicatat.'],['Outfit dikembalikan','Bukti pengembalian dikirim.'],['Pemeriksaan selesai','Deposit diselesaikan.']].map((s,i)=>`<li class="${i<=o.step?'done':''}"><strong>${s[0]}</strong><small>${s[1]}</small></li>`).join('')}</ol><div class="summary-row total"><span>Total pesanan</span><strong class="num">${money(o.total)}</strong></div><p class="hint">Termasuk deposit ${money(p.deposit)}.</p></aside></div>`
}

function returns(o) {
  return `<div class="narrow"><div class="page-top"><nav class="crumb"><a href="#/pesanan">Pesanan saya</a><span>/</span><span>Pengembalian</span></nav><h1>Pengembalian outfit</h1><p>Upload foto kondisi akhir dan bukti pengembalian.</p></div><form class="panel" id="returnForm" data-id="${o.id}"><div class="order-mini"><img src="${esc(o.product.img)}" alt="${esc(o.product.name)}"><div><h3>${esc(o.product.name)}</h3><p class="small">Batas kembali: ${endDate(o.start,o.days)}</p></div></div><label>Kondisi saat dikembalikan<select name="condition" required><option value="">Pilih kondisi</option><option>Baik, sesuai kondisi awal</option><option>Ada noda atau kerusakan</option><option>Ada bagian yang hilang</option></select></label><label style="margin-top:22px">Catatan kondisi<textarea name="notes" placeholder="Jelaskan perubahan kondisi atau kelengkapan, jika ada."></textarea></label><div class="upload-area" style="margin-top:22px"><label>Foto kondisi & bukti pengembalian<input type="file" name="evidence" id="evidence" accept="image/jpeg,image/png,image/webp" multiple required></label><p class="hint">Sertakan foto depan, belakang, dan kelengkapan. Maks. 4 foto, 5 MB per foto. </p><div class="upload-previews" id="evidencePreview"></div></div>${o.delivery==='courier'?'<label style="margin-top:22px">Nomor resi pengembalian<input name="tracking" required placeholder="Masukkan resi contoh"></label>':''}<label class="checkline"><input type="checkbox" required><span>Saya sudah mengirim atau menyerahkan kembali outfit, dan bukti ini sesuai kondisinya.</span></label><p class="note">Deposit belum langsung dikembalikan. Pemilik akan memeriksa outfit; jika ada perbedaan, kedua pihak dapat mengajukan bukti.</p><button type="submit" class="btn full">Kirim bukti pengembalian</button></form></div>`
}

function problem(o) {
  return `<div class="narrow"><div class="page-top"><nav class="crumb"><a href="#/pesanan">Pesanan saya</a><span>/</span><span>Laporkan masalah</span></nav><h1>Laporkan masalah</h1><p>Sertakan kronologi dan bukti, jika tersedia.</p></div><form class="panel" id="issueForm" data-id="${o.id}"><h2>Pesanan ${o.id}</h2><label>Jenis masalah<select name="type" required><option value="">Pilih masalah</option><option>Outfit berbeda dari deskripsi</option><option>Outfit rusak atau kotor</option><option>Kelengkapan hilang</option><option>Belum diterima / tidak dikembalikan</option><option>Pembayaran atau deposit</option><option>Lainnya</option></select></label><label style="margin-top:22px">Ceritakan yang terjadi<textarea name="description" minlength="15" required placeholder="Minimal 15 karakter. Jelaskan kondisi, waktu, dan penyelesaian yang kamu harapkan."></textarea></label><div class="upload-area" style="margin-top:22px"><label>Tambahkan bukti (opsional)<input type="file" name="evidence" id="evidence" multiple accept="image/*"></label><p class="hint">Maks. 4 foto, 5 MB per foto. Untuk outfit yang belum diterima, laporan boleh tanpa foto.</p><div class="upload-previews" id="evidencePreview"></div></div><p class="note">Pelaporan tidak otomatis mengenakan denda. Deposit ditahan selama peninjauan; keputusan memerlukan bukti dari kedua pihak.</p><button type="submit" class="btn full">Kirim laporan</button></form></div>`
}

function merchant() {
  const ownedProducts = products.filter(p => ownerId(p) === account.user?.id);
  const orders = visibleOrders();
  return `<div class="page-shell"><div class="page-top page-actions"><div><h1>Outfit saya</h1><p>Kelola listing dan pesanan sewa.</p></div><a class="btn" href="#/upload">${icon('plus')} Tambah outfit</a></div><div class="tabs"><a class="${state.merchantTab==='outfit'?'active':''}" href="#/merchant" data-tab="outfit">Outfit saya</a><a class="${state.merchantTab==='orders'?'active':''}" href="#/merchant" data-tab="orders">Pesanan masuk</a><a class="${state.merchantTab==='revenue'?'active':''}" href="#/merchant" data-tab="revenue">Pendapatan & biaya</a></div><div class="stats"><div class="stat"><span class="muted">Listing milik akun ini</span><strong>${ownedProducts.length}</strong></div><div class="stat"><span class="muted">Pesanan</span><strong>${orders.length}</strong></div><div class="stat"><span class="muted">Pendapatan sewa selesai</span><strong>${money(orders.filter(o=>o.step===3).reduce((a,o)=>a+o.product.price*o.days,0))}</strong></div></div>${state.merchantTab==='outfit'?`<section class="panel"><h2>Listing outfit</h2><p class="small muted">Listing yang dikelola akun pemilik ini.</p>${ownedProducts.map(p=>`<article class="listing-row"><img src="${esc(p.img)}" alt="${esc(p.name)}"><div class="grow"><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.category)} · ${money(p.price)} / hari</p></div><span class="badge green">${p.custom?'Terbit':'Contoh aktif'}</span><a class="btn secondary" href="#/outfit/${p.id}">Lihat listing</a></article>`).join('')}</section>`:state.merchantTab==='orders'?`<section class="panel"><h2>Pesanan masuk</h2>${orders.length?orders.map(o=>`<div class="listing-row"><img src="${esc(o.product.img)}" alt="${esc(o.product.name)}"><div class="grow"><h3>${esc(o.product.name)}</h3><p class="small muted">${o.id} · ${o.days} hari · ${statuses[o.step]}</p></div><a class="btn secondary" href="#/pesanan">Kelola pesanan</a></div>`).join(''):'<p class="muted">Belum ada pesanan. Coba buat pesanan melalui akun penyewa.</p>'}</section>`:`<section class="panel"><h2>Pembagian biaya</h2><p>Pemilik menerima harga sewa penuh. Penyewa membayar biaya platform 10% secara terpisah.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Contoh: Rp55.000 × 3 hari</th><th>Nominal</th><th>Tujuan dana</th></tr></thead><tbody><tr><td>Harga sewa</td><td>Rp165.000</td><td>Pendapatan pemilik</td></tr><tr><td>Biaya platform 10%</td><td>Rp16.500</td><td>Pendapatan kotor reoutfit</td></tr><tr><td>Deposit</td><td>Rp100.000</td><td>Ditahan sementara, bukan revenue</td></tr></tbody></table></div><p class="note">10% adalah asumsi model bisnis awal, bukan tarif final. Biaya payment gateway, operasional, dan penanganan sengketa masih perlu divalidasi.</p><p class="small muted">Tidak ada saldo atau pencairan dana sungguhan dalam prototipe.</p></section>`}</div>`
}

function upload() { return listingFlow.page() }

function policy() {
  return `<div class="narrow"><div class="page-top"><h1>Syarat & deposit</h1><p>Syarat pemilik dan rincian biaya disetujui saat checkout.</p></div><div class="policy-grid"><div class="panel"><span class="icon-tile" style="margin-bottom:18px">${icon('wallet')}</span><h3>Sewa, biaya platform & deposit</h3><p><b>Harga sewa</b> untuk pemilik. <b>Biaya platform 10%</b> untuk reoutfit. <b>Deposit</b> ditahan sementara dan bukan pendapatan.</p></div><div class="panel"><span class="icon-tile" style="margin-bottom:18px">${icon('shield')}</span><h3>Deposit bukan asuransi</h3><p>Deposit tidak menjamin seluruh kerugian tertutup. Nilai penggantian maksimum harus dijelaskan dan disetujui sebelum pemesanan.</p></div></div><div class="panel" style="margin-top:22px"><h2>Jika outfit kotor, rusak, atau hilang</h2><ol class="policy-list"><li><b>Catat kondisi awal.</b> Pemilik dan penyewa menyimpan foto serta daftar kelengkapan saat serah terima.</li><li><b>Laporkan perbedaannya.</b> Lampirkan foto, kronologi, dan biaya perbaikan atau penggantian yang diajukan.</li><li><b>Tinjau bukti kedua pihak.</b> Pemakaian normal tidak otomatis dikenakan denda. Klaim noda atau kerusakan mengacu pada biaya yang dapat dijelaskan.</li><li><b>Selesaikan klaim sebelum melepas deposit.</b> Potongan yang disetujui dan sisa pengembalian ditampilkan terpisah. Jika masih berselisih, gunakan proses peninjauan.</li></ol><p class="note">Kehilangan atau tidak dikembalikan dapat memerlukan penggantian hingga nilai maksimum yang disepakati, setelah peninjauan. Harga beli asli bukan denda otomatis. Tidak ada penagihan otomatis.</p></div><div class="panel"><h2>Jadwal, pencucian & pembayaran</h2><details class="accordion" open><summary>Bagaimana durasi dihitung?</summary><p>Sewa tersedia mulai 1 hari. Tanggal mulai adalah hari pertama pemakaian; sewa 1 hari dikembalikan pada tanggal yang sama, sesuai jam serah terima yang disepakati. Sewa 3 hari mulai tanggal 10 berakhir tanggal 12. Waktu dan lokasi serah terima disepakati bersama; pengiriman harus diatur sebelum jadwal mulai.</p></details><details class="accordion"><summary>Apa bedanya COD dan ambil langsung?</summary><p>Ambil langsung adalah cara menerima outfit. COD adalah cara membayar sewa saat serah terima. COD tersedia untuk ambil langsung. Deposit dan biaya platform dibayar di awal.</p></details><details class="accordion"><summary>Apakah pencucian termasuk?</summary><p>Periksa ketentuan pencucian pada masing-masing listing. Kerusakan atau noda di luar pemakaian normal perlu bukti dan peninjauan; tidak ada potongan otomatis.</p></details><details class="accordion"><summary>Kapan deposit kembali?</summary><p>Setelah kondisi diperiksa dan klaim selesai, jika ada. Waktu pengembalian bergantung pada proses operasional dan penyedia pembayaran.</p></details><details class="accordion"><summary>Bagaimana pembatalan atau keterlambatan?</summary><p>Rincian tenggat pembatalan, pengembalian dana, dan tarif keterlambatan masih perlu disepakati sebelum peluncuran. Hubungi pemilik melalui proses laporan. Tidak ada denda otomatis atau pembatalan berbayar.</p></details></div><a href="#/jelajah" class="btn">Kembali jelajahi outfit</a></div>`
}

function guide() {
  return `<div class="narrow"><div class="page-top"><h1>Cara sewa</h1></div>${[['1','Pilih outfit dan tanggal','Periksa foto, ukuran, kondisi, dan jadwal yang tersedia. Sewa 1–7 hari; tanggal mulai dihitung sebagai hari pertama.'],['2','Periksa ringkasan','Lihat harga sewa, biaya layanan, deposit, ongkir, dan total. Pilih cara menerima outfit dan baca ketentuan pemilik.'],['3','Konfirmasi pesanan','Masuk atau daftar jika belum punya akun, lalu selesaikan verifikasi dummy sebelum konfirmasi. Pengguna baru memerlukan langkah tambahan ini; tiga tahap bukan berarti seluruh tindakan selesai dalam tiga klik.']].map(a=>`<section class="panel"><div class="big-number">${a[0]}</div><h2>${a[1]}</h2><p class="muted">${a[2]}</p></section>`).join('')}<section class="panel"><h2>Setelah pesanan dibuat</h2><p>Pemilik mencatat kondisi awal. Penyewa menerima outfit, mengunggah bukti pengembalian, lalu menunggu pemeriksaan. Ulasan tersedia setelah transaksi selesai.</p><p class="hint">Pembayaran dan pengembalian deposit masih simulasi. Tidak ada uang yang dipindahkan.</p></section><div class="row-actions"><a class="btn" href="#/jelajah">Sewa outfit</a><a class="btn secondary" href="#/syarat">Syarat & deposit</a></div></div>`
}

function filePreview(input, holder, strictConditionFormats = false) {
  let previewUrls = [];
  const clearPreviews = () => {
    previewUrls.forEach(releaseTransientObjectUrl);
    previewUrls = []
  };
  const dialog = input.closest('dialog');
  const releasePicker = enhanceFilePickers(input.closest('.upload-area') || input.parentElement);
  dialog?.addEventListener('close', releasePicker, { once: true });
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
let cleanupFeatured = () => {};
function bind(route) {
  bindAccountButtons($('#main'));
  if (route === '/') cleanupFeatured = bindFeatured() || (() => {});
  $$('[data-reset-demo]').forEach(button => button.onclick = () => {
    showModal('Reset data?', 'Tindakan ini menghapus listing, pesanan, chat, bukti kondisi, dan ulasan Reoutfit di browser ini. Tab Reoutfit lain yang terbuka ikut diperbarui; data browser lainnya tetap aman.', '<div class="row-actions"><button class="btn danger" id="confirmDemoReset" type="button">Reset data</button><button class="btn secondary" id="cancelDemoReset" type="button">Batal</button></div>');
    $('#confirmDemoReset').onclick = () => {
      $('#modal').close();
      resetSharedDemo()
    };
    $('#cancelDemoReset').onclick = () => $('#modal').close()
  });
  if (route === '/' && activeRole() === 'renter') {
    const merchantBanner = $('.merchant-banner');
    if (merchantBanner) merchantBanner.remove()
  }
  if (route === '/pesanan') {
    $$('#main .checkout-grid').forEach((card, index) => {
      const order = visibleOrders()[index],
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
      if (order && actions) actions.insertAdjacentHTML('beforeend', `<a class="btn secondary" href="${chatHref(order.product, order, '/pesanan')}">${activeRole() === 'owner' ? 'Chat penyewa' : 'Chat penjual'}</a>`);
      if (order && panel && order.step === 3) panel.insertAdjacentHTML('beforeend', `<section class="order-reviews"><h3>Ulasan transaksi</h3><div class="row-actions">${reviewFlow.action(order, activeRole())}</div></section>`)
    });
    bindConditionEvidenceUploads()
  }
  if (route === '/merchant' && state.merchantTab === 'orders') {
    $$('#main .listing-row').forEach((row, index) => {
      const order = visibleOrders()[index],
        action = order && order.step === 3 ? reviewFlow.action(order, 'owner') : '';
      if (action) row.insertAdjacentHTML('beforeend', `<div class="merchant-review-control">${action}</div>`)
    })
  }
  $$('[data-review]').forEach(button => button.onclick = () => reviewFlow.open(button.dataset.review, button.dataset.reviewSide));
  if (route.startsWith('/outfit/')) {
    bindOutfitGallery();
    const ownerLinks = $('#main .owner-profile-link');
    if (activeRole() !== 'owner' && ownerLinks) ownerLinks.insertAdjacentHTML('beforeend', `<a class="btn secondary" href="${chatHref(current())}">Chat penjual</a>`);
    if (activeRole() === 'owner' && ownerLinks) {
      const keys = Object.keys(state.chats).filter(key => key.startsWith(`product:${current().id}:`) && canAccessChat(key));
      keys.forEach((key, index) => ownerLinks.insertAdjacentHTML('beforeend', `<a class="btn secondary" href="${chatHref(current(), null, '', key.split(':')[2])}">Chat penyewa ${index + 1}</a>`));
    }

  }
  if (route === '/chat' && $('#chatForm')) {
    const form = $('#chatForm'),
      input = $('#chatInput'),
      count = $('#chatMessageCount'),
      error = $('#chatMessageError');
    input.onkeydown = event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
    };
    input.oninput = () => {
      count.textContent = `${input.value.length.toLocaleString('id-ID')}/1.000`;
      error.textContent = ''
    };
    form.onsubmit = event => {
      event.preventDefault();
      if (!form.isConnected || form.dataset.sending === 'true') return;
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
      if (!canAccessChat(key)) {
        error.textContent = 'Akun ini tidak dapat mengirim pesan dalam percakapan ini.';
        return;
      }
      if (!Array.isArray(state.chats[key])) state.chats[key] = [];
      form.dataset.sending = 'true';
      const message = { id: stableId('msg'), sender: activeRole(), text, createdAt: new Date().toISOString() };
      state.chats[key].push(message);
      if (!persistSharedDemo()) {
        state.chats[key] = state.chats[key].filter(item => item.id !== message.id);
        form.dataset.sending = 'false';
        error.textContent = 'Pesan belum tersimpan. Periksa ruang penyimpanan browser, lalu coba lagi.';
        return;
      }
      render();
      const messages = $('#chatMessages');
      messages.scrollTop = messages.scrollHeight;
      $('#chatInput').focus({ preventScroll: true })
    };
    const messages = $('#chatMessages');
    messages.scrollTop = messages.scrollHeight
  }
  if (route === '/') $$('[data-home-cat]').forEach(b => b.onclick = () => {
    $$('[data-home-cat]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    $('#home-products').innerHTML = products.filter(p => b.dataset.homeCat === 'Semua' || p.category === b.dataset.homeCat).map(card).join('');
    enhancePresentation()
  });
  if (route === '/jelajah') {
    renderResults();
    ['category', 'size', 'location', 'max', 'sort', 'search'].forEach(k => $('#' + k).addEventListener(k === 'search' || k === 'max' ? 'input' : 'change', e => {
      state[k] = k === 'max' ? parseRupiahInput(e.target.value) ?? '' : e.target.value;
      renderResults()
    }));
    $('#max').addEventListener('blur', event => { if (state.max !== '') event.target.value = formatRupiahInput(Number(state.max)); });
    $('#reset').onclick = resetFilters
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
      const candidate = dateInput.value, duration = Number(daysInput.value);
      const issue = rentalPeriodIssue(product.id, candidate, duration);
      if (issue) {
        showAvailabilityMessage(`Jadwal tidak tersedia: ${formatDate(issue.date)}. Pilih tanggal dan durasi lain sebelum melanjutkan.`);
        $('#availabilityCalendar').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return
      }
      state.start = candidate; state.days = duration;
      go('/checkout')
    }
  }
  if ($('#checkoutForm')) checkoutFlow.bind();
  $$('[data-receive]').forEach(b => b.onclick = () => {
    refreshSharedDemo();
    const o = visibleOrders().find(o => o.id === b.dataset.receive);
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
      let currentOrder = visibleOrders().find(item => item.id === b.dataset.receive);
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
        currentOrder = visibleOrders().find(item => item.id === b.dataset.receive);
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
    const o = visibleOrders().find(o => o.id === b.dataset.inspect);
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
        const latestOrder = visibleOrders().find(item => item.id === b.dataset.inspect);
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
      let o = visibleOrders().find(o => o.id === e.target.dataset.id);
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
        o = visibleOrders().find(order => order.id === e.target.dataset.id);
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
      let o = visibleOrders().find(o => o.id === e.target.dataset.id);
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
        o = visibleOrders().find(order => order.id === e.target.dataset.id);
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
  if ($('#uploadForm')) listingFlow.bind();
}
function enhancePresentation() {
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
    if (img.closest('.auth-slideshow,.auth-visual,.featured-item.is-active') || img.loading === 'eager' || img.classList.contains('detail-photo')) {
      img.loading = 'eager';
      img.fetchPriority = 'high'
    } else img.loading = 'lazy';
  });
}

function animatePage() {
  cleanupMotion();
  cleanupMotion = bindPageMotion($('#main'));
}
// Hash URL menentukan halaman yang ditampilkan.
let cleanupAuth = () => {};
let cleanupPickers = () => {};
let cleanupMotion = () => {};
function render() {
  cleanupMotion();
  cleanupMotion = () => {};
  cleanupAuth();
  cleanupAuth = () => {};
  cleanupPickers();
  cleanupFeatured();
  cleanupFeatured = () => {};
  listingFlow.captureDraft();
  checkoutFlow.captureDraft();
  let routeHash = location.hash.slice(1) || '/';
  const initialPath = routeHash.split('?')[0];
  if (!account.user && (initialPath === '/' || initialPath === '/chat')) {
    routeHash = '/login?next=' + encodeURIComponent(routeHash);
    history.replaceState(null, '', '#' + routeHash);
  }
  if (account.user && ['/login', '/register'].includes(routeHash.split('?')[0])) {
    const next = new URLSearchParams(routeHash.split('?')[1]).get('next') || '/';
    routeHash = safeAuthReturnPath(next);
    history.replaceState(null, '', '#' + routeHash);
  }
  const [requestedRoute, queryString = ''] = routeHash.split('?');
  const route = requestedRoute === '/mode' ? '/akun' : requestedRoute;
  header(route);
  let html, bindRoute = route;
  const needsAccount = ['/pesanan', '/merchant', '/chat'].includes(route) || route.startsWith('/pengembalian/') || route.startsWith('/masalah/');
  if (route === '/login' || route === '/register') html = account.page(route.slice(1), { returnTo: new URLSearchParams(queryString).get('next') || '/', role: new URLSearchParams(queryString).get('role') || '' });
  else if (route === '/akun') html = `<div class="narrow"><section class="panel account-gate"><h1>Akun</h1><p>${account.user ? esc(account.user.name) : 'Masuk saat ingin membuat pesanan atau menerbitkan listing.'}</p><button class="btn" type="button" data-account>Kelola akun demo</button></section></div>`;
  else if (needsAccount && (!account.user || (route === '/merchant' && activeRole() !== 'owner'))) { html = accessPage(route === '/merchant' ? 'owner' : ''); bindRoute = '/restricted' }
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
  } else if (route === '/checkout') html = checkout();
  else if (route === '/pesanan') html = orderPage();
  else if (route === '/chat') {
    const params = new URLSearchParams(queryString);
    html = chatPage(params.get('product') || '', params.get('order') || '', params.get('from') || '', params.get('renter') || '')
  }
  else if (route === '/merchant') html = merchant();
  else if (route === '/upload') html = upload();
  else if (route === '/syarat') html = policy();
  else if (route === '/panduan') html = guide();
  else if (route.startsWith('/pengembalian/') || route.startsWith('/masalah/')) {
    let o = visibleOrders().find(o => o.id === route.split('/')[2]);
    html = o ? (route.startsWith('/pengembalian/') ? activeRole() === 'renter' && o.step === 1 ? returns(o) : `<div class="narrow"><div class="empty"><h2>Pengembalian belum tersedia</h2><p>Pengembalian hanya dapat dikirim oleh penyewa ketika status pesanan masih aktif. Masuk dengan akun penyewa pada pesanan ini.</p><a class="btn" href="#/pesanan">Kembali ke pesanan</a></div></div>` : problem(o)) : notfound()
  } else html = notfound();
  releaseTransientObjectUrls();
  $('#main').innerHTML = html;
  bind(bindRoute);
  if (['/login','/register'].includes(route)) cleanupAuth = account.bindPage(route.slice(1), { returnTo: new URLSearchParams(queryString).get('next') || '/', role: new URLSearchParams(queryString).get('role') || '' }) || (() => {});
  cleanupPickers = enhanceFilePickers($('#main'));
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
const store = createSharedStore({ products, baseProducts, state, toast, onUpdate: renderAfterSharedUpdate });
const refreshSharedDemo = () => store.refresh();
const persistSharedDemo = () => store.persist();
const resetSharedDemo = () => store.reset();
const touchOrder = order => store.touchOrder(order);
const account = createAccountFlow({ toast, onNavigate: go, onChange: () => {
  header((location.hash.slice(1) || '/').split('?')[0]);
  checkoutFlow.refreshAccountStatus();
  listingFlow.refreshAccountStatus();
  // Only replace private views after a session change; keep draft forms mounted.
  const route = (location.hash.slice(1) || '/').split('?')[0];
  if (['/pesanan','/merchant','/chat','/akun','/mode'].includes(route) || route.startsWith('/pengembalian/') || route.startsWith('/masalah/')) render();
} });
const checkoutFlow = createCheckoutFlow({ state, current, account, esc, money, formatDate, endDate, costRows, ownerId, stableId, refreshSharedDemo, persistSharedDemo, toast, go });
const listingFlow = createListingFlow({ state, products, account, esc, icon, money, stableId, refreshSharedDemo, persistSharedDemo, imageFileToSharedDataUrl, toast, go });
const chatUI = createChatUI({ state, products, account, canAccessChat, visibleOrders, ownerId, esc, money, chatTime, chatHref });
const reviewFlow = createReviewFlow({ state, account, esc, formatDate, touchOrder, refreshSharedDemo, persistSharedDemo, toast, render });
// Closed dialogs must not leave duplicate form IDs behind on the next page.
$('#modal').addEventListener('close', () => {
  if (!$('#modal').open) $('#modal').replaceChildren();
});
store.start();
render();
animatePage();
