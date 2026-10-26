// Complementary browser regressions. Uses the existing local server and Chrome
// debugging endpoint; every scenario owns a fresh isolated browser context.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { BASE, connectBrowser } from './cdp.mjs';

const browser = await connectBrowser();
const results = [];
const filter = process.env.REOUTFIT_TEST_FILTER || '';
const count = (page, selector) => page.evaluate(selector => document.querySelectorAll(selector).length, selector);
const text = (page, selector) => page.evaluate(selector => document.querySelector(selector)?.textContent || '', selector);

async function test(name, run) {
  if (filter && !name.includes(filter)) return;
  const context = await browser.context();
  const page = await context.page();
  const started = Date.now();
  try {
    await run(page);
    assert.deepEqual(page.errors, [], 'no browser JavaScript exceptions');
    assert.deepEqual(page.failedRequests, [], 'no failed local asset requests');
    results.push({ name, status: 'PASS', ms: Date.now() - started });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, status: 'FAIL', ms: Date.now() - started, error: error.stack, browserErrors: page.errors, failedRequests: page.failedRequests });
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    await context.close();
  }
}

async function login(page, alias = 'renter-demo') {
  await page.waitFor(() => !!document.querySelector('#accountForm'));
  await page.fill('#accountRole', alias.startsWith('owner') ? 'owner' : 'renter');
  await page.fill('#accountAlias', alias);
  await page.fill('#accountPassword', 'reoutfit123');
  await page.click('#accountForm [type=submit]');
}

async function uploadFiles(page, descriptors, method = 'input') {
  await page.evaluate(async (descriptors, method) => {
    const response = await fetch('assets/korean.webp');
    if (!response.ok) throw new Error('The valid upload fixture could not be fetched.');
    const photo = await response.blob();
    const transfer = new DataTransfer();
    for (const { name, kind = 'valid' } of descriptors) {
      const file = kind === 'text'
        ? new File(['File teks, bukan foto outfit.'], name, { type: 'text/plain' })
        : kind === 'large'
          ? new File([new Uint8Array(5 * 1024 * 1024 + 1)], name, { type: 'image/webp' })
          : new File([photo], name, { type: 'image/webp' });
      transfer.items.add(file);
    }
    const input = document.querySelector('#outfitPhotos');
    if (method === 'drop') {
      input.closest('.file-dropzone').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    } else {
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, descriptors, method);
  await page.waitFor(() => !document.querySelector('#outfitPhotos').disabled);
}

try {
  await test('mixed upload preserves valid photos removal and four-photo cap', async page => {
    await page.goto();
    await page.seedAccount('owner-lemari-kamu', 'verified');
    await page.goto('#/upload');
    await uploadFiles(page, [
      { name: 'depan.webp' },
      { name: 'catatan.txt', kind: 'text' },
      { name: 'terlalu-besar.webp', kind: 'large' },
      { name: 'belakang.webp' }
    ]);
    assert.equal(await count(page, '#photoPreview img'), 2, 'two valid images survive the rejected files');
    assert.match(await text(page, '#outfitPhotosError'), /catatan\.txt/);
    assert.match(await text(page, '#outfitPhotosError'), /JPEG|PNG|WebP/);
    assert.match(await text(page, '#outfitPhotosError'), /terlalu-besar\.webp/);
    assert.match(await text(page, '#outfitPhotosError'), /5 MB/);
    assert.deepEqual(await page.evaluate(() => [...document.querySelector('#outfitPhotos').files].map(file => file.name)), ['depan.webp', 'belakang.webp']);
    assert.match(await text(page, '#listingPhotoStatus'), /2 \/ 4 foto/);
    assert.equal(await count(page, '.photo-cover'), 1);

    await page.click('[data-listing-remove="0"]');
    assert.equal(await count(page, '#photoPreview img'), 1);
    assert.match(await text(page, '#photoPreview figcaption'), /Sampul.*belakang\.webp/);
    assert.equal(await text(page, '#outfitPhotosError'), '');

    await uploadFiles(page, [
      { name: 'detail-a.webp' }, { name: 'detail-b.webp' },
      { name: 'detail-c.webp' }, { name: 'foto-kelima.webp' }
    ], 'drop');
    assert.equal(await count(page, '#photoPreview img'), 4, 'drag and drop shares the native picker limit');
    assert.deepEqual(await page.evaluate(() => [...document.querySelector('#outfitPhotos').files].map(file => file.name)), ['belakang.webp', 'detail-a.webp', 'detail-b.webp', 'detail-c.webp']);
    assert.match(await text(page, '#outfitPhotosError'), /foto-kelima\.webp.*maksimal 4 foto/);
    assert.equal(await count(page, '.photo-cover'), 1);
    await page.click('[data-listing-remove="1"]');
    await uploadFiles(page, [{ name: 'pengganti.webp' }]);
    assert.equal(await count(page, '#photoPreview img'), 4, 'removing a photo frees a slot for a new file');
    assert.equal(await text(page, '#outfitPhotosError'), '');
    assert.match(await text(page, '#photoPreview'), /pengganti\.webp/);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('#photoPreview img')].every(image => image.complete && image.naturalWidth > 0)), true);
  });

  await test('guest direct chat returns to its outfit after login and skipped verification', async page => {
    const destination = '/chat?product=cosplay&from=%2Foutfit%2Fcosplay&renter=renter-demo';
    await page.goto('#' + destination);
    assert.equal(await page.evaluate(() => location.hash.split('?')[0]), '#/login');
    assert.equal(await page.evaluate(() => new URLSearchParams(location.hash.split('?')[1]).get('next')), destination);
    await login(page);
    await page.waitFor(() => !!document.querySelector('[data-account-later]'));
    await page.click('[data-account-later]');
    await page.waitFor(() => !!document.querySelector('#chatForm'));
    assert.equal(await page.evaluate(() => location.hash), '#' + destination);
    assert.match(await text(page, '.chat-outfit'), /Midnight Royal Costume/);
    assert.match(await text(page, '.chat-panel-heading'), /Atelier Luna/);
    assert.equal(await page.evaluate(() => document.querySelector('#chatForm').dataset.chatKey), 'product:cosplay:renter-demo');
    await page.fill('#chatInput', 'Apakah kostum ini tersedia untuk akhir pekan?');
    await page.click('#chatForm [type=submit]');
    assert.equal(await count(page, '.chat-message'), 1);
    const accounts = await page.evaluate(() => JSON.parse(localStorage.getItem('reoutfit.demo.accounts.v1')).accounts);
    assert.equal(accounts['renter-demo'].verification, 'unverified', 'chat does not require or silently grant verification');
  });

  await test('verified account login bypasses onboarding and keeps its destination', async page => {
    await page.goto('#/login?next=%2Fpesanan');
    await page.evaluate(() => {
      localStorage.setItem('reoutfit.demo.accounts.v1', JSON.stringify({ version: 1, accounts: { 'renter-demo': { registered: true, verification: 'verified' } } }));
      window.testVerificationOffers = 0;
      new MutationObserver(records => {
        for (const record of records) for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && (node.matches('[data-account-later]') || node.querySelector('[data-account-later]'))) window.testVerificationOffers++;
        }
      }).observe(document.querySelector('#modal'), { childList: true, subtree: true });
    });
    await login(page);
    await page.waitFor(() => location.hash === '#/pesanan' && !document.querySelector('#accountForm'));
    assert.equal(await page.evaluate(() => document.querySelector('#modal').open), false);
    assert.equal(await page.evaluate(() => window.testVerificationOffers), 0, 'no verification offer is inserted for an already verified account');
    assert.match(await text(page, 'main'), /Belum ada pesanan/);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('reoutfit.demo.account.session.v1')), 'renter-demo');
  });

  await test('GSAP loads reduces motion and releases animations across routes', async page => {
    await page.goto();
    assert.equal(await page.evaluate(() => typeof globalThis.gsap?.fromTo), 'function');
    assert.match(await page.evaluate(() => globalThis.gsap.version), /^\d+\./);
    await page.goto('#/upload');
    const feedback = await page.evaluate(() => {
      const target = document.querySelector('#listing-agree');
      target.checked = true;
      target.dispatchEvent(new Event('change', { bubbles: true }));
      window.testMotionTarget = target;
      return gsap.getTweensOf(target).length;
    });
    assert.ok(feedback > 0, 'native checkbox change receives the small GSAP response');
    await page.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await page.waitFor(() => gsap.getTweensOf(window.testMotionTarget).length === 0 && !window.testMotionTarget.style.transform);
    assert.equal(await page.evaluate(() => {
      const target = document.querySelector('#listing-agree');
      target.checked = false;
      target.dispatchEvent(new Event('change', { bubbles: true }));
      return gsap.getTweensOf(target).length;
    }), 0, 'reduced motion disables interaction animation');
    await page.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await page.waitFor(() => matchMedia('(prefers-reduced-motion: no-preference)').matches);
    await page.evaluate(() => {
      const target = document.querySelector('#listing-agree');
      target.dispatchEvent(new Event('change', { bubbles: true }));
      window.testMotionTarget = target;
      location.hash = '/jelajah';
    });
    await page.waitFor(() => !!document.querySelector('#catalog-products'));
    assert.equal(await page.evaluate(() => window.testMotionTarget.isConnected), false);
    assert.equal(await page.evaluate(() => gsap.getTweensOf(window.testMotionTarget).length), 0, 'route cleanup kills animation of the detached input');
    assert.equal(await page.evaluate(() => window.testMotionTarget.style.transform), '', 'route cleanup restores the detached target style');
    assert.equal(await page.evaluate(() => gsap.globalTimeline.getChildren(true, true, false).some(tween => tween.targets().some(target => target instanceof Element && !target.isConnected))), false, 'no detached DOM element remains in the GSAP timeline');
  });

  await test('Preline password controls stay single and are disposed on route changes', async page => {
    await page.goto();
    for (const route of ['#/login', '#/register', '#/jelajah', '#/login', '#/register', '#/jelajah', '#/login']) {
      await page.goto(route);
      const isAuth = route !== '#/jelajah';
      assert.equal(await count(page, '[data-account-password-toggle]'), isAuth ? 1 : 0);
      assert.equal(await page.evaluate(() => globalThis.$hsTogglePasswordCollection?.length || 0), isAuth ? 1 : 0, 'plugin registry follows the mounted auth form');
      if (!isAuth) {
        assert.equal(await page.evaluate(() => {
          window.testRetiredPasswordToggle.click();
          return window.testRetiredPassword.type;
        }), 'password', 'a detached old toggle has no remaining listener');
        continue;
      }
      assert.equal(await count(page, '#accountPassword'), 1);
      await page.click('[data-account-password-toggle]');
      assert.equal(await page.evaluate(() => document.querySelector('#accountPassword').type), 'text', 'one click reveals the password exactly once');
      assert.equal(await page.evaluate(() => document.querySelector('[data-account-password-toggle]').getAttribute('aria-pressed')), 'true');
      await page.click('[data-account-password-toggle]');
      assert.equal(await page.evaluate(() => document.querySelector('#accountPassword').type), 'password');
      await page.evaluate(() => {
        window.testRetiredPasswordToggle = document.querySelector('[data-account-password-toggle]');
        window.testRetiredPassword = document.querySelector('#accountPassword');
      });
    }
  });
} finally {
  browser.close();
  await mkdir('artifacts/ui-review', { recursive: true });
  await writeFile('artifacts/ui-review/extra-regression.json', JSON.stringify({ base: BASE, results }, null, 2));
  const failed = results.filter(result => result.status === 'FAIL').length;
  console.log(`${results.length - failed}/${results.length} extra browser scenarios passed; ${failed} failed.`);
  if (failed) process.exitCode = 1;
}
