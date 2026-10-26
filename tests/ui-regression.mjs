// Uses Node's built-in WebSocket and an isolated Chrome/Edge debugging context.
// See README for the local browser command. No automation dependency is required.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { BASE, connectBrowser, delay } from './cdp.mjs';

const browser = await connectBrowser();
const results = [];
const PHOTO = resolve('dist/assets/korean.webp');
const filter = process.env.REOUTFIT_TEST_FILTER || '';
const text = (page, selector) => page.evaluate(selector => document.querySelector(selector)?.textContent || '', selector);
const count = (page, selector) => page.evaluate(selector => document.querySelectorAll(selector).length, selector);
const value = (page, selector) => page.evaluate(selector => document.querySelector(selector)?.value, selector);
const storedOrders = page => page.evaluate(() => JSON.parse(localStorage.getItem('reoutfit.demo.shared.v1') || '{"orders":[]}').orders || []);
const clickSubmit = (page, selector) => page.click(`${selector} [type=submit]`);
const modalOpen = page => page.evaluate(() => document.querySelector('#modal')?.open);

async function test(name, callback) {
  if (filter && !name.includes(filter)) return;
  const started = Date.now(), context = await browser.context(), pages = [];
  const newPage = async (width = 1440, height = 1000) => {
    const page = await context.page(width, height); pages.push(page); return page;
  };
  try {
    await callback(await newPage(), newPage);
    for (const page of pages) {
      assert.deepEqual(page.errors, [], 'browser JavaScript exceptions');
      assert.deepEqual(page.failedRequests, [], 'failed asset/network requests');
    }
    results.push({ name, status: 'PASS', ms: Date.now() - started });
    console.log(`PASS ${name}`);
  } catch (error) {
    const path = `artifacts/ui-review/failures/${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
    await pages[0]?.screenshot(path).catch(() => {});
    results.push({ name, status: 'FAIL', ms: Date.now() - started, error: error.stack, screenshot: path, browserErrors: pages.flatMap(page => page.errors) });
    console.error(`FAIL ${name}: ${error.message}`);
  } finally { await context.close(); }
}

async function login(page, alias = 'renter-demo', { register = false, skip = true } = {}) {
  if (register) await page.goto('#/register');
  await page.waitFor(() => !!document.querySelector('#accountForm'));
  await page.fill('#accountRole', alias.startsWith('owner') ? 'owner' : 'renter');
  await page.fill('#accountAlias', alias);
  await page.fill('#accountPassword', 'reoutfit123');
  await clickSubmit(page, '#accountForm');
  if (skip) {
    await page.waitFor(() => !!document.querySelector('[data-account-later]'));
    await page.click('[data-account-later]');
    await page.waitFor(() => !!document.querySelector('.home-page'));
  }
}

async function seed(page, id = 'renter-demo', verification = 'verified') {
  await page.goto();
  await page.seedAccount(id, verification);
  await page.goto('#/');
}

async function booking(page, days = 3) {
  await page.goto('#/outfit/korean');
  await page.waitFor(() => !!document.querySelector('#booking'));
  const start = await page.evaluate(days => {
    const date = new Date(); date.setDate(date.getDate() + 2);
    const blocked = start => Array.from({ length: days }, (_, n) => {
      const day = new Date(start); day.setDate(day.getDate() + n); return day.getDate();
    }).some(day => [8, 9, 18].includes(day));
    while (blocked(date)) date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, days);
  await page.fill('#start', start);
  await page.fill('#days', String(days));
  await clickSubmit(page, '#booking');
  await page.waitFor(() => !!document.querySelector('#checkoutForm'));
  return start;
}

async function checkoutData(page, courier = false) {
  await page.click('#checkout-fill-demo');
  if (courier) await page.click('[name=delivery][value=courier]');
  await page.click('[name=agree]');
}

async function verify(page) {
  if (await count(page, '[data-account-verify]')) await page.click('[data-account-verify]');
  await page.waitFor(() => !!document.querySelector('[data-account-submit]'));
  await page.click('[data-account-submit]');
  await page.click('[data-account-approve]');
}

async function fillListing(page) {
  await page.goto('#/upload');
  await page.setFiles('#outfitPhotos', [PHOTO]);
  await page.waitFor(() => document.querySelectorAll('#photoPreview img').length === 1);
  const data = { name: 'Outfit Demo Baru', brand: 'Brand demo', material: 'Katun', description: 'Outfit contoh untuk pengujian lokal, termasuk satu atasan.', condition: 'Baik, contoh data', chest: '90', waist: '70', length: '60', original: '1000000', price: '55000', deposit: '100000', replacement: '900000', terms: 'Pencucian normal termasuk harga sewa contoh.' };
  for (const [key, val] of Object.entries(data)) await page.fill(`#uploadForm [name="${key}"]`, val);
  await page.click('#listing-agree');
}

try {
  await test('auth dedicated page password onboarding and per-account verification', async page => {
    await page.goto();
    assert.match(await page.evaluate(() => location.hash), /^#\/login/);
    assert.equal(await count(page, 'main #accountForm'), 1);
    assert.equal(await modalOpen(page), false);
    await page.fill('#accountPassword', 'wrong-demo-password');
    await clickSubmit(page, '#accountForm');
    assert.ok((await text(page, '#accountPasswordError')).trim(), 'invalid password has inline error');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('reoutfit.demo.account.session.v1')), null);
    await page.click('[data-account-password-toggle]');
    assert.equal(await page.evaluate(() => document.querySelector('#accountPassword').type), 'text');
    await page.click('[data-account-password-toggle]');
    assert.equal(await page.evaluate(() => document.querySelector('#accountPassword').type), 'password');
    await login(page);
    assert.equal(await modalOpen(page), false);
    await page.goto('#/jelajah');
    assert.equal(await count(page, '#catalog-products .product'), 4);
    await page.goto('#/upload');
    assert.equal(await count(page, '#uploadForm'), 1);
    await page.click('[data-account]');
    await page.click('[data-account-logout]');
    await page.waitFor(() => !!document.querySelector('main #accountForm'));
    await login(page, 'renter-demo-2', { register: true, skip: false });
    await verify(page);
    if (await count(page, '[data-account-continue]')) await page.click('[data-account-continue]');
    await page.waitFor(() => !!document.querySelector('.home-page'));
    const accounts = await page.evaluate(() => JSON.parse(localStorage.getItem('reoutfit.demo.accounts.v1')).accounts);
    assert.equal(accounts['renter-demo'].verification, 'unverified');
    assert.equal(accounts['renter-demo-2'].verification, 'verified');
    await page.call('Page.reload');
    await page.waitFor(() => !!document.querySelector('.home-page'));
    assert.equal(await modalOpen(page), false);
  });

  await test('checkout verify gate retains fields and pricing until confirmation', async page => {
    await seed(page, 'renter-demo', 'unverified');
    const start = await booking(page);
    assert.equal(await text(page, '#checkout-costs .total strong'), 'Rp281.500');
    await checkoutData(page, true);
    assert.equal(await text(page, '#checkout-costs .total strong'), 'Rp321.500');
    await page.click('#checkout-confirm');
    await page.waitFor(() => document.querySelector('#modal')?.open);
    assert.equal((await storedOrders(page)).length, 0);
    await page.key('Escape');
    assert.equal(await modalOpen(page), false);
    assert.equal(await value(page, '[name=receiver]'), 'Nara Demo');
    assert.equal(await value(page, '[name=address]'), 'Jalan Contoh No. 10, Kota Demo');
    assert.equal(await text(page, '#checkout-costs .total strong'), 'Rp321.500');
    await page.click('#checkout-confirm');
    await verify(page);
    await page.waitFor(() => location.hash === '#/pesanan');
    const orders = await storedOrders(page);
    assert.equal(orders.length, 1);
    assert.equal(orders[0].start, start);
    assert.equal(orders[0].total, 321500);
    assert.equal(orders[0].paymentStatus, 'unpaid-demo');
    for (const field of ['receiver', 'address', 'identityImage']) assert.equal(field in orders[0], false);
  });

  await test('checkout validation storage failure duplicate submit and conflict', async (page, newPage) => {
    await seed(page);
    await booking(page, 1);
    await page.fill('[name=receiver]', '   ');
    await page.fill('[name=phone]', '++++++++');
    await page.click('[name=payment][value=cod]');
    await page.click('[name=delivery][value=courier]');
    assert.equal(await page.evaluate(() => document.querySelector('[name=payment][value=cod]').disabled), true);
    await page.click('#checkout-confirm');
    assert.match(await text(page, '#checkout-receiver-error'), /wajib diisi/);
    assert.match(await text(page, '#checkout-phone-error'), /valid/);
    assert.match(await text(page, '#checkout-address-error'), /wajib diisi/);
    await checkoutData(page);
    await page.evaluate(() => {
      window.originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) { if (key === 'reoutfit.demo.shared.v1') throw new DOMException('test quota', 'QuotaExceededError'); return window.originalSetItem.call(this, key, value); };
    });
    await page.click('#checkout-confirm');
    assert.match(await text(page, '#checkout-submit-error'), /belum tersimpan/);
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
    const second = await newPage();
    await seed(second, 'renter-demo-2');
    await booking(second, 1);
    await checkoutData(second);
    await page.evaluate(() => { const form = document.querySelector('#checkoutForm'); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await page.waitFor(() => location.hash === '#/pesanan');
    assert.equal((await storedOrders(page)).length, 1);
    await second.click('#checkout-confirm');
    assert.match(await text(second, '#checkout-schedule-error'), /sudah dipesan/);
    assert.equal(await value(second, '[name=receiver]'), 'Nara Demo');
  });

  await test('rental lifecycle photos returns review and account isolation', async (page, newPage) => {
    await seed(page); await booking(page); await checkoutData(page); await page.click('#checkout-confirm');
    await page.waitFor(() => location.hash === '#/pesanan');
    const owner = await newPage(); await seed(owner, 'owner-lemari-nara'); await owner.goto('#/pesanan');
    await owner.setFiles('[data-condition-upload][data-stage=initialConditionPhotos] [data-condition-input]', [PHOTO]);
    await owner.click('[data-condition-upload][data-stage=initialConditionPhotos] [data-condition-save]');
    await page.waitFor(() => !document.querySelector('[data-receive]')?.disabled);
    await page.click('[data-receive]'); await page.setFiles('#evidence', [PHOTO]); await page.click('[name=conditionAgree]'); await clickSubmit(page, '#receiveForm');
    await page.waitFor(() => !!document.querySelector('a[href^="#/pengembalian/"]'));
    await page.click('a[href^="#/pengembalian/"]');
    await page.fill('[name=condition]', 'Baik, sesuai kondisi awal'); await page.setFiles('#evidence', [PHOTO]); await page.click('#returnForm [type=checkbox]'); await clickSubmit(page, '#returnForm');
    await owner.waitFor(() => !!document.querySelector('[data-condition-upload][data-stage=finalConditionPhotos]'));
    await owner.setFiles('[data-condition-upload][data-stage=finalConditionPhotos] [data-condition-input]', [PHOTO]);
    await owner.click('[data-condition-upload][data-stage=finalConditionPhotos] [data-condition-save]');
    await owner.waitFor(() => document.querySelectorAll('.condition-comparison .condition-evidence-list img').length === 2);
    await owner.click('[data-inspect]');
    await page.waitFor(() => !!document.querySelector('[data-review][data-review-side=renter]'));
    await page.click('[data-review][data-review-side=renter]');
    await page.fill('#reviewForm textarea', 'Komentar tetap tersedia'); await clickSubmit(page, '#reviewForm');
    assert.match(await text(page, '#reviewRatingError'), /1–5/);
    assert.equal(await value(page, '#reviewForm textarea'), 'Komentar tetap tersedia');
    await page.click('#reviewForm [name=rating][value="5"]');
    await page.fill('#reviewForm textarea', '<img src=x onerror=alert(1)> Contoh ulasan'); await clickSubmit(page, '#reviewForm');
    await page.goto('#/outfit/korean');
    assert.match(await text(page, 'main'), /<img src=x onerror=alert\(1\)> Contoh ulasan/);
    assert.equal(await count(page, 'img[src=x]'), 0);
    await page.seedAccount('renter-demo-2'); await page.goto('#/pesanan');
    assert.match(await text(page, 'main'), /Belum ada pesanan/);
  });

  await test('listing draft validation verification gate and publish', async page => {
    await seed(page, 'owner-lemari-kamu', 'unverified');
    await fillListing(page);
    assert.equal(await value(page, '[name=original]'), '1.000.000');
    await page.fill('#merchantPrice', '0'); await page.click('#publishListing');
    assert.match(await text(page, '#merchantPriceError'), /lebih dari Rp0/);
    await page.fill('#merchantPrice', '55000'); await page.fill('[name=brand]', '   '); await page.click('#publishListing');
    assert.match(await text(page, '#listing-brandError'), /wajib diisi/);
    await page.fill('[name=brand]', 'Brand demo');
    await page.click('#saveListingDraft'); await page.goto('#/jelajah'); await page.goto('#/upload');
    assert.equal(await value(page, '[name=name]'), 'Outfit Demo Baru');
    assert.equal(await count(page, '#photoPreview img'), 1);
    await page.click('#publishListing');
    await page.waitFor(() => document.querySelector('#modal')?.open);
    await page.key('Escape');
    assert.equal(await value(page, '[name=name]'), 'Outfit Demo Baru');
    assert.equal(await count(page, '#photoPreview img'), 1);
    await page.click('#publishListing'); await verify(page);
    await page.waitFor(() => location.hash === '#/merchant');
    assert.match(await text(page, 'main'), /Outfit Demo Baru/);
    assert.equal(await count(page, '.listing-row'), 1);
  });

  await test('chat safe text persistence cross-tab and account isolation', async (page, newPage) => {
    await seed(page); await page.goto('#/chat?product=korean');
    await page.waitFor(() => !!document.querySelector('#chatForm'));
    await page.fill('#chatInput', '   '); await clickSubmit(page, '#chatForm');
    assert.equal(await count(page, '.chat-message'), 0);
    const unsafe = '<img src=x onerror=alert(1)> Pesan contoh penyewa pertama';
    await page.fill('#chatInput', unsafe); await clickSubmit(page, '#chatForm');
    assert.match(await text(page, '#chatMessages'), /<img src=x onerror=alert\(1\)>/);
    assert.equal(await count(page, 'img[src=x]'), 0);
    await page.call('Page.reload'); await page.waitFor(() => !!document.querySelector('#chatForm'));
    assert.equal(await count(page, '.chat-message'), 1);
    const second = await newPage(); await seed(second, 'renter-demo-2'); await second.goto('#/chat?product=korean');
    assert.equal((await text(second, '#chatMessages')).includes('Pesan contoh penyewa pertama'), false);
    const owner = await newPage(); await seed(owner, 'owner-atelier-luna'); await owner.goto('#/chat?product=korean&renter=renter-demo');
    assert.equal(await count(owner, '#chatForm'), 0);
    await owner.seedAccount('owner-lemari-nara'); await owner.goto('#/chat?product=korean&renter=renter-demo');
    assert.match(await text(owner, '#chatMessages'), /Pesan contoh penyewa pertama/);
    await owner.fill('#chatInput', 'Tersedia, silakan pilih tanggal sewa.'); await clickSubmit(owner, '#chatForm');
    await page.waitFor(() => document.querySelector('#chatMessages')?.textContent.includes('Tersedia, silakan pilih tanggal sewa.'));
    await page.goto('#/chat?product=korean&renter=renter-demo%3A%3Aother');
    assert.equal(await count(page, '#chatForm'), 0);
  });

  await test('carousel keyboard dots wrap swipe and interaction pause', async page => {
    await seed(page);
    await page.waitFor(() => !!document.querySelector('.featured-rail[data-active]'));
    const total = await count(page, '[data-featured-dot]');
    assert.ok(total >= 4);
    await page.evaluate(() => document.querySelector('.featured-rail').focus());
    await page.key('End'); await delay(450);
    assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.active), String(total - 1));
    await page.key('ArrowRight'); await delay(450);
    assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.active), '0');
    await page.key('ArrowLeft'); await delay(450);
    assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.active), String(total - 1));
    await page.click('[data-featured-dot="1"]'); await delay(450);
    assert.equal(await page.evaluate(() => document.querySelector('[data-featured-dot="1"]').getAttribute('aria-pressed')), 'true');
    assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.playing), 'false');
    await page.call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    const point = await page.evaluate(() => { const r = document.querySelector('.featured-rail').getBoundingClientRect(); return { x: r.x + r.width * 0.65, y: r.y + r.height / 2 }; });
    await page.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, id: 1 }] });
    for (const delta of [45, 90, 150]) { await page.call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x - delta, y: point.y, id: 1 }] }); await delay(40); }
    await page.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await delay(500);
    assert.notEqual(await page.evaluate(() => document.querySelector('.featured-rail').dataset.active), '1', 'swipe changes the active outfit');
    await page.goto('#/jelajah');
    await page.goto('#/');
    assert.equal(await count(page, '.featured-playback'), 1);
    assert.equal(await count(page, '[data-featured-clone]'), 4, 'navigation must not duplicate clones');
  });

  await test('carousel autoplay suspends offscreen and respects reduced motion', async page => {
    await seed(page);
    await page.waitFor(() => document.querySelector('.featured-rail')?.dataset.playing === 'true');
    const active = await page.evaluate(() => document.querySelector('.featured-rail').dataset.active);
    await delay(3400);
    assert.notEqual(await page.evaluate(() => document.querySelector('.featured-rail').dataset.active), active, 'autoplay advances after 3 seconds');
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitFor(() => document.querySelector('.featured-rail')?.dataset.playing === 'false');
    const offscreen = await page.evaluate(() => document.querySelector('.featured-rail').dataset.active);
    await delay(3400);
    assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.active), offscreen);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitFor(() => document.querySelector('.featured-rail')?.dataset.playing === 'true');
    await page.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await page.waitFor(() => document.querySelector('.featured-rail')?.dataset.playing === 'false');
    const reduced = await page.evaluate(() => document.querySelector('.featured-rail').dataset.active);
    await delay(3400);
    assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.active), reduced);
    await page.click('[data-featured-dot="0"]');
    assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.active), '0');
    await page.goto('#/jelajah');
    await delay(600);
    assert.equal(await count(page, '.featured-rail'), 0);
  });
} finally {
  browser.close();
  await mkdir('artifacts/ui-review', { recursive: true });
  const output = `artifacts/ui-review/regression${filter ? '-' + filter.replace(/[^a-z0-9]+/gi, '-') : ''}.json`;
  await writeFile(output, JSON.stringify({ base: BASE, results }, null, 2));
  const failed = results.filter(result => result.status === 'FAIL').length;
  console.log(`${results.length - failed}/${results.length} browser scenarios passed; ${failed} failed.`);
  if (failed) process.exitCode = 1;
}
