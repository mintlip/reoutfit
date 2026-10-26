import { icon } from './icons.mjs';
// Keep the existing shared-store keys. Conversations are selected only after the
// caller has applied account ownership checks, including direct hash URLs.
export function createChatUI({ state, products, account, canAccessChat, visibleOrders, ownerId, esc, money, chatTime, chatHref }) {
  function context(key) {
    if (!canAccessChat(key)) return null;
    const [kind, id, renterId] = key.split(':');
    const order = kind === 'order' ? visibleOrders().find(item => item.id === id) : null;
    const product = order?.product || products.find(item => item.id === id);
    if (!product) return null;
    return { key, order, product, renterId, peer: account.user.role === 'owner' ? (renterId === 'renter-demo-2' || order?.renterId === 'renter-demo-2' ? 'Penyewa Demo 2' : 'Penyewa Demo') : product.owner };
  }

  function sidebar(selected = '') {
    const keys = Object.keys(state.chats).filter(key => state.chats[key]?.length && canAccessChat(key));
    if (selected && !keys.includes(selected) && canAccessChat(selected)) keys.unshift(selected);
    keys.sort((a, b) => (Date.parse(state.chats[b]?.at(-1)?.createdAt) || 0) - (Date.parse(state.chats[a]?.at(-1)?.createdAt) || 0));
    return `<aside class="chat-sidebar"><p class="eyebrow mb-2">Tetap terhubung</p><h1 class="text-2xl">Percakapan</h1><p class="mt-2 text-sm text-muted">Tanyakan detail, siapkan momenmu.</p><ul class="chat-list">${keys.map(key => {
      const item = context(key);
      if (!item) return '';
      const message = state.chats[key]?.at(-1);
      return `<li><a class="chat-thread${key === selected ? ' active' : ''}" ${key === selected ? 'aria-current="page"' : ''} href="${chatHref(item.product, item.order, '', item.renterId)}"><img src="${esc(item.product.img)}" alt="" width="44" height="56"><span class="min-w-0"><strong class="block truncate">${esc(item.peer)}</strong><span class="block truncate text-xs text-muted">${esc(item.product.name)}</span><span class="mt-1 block truncate text-xs">${message ? esc(message.text) : 'Percakapan baru'}</span></span></a></li>`;
    }).join('')}</ul>${!keys.length ? '<p class="mt-6 text-sm text-muted">Belum ada percakapan. Pilih outfit, lalu tekan “Chat penjual”.</p>' : ''}</aside>`;
  }

  function page(productId, orderId, renterId) {
    if (!productId) return `<div class="page-shell chat-layout">${sidebar()}<section class="chat-overview"><div class="max-w-sm"><span class="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-pink-soft text-berry" aria-hidden="true">${icon('chat')}</span><h2 class="text-2xl">Obrolan dimulai dari outfit</h2><p class="mt-3 text-muted">Pilih percakapan atau temukan outfit untuk menanyakan ukuran dan jadwal kepada pemilik.</p><a class="btn mt-6" href="#/jelajah">Jelajahi outfit</a><p class="mt-6 text-xs text-muted">Chat simulasi, tersimpan pada perangkat ini.</p></div></section></div>`;
    const product = products.find(item => item.id === productId);
    const order = orderId ? visibleOrders().find(item => item.id === orderId && item.product.id === productId) : null;
    const key = order ? `order:${order.id}` : `product:${productId}:${renterId || (account.user?.role === 'renter' ? account.user.id : '')}`;
    const item = product && (!orderId || order) ? context(key) : null;
    if (!item) return `<div class="page-shell py-12"><section class="panel"><h1 class="text-title">Percakapan tidak tersedia</h1><p class="mt-4 text-muted">Masuk dengan akun yang terlibat dalam percakapan ini.</p><a class="btn mt-6" href="#/chat">Kembali ke percakapan</a></section></div>`;
    const messages = state.chats[key] || [];
    return `<div class="page-shell chat-layout">${sidebar(key)}<div class="chat-content"><section class="chat-outfit"><img src="${esc(product.img)}" alt="${esc(product.name)}" width="64" height="80"><div class="chat-outfit-info"><h2>${esc(product.name)}</h2><p>${money(product.price)} / hari · ${esc(product.owner)}</p>${order ? `<p>Pesanan ${esc(order.id)}</p>` : ''}</div><a class="text-sm font-semibold text-berry underline-offset-4 hover:underline" href="#/outfit/${encodeURIComponent(product.id)}">Lihat outfit</a></section><p class="chat-demo-note">Chat simulasi · tersimpan pada perangkat ini dan dapat dibuka di tab lain.</p><section class="chat-panel" aria-label="Percakapan dengan ${esc(item.peer)}"><div class="chat-panel-heading"><h2>${esc(item.peer)}</h2><p class="text-xs text-muted">${order ? 'Tentang pesananmu' : 'Tentang outfit ini'}</p></div><div class="chat-messages" id="chatMessages" role="log" aria-live="polite" aria-relevant="additions text">${messages.length ? messages.map(message => `<article class="chat-message ${message.sender === account.user.role ? 'own' : 'other'}"><span class="chat-sender">${message.sender === account.user.role ? 'Kamu' : esc(item.peer)}</span><p>${esc(message.text)}</p><time datetime="${esc(message.createdAt)}">${esc(chatTime(message.createdAt))}</time></article>`).join('') : '<div class="chat-empty"><strong>Sapa pemilik outfit</strong><p>Mulai dengan pertanyaan tentang ukuran, detail, atau jadwal sewa.</p></div>'}</div><form class="chat-compose" id="chatForm" data-chat-key="${esc(key)}"><label for="chatInput">Pesan</label><textarea id="chatInput" name="message" rows="2" maxlength="1000" placeholder="Halo, aku ingin tanya tentang outfit ini…" aria-describedby="chatMessageHint chatMessageError"></textarea><div class="chat-compose-meta"><span id="chatMessageHint">Enter untuk kirim, Shift+Enter untuk baris baru.</span><span id="chatMessageCount">0/1.000</span></div><p class="field-error" id="chatMessageError" role="alert"></p><button class="btn" type="submit">Kirim pesan ${icon('send')}</button></form></section></div></div>`;
  }
  return { page };
}
