import { reviewEligibility, validateReview, ratingSummary } from '../core/rules.mjs';

// Reviews remain attached to their transaction; owner replies never enter an outfit's score.
export function createReviewFlow({ state, account, esc, formatDate, touchOrder, refreshSharedDemo, persistSharedDemo, toast, render }) {
  const currentAccount = () => account.user;
  const reviewField = side => side === 'renter' ? 'renterReview' : 'ownerReview';
  const reviewLabel = side => side === 'renter' ? 'Ulasan outfit' : 'Balasan pemilik';
  const summary = productId => ratingSummary(state.orders, productId);
  const reviewText = review => review.text
    ? `<p class="review-comment">${esc(review.text)}</p>`
    : '<p class="muted">Tanpa komentar tertulis.</p>';

  function action(order, side) {
    if (!order || !['renter', 'owner'].includes(side)) return '';
    const review = order[reviewField(side)];
    if (review) return `<p class="review-submitted">${reviewLabel(side)}: <strong>${esc(review.rating)}/5 ★</strong>${review.text ? ` · ${esc(review.text)}` : ''}</p>`;
    if (reviewEligibility(order, currentAccount(), side)) return '';
    return `<button class="btn secondary" type="button" data-review="${esc(order.id)}" data-review-side="${side}" aria-haspopup="dialog">${side === 'renter' ? 'Beri ulasan outfit' : 'Beri balasan'}</button>`;
  }

  function outfitSection(productId) {
    const result = summary(productId);
    return `<section class="panel profile-section outfit-reviews" aria-label="Ulasan outfit"><div class="section-heading"><div><h2>Ulasan outfit</h2>${result.count ? `<p><strong>${result.average.toFixed(1)} dari 5 ★</strong> · ${result.count} ulasan</p>` : ''}</div></div>${result.count ? `<p class="small muted review-demo-note">Ulasan demo di browser ini</p><div class="profile-reviews">${result.reviews.map(({ order, review }) => `<article class="profile-review"><div class="review-topline"><strong aria-label="${Number(review.rating)} dari 5 bintang">${'★'.repeat(Number(review.rating))}${'☆'.repeat(5 - Number(review.rating))}</strong><span class="small muted">${esc(formatDate(order.start))} · ${esc(order.days)} hari</span></div>${reviewText(review)}${order.ownerReview && !validateReview(order.ownerReview.rating, order.ownerReview.text ?? '') ? `<div class="review-owner-reply"><strong class="small">Balasan pemilik</strong>${reviewText(order.ownerReview)}</div>` : ''}</article>`).join('')}</div>` : '<p class="muted">Belum ada ulasan</p>'}</section>`;
  }

  function open(orderId, side = 'renter') {
    refreshSharedDemo();
    const order = state.orders.find(item => item.id === orderId);
    const blocked = reviewEligibility(order, currentAccount(), side);
    const modal = document.querySelector('#modal');
    if (!modal) return;
    const opener = document.activeElement;
    const title = reviewLabel(side);
    modal.innerHTML = `<div class="dialog-head"><h2 id="reviewDialogTitle">${title}</h2><button class="icon-btn" type="button" aria-label="Tutup dialog" id="closeReviewDialog"><span aria-hidden="true">×</span></button></div>${blocked ? `<p class="field-error" role="alert">${esc(blocked)}</p>` : `<p class="small muted">Transaksi ${esc(order.id)} · ${esc(order.product.name)} · ${esc(formatDate(order.start))} · ${esc(order.days)} hari</p><form id="reviewForm" novalidate><fieldset class="rating-field" aria-describedby="reviewRatingError"><legend>${side === 'renter' ? 'Rating outfit' : 'Rating untuk penyewa'}</legend><div class="rating-options">${[1, 2, 3, 4, 5].map(value => `<label><input type="radio" name="rating" value="${value}" required aria-label="${value} dari 5 bintang" aria-describedby="reviewRatingError"><span aria-hidden="true">${value} ★</span></label>`).join('')}</div><p class="field-error" id="reviewRatingError" role="alert" aria-live="polite"></p></fieldset><label for="reviewComment">Komentar (opsional)</label><textarea id="reviewComment" name="text" maxlength="500" aria-describedby="reviewCommentHint reviewTextError" placeholder="Bagikan pengalaman terkait transaksi ini."></textarea><p class="hint" id="reviewCommentHint">Maksimal 500 karakter.</p><p class="field-error" id="reviewTextError" role="alert" aria-live="polite"></p><p class="hint">${side === 'renter' ? 'Satu ulasan per transaksi yang selesai.' : 'Balasan pemilik tidak dihitung sebagai rating outfit.'}</p><p class="field-error" id="reviewSaveError" role="alert" aria-live="polite" tabindex="-1"></p><button class="btn full" type="submit">${side === 'renter' ? 'Kirim ulasan' : 'Kirim balasan'}</button></form>`}`;
    modal.classList.add('review-dialog');
    modal.setAttribute('aria-labelledby', 'reviewDialogTitle');
    const onClose = () => {
      modal.classList.remove('review-dialog');
      if (modal.getAttribute('aria-labelledby') === 'reviewDialogTitle') modal.removeAttribute('aria-labelledby');
      if (opener?.isConnected) opener.focus();
    };
    modal.addEventListener('close', onClose, { once: true });
    modal.querySelector('#closeReviewDialog').onclick = () => modal.close();
    if (!modal.open) modal.showModal();
    if (blocked) return;

    const form = modal.querySelector('#reviewForm');
    const radios = [...form.querySelectorAll('[name="rating"]')];
    const fieldset = form.querySelector('fieldset');
    const comment = form.querySelector('[name="text"]');
    const button = form.querySelector('[type="submit"]');
    const buttonLabel = button.textContent;
    const ratingError = form.querySelector('#reviewRatingError');
    const textError = form.querySelector('#reviewTextError');
    const saveError = form.querySelector('#reviewSaveError');
    let busy = false;

    const setBusy = value => {
      busy = value;
      form.setAttribute('aria-busy', String(value));
      fieldset.disabled = value;
      comment.disabled = value;
      button.disabled = value;
      button.textContent = value ? 'Menyimpan…' : buttonLabel;
    };
    const showSaveError = message => {
      saveError.textContent = message;
      saveError.focus();
    };
    const clearErrors = () => {
      ratingError.textContent = '';
      textError.textContent = '';
      saveError.textContent = '';
      radios.forEach(radio => radio.removeAttribute('aria-invalid'));
      comment.removeAttribute('aria-invalid');
    };
    radios.forEach(radio => radio.addEventListener('change', () => {
      ratingError.textContent = '';
      radios.forEach(input => input.removeAttribute('aria-invalid'));
    }));
    comment.addEventListener('input', () => {
      if (comment.value.length <= 500) {
        textError.textContent = '';
        comment.removeAttribute('aria-invalid');
      }
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      const rating = radios.find(radio => radio.checked)?.value ?? '';
      const text = comment.value;
      clearErrors();
      setBusy(true);

      const save = async () => {
        // A queued lock must not save after the person has closed the dialog.
        if (!modal.open || !form.isConnected) return false;
        refreshSharedDemo();
        const currentOrder = state.orders.find(item => item.id === orderId);
        const eligibilityError = reviewEligibility(currentOrder, currentAccount(), side);
        if (eligibilityError) {
          showSaveError(eligibilityError);
          return false;
        }
        const validationError = validateReview(rating, text);
        if (validationError) {
          if (validateReview(rating, '')) {
            ratingError.textContent = validationError;
            radios.forEach(radio => radio.setAttribute('aria-invalid', 'true'));
          } else {
            textError.textContent = validationError;
            comment.setAttribute('aria-invalid', 'true');
          }
          return false;
        }
        const field = reviewField(side);
        const hadReview = Object.hasOwn(currentOrder, field);
        const oldReview = currentOrder[field];
        const hadUpdatedAt = Object.hasOwn(currentOrder, 'updatedAt');
        const oldUpdatedAt = currentOrder.updatedAt;
        const review = { rating: Number(rating), text: text.trim(), createdAt: new Date().toISOString() };
        currentOrder[field] = review;
        touchOrder(currentOrder);
        try {
          if (!await persistSharedDemo()) throw new Error('review-storage');
        } catch (_) {
          // Persistence can replace the array, so restore both references when needed.
          const latest = state.orders.find(item => item.id === orderId);
          for (const item of new Set([currentOrder, latest])) {
            if (!item || item[field]?.createdAt !== review.createdAt) continue;
            if (hadReview) item[field] = oldReview;
            else delete item[field];
            if (hadUpdatedAt) item.updatedAt = oldUpdatedAt;
            else delete item.updatedAt;
          }
          showSaveError('Ulasan belum tersimpan. Coba lagi; isianmu tetap tersedia.');
          return false;
        }
        return true;
      };

      try {
        const locks = globalThis.navigator?.locks;
        const saved = locks?.request
          ? await locks.request(`reoutfit-review-${orderId}`, save)
          : await save();
        if (saved) {
          modal.close();
          render();
          toast(side === 'renter' ? 'Ulasan terkirim.' : 'Balasan terkirim.');
        }
      } catch (_) {
        showSaveError('Ulasan belum tersimpan. Coba lagi; isianmu tetap tersedia.');
      } finally {
        setBusy(false);
        if (modal.open && form.isConnected) {
          if (ratingError.textContent) radios[0].focus();
          else if (textError.textContent) comment.focus();
        }
      }
    });
    radios[0].focus();
  }

  return { action, open, outfitSection, summary };
}
