// Real browser timing checks. Requires the existing local HTTP/CDP endpoints.
// Prints results only; it deliberately does not write screenshots or reports.
import assert from 'node:assert/strict';
import { connectBrowser, delay } from './cdp.mjs';

const browser = await connectBrowser();
const filter = process.env.REOUTFIT_TEST_FILTER || '';
let passed = 0, failed = 0;

async function scenario(name, run) {
  if (filter && !name.includes(filter)) return;
  const context = await browser.context();
  const page = await context.page();
  try {
    await run(page);
    assert.deepEqual(page.errors, [], 'no JavaScript exceptions');
    assert.deepEqual(page.failedRequests, [], 'no failed asset requests');
    passed++;
    console.log(`PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}: ${error.stack}`);
  } finally { await context.close(); }
}

const homeIndex = page => page.evaluate(() => Number(document.querySelector('.featured-rail').dataset.active));
const authIndex = page => page.evaluate(() => Number(document.querySelector('[data-auth-slide].is-active').dataset.authSlide));

async function homeAdvance(page, previous, expected) {
  const start = Date.now();
  while (Date.now() - start < 4200) {
    const current = await homeIndex(page);
    if (current !== previous) {
      assert.equal(current, expected, 'home advances in sequence, including final-to-first');
      return;
    }
    await delay(80);
  }
  throw new Error(`Home autoplay did not advance from ${previous} within 4.2 seconds`);
}

async function authAdvance(page, previous, expected) {
  const start = Date.now();
  while (Date.now() - start < 4200) {
    const current = await authIndex(page);
    if (current !== previous) {
      assert.equal(current, expected, 'auth advances in sequence, including final-to-first');
      return;
    }
    await delay(80);
  }
  throw new Error(`Auth autoplay did not advance from ${previous} within 4.2 seconds`);
}

try {
  await Promise.all([
    scenario('home 3-second loop keeps moving through hover and page scrolling', async page => {
      await page.goto();
      await page.seedAccount();
      await page.goto('#/');
      await page.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
      await page.waitFor(() => document.querySelector('.featured-rail')?.dataset.playing === 'true');
      assert.equal(await page.evaluate(() => document.hidden), false);
      const count = await page.evaluate(() => document.querySelectorAll('[data-featured-original]').length);
      assert.equal(count, 4);
      assert.equal(await homeIndex(page), 0);
      for (let next = 1; next <= count; next++) await homeAdvance(page, (next - 1) % count, next % count);
      await delay(550);
      const centerError = await page.evaluate(() => {
        const rail = document.querySelector('.featured-rail').getBoundingClientRect();
        const active = document.querySelector('[data-featured-original].is-active').getBoundingClientRect();
        return Math.abs(active.x + active.width / 2 - rail.x - rail.width / 2);
      });
      assert.ok(centerError < 2, `last-to-first stays centered (${centerError}px)`);
      const point = await page.evaluate(() => { const rect = document.querySelector('.featured-rail').getBoundingClientRect(); return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + 100) }; });
      await page.call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
      assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.playing), 'true');
      const hovered = await homeIndex(page);
      await homeAdvance(page, hovered, (hovered + 1) % count);
      await page.call('Input.dispatchMouseEvent', { type: 'mouseWheel', ...point, deltaX: 0, deltaY: 80 });
      await delay(150);
      assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.playing), 'true', 'ordinary wheel scrolling does not stop autoplay');
      const scrolled = await homeIndex(page);
      await homeAdvance(page, scrolled, (scrolled + 1) % count);
      await page.call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      const touchPoint = await page.evaluate(() => { const rect = document.querySelector('.featured-rail').getBoundingClientRect(); return { x: Math.round(rect.x + rect.width * .6), y: Math.round(rect.y + 150) }; });
      await page.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...touchPoint, id: 1 }] });
      for (const distance of [40, 80, 120]) {
        await page.call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchPoint.x, y: touchPoint.y + distance, id: 1 }] });
        await delay(50);
      }
      await page.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitFor(() => document.querySelector('.featured-rail').dataset.playing === 'true');
      const touched = await homeIndex(page);
      await homeAdvance(page, touched, (touched + 1) % count);
      const swipePoint = await page.evaluate(() => { const rect = document.querySelector('.featured-rail').getBoundingClientRect(); return { x: Math.round(rect.x + rect.width * .6), y: Math.round(rect.y + 150) }; });
      const beforeSwipe = await homeIndex(page);
      await page.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...swipePoint, id: 1 }] });
      for (const distance of [40, 80, 150]) {
        await page.call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: swipePoint.x - distance, y: swipePoint.y, id: 1 }] });
        await delay(50);
      }
      await page.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await delay(450);
      assert.equal(await homeIndex(page), (beforeSwipe + 1) % count, 'deliberate horizontal swipe changes slides');
      assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.playing), 'false', 'manual horizontal swipe pauses');
      await page.click('[data-featured-dot="2"]');
      assert.equal(await homeIndex(page), 2);
      assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.playing), 'false');
      await delay(3400);
      assert.equal(await homeIndex(page), 2, 'manual navigation intentionally stays paused');
      await page.evaluate(() => document.querySelector('.featured-rail').focus());
      await page.key(' ', 'Space');
      assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.playing), 'true');
      await page.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await page.waitFor(() => document.querySelector('.featured-rail').dataset.playing === 'false');
      await page.key(' ', 'Space');
      assert.equal(await page.evaluate(() => document.querySelector('.featured-rail').dataset.playing), 'false');
      await page.click('[data-featured-dot="0"]');
      assert.equal(await homeIndex(page), 0, 'manual navigation remains available in reduced motion');
      await page.evaluate(() => { window.retiredRail = document.querySelector('.featured-rail'); });
      await page.goto('#/jelajah');
      assert.equal(await page.evaluate(() => window.retiredRail.isConnected), false);
      assert.equal(await page.evaluate(() => window.retiredRail.querySelectorAll('[data-featured-clone]').length), 0, 'route cleanup removes carousel clones');
    }),
    scenario('auth real autoplay loop manual dots reduced motion and cleanup', async page => {
      await page.goto();
      assert.equal(await page.evaluate(() => document.hidden), false);
      assert.equal(await authIndex(page), 0);
      for (let next = 1; next <= 3; next++) await authAdvance(page, (next - 1) % 3, next % 3);
      await page.click('[data-auth-dot="2"]');
      assert.equal(await authIndex(page), 2);
      assert.equal(await page.evaluate(() => document.querySelector('[data-auth-dot="2"]').getAttribute('aria-pressed')), 'true');
      await delay(3400);
      assert.equal(await authIndex(page), 2, 'manual dot selection intentionally pauses autoplay');
      await page.evaluate(() => document.querySelector('[data-auth-play]').focus());
      await page.click('[data-auth-play]');
      await authAdvance(page, 2, 0);
      await page.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await page.waitFor(() => document.querySelector('[data-auth-play]').disabled);
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('[data-auth-slide]')].some(slide => gsap.getTweensOf(slide).length)), false, 'reduced motion removes auth photo drift');
      await page.click('[data-auth-dot="1"]');
      assert.equal(await authIndex(page), 1);
      await delay(3400);
      assert.equal(await authIndex(page), 1, 'reduced motion keeps photo static');
      await page.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
      await page.evaluate(() => {
        window.retiredSlides = [...document.querySelectorAll('[data-auth-slide]')];
        window.retiredDot = document.querySelector('[data-auth-dot="2"]');
        window.retiredAuthChanges = 0;
        window.retiredAuthObserver = new MutationObserver(records => { window.retiredAuthChanges += records.length; });
      });
      await page.goto('#/jelajah');
      await page.evaluate(() => window.retiredSlides.forEach(slide => window.retiredAuthObserver.observe(slide, { attributes: true })));
      await page.evaluate(() => window.retiredDot.click());
      await delay(3400);
      assert.equal(await page.evaluate(() => window.retiredAuthChanges), 0, 'retired auth slides have no timer or dot listeners');
      assert.equal(await page.evaluate(() => window.retiredSlides.some(slide => gsap.getTweensOf(slide).length)), false, 'route cleanup releases photo animation targets');
      await page.evaluate(() => window.retiredAuthObserver.disconnect());
    })
  ]);

  await scenario('shared motion respects reduced preference and cleans route targets', async page => {
    await page.goto('#/upload');
    assert.equal(await page.evaluate(() => typeof globalThis.gsap?.fromTo), 'function');
    await page.evaluate(() => {
      window.retiredMotionTarget = document.querySelector('#listing-agree');
      window.retiredMotionTarget.dispatchEvent(new Event('change', { bubbles: true }));
    });
    assert.ok(await page.evaluate(() => gsap.getTweensOf(window.retiredMotionTarget).length) > 0);
    await page.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await page.waitFor(() => gsap.getTweensOf(window.retiredMotionTarget).length === 0);
    await page.evaluate(() => window.retiredMotionTarget.dispatchEvent(new Event('change', { bubbles: true })));
    assert.equal(await page.evaluate(() => gsap.getTweensOf(window.retiredMotionTarget).length), 0);
    await page.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await page.evaluate(() => window.retiredMotionTarget.dispatchEvent(new Event('change', { bubbles: true })));
    await page.goto('#/jelajah');
    assert.equal(await page.evaluate(() => gsap.getTweensOf(window.retiredMotionTarget).length), 0);
    assert.equal(await page.evaluate(() => window.retiredMotionTarget.style.transform), '');
    assert.equal(await page.evaluate(() => gsap.globalTimeline.getChildren(true, true, false).some(tween => tween.targets().some(target => target instanceof Element && !target.isConnected))), false);
  });
} finally { browser.close(); }
console.log(`${passed}/${passed + failed} motion scenarios passed.`);
if (failed) process.exitCode = 1;
