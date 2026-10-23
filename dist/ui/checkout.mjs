import { calculateCosts, rentalPeriodIssue, validateCheckout } from '../core/rules.mjs';

const CONFIRM_LOCK = 'reoutfit.demo.confirm-order.v1';
const PAYMENTS = ['qris', 'va', 'cod'];

export function createCheckoutFlow({ state, current, account, esc, money, formatDate, endDate, costRows, ownerId, stableId, refreshSharedDemo, persistSharedDemo, toast, go }) {
  let activeForm = null;
  let inFlight = false;
  const completed = new Set();

  function captureDraft() {
    const form = document.querySelector('#checkoutForm');
    if (form) {
      state.checkoutDraft = {
        receiver: form.elements.receiver.value,
        phone: form.elements.phone.value,
        address: form.elements.address.value,
        agree: form.elements.agree.checked
      };
    }
    return state.checkoutDraft || { receiver: '', phone: '', address: '', agree: false };
  }

  function accountStatusText() {
    return account.user?.role === 'renter' && account.user.verification === 'verified'
      ? 'Akun penyewa sudah terverifikasi. Pesanan siap dikonfirmasi setelah data dan syarat lengkap.'
      : 'Konfirmasi memerlukan akun penyewa terverifikasi. Masuk atau buat akun dan selesaikan verifikasi tanpa meninggalkan ringkasan ini.';
  }

  function refreshAccountStatus() {
    const status = document.querySelector('#checkout-account-note');
    if (status) status.textContent = accountStatusText();
  }

  function choices() {
    if (!['pickup', 'courier'].includes(state.delivery)) state.delivery = 'pickup';
    if (!PAYMENTS.includes(state.payment) || (state.delivery === 'courier' && state.payment === 'cod')) state.payment = 'qris';
  }

  function scheduleText(product) {
    const issue = rentalPeriodIssue(product.id, state.start, state.days, []);
    if (issue && (!/^\d{4}-\d{2}-\d{2}$/.test(state.start) || !Number.isInteger(state.days) || state.days < 1 || state.days > 7)) return 'Pilih tanggal dan durasi sewa pada detail outfit.';
    try {
      return `Mulai ${formatDate(state.start)} · kembali ${endDate(state.start, state.days)} (hari terakhir pemakaian) · ${state.days} hari`;
    } catch (_) {
      return 'Pilih tanggal dan durasi sewa pada detail outfit.';
    }
  }

  function costsMarkup(product) {
    try {
      calculateCosts(product, state.days, state.delivery);
      return costRows(product, state.days, state.delivery);
    } catch (_) {
      return '<p class="field-error">Biaya belum dapat dihitung. Periksa jadwal dan harga outfit.</p>';
    }
  }

  function fieldError(name) {
    return `<span id="checkout-${name}-error" class="field-error" aria-live="polite" hidden></span>`;
  }

  function page() {
    choices();
    const product = current();
    if (!product) return '<div class="container checkout-flow"><div class="page-top"><h1>Ringkasan sewa</h1></div><section class="panel"><h2>Outfit belum dipilih</h2><a class="btn" href="#/jelajah">Jelajah outfit</a></section></div>';
    const draft = state.checkoutDraft || {};
    const detailHref = `#/outfit/${encodeURIComponent(product.id)}`;
    return `<div class="container checkout-flow">
      <div class="page-top"><nav class="crumb" aria-label="Breadcrumb"><a href="${detailHref}">Detail outfit</a><span aria-hidden="true">/</span><span aria-current="page">Ringkasan sewa</span></nav><h1>Ringkasan sewa</h1><p class="muted">Periksa jadwal, biaya, dan syarat sebelum mengonfirmasi pesanan.</p></div>
      <ol class="progress-steps checkout-progress" aria-label="Tahap pemesanan"><li><span><b aria-hidden="true">1</b> Pilih outfit & tanggal</span></li><li class="current" data-checkout-stage="2" aria-current="step"><span><b aria-hidden="true">2</b> Periksa ringkasan</span></li><li data-checkout-stage="3"><span><b aria-hidden="true">3</b> Konfirmasi pesanan</span></li></ol>
      <form id="checkoutForm" class="checkout-grid" novalidate>
        <div>
          <section class="panel" aria-labelledby="checkout-outfit-heading"><h2 id="checkout-outfit-heading">Outfit & jadwal</h2><div class="order-mini"><img src="${esc(product.img)}" alt="${esc(product.name)}"><div><h3>${esc(product.name)}</h3><p class="small muted">Ukuran ${esc(product.size)} · ${esc(product.owner)}</p><p class="small">${esc(scheduleText(product))}</p></div></div><p class="small checkout-condition"><strong>Kondisi outfit:</strong> ${esc(product.condition || 'Belum dijelaskan oleh pemilik.')}</p><p id="checkout-schedule-error" class="field-error" aria-live="polite" hidden></p><a id="checkout-edit-schedule" class="help-link" href="${detailHref}" aria-describedby="checkout-schedule-error">Ubah outfit atau jadwal</a></section>
          <section class="panel" aria-labelledby="checkout-delivery-heading"><h2 id="checkout-delivery-heading">Cara menerima outfit</h2><fieldset class="checkout-choice-group" aria-labelledby="checkout-delivery-heading" aria-describedby="checkout-delivery-error"><legend class="checkout-sr-only">Cara menerima outfit</legend><label class="option"><input type="radio" name="delivery" value="pickup" ${state.delivery === 'pickup' ? 'checked' : ''}><span><strong>Ambil langsung</strong><small>Serah terima di ${esc(product.location)}. Lokasi tepat disepakati dengan pemilik.</small></span></label><label class="option"><input type="radio" name="delivery" value="courier" ${state.delivery === 'courier' ? 'checked' : ''}><span><strong>Kurir reguler</strong><small>Ongkir pulang-pergi contoh tercantum di ringkasan. Atur pengiriman agar tiba sebelum tanggal mulai.</small></span></label>${fieldError('delivery')}</fieldset>
          <div class="checkout-data-heading"><h3>Data penerima</h3><button class="btn secondary" type="button" id="checkout-fill-demo">Isi data contoh</button></div><p id="checkout-data-note" class="hint checkout-data-note">Gunakan data contoh. Nama, telepon, dan alamat hanya disimpan sementara di halaman ini selama tab terbuka.</p>
          <div class="form-grid"><label for="checkout-receiver">Nama penerima <input id="checkout-receiver" name="receiver" value="${esc(draft.receiver || '')}" placeholder="Contoh: Nara Demo" required autocomplete="off" aria-describedby="checkout-data-note checkout-receiver-error">${fieldError('receiver')}</label><label for="checkout-phone">Nomor telepon <input id="checkout-phone" name="phone" type="tel" value="${esc(draft.phone || '')}" placeholder="Contoh: 080000000000" required autocomplete="off" aria-describedby="checkout-data-note checkout-phone-error">${fieldError('phone')}</label><label class="span2" id="addressField" for="address" ${state.delivery === 'pickup' ? 'hidden' : ''}>Alamat pengiriman <textarea name="address" id="address" ${state.delivery === 'courier' ? 'required' : ''} placeholder="Contoh: Jalan Contoh No. 10, Kota Demo" autocomplete="off" aria-describedby="checkout-data-note checkout-address-error">${esc(draft.address || '')}</textarea>${fieldError('address')}</label></div></section>
          <section class="panel" aria-labelledby="checkout-payment-heading"><h2 id="checkout-payment-heading">Metode pembayaran</h2><p class="note neutral">Pembayaran masih simulasi. Tidak ada uang yang ditagih atau dipindahkan.</p><fieldset class="checkout-choice-group" aria-labelledby="checkout-payment-heading" aria-describedby="checkout-payment-error"><legend class="checkout-sr-only">Metode pembayaran</legend><label class="option"><input type="radio" name="payment" value="qris" ${state.payment === 'qris' ? 'checked' : ''}><span><strong>QRIS</strong><small>Simulasi pembayaran digital.</small></span></label><label class="option"><input type="radio" name="payment" value="va" ${state.payment === 'va' ? 'checked' : ''}><span><strong>Virtual account</strong><small>Simulasi transfer bank.</small></span></label><label class="option" id="codOption"><input type="radio" name="payment" value="cod" ${state.payment === 'cod' ? 'checked' : ''} ${state.delivery === 'courier' ? 'disabled' : ''}><span><strong>COD · bayar saat serah terima</strong><small>Hanya untuk ambil langsung. Sewa dibayar saat bertemu; deposit dan biaya platform dibayar di awal.</small></span></label>${fieldError('payment')}</fieldset><p id="checkout-payment-notice" class="hint" aria-live="polite"></p></section>
          <section class="panel" aria-labelledby="checkout-terms-heading"><h2 id="checkout-terms-heading">Syarat pemilik & deposit</h2><p>${esc(product.terms || 'Syarat tambahan belum dijelaskan oleh pemilik.')}</p><div class="note neutral">Nilai penggantian maksimum yang diajukan: <strong>${money(product.replacement)}</strong>. Klaim harus didukung bukti dan ditinjau; bukan biaya otomatis. Deposit tidak otomatis hangus.</div><a class="help-link" href="#/syarat" target="_blank" rel="noopener">Baca ketentuan lengkap (tab baru)</a></section>
        </div>
        <aside class="sticky"><section class="panel" aria-labelledby="checkout-cost-heading"><h2 id="checkout-cost-heading">Ringkasan biaya</h2><div id="checkout-costs" aria-live="polite">${costsMarkup(product)}</div><div id="payment-split"></div><p class="note">Biaya platform untuk reoutfit. Deposit dikembalikan setelah pemeriksaan kondisi dan penyelesaian klaim, jika ada.</p><label class="checkline" for="checkout-agree"><input id="checkout-agree" name="agree" type="checkbox" ${draft.agree ? 'checked' : ''} required aria-describedby="checkout-agree-error"><span>Saya sudah membaca dan menyetujui syarat pemilik, nilai penggantian, serta aturan deposit dan penanganan klaim.</span></label>${fieldError('agree')}<p class="hint checkout-account-note" id="checkout-account-note">${accountStatusText()}</p><p id="checkout-submit-error" class="field-error" role="alert" hidden></p><button class="btn full" id="checkout-confirm" type="submit">Konfirmasi pesanan</button><p class="hint checkout-submit-note">Pesanan demo dibuat setelah konfirmasi. Pembayaran belum dilakukan.</p></section></aside>
      </form>
    </div>`;
  }

  function setError(form, name, message = '') {
    const node = form.querySelector(`#checkout-${name}-error`);
    if (node) {
      node.textContent = message;
      node.hidden = !message;
    }
    const controls = form.querySelectorAll(`[name="${name}"]`);
    controls.forEach(control => {
      if (message) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
    });
  }

  function showErrors(form, errors, focus = false) {
    ['receiver', 'phone', 'address', 'agree', 'delivery', 'payment', 'schedule', 'submit'].forEach(name => setError(form, name, errors[name] || ''));
    if (focus && Object.keys(errors).length) {
      const first = ['schedule', 'receiver', 'phone', 'address', 'delivery', 'payment', 'agree', 'submit'].find(name => errors[name]);
      const target = first === 'schedule' ? form.querySelector('#checkout-edit-schedule') : first === 'submit' ? form.querySelector('#checkout-confirm') : form.querySelector(`[name="${first}"]`);
      target?.focus();
    }
  }

  function readIntent(form) {
    const draft = captureDraft();
    return {
      productId: current()?.id,
      start: state.start,
      days: state.days,
      delivery: form.elements.delivery.value,
      payment: form.elements.payment.value,
      receiver: String(draft.receiver || '').trim(),
      phone: String(draft.phone || '').trim(),
      address: String(draft.address || '').trim(),
      agree: draft.agree === true
    };
  }

  function intentKey(intent) {
    // This key never includes delivery contact data and remains in memory only.
    return JSON.stringify([intent.productId, intent.start, intent.days, intent.delivery, intent.payment]);
  }

  function validateIntent(intent, product) {
    const errors = validateCheckout(intent);
    if (!PAYMENTS.includes(intent.payment) || (intent.delivery === 'courier' && intent.payment === 'cod')) errors.payment = 'Pilih QRIS atau virtual account untuk pengiriman kurir.';
    const issue = rentalPeriodIssue(intent.productId, intent.start, intent.days, state.orders);
    if (issue) errors.schedule = issue.reason;
    if (!product || product.id !== intent.productId) errors.schedule = 'Outfit berubah. Periksa pilihan outfit dan jadwal kembali.';
    try { calculateCosts(product, intent.days, intent.delivery); }
    catch (error) { errors.submit = error.message; }
    return errors;
  }

  function setSaving(form, saving) {
    const button = form.querySelector('#checkout-confirm');
    button.disabled = saving;
    button.textContent = saving ? 'Menyimpan pesanan…' : 'Konfirmasi pesanan';
    if (saving) form.setAttribute('aria-busy', 'true');
    else form.removeAttribute('aria-busy');
    const progress = form.parentElement?.querySelector('.checkout-progress');
    progress?.querySelectorAll('[data-checkout-stage]').forEach(stage => {
      const active = stage.dataset.checkoutStage === (saving ? '3' : '2');
      stage.classList.toggle('current', active);
      if (active) stage.setAttribute('aria-current', 'step');
      else stage.removeAttribute('aria-current');
    });
  }

  function update(form, announce = false) {
    state.delivery = form.elements.delivery.value;
    const switched = state.delivery === 'courier' && form.elements.payment.value === 'cod';
    if (switched) form.querySelector('[name="payment"][value="qris"]').checked = true;
    state.payment = form.elements.payment.value;
    form.querySelector('[name="payment"][value="cod"]').disabled = state.delivery === 'courier';
    form.querySelector('#addressField').hidden = state.delivery !== 'courier';
    form.elements.address.required = state.delivery === 'courier';
    form.querySelector('#checkout-costs').innerHTML = costsMarkup(current());
    const split = form.querySelector('#payment-split');
    split.innerHTML = '';
    if (state.payment === 'cod') {
      try {
        const costs = calculateCosts(current(), state.days, state.delivery);
        split.innerHTML = `<div class="note neutral"><strong>Dibayar di awal: ${money(costs.deposit + costs.fee)}</strong><br>Sewa saat serah terima: ${money(costs.rent)}</div>`;
      } catch (_) { /* The cost summary already explains invalid input. */ }
    }
    if (announce) form.querySelector('#checkout-payment-notice').textContent = switched ? 'Pembayaran berubah ke QRIS karena COD hanya tersedia untuk ambil langsung.' : '';
    if (state.delivery === 'pickup') setError(form, 'address');
    captureDraft();
  }

  async function submit(form) {
    if (inFlight || activeForm !== form || !form.isConnected) return;
    const intent = readIntent(form);
    const errors = validateIntent(intent, current());
    showErrors(form, errors, true);
    if (Object.keys(errors).length) return;
    inFlight = true;
    const button = form.querySelector('#checkout-confirm');
    button.disabled = true;
    try {
      let authorized = false;
      const allowed = await account.ensureVerified(() => { authorized = true; }, { role: 'renter' });
      if (!allowed || !authorized || activeForm !== form || !form.isConnected) return;
      const latestIntent = readIntent(form);
      if (intentKey(latestIntent) !== intentKey(intent) || ['receiver', 'phone', 'address', 'agree'].some(key => latestIntent[key] !== intent[key])) {
        showErrors(form, { submit: 'Pilihan atau data berubah. Periksa ringkasan lalu konfirmasi kembali.' }, true);
        return;
      }
      setSaving(form, true);
      const commitOrder = async () => {
        if (activeForm !== form || !form.isConnected) return;
        await refreshSharedDemo();
        const user = account.user;
        if (!user?.id || user.role !== 'renter' || user.verification !== 'verified') {
          showErrors(form, { submit: 'Gunakan akun penyewa yang sudah terverifikasi untuk mengonfirmasi pesanan.' }, true);
          return;
        }
        const product = current();
        const freshErrors = validateIntent(intent, product);
        if (intentKey(readIntent(form)) !== intentKey(intent)) freshErrors.submit = 'Pilihan sewa berubah. Periksa ringkasan lalu konfirmasi kembali.';
        if (Object.keys(freshErrors).length) {
          showErrors(form, freshErrors, true);
          return;
        }
        const key = `${user.id}:${intentKey(intent)}`;
        if (completed.has(key)) return;
        const costs = calculateCosts(product, intent.days, intent.delivery);
        const now = new Date().toISOString();
        const order = {
          id: stableId('RO-DEMO'),
          product: { ...product, ...(Array.isArray(product.photos) ? { photos: product.photos.slice() } : {}) },
          ownerId: ownerId(product), renterId: user.id,
          start: intent.start, days: intent.days, delivery: intent.delivery, payment: intent.payment,
          total: costs.total, step: 0, paymentStatus: 'unpaid-demo', renterVerification: 'verified',
          createdAt: now, updatedAt: now, initialConditionPhotos: [], finalConditionPhotos: []
        };
        state.orders.unshift(order);
        let saved = false;
        try { saved = await persistSharedDemo(); }
        catch (_) { saved = false; }
        if (!saved) {
          state.orders = state.orders.filter(item => item.id !== order.id);
          showErrors(form, { submit: 'Pesanan belum tersimpan. Data isian tetap ada; coba konfirmasi lagi setelah penyimpanan browser tersedia.' }, true);
          return;
        }
        completed.add(key);
        state.checkoutDraft = { receiver: '', phone: '', address: '', agree: false };
        // Clear the connected fields too, so a route-change capture cannot restore them.
        form.elements.receiver.value = '';
        form.elements.phone.value = '';
        form.elements.address.value = '';
        form.elements.agree.checked = false;
        toast('Pesanan demo dibuat. Pembayaran belum dilakukan.');
        go('/pesanan');
      };
      if (globalThis.navigator?.locks?.request) {
        await navigator.locks.request(CONFIRM_LOCK, { mode: 'exclusive' }, commitOrder);
      } else {
        // The in-memory guard serializes this page only. Browsers without Web Locks
        // cannot guarantee atomic confirmation across separate tabs in this demo.
        await commitOrder();
      }
    } catch (_) {
      if (activeForm === form && form.isConnected) showErrors(form, { submit: 'Pesanan belum dapat dibuat. Periksa ringkasan lalu coba lagi.' }, true);
    } finally {
      inFlight = false;
      if (activeForm === form && form.isConnected) setSaving(form, false);
    }
  }

  function bind() {
    const form = document.querySelector('#checkoutForm');
    activeForm = form;
    if (!form) return;
    update(form);
    form.addEventListener('input', event => {
      captureDraft();
      if (['receiver', 'phone', 'address', 'agree'].includes(event.target.name)) setError(form, event.target.name);
    });
    form.addEventListener('change', event => {
      if (event.target.name === 'delivery' || event.target.name === 'payment') {
        update(form, true);
        setError(form, event.target.name);
      }
      captureDraft();
    });
    form.querySelector('#checkout-fill-demo').addEventListener('click', () => {
      form.elements.receiver.value = 'Nara Demo';
      form.elements.phone.value = '080000000000';
      form.elements.address.value = 'Jalan Contoh No. 10, Kota Demo';
      ['receiver', 'phone', 'address'].forEach(name => setError(form, name));
      captureDraft();
      form.elements.receiver.focus();
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      void submit(form);
    });
    form.querySelector('#checkout-edit-schedule').addEventListener('click', captureDraft);
    const issue = rentalPeriodIssue(current()?.id, state.start, state.days, state.orders);
    if (issue) setError(form, 'schedule', issue.reason);
  }

  return { page, bind, captureDraft, refreshAccountStatus };
}
