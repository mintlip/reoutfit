import { parseRupiahInput, parseValidRentalPrice, rentalPriceError, formatRupiahInput, calculateCosts, validatePhotos } from '../core/rules.mjs';

const TEXT_FIELDS = ['name', 'category', 'brand', 'material', 'location', 'description', 'condition', 'size', 'terms'];
const NUMBER_FIELDS = ['chest', 'waist', 'length'];
const MONEY_FIELDS = ['original', 'price', 'deposit', 'replacement'];
const FIELD_LABELS = { name: 'Nama outfit', category: 'Kategori', brand: 'Brand', material: 'Bahan', location: 'Lokasi', description: 'Deskripsi & kelengkapan', condition: 'Kondisi saat ini', size: 'Label ukuran', chest: 'Lingkar dada', waist: 'Lingkar pinggang', length: 'Panjang baju', original: 'Harga beli asli', price: 'Harga sewa', deposit: 'Deposit jaminan', replacement: 'Nilai penggantian', terms: 'Syarat khusus pemilik' };
const OPTIONS = { category: ['Korean style', 'Cosplay', 'Dress', 'Vest & formal'], location: ['Bekasi', 'Jakarta Selatan'], size: ['S', 'S–M', 'M', 'L', 'XL'] };
const DIMENSIONS = { chest: [40, 200], waist: [40, 200], length: [10, 220] };

export function createListingFlow({ state, products, account, esc, money, stableId, refreshSharedDemo, persistSharedDemo, imageFileToSharedDataUrl, toast, go }) {
  let publishing = false;
  let gatePending = false;
  let photoSequence = 0;
  let photoPending = false;
  const activeForm = () => document.getElementById('uploadForm');
  const draft = () => state.listingDraft ||= { id: stableId('outfit'), values: {}, files: [], photos: [], photoError: '' };
  const fieldId = name => name === 'price' ? 'merchantPrice' : name === 'photos' ? 'outfitPhotos' : `listing-${name}`;
  const errorId = name => name === 'price' ? 'merchantPriceError' : `${fieldId(name)}Error`;
  const errorMarkup = name => `<span class="field-error" id="${errorId(name)}" aria-live="polite"></span>`;
  const fieldAttrs = name => `id="${fieldId(name)}" name="${name}" required aria-describedby="${errorId(name)}"`;
  const inputField = (name, attrs = '', label = FIELD_LABELS[name], extraClass = '') => `<label class="${extraClass}">${label}<input ${fieldAttrs(name)} ${attrs}>${errorMarkup(name)}</label>`;
  const selectField = name => `<label>${FIELD_LABELS[name]}<select ${fieldAttrs(name)}>${OPTIONS[name].map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select>${errorMarkup(name)}</label>`;
  const textArea = (name, min, placeholder) => `<label class="span2">${FIELD_LABELS[name]}<textarea ${fieldAttrs(name)} minlength="${min}" placeholder="${placeholder}"></textarea>${errorMarkup(name)}</label>`;
  const moneyField = (name, label, hint, placeholder) => `<label>${label}<span class="listing-money"><span aria-hidden="true">Rp</span><input id="${fieldId(name)}" name="${name}" type="text" inputmode="numeric" autocomplete="off" required placeholder="${placeholder}" aria-describedby="${fieldId(name)}Hint ${errorId(name)}"></span><span class="hint" id="${fieldId(name)}Hint">${hint}</span>${errorMarkup(name)}</label>`;

  function page() {
    draft();
    return `<div class="container listing-page"><div class="page-top"><nav class="crumb" aria-label="Jejak halaman"><a href="#/merchant">Ruang merchant</a><span aria-hidden="true">/</span><span>Tambah outfit</span></nav><h1>Tambah outfit</h1><p class="hint">Siapkan outfit dan simpan draft. Akun pemilik terverifikasi diperlukan saat menerbitkan.</p></div>
      <form id="uploadForm" class="checkout-grid" novalidate><div>
        <section class="panel"><h2>01 · Foto & informasi outfit</h2><div class="upload-area"><label>Foto outfit<input id="outfitPhotos" name="photos" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple aria-required="true" aria-describedby="outfitPhotosHint outfitPhotosError"></label><p class="hint" id="outfitPhotosHint">JPEG, PNG, atau WebP. Maks. 4 foto, 5 MB per foto. Foto pertama menjadi sampul. Sertakan bagian depan, belakang, dan detail.</p>${errorMarkup('photos')}<p id="listingPhotoStatus" class="hint" role="status"></p><div id="photoPreview" class="upload-previews"></div></div>
          <div class="form-grid listing-information">${inputField('name', 'maxlength="65" placeholder="Contoh: Blue Hour Korean Set"', 'Nama outfit', 'span2')}${selectField('category')}${inputField('brand', 'placeholder="Nama brand / custom / tanpa brand"')}${inputField('material', 'placeholder="Contoh: katun, rajut"')}${selectField('location')}${textArea('description', 30, 'Jelaskan bahan, kondisi, dan semua item yang termasuk dalam sewa. Minimal 30 karakter.')}${inputField('condition', 'placeholder="Contoh: baik; sedikit aus pada ujung lengan"', 'Kondisi saat ini', 'span2')}</div>
        </section>
        <section class="panel"><h2>02 · Ukuran (cm)</h2><div class="form-grid">${selectField('size')}${NUMBER_FIELDS.map(name => inputField(name, `type="number" min="${DIMENSIONS[name][0]}" max="${DIMENSIONS[name][1]}" step="1"`, `${FIELD_LABELS[name]} (cm)`)).join('')}</div><p class="hint">Untuk set, tuliskan ukuran setiap potongan tambahan di deskripsi.</p></section>
        <section class="panel"><h2>03 · Harga & ketentuan</h2><div class="form-grid">${moneyField('original', 'Harga beli asli (Rp)', 'Referensi kualitas, bukan denda otomatis. Harus lebih dari Rp0.', '500.000')}${moneyField('price', 'Harga sewa / hari (Rp)', 'Minimum harga sewa Rp1.000 per hari.', '55.000')}${moneyField('deposit', 'Deposit jaminan (Rp)', 'Boleh Rp0. Dikembalikan setelah pemeriksaan.', '100.000')}${moneyField('replacement', 'Nilai penggantian maks. (Rp)', 'Harus lebih dari Rp0 dan tidak melebihi harga beli asli.', '400.000')}${textArea('terms', 15, 'Contoh: jangan mencuci sendiri; pencucian normal termasuk harga sewa. Minimal 15 karakter.')}</div></section>
      </div><aside class="sticky"><section class="panel"><h2>Terbitkan listing</h2><div class="note neutral" id="merchantEstimate" aria-live="polite">Isi harga sewa untuk melihat estimasi biaya.</div><p class="hint" id="listingAccountStatus"></p><label class="checkline"><input id="listing-agree" name="agree" type="checkbox" required aria-describedby="listing-agreeError"><span>Saya berhak menyewakan outfit ini dan informasi kondisi serta kelengkapannya sesuai.</span></label>${errorMarkup('agree')}<p id="uploadError" class="field-error" role="alert"></p><div class="listing-actions"><button type="submit" class="btn full" id="publishListing">Terbitkan listing</button><button type="button" class="btn secondary full" id="saveListingDraft">Simpan draft</button></div><p class="hint" id="listingDraftStatus" role="status">Draft hanya tersimpan selama tab ini terbuka dan hilang saat halaman dimuat ulang.</p></section></aside></form></div>`;
  }

  function captureDraft() {
    const form = activeForm();
    if (!form || form.dataset.published === 'true') return state.listingDraft;
    const current = draft();
    for (const name of [...TEXT_FIELDS, ...NUMBER_FIELDS, ...MONEY_FIELDS]) current.values[name] = form.elements.namedItem(name).value;
    current.values.agree = form.elements.namedItem('agree').checked;
    return current;
  }

  function setError(form, name, message) {
    const field = form.elements.namedItem(name);
    const error = form.querySelector(`#${errorId(name)}`);
    if (error) error.textContent = message;
    if (field) {
      if (message) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
    }
  }

  function focusField(form, name) {
    const field = form.elements.namedItem(name);
    if (field && form.isConnected) field.focus();
  }

  function moneyError(name, raw) {
    if (name === 'price') return rentalPriceError(raw);
    if (!String(raw).trim()) return `${FIELD_LABELS[name]} wajib diisi.`;
    const amount = parseRupiahInput(raw);
    if (amount === null) return 'Gunakan rupiah bulat tanpa tanda minus atau desimal, misalnya Rp100.000.';
    if (name !== 'deposit' && amount === 0) return `${FIELD_LABELS[name]} harus lebih dari Rp0.`;
    return '';
  }

  function validate(form) {
    const current = captureDraft();
    const errors = {};
    const values = {};
    for (const name of TEXT_FIELDS) {
      values[name] = String(current.values[name] || '').trim();
      if (!values[name]) errors[name] = `${FIELD_LABELS[name]} wajib diisi.`;
      else if (OPTIONS[name] && !OPTIONS[name].includes(values[name])) errors[name] = `Pilih ${FIELD_LABELS[name].toLowerCase()} yang tersedia.`;
    }
    if (values.name.length > 65) errors.name = 'Nama outfit maksimal 65 karakter.';
    if (values.description && values.description.length < 30) errors.description = 'Deskripsi & kelengkapan minimal 30 karakter setelah spasi tepi dihapus.';
    if (values.terms && values.terms.length < 15) errors.terms = 'Syarat khusus pemilik minimal 15 karakter setelah spasi tepi dihapus.';
    for (const name of NUMBER_FIELDS) {
      const raw = String(current.values[name] || '').trim();
      values[name] = Number(raw);
      const [min, max] = DIMENSIONS[name];
      if (!raw) errors[name] = `${FIELD_LABELS[name]} wajib diisi.`;
      else if (!Number.isInteger(values[name]) || values[name] < min || values[name] > max) errors[name] = `${FIELD_LABELS[name]} harus berupa bilangan bulat antara ${min}–${max} cm.`;
    }
    for (const name of MONEY_FIELDS) {
      values[name] = parseRupiahInput(current.values[name]);
      const message = moneyError(name, current.values[name]);
      if (message) errors[name] = message;
    }
    if (!errors.original && !errors.replacement && values.replacement > values.original) errors.replacement = 'Nilai penggantian tidak boleh melebihi harga beli asli.';
    if (!errors.deposit && !errors.replacement && values.deposit > values.replacement) errors.deposit = 'Deposit tidak boleh melebihi nilai penggantian.';
    if (!errors.price && !errors.deposit) {
      try { calculateCosts(values, 7, 'courier'); }
      catch (_) { errors.price = 'Nominal terlalu besar. Kurangi harga sewa atau deposit.'; }
    }
    const photoError = photoPending ? 'Tunggu hingga foto selesai disiapkan.' : current.photoError || validatePhotos(current.files);
    if (photoError) errors.photos = photoError;
    if (!current.values.agree) errors.agree = 'Setujui pernyataan kepemilikan dan kondisi outfit sebelum menerbitkan.';
    for (const name of [...TEXT_FIELDS, ...NUMBER_FIELDS, ...MONEY_FIELDS, 'photos', 'agree']) setError(form, name, errors[name] || '');
    const first = [...form.elements].find(field => errors[field.name]);
    form.querySelector('#uploadError').textContent = first ? 'Periksa bagian yang ditandai. Isian dan foto yang sudah diterima tetap tersimpan.' : '';
    if (first) focusField(form, first.name);
    return Object.keys(errors).length ? null : values;
  }

  function updateEstimate(form) {
    const raw = form.elements.namedItem('price').value;
    const price = parseValidRentalPrice(raw);
    const estimate = form.querySelector('#merchantEstimate');
    if (price === null) {
      estimate.textContent = 'Isi harga sewa untuk melihat estimasi biaya.';
      return;
    }
    try {
      const costs = calculateCosts({ price, deposit: 0 }, 3);
      estimate.innerHTML = `Contoh sewa 3 hari:<br>Subtotal sewa: <b>${money(costs.rent)}</b><br>Biaya platform ke penyewa (10%): <b>${money(costs.fee)}</b><br><small>Deposit dan ongkir dihitung terpisah.</small>`;
    } catch (_) { estimate.textContent = 'Nominal terlalu besar untuk dihitung.'; }
  }

  function refreshAccountStatus(form = document.querySelector('#uploadForm')) {
    const status = form?.querySelector('#listingAccountStatus');
    if (!status) return;
    status.textContent = !account.user ? 'Buat akun atau masuk saat menerbitkan. Draft dapat disimpan sekarang.' : account.user.role !== 'owner' ? 'Beralih ke peran pemilik saat menerbitkan listing.' : !account.isVerified ? 'Verifikasi akun pemilik diperlukan saat menerbitkan. Draft tetap tersedia.' : 'Akun pemilik terverifikasi (simulasi). Listing siap diterbitkan setelah semua isian lengkap.';
  }

  function restoreFileInput(form) {
    const input = form.elements.namedItem('photos');
    try {
      const transfer = new DataTransfer();
      for (const file of draft().files) transfer.items.add(file);
      input.files = transfer.files;
    } catch (_) {
      // File objects remain in memory when a browser cannot restore FileList.
      input.value = '';
    }
  }

  function renderPhotos(form) {
    const current = draft();
    form.querySelector('#photoPreview').innerHTML = current.photos.map((url, index) => `<figure class="listing-photo"><img src="${esc(url)}" alt="${index === 0 ? 'Sampul' : `Foto ${index + 1}`} outfit: ${esc(current.files[index]?.name || '')}"><figcaption class="hint">${index === 0 ? 'Sampul · ' : ''}${esc(current.files[index]?.name || `Foto ${index + 1}`)}</figcaption><button type="button" class="btn ghost" data-listing-remove="${index}" aria-label="Hapus foto ${index + 1}: ${esc(current.files[index]?.name || '')}"${publishing || photoPending ? ' disabled' : ''}>Hapus foto</button></figure>`).join('');
    form.querySelector('#listingPhotoStatus').textContent = photoPending ? 'Menyiapkan foto…' : current.files.length ? `${current.files.length} foto tersimpan dalam draft sesi ini.` : 'Belum ada foto dipilih.';
    setError(form, 'photos', current.photoError || '');
    form.querySelectorAll('[data-listing-remove]').forEach(button => button.addEventListener('click', () => {
      if (publishing || photoPending) return;
      const index = Number(button.dataset.listingRemove);
      current.files.splice(index, 1);
      current.photos.splice(index, 1);
      current.photoError = '';
      restoreFileInput(form);
      renderPhotos(form);
      form.elements.namedItem('photos').focus();
    }));
  }

  async function choosePhotos(form) {
    if (publishing) return;
    const current = captureDraft();
    const files = Array.from(form.elements.namedItem('photos').files || []);
    if (!files.length) { restoreFileInput(form); return; }
    const sequence = ++photoSequence;
    const issue = validatePhotos(files);
    if (issue) {
      photoPending = false;
      current.photoError = issue;
      // Keep the accepted draft photos, but let choosing the same valid file
      // fire a new change event after an invalid selection.
      form.elements.namedItem('photos').value = '';
      renderPhotos(form);
      return;
    }
    photoPending = true;
    current.photoError = '';
    renderPhotos(form);
    try {
      const photos = await Promise.all(files.map(file => imageFileToSharedDataUrl(file)));
      if (sequence !== photoSequence || state.listingDraft !== current) return;
      current.files = files;
      current.photos = photos;
    } catch (_) {
      if (sequence !== photoSequence || state.listingDraft !== current) return;
      current.photoError = 'Foto tidak dapat dibaca. Pilih file JPEG, PNG, atau WebP yang dapat dibuka. Foto sebelumnya tetap tersimpan.';
    } finally {
      if (sequence === photoSequence) {
        photoPending = false;
        const visibleForm = activeForm();
        if (visibleForm && state.listingDraft === current) {
          if (current.photoError) visibleForm.elements.namedItem('photos').value = '';
          else restoreFileInput(visibleForm);
          renderPhotos(visibleForm);
        }
      }
    }
  }

  function setBusy(form, busy) {
    publishing = busy;
    form.setAttribute('aria-busy', String(busy));
    form.querySelector('#publishListing').textContent = busy ? 'Menerbitkan…' : 'Terbitkan listing';
    for (const control of form.elements) control.disabled = busy;
  }

  async function publish(form) {
    if (publishing || gatePending || !form.isConnected || form.dataset.published === 'true') return;
    const values = validate(form);
    if (!values) return;
    const current = captureDraft();
    const resume = () => {
      gatePending = false;
      const visibleForm = activeForm();
      if (visibleForm && state.listingDraft?.id === current.id) {
        refreshAccountStatus(visibleForm);
        return publish(visibleForm);
      }
    };
    if (!account.user || account.user.role !== 'owner') {
      gatePending = true;
      try { await account.ensureAccount(resume, { role: 'owner' }); }
      finally { gatePending = false; }
      return;
    }
    if (!account.isVerified || account.user.verification !== 'verified') {
      gatePending = true;
      try { await account.ensureVerified(resume, { role: 'owner' }); }
      finally { gatePending = false; }
      return;
    }
    setBusy(form, true);
    const publisherId = account.user.id;
    let inserted = null;
    let previous = null;
    try {
      const issue = validatePhotos(current.files);
      if (issue) throw new Error(issue);
      const photos = current.photos.length === current.files.length ? current.photos : await Promise.all(current.files.map(file => imageFileToSharedDataUrl(file)));
      // Authentication may change while decoding; verify the actual mutation too.
      if (!account.user || account.user.id !== publisherId || account.user.role !== 'owner' || account.user.verification !== 'verified' || !account.isVerified) throw new Error('Status akun berubah. Periksa akun pemilik dan coba terbitkan kembali.');
      refreshSharedDemo();
      inserted = { ...values, id: current.id, custom: true, ownerId: account.user.id, owner: account.user.name, verification: 'verified', img: photos[0], photos, updatedAt: new Date().toISOString() };
      const existingIndex = products.findIndex(product => product.id === current.id);
      if (existingIndex >= 0) {
        previous = products[existingIndex];
        products.splice(existingIndex, 1, inserted);
      } else products.push(inserted);
      if (!persistSharedDemo()) throw new Error('Listing belum diterbitkan karena penyimpanan browser gagal. Isian dan foto tetap dalam draft; coba lagi.');
      form.dataset.published = 'true';
      state.listingDraft = null;
      state.merchantTab = 'outfit';
      go('/merchant');
      toast('Listing diterbitkan dan dibagikan ke tab lain. Status pemilik: Terverifikasi (simulasi).');
    } catch (error) {
      if (inserted) {
        const index = products.findIndex(product => product.id === inserted.id);
        if (index >= 0) {
          if (previous) products.splice(index, 1, previous);
          else products.splice(index, 1);
        }
      }
      form.querySelector('#uploadError').textContent = error.message || 'Listing belum diterbitkan. Draft tetap tersimpan; coba lagi.';
      form.querySelector('#uploadError').setAttribute('tabindex', '-1');
      form.querySelector('#uploadError').focus();
    } finally {
      setBusy(form, false);
    }
  }

  function bind() {
    const form = activeForm();
    if (!form || form.dataset.listingBound === 'true') return;
    form.dataset.listingBound = 'true';
    const current = draft();
    for (const [name, value] of Object.entries(current.values)) {
      const field = form.elements.namedItem(name);
      if (!field || name === 'photos') continue;
      if (name === 'agree') field.checked = value === true;
      else field.value = String(value ?? '');
    }
    restoreFileInput(form);
    renderPhotos(form);
    updateEstimate(form);
    refreshAccountStatus(form);
    for (const name of MONEY_FIELDS) {
      const field = form.elements.namedItem(name);
      field.addEventListener('input', () => {
        const raw = field.value;
        const amount = parseRupiahInput(raw);
        if (amount !== null) {
          const digitsBeforeCaret = raw.slice(0, field.selectionStart ?? raw.length).replace(/\D/g, '').length;
          const formatted = formatRupiahInput(amount);
          field.value = formatted;
          let position = 0;
          let digits = 0;
          while (position < formatted.length && digits < digitsBeforeCaret) {
            if (/\d/.test(formatted[position])) digits++;
            position++;
          }
          field.setSelectionRange(position, position);
        }
        setError(form, name, moneyError(name, field.value));
        updateEstimate(form);
        captureDraft();
      });
    }
    form.addEventListener('input', event => {
      if (!MONEY_FIELDS.includes(event.target.name) && event.target.name !== 'photos') setError(form, event.target.name, '');
      captureDraft();
    });
    form.addEventListener('change', () => captureDraft());
    form.elements.namedItem('photos').addEventListener('change', () => choosePhotos(form));
    form.querySelector('#saveListingDraft').addEventListener('click', () => {
      captureDraft();
      form.querySelector('#listingDraftStatus').textContent = 'Draft disimpan untuk sesi tab ini. Isian dan foto kembali saat kamu membuka Tambah outfit. Memuat ulang halaman akan menghapus draft.';
      toast('Draft tersimpan untuk sesi tab ini.');
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      void publish(form);
    });
  }

  return { page, bind, captureDraft, refreshAccountStatus };
}
