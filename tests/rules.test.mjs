import test from 'node:test';
import assert from 'node:assert/strict';
import {
  money, formatRupiahInput, parseRupiahInput, parseValidRentalPrice, rentalPriceError,
  calculateCosts, localDateFromISO, localDateISO, todayISO, addDaysISO,
  demoUnavailableDays, rentalPeriodIssue, reviewEligibility, validateReview,
  ratingSummary, validatePhotos, validateCheckout, accessRequirement
} from '../dist/core/rules.mjs';

const product = { id: 'korean', price: 55000, deposit: 100000, ownerId: 'owner-lemari-nara' };
const renter = { id: 'renter-demo', role: 'renter' };
const owner = { id: 'owner-lemari-nara', role: 'owner' };
const order = { id: 'order-1', product, ownerId: owner.id, renterId: renter.id, start: '2026-11-10', days: 3, step: 3 };
const photo = { name: 'outfit.webp', type: 'image/webp', size: 1024 };

test('rupiah displays separators and parses a numeric value', () => {
  assert.equal(money(1000000), 'Rp1.000.000');
  assert.equal(formatRupiahInput(1000000), '1.000.000');
  for (const input of ['1000000', '1.000.000', ' Rp1.000.000 ']) assert.equal(parseRupiahInput(input), 1000000);
});

test('rupiah rejects empty, negative, decimal, non-numeric, and unsafe values', () => {
  for (const input of ['', '   ', '-1000', '1,5', 'abc', 'Infinity', '9007199254740992']) assert.equal(parseRupiahInput(input), null, input);
});

test('rental price preserves the Rp1.000 minimum and names a zero-price error', () => {
  assert.equal(parseValidRentalPrice('Rp1.000'), 1000);
  assert.equal(parseValidRentalPrice('999'), null);
  assert.equal(parseValidRentalPrice('0'), null);
  assert.equal(rentalPriceError('0'), 'Harga harus lebih dari Rp0.');
  assert.match(rentalPriceError('999'), /Rp1\.000/);
  assert.match(rentalPriceError('   '), /wajib diisi/);
  assert.equal(rentalPriceError('55.000'), '');
});

test('one-day pickup separates rental, fee, and refundable deposit', () => {
  assert.deepEqual(calculateCosts(product, 1), { rent: 55000, fee: 5500, deposit: 100000, shipping: 0, total: 160500 });
});

test('three-day courier adds exactly Rp40.000', () => {
  assert.deepEqual(calculateCosts(product, 3, 'courier'), { rent: 165000, fee: 16500, deposit: 100000, shipping: 40000, total: 321500 });
});

test('fees round once from the full rental subtotal', () => {
  assert.equal(calculateCosts({ price: 1005, deposit: 0 }, 3).fee, 302);
});

test('costs reject invalid durations and delivery methods', () => {
  for (const days of [0, -1, 8, 1.5, NaN, Infinity, '', null, true]) assert.throws(() => calculateCosts(product, days));
  assert.throws(() => calculateCosts(product, 1, 'unknown'));
});

test('costs reject invalid prices and deposits', () => {
  for (const price of [0, -1, 999, 1.5, NaN, Infinity, '55000']) assert.throws(() => calculateCosts({ ...product, price }, 1));
  for (const deposit of [-1, 0.5, NaN, Infinity, '100000']) assert.throws(() => calculateCosts({ ...product, deposit }, 1));
  assert.equal(calculateCosts({ ...product, deposit: 0 }, 1).deposit, 0);
});

test('costs reject unsafe rental multiplication and total overflow', () => {
  assert.throws(() => calculateCosts({ price: Number.MAX_SAFE_INTEGER, deposit: 0 }, 2));
  assert.throws(() => calculateCosts({ price: 1000, deposit: Number.MAX_SAFE_INTEGER }, 1));
});

test('strict calendar parsing rejects rollover and malformed dates', () => {
  for (const value of ['', '2026-02-30', '2026-02-29', '2026-13-01', '2026-00-01', '2026-1-01', '2026-11-10T12:00:00']) assert.equal(localDateFromISO(value), null, value);
  assert.equal(localDateISO(localDateFromISO('2028-02-29')), '2028-02-29');
  assert.equal(localDateISO(new Date('invalid')), '');
});

test('inclusive rental dates preserve one day and cross month/year boundaries', () => {
  assert.equal(addDaysISO('2026-11-10', 1 - 1), '2026-11-10');
  assert.equal(addDaysISO('2026-11-10', 3 - 1), '2026-11-12');
  assert.equal(addDaysISO('2026-12-31', 1), '2027-01-01');
  assert.equal(addDaysISO('2028-02-28', 1), '2028-02-29');
  assert.equal(addDaysISO('2026-01-01', -1), '2025-12-31');
  assert.equal(addDaysISO('invalid', 1), '');
  assert.equal(addDaysISO('2026-01-01', 0.5), '');
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});

test('availability preserves the current rule allowing today', () => {
  assert.equal(rentalPeriodIssue('korean', '2026-11-10', 1, [], '2026-11-10'), null);
  assert.match(rentalPeriodIssue('korean', '2026-11-09', 1, [], '2026-11-10').reason, /lewat/);
});

test('availability rejects invalid dates and non-integer durations', () => {
  assert.match(rentalPeriodIssue('korean', '2026-02-30', 1, [], '2026-01-01').reason, /valid/);
  for (const duration of [0, 8, 1.5, Infinity, null, '', true]) assert.match(rentalPeriodIssue('korean', '2026-11-10', duration, [], '2026-11-01').reason, /1–7/);
});

test('every day of an inclusive period respects recurring blocked dates', () => {
  assert.deepEqual(demoUnavailableDays.korean, [8, 9, 18]);
  assert.deepEqual(rentalPeriodIssue('korean', '2026-11-07', 3, [], '2026-11-01'), { date: '2026-11-08', reason: 'Tanggal ini tidak tersedia.' });
  assert.equal(rentalPeriodIssue('new-listing', '2026-11-07', 7, [], '2026-11-01'), null);
});

test('an active order blocks every overlapping inclusive day', () => {
  const active = { ...order, step: 0 };
  assert.equal(rentalPeriodIssue('korean', '2026-11-10', 1, [active], '2026-11-01').date, '2026-11-10');
  assert.equal(rentalPeriodIssue('korean', '2026-11-12', 2, [active], '2026-11-01').date, '2026-11-12');
  assert.equal(rentalPeriodIssue('korean', '2026-11-13', 1, [active], '2026-11-01'), null);
});

test('completed orders and other outfits do not block dates', () => {
  assert.equal(rentalPeriodIssue('korean', '2026-11-10', 1, [order], '2026-11-01'), null);
  assert.equal(rentalPeriodIssue('vest', '2026-11-10', 1, [{ ...order, step: 1 }], '2026-11-01'), null);
});

test('malformed stored orders cannot crash availability checks', () => {
  const malformed = [null, {}, { ...order, start: 'invalid', step: 0 }, { ...order, days: -5, step: 0 }, { ...order, step: 1.5 }];
  assert.equal(rentalPeriodIssue('korean', '2026-11-10', 1, malformed, '2026-11-01'), null);
});

test('only the renter named on a completed order can review it', () => {
  assert.equal(reviewEligibility(order, renter), '');
  assert.notEqual(reviewEligibility(order, null), '');
  assert.notEqual(reviewEligibility(order, { id: 'renter-demo-2', role: 'renter' }), '');
  assert.notEqual(reviewEligibility(order, owner), '');
  assert.notEqual(reviewEligibility(order, { id: renter.id, role: 'owner' }), '');
});

test('reviews require the completed integer state', () => {
  for (const step of [0, 1, 2, 2.9, '3', null]) assert.notEqual(reviewEligibility({ ...order, step }, renter), '');
  assert.notEqual(reviewEligibility(null, renter), '');
});

test('a second review for the same transaction is refused', () => {
  assert.match(reviewEligibility({ ...order, renterReview: { rating: 5 } }, renter), /sudah/);
});

test('renters cannot review their own listing', () => {
  assert.notEqual(reviewEligibility({ ...order, ownerId: renter.id }, renter), '');
  assert.notEqual(reviewEligibility({ ...order, product: { ...product, ownerId: renter.id } }, renter), '');
});

test('existing owner responses require the matching owner and allow no duplicates', () => {
  assert.equal(reviewEligibility(order, owner, 'owner'), '');
  assert.notEqual(reviewEligibility(order, { id: 'owner-atelier-luna', role: 'owner' }, 'owner'), '');
  assert.notEqual(reviewEligibility({ ...order, ownerReview: { rating: 4 } }, owner, 'owner'), '');
  assert.notEqual(reviewEligibility(order, owner, 'invalid'), '');
});

test('review ratings must be integers from one to five', () => {
  for (const rating of [1, 2, 3, 4, 5, '5']) assert.equal(validateReview(rating, ''), '');
  for (const rating of [0, 6, 1.5, NaN, Infinity, '', null, true]) assert.notEqual(validateReview(rating, ''), '');
});

test('comments are optional and limited to 500 characters', () => {
  assert.equal(validateReview(5, ''), '');
  assert.equal(validateReview(5, 'x'.repeat(500)), '');
  assert.match(validateReview(5, 'x'.repeat(501)), /500/);
  assert.equal(validateReview(5, '<img src=x onerror=alert(1)>'), '');
});

test('rating summaries contain valid completed renter reviews for that outfit only', () => {
  const orders = [
    { ...order, id: 'a', renterReview: { rating: 5, text: '' } },
    { ...order, id: 'b', renterReview: { rating: 3, text: 'Baik' } },
    { ...order, id: 'a', renterReview: { rating: 5 } },
    { ...order, id: 'c', step: 2, renterReview: { rating: 1 } },
    { ...order, id: 'd', renterReview: { rating: 9 } },
    { ...order, id: 'e', ownerReview: { rating: 1 } },
    { ...order, id: 'f', product: { ...product, id: 'vest' }, renterReview: { rating: 1 } },
    { ...order, id: 'g', ownerId: renter.id, renterReview: { rating: 1 } },
    { ...order, id: 'h', renterReview: { rating: 2, text: 'x'.repeat(501) } }
  ];
  const summary = ratingSummary(orders, product.id);
  assert.equal(summary.count, 2);
  assert.equal(summary.average, 4);
  assert.equal(summary.reviews.length, 2);
});

test('an outfit with no reviews has no invented average', () => {
  assert.deepEqual(ratingSummary([], product.id), { count: 0, average: null, reviews: [] });
});

test('listing photos require one to four nonempty files', () => {
  assert.notEqual(validatePhotos([]), '');
  assert.equal(validatePhotos([], { required: false }), '');
  assert.equal(validatePhotos([photo]), '');
  assert.equal(validatePhotos(Array(4).fill(photo)), '');
  assert.notEqual(validatePhotos(Array(5).fill(photo)), '');
  assert.notEqual(validatePhotos([{ ...photo, size: 0 }]), '');
});

test('listing photo extension and MIME must both match JPEG, PNG, or WebP', () => {
  assert.equal(validatePhotos([{ name: 'Outfit.JPG', type: 'image/jpeg', size: 1024 }]), '');
  assert.equal(validatePhotos([{ name: 'outfit.png', type: 'image/png', size: 1024 }]), '');
  for (const file of [
    { ...photo, name: 'file.svg', type: 'image/svg+xml' },
    { ...photo, name: 'file.png' },
    { ...photo, type: '' },
    { ...photo, name: 'file.webp.exe' },
    { ...photo, type: 'text/html' }
  ]) assert.notEqual(validatePhotos([file]), '');
});

test('listing photos enforce exactly the stated 5 MB limit', () => {
  assert.equal(validatePhotos([{ ...photo, size: 5 * 1024 * 1024 }]), '');
  assert.match(validatePhotos([{ ...photo, size: 5 * 1024 * 1024 + 1 }]), /5 MB/);
});

test('checkout rejects whitespace-only receiver, phone, and courier address', () => {
  const errors = validateCheckout({ receiver: '   ', phone: '  ', delivery: 'courier', address: '   ', agree: false });
  for (const key of ['receiver', 'phone', 'address', 'agree']) assert.ok(errors[key], key);
});

test('checkout accepts a pickup without address and normalized display phone', () => {
  assert.deepEqual(validateCheckout({ receiver: ' Demo Penyewa ', phone: '+62 812-3456-7890', delivery: 'pickup', address: '', agree: true }), {});
});

test('checkout accepts a courier with an address but rejects malformed phone and missing agreement', () => {
  assert.deepEqual(validateCheckout({ receiver: 'Demo', phone: '081234567890', delivery: 'courier', address: 'Alamat dummy', agree: true }), {});
  for (const phone of ['abcdefghijk', '123', '++++++++', '000000000000000000000']) assert.ok(validateCheckout({ receiver: 'Demo', phone, delivery: 'pickup', agree: true }).phone);
  assert.ok(validateCheckout({ receiver: 'Demo', phone: '081234567890', delivery: 'pickup', agree: 'false' }).agree);
});

test('visitors can browse and prepare drafts without an account', () => {
  for (const action of ['browse', 'draft']) assert.equal(accessRequirement(null, action), null);
});

test('confirmation and publication require an account before verification', () => {
  for (const action of ['confirm', 'publish']) {
    assert.equal(accessRequirement(null, action), 'account');
    for (const verification of ['unverified', 'pending', 'rejected', undefined]) {
      assert.equal(accessRequirement({ ...renter, verification }, action), 'verification');
    }
    assert.equal(accessRequirement({ ...renter, verification: 'verified' }, action), null);
  }
});

test('access requirements fail closed for unknown actions and incomplete accounts', () => {
  assert.throws(() => accessRequirement(renter, 'delete'));
  assert.equal(accessRequirement({ verification: 'verified' }, 'publish'), 'account');
});

test('a rental cannot overflow the supported four-digit calendar range', () => {
  assert.equal(addDaysISO('9999-12-31', 1), '');
  assert.match(rentalPeriodIssue('new-listing', '9999-12-31', 2, [], '2026-01-01').reason, /valid/);
});
