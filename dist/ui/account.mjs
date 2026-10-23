const REGISTRY_KEY = 'reoutfit.demo.accounts.v1';
const SESSION_KEY = 'reoutfit.demo.account.session.v1';
const PRESETS = Object.freeze([
  { id: 'renter-demo', name: 'Penyewa Demo', role: 'renter' },
  { id: 'renter-demo-2', name: 'Penyewa Demo 2', role: 'renter' },
  { id: 'owner-lemari-nara', name: 'Lemari Nara', role: 'owner' },
  { id: 'owner-atelier-luna', name: 'Atelier Luna', role: 'owner' },
  { id: 'owner-lemari-kamu', name: 'Lemari Kamu', role: 'owner' }
]);
const VERIFICATIONS = ['unverified', 'pending', 'verified', 'rejected'];
const STATUS_LABELS = {
  unverified: 'Belum diverifikasi · simulasi',
  pending: 'Menunggu hasil · simulasi',
  verified: 'Terverifikasi · simulasi',
  rejected: 'Ditolak · simulasi'
};
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const roleLabel = role => role === 'owner' ? 'Pemilik outfit' : 'Penyewa';
const normalizeRole = role => role === 'merchant' ? 'owner' : role;
const emptyRegistry = () => Object.fromEntries(PRESETS.map(preset => [preset.id, {
  registered: false, verification: 'unverified'
}]));

// Only preset identifiers and simulation metadata are persisted. No identity
// documents, contact details, credentials, or user-supplied names are collected.
export function createAccountFlow({ toast = () => {}, onChange = () => {} } = {}) {
  let registry = emptyRegistry();
  let currentId = null;
  let intent = null;
  let modal = null;
  let active = false;
  let view = '';
  let returnFocus = null;
  let storageWarningShown = false;

  function readRegistry() {
    try {
      const saved = JSON.parse(globalThis.localStorage.getItem(REGISTRY_KEY) || 'null');
      const next = emptyRegistry();
      for (const preset of PRESETS) {
        const account = saved?.accounts?.[preset.id];
        if (!account || typeof account !== 'object') continue;
        next[preset.id] = {
          registered: account.registered === true,
          verification: VERIFICATIONS.includes(account.verification) ? account.verification : 'unverified'
        };
      }
      registry = next;
    } catch {
      // Storage can be unavailable; this instance still works within the tab.
    }
    return registry;
  }

  function storageWarning() {
    if (storageWarningShown) return;
    storageWarningShown = true;
    toast('Penyimpanan browser tidak tersedia. Akun demo berlaku selama halaman ini terbuka.');
  }

  function saveAccount(id, changes) {
    readRegistry();
    registry[id] = { ...registry[id], ...changes };
    try {
      globalThis.localStorage.setItem(REGISTRY_KEY, JSON.stringify({ version: 1, accounts: registry }));
    } catch {
      storageWarning();
    }
  }

  function user() {
    const preset = PRESETS.find(account => account.id === currentId);
    return preset ? Object.freeze({ ...preset, verification: registry[currentId].verification }) : null;
  }

  function notifyChange() {
    onChange(user());
  }

  function setCurrent(id) {
    currentId = id;
    try {
      if (id) globalThis.sessionStorage.setItem(SESSION_KEY, id);
      else globalThis.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      storageWarning();
    }
    notifyChange();
  }

  readRegistry();
  try {
    const savedId = globalThis.sessionStorage.getItem(SESSION_KEY);
    if (PRESETS.some(account => account.id === savedId)) currentId = savedId;
  } catch {
    // A tab can run the demonstration without persistent storage.
  }

  function cancelIntent() {
    const cancelled = intent;
    intent = null;
    cancelled?.resolve(false);
  }

  function releaseModal() {
    if (!active) return;
    active = false;
    view = '';
    modal.removeEventListener('cancel', onCancel);
    modal.removeEventListener('close', onClosed);
    modal.classList.remove('account-dialog');
    modal.removeAttribute('aria-labelledby');
    modal.removeAttribute('aria-describedby');
  }

  function closeModal() {
    if (!active) return;
    const focusTarget = returnFocus;
    returnFocus = null;
    releaseModal();
    modal.close();
    queueMicrotask(() => {
      if (!modal.open && focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
    });
  }

  function dismiss() {
    cancelIntent();
    closeModal();
  }

  function onCancel(event) {
    event.preventDefault();
    dismiss();
  }

  function onClosed() {
    cancelIntent();
    releaseModal();
    returnFocus = null;
  }

  function allowed(action = intent) {
    const account = user();
    return Boolean(account && (!action?.role || account.role === action.role)
      && (!action?.verified || account.verification === 'verified'));
  }

  function complete() {
    if (intent && !allowed()) {
      continueIntent();
      return;
    }
    const completed = intent;
    intent = null;
    closeModal();
    if (!completed) return;
    try {
      completed.callback?.(user());
      completed.resolve(true);
    } catch (error) {
      completed.reject(error);
    }
  }

  function render(title, description, content, nextView) {
    modal = document.querySelector('#modal');
    if (!modal) {
      cancelIntent();
      toast('Dialog akun belum tersedia. Muat ulang halaman lalu coba lagi.');
      return;
    }
    if (!active) {
      returnFocus = document.activeElement;
      active = true;
      modal.addEventListener('cancel', onCancel);
      modal.addEventListener('close', onClosed);
    }
    view = nextView;
    modal.classList.add('account-dialog');
    modal.setAttribute('aria-labelledby', 'accountDialogTitle');
    modal.setAttribute('aria-describedby', 'accountDialogDescription');
    modal.innerHTML = `<div class="dialog-head"><h2 id="accountDialogTitle" tabindex="-1">${escapeHTML(title)}</h2><button class="icon-btn" type="button" data-account-close aria-label="Tutup dialog akun"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div><p id="accountDialogDescription">${escapeHTML(description)}</p>${content}`;
    modal.querySelector('[data-account-close]').onclick = dismiss;
    if (!modal.open) modal.showModal();
    modal.querySelector('#accountDialogTitle').focus({ preventScroll: true });
  }

  function button(selector, handler) {
    const target = modal?.querySelector(selector);
    if (target) target.onclick = handler;
  }

  function statusMarkup(account) {
    return `<span class="badge account-status" data-account-status="${account.verification}">${STATUS_LABELS[account.verification]}</span>`;
  }

  function renderAuth(mode = 'login', preferredRole = intent?.role || user()?.role || 'renter') {
    const register = mode === 'register';
    const requiredRole = intent?.role;
    const selectedRole = requiredRole || preferredRole;
    const roles = requiredRole ? [requiredRole] : ['renter', 'owner'];
    const account = user();
    const switching = account && requiredRole && account.role !== requiredRole;
    render(register ? 'Daftar akun demo' : switching ? 'Ganti akun demo' : 'Masuk akun demo',
      'Ini akun demo lokal untuk mencoba Reoutfit. Gunakan alias bawaan, tanpa email atau kata sandi.',
      `${switching ? `<p class="account-note">Anda sedang memakai ${escapeHTML(account.name)} (${roleLabel(account.role).toLowerCase()}). Aksi ini memerlukan akun ${roleLabel(requiredRole).toLowerCase()}.</p>` : ''}
      <div class="account-auth-tabs" aria-label="Pilihan akun demo"><button class="btn ${register ? 'secondary' : ''}" type="button" data-account-mode="login" aria-pressed="${!register}">Masuk</button><button class="btn ${register ? '' : 'secondary'}" type="button" data-account-mode="register" aria-pressed="${register}">Daftar</button></div>
      <form id="accountForm" class="account-form" novalidate>
        <label for="accountRole">Peran demo<select id="accountRole" name="role">${roles.map(role => `<option value="${role}" ${role === selectedRole ? 'selected' : ''}>${roleLabel(role)}</option>`).join('')}</select></label>
        <label for="accountAlias">Alias demo<select id="accountAlias" name="alias" aria-describedby="accountAliasHint accountAliasError" required></select></label>
        <p class="hint" id="accountAliasHint">${register ? 'Aktifkan salah satu alias contoh pada perangkat ini.' : 'Semua alias adalah akun contoh yang dapat dicoba.'}</p>
        <p class="field-error" id="accountAliasError" role="alert"></p>
        <div class="account-actions"><button class="btn full" type="submit">${register ? 'Buat akun demo' : 'Masuk dengan alias ini'}</button><button class="btn ghost full" type="button" data-account-cancel>Batal</button></div>
      </form><p class="hint account-storage-note">Sesi masuk berlaku untuk tab ini. Status simulasi alias tersimpan di browser ini.</p>`, 'auth');
    if (!active) return;
    const form = modal.querySelector('#accountForm');
    const roleField = form.querySelector('#accountRole');
    const aliasField = form.querySelector('#accountAlias');
    const error = form.querySelector('#accountAliasError');
    const submit = form.querySelector('[type="submit"]');
    const fillAliases = () => {
      const aliases = PRESETS.filter(preset => preset.role === roleField.value);
      aliasField.innerHTML = aliases.map(preset => `<option value="${preset.id}" ${register && registry[preset.id].registered ? 'disabled' : ''}>${escapeHTML(preset.name)}${register && registry[preset.id].registered ? ' · sudah aktif' : ''}</option>`).join('');
      const first = aliases.find(preset => !register || !registry[preset.id].registered);
      aliasField.value = first?.id || '';
      submit.disabled = !first;
      error.textContent = first ? '' : 'Semua alias peran ini sudah aktif. Pilih Masuk untuk memakainya.';
      aliasField.removeAttribute('aria-invalid');
    };
    fillAliases();
    roleField.onchange = fillAliases;
    modal.querySelectorAll('[data-account-mode]').forEach(tab => {
      tab.onclick = () => renderAuth(tab.dataset.accountMode, roleField.value);
    });
    button('[data-account-cancel]', dismiss);
    let submitted = false;
    form.onsubmit = event => {
      event.preventDefault();
      if (submitted || !form.isConnected) return;
      readRegistry();
      const selected = PRESETS.find(preset => preset.id === aliasField.value && preset.role === roleField.value);
      if (!selected || (requiredRole && selected.role !== requiredRole) || (register && registry[selected.id].registered)) {
        error.textContent = selected && registry[selected.id].registered ? 'Alias ini sudah aktif. Pilih alias lain atau masuk.' : 'Pilih alias demo sesuai peran.';
        aliasField.setAttribute('aria-invalid', 'true');
        aliasField.focus();
        return;
      }
      submitted = true;
      submit.disabled = true;
      form.setAttribute('aria-busy', 'true');
      saveAccount(selected.id, { registered: true });
      setCurrent(selected.id);
      toast(`${register ? 'Akun demo dibuat' : 'Masuk sebagai'} ${selected.name}.`);
      if (register) renderOffer();
      else if (intent) continueIntent();
      else renderProfile();
    };
  }

  function renderOffer() {
    const account = user();
    if (!account) return renderAuth('register');
    render('Akun demo siap', 'Anda bisa memverifikasi alias sekarang atau melanjutkan menjelajah.',
      `<div class="panel account-summary"><strong>${escapeHTML(account.name)}</strong><p class="small muted">${roleLabel(account.role)}</p>${statusMarkup(account)}</div><p class="small">Verifikasi juga simulasi dan memakai kartu contoh bawaan. Pilihan “Nanti saja” membatalkan aksi yang sedang menunggu verifikasi.</p><div class="account-actions"><button class="btn full" type="button" data-account-verify>Verifikasi sekarang</button><button class="btn secondary full" type="button" data-account-later>Nanti saja</button></div>`, 'offer');
    button('[data-account-verify]', renderVerification);
    button('[data-account-later]', () => {
      dismiss();
      toast('Akun demo siap. Verifikasi dapat dilakukan lewat menu Akun.');
    });
  }

  function dummyCard(account) {
    return `<div class="account-dummy-card" aria-label="Kartu simulasi bawaan, contoh tidak berlaku"><div class="account-dummy-top"><span class="eyebrow">Contoh KTP dummy</span><span class="badge account-status">SIMULASI</span></div><div class="account-dummy-body"><span class="account-dummy-avatar" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg></span><div><strong>${escapeHTML(account.name)}</strong><p class="small muted">Alias bawaan · ${roleLabel(account.role)}</p><span class="small">Bukan dokumen identitas</span></div></div><strong class="account-dummy-watermark">CONTOH / TIDAK BERLAKU</strong></div>`;
  }

  function setVerification(verification) {
    if (!currentId) return;
    saveAccount(currentId, { verification });
    notifyChange();
  }

  function renderVerification() {
    const account = user();
    if (!account) return renderAuth();
    const { verification } = account;
    const pending = verification === 'pending';
    const verified = verification === 'verified';
    const rejected = verification === 'rejected';
    const explanation = verified
      ? 'Alias ini sudah terverifikasi dalam simulasi lokal. Tidak ada pemeriksaan identitas nyata.'
      : pending ? 'Pengajuan contoh sedang menunggu hasil simulasi. Pilih hasil di bawah untuk mencoba alurnya.'
        : rejected ? 'Pengajuan contoh ditolak dalam simulasi. Anda dapat mencoba lagi dengan kartu bawaan yang sama.'
          : 'Gunakan kartu contoh bawaan untuk mencoba verifikasi. Jangan gunakan KTP asli. Tidak ada dokumen pribadi yang diperlukan.';
    render('Verifikasi akun demo', explanation,
      `<div class="account-verification-status" role="status" aria-live="polite">${statusMarkup(account)}</div>${dummyCard(account)}<p class="hint account-card-note">Kartu fiktif ini dibuat oleh aplikasi dan tidak berlaku sebagai identitas.</p><div class="account-actions">
      ${verified ? `<button class="btn full" type="button" data-account-continue>${intent ? 'Lanjutkan aksi' : 'Selesai'}</button>`
        : pending ? '<button class="btn full" type="button" data-account-approve>Simulasikan disetujui</button><button class="btn secondary full" type="button" data-account-reject>Simulasikan ditolak</button>'
          : `<button class="btn full" type="button" data-account-submit>${rejected ? 'Coba verifikasi lagi' : 'Ajukan verifikasi simulasi'}</button>`}
      <button class="btn ghost full" type="button" data-account-cancel>${verified ? 'Tutup' : 'Batal'}</button></div>`, 'verification');
    button('[data-account-submit]', event => {
      event.currentTarget.disabled = true;
      setVerification('pending');
      renderVerification();
    });
    button('[data-account-approve]', event => {
      event.currentTarget.disabled = true;
      setVerification('verified');
      toast('Verifikasi simulasi disetujui.');
      if (intent) complete();
      else renderVerification();
    });
    button('[data-account-reject]', event => {
      event.currentTarget.disabled = true;
      setVerification('rejected');
      toast('Verifikasi simulasi ditolak. Anda bisa mencoba lagi.');
      renderVerification();
    });
    button('[data-account-continue]', complete);
    button('[data-account-cancel]', dismiss);
  }

  function renderProfile() {
    const account = user();
    if (!account) return renderAuth();
    render('Akun demo Anda', 'Akun ini hanya simulasi lokal. Sesi masuk berlaku untuk tab ini.',
      `<div class="panel account-summary"><strong>${escapeHTML(account.name)}</strong><p class="small muted">${roleLabel(account.role)}</p>${statusMarkup(account)}</div><div class="account-actions">${account.verification !== 'verified' ? `<button class="btn full" type="button" data-account-verify>${account.verification === 'pending' ? 'Lihat pengajuan simulasi' : account.verification === 'rejected' ? 'Coba verifikasi lagi' : 'Verifikasi sekarang'}</button>` : ''}<button class="btn secondary full" type="button" data-account-switch>Ganti akun demo</button><button class="btn ghost full" type="button" data-account-logout>Keluar dari tab ini</button></div><p class="hint account-storage-note">Status simulasi tersimpan untuk alias ini di browser yang sama. Keluar tidak menghapus data demo.</p>`, 'profile');
    button('[data-account-verify]', renderVerification);
    button('[data-account-switch]', () => renderAuth());
    button('[data-account-logout]', logout);
  }

  function continueIntent() {
    const account = user();
    if (!account || (intent?.role && account.role !== intent.role)) return renderAuth();
    if (intent?.verified && account.verification !== 'verified') return renderVerification();
    complete();
  }

  function ensure(callback, options, verified) {
    cancelIntent();
    readRegistry();
    const role = normalizeRole(options?.role);
    if (role && !['renter', 'owner'].includes(role)) return Promise.resolve(false);
    return new Promise((resolve, reject) => {
      intent = { callback, role, verified, resolve, reject };
      continueIntent();
    });
  }

  function openAccount() {
    cancelIntent();
    readRegistry();
    if (user()) renderProfile();
    else renderAuth();
  }

  function logout() {
    dismiss();
    setCurrent(null);
    toast('Keluar dari akun demo di tab ini.');
  }

  globalThis.addEventListener('storage', event => {
    if (event.key !== REGISTRY_KEY && event.key !== null) return;
    readRegistry();
    notifyChange();
    // Cross-tab changes never approve an action on the user's behalf.
    if (active && view === 'verification') renderVerification();
    else if (active && view === 'profile') renderProfile();
  });
  globalThis.addEventListener('hashchange', () => {
    if (active) dismiss();
  });

  return Object.freeze({
    get user() { return user(); },
    get isVerified() { return user()?.verification === 'verified'; },
    ensureAccount: (callback, options = {}) => ensure(callback, options, false),
    ensureVerified: (callback, options = {}) => ensure(callback, options, true),
    openAccount,
    logout
  });
}
