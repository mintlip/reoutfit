import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { connectBrowser, delay } from './cdp.mjs';

const browser = await connectBrowser();
const results = [];
try {
  for (const width of [360, 390, 768, 1440]) {
    const context = await browser.context();
    const page = await context.page(width, width === 1440 ? 1000 : 844);
    const report = { width, views: [], errors: page.errors, failedRequests: page.failedRequests };
    try {
      const capture = async (name, selector = null) => {
        await page.evaluate(() => { for (const img of document.images) img.loading = 'eager'; });
        await page.waitFor(() => [...document.images].every(img => img.complete));
        await delay(500);
        const metrics = await page.evaluate(() => ({
          viewport: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          brokenImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).map(img => img.getAttribute('src')),
          title: document.querySelector('main h1')?.textContent,
          font: getComputedStyle(document.body).fontFamily
        }));
        report.views.push({ name, ...metrics });
        await page.screenshot(`artifacts/ui-review/after/${name}-${width}.png`, selector);
        assert.ok(metrics.scrollWidth <= width, `${name} ${width}: overflow ${metrics.scrollWidth}`);
        assert.deepEqual(metrics.brokenImages, [], `${name}: broken images`);
      };
      await page.goto(); await capture('login');
      await page.seedAccount(); await page.goto('#/');
      await capture('home'); await capture('navbar', '#header');
      await page.goto('#/upload'); await capture('listing');
      await page.goto('#/chat?product=korean');
      await page.waitFor(() => !!document.querySelector('#chatForm'));
      await page.fill('#chatInput', 'Halo, apakah outfit ini tersedia untuk acara akhir pekan?');
      await page.click('#chatForm [type=submit]');
      await capture('chat');
      for (const route of ['#/jelajah', '#/outfit/korean', '#/checkout', '#/pesanan']) {
        await page.goto(route);
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        report.views.push({ name: route, viewport: width, scrollWidth });
        assert.ok(scrollWidth <= width, `${route} ${width}: overflow ${scrollWidth}`);
      }
      assert.deepEqual(page.errors, [], `JavaScript exceptions at ${width}`);
      assert.deepEqual(page.failedRequests, [], `asset/network failures at ${width}`);
      report.status = 'PASS';
      console.log(`PASS screenshots and overflow: ${width}px`);
    } catch (error) {
      report.status = 'FAIL'; report.error = error.message;
      console.error(`FAIL ${width}px: ${error.message}`);
    } finally {
      results.push(report); await context.close();
    }
  }
} finally { browser.close(); }
await mkdir('artifacts/ui-review/after', { recursive: true });
await writeFile('artifacts/ui-review/after/report.json', JSON.stringify(results, null, 2));
if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;
