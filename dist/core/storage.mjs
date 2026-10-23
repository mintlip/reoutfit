import { localDateFromISO } from './rules.mjs';
import { stableId } from './id.mjs';

const SHARED_DEMO_KEY = 'reoutfit.demo.shared.v1';
const SHARED_DEMO_CHANNEL = 'reoutfit.demo.shared.v1';
const SHARED_IMAGE_PREFIX = /^data:image\/(?:jpeg|png|webp);base64,/i;
function safeSharedImage(value) {
  if (typeof value !== 'string') return '';
  if (SHARED_IMAGE_PREFIX.test(value)) return value;
  return /^assets\/[a-z0-9_./-]+\.(?:png|jpe?g|webp)$/i.test(value) ? value : ''
}

export function safeSharedProduct(product) {
  if (!product || typeof product !== 'object' || !product.id) return null;
  const fields = ['id', 'custom', 'ownerId', 'verification', 'owner', 'name', 'category', 'price', 'original', 'replacement', 'deposit', 'size', 'chest', 'waist', 'length', 'location', 'description', 'condition', 'material', 'brand', 'terms', 'updatedAt'];
  const clean = {};
  fields.forEach(key => {
    if (product[key] !== undefined) clean[key] = product[key]
  });
  if (!Number.isSafeInteger(product.price) || product.price < 1000 || !Number.isSafeInteger(product.deposit) || product.deposit < 0) return null;
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

export function safeSharedOrder(order) {
  if (!order || typeof order !== 'object' || !order.id || !order.product?.id) return null;
  const product = safeSharedProduct(order.product);
  if (!product || !localDateFromISO(order.start) || !Number.isInteger(order.days) || order.days < 1 || order.days > 7 || !Number.isInteger(order.step) || order.step < 0 || order.step > 3) return null;
  const result = {
    id: String(order.id), product,
    ownerId: String(order.ownerId || ''), renterId: String(order.renterId || ''),
    start: String(order.start || ''), days: Number(order.days) || 1,
    delivery: String(order.delivery || 'pickup'), payment: String(order.payment || 'qris'),
    total: Number(order.total) || 0, step: Math.max(0, Math.min(3, Number(order.step) || 0)),
    paymentStatus: 'unpaid-demo',
    renterVerification: order.renterVerification === 'verified' ? 'verified' : 'unverified',
    createdAt: String(order.createdAt || ''),
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
    // Keep old product threads as legacy data; only scoped threads are opened by the UI.
    if (!/^(?:order:[a-z0-9_-]+|product:[a-z0-9_-]+(?::[a-z0-9_-]+)?)$/i.test(key) || !Array.isArray(messages)) return;
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

export function mergeSharedDemo(remote, local) {
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

export function createSharedStore({ products, baseProducts, state, toast, onUpdate }) {
let sharedChannel = null;
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

function resetSharedDemo() {
  let removed = true;
  try { localStorage.removeItem(SHARED_DEMO_KEY) } catch (_) { removed = false }
  applySharedDemo(emptySharedDemo());
  try { sharedChannel?.postMessage({ type: 'reset', revision: Date.now() }) } catch (_) {}
  onUpdate();
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
        onUpdate()
      }
    }
  } catch (_) { sharedChannel = null }
  window.addEventListener('storage', event => {
    if (event.key !== SHARED_DEMO_KEY) return;
    if (event.newValue === null) applySharedDemo(emptySharedDemo());
    else refreshSharedDemo();
    onUpdate()
  });
}

return { refresh: refreshSharedDemo, persist: persistSharedDemo, reset: resetSharedDemo, start: startSharedDemoSync, touchOrder };
}
