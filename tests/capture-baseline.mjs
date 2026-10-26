import { connectBrowser } from './cdp.mjs';
import { writeFile, mkdir } from 'node:fs/promises';

const browser = await connectBrowser();
const report = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.context();
    const page = await context.page(width, width === 1440 ? 1000 : 844);
    try {
      await page.goto();
      await page.screenshot(`artifacts/ui-review/before/home-${width}.png`);
      await page.screenshot(`artifacts/ui-review/before/navbar-${width}.png`, '#header');
      await page.click('[data-login]');
      await page.waitFor(() => document.querySelector('#modal')?.open);
      await page.screenshot(`artifacts/ui-review/before/login-${width}.png`);
      await page.evaluate(() => document.querySelector('#modal').close());
      await page.goto('#/upload');
      await page.screenshot(`artifacts/ui-review/before/listing-${width}.png`);
      await page.seedAccount();
      await page.goto('#/chat?product=korean');
      await page.waitFor(() => !!document.querySelector('#chatForm'));
      await page.fill('#chatInput', 'Halo, apakah outfit ini tersedia untuk acara akhir pekan?');
      await page.click('#chatForm [type=submit]');
      await page.screenshot(`artifacts/ui-review/before/chat-${width}.png`);
      report.push({ width, errors: page.errors, failedRequests: page.failedRequests });
      console.log(`Captured baseline ${width}: home, navbar, login, listing, chat`);
    } finally { await context.close(); }
  }
} finally { browser.close(); }
await mkdir('artifacts/ui-review/before', { recursive: true });
await writeFile('artifacts/ui-review/before/report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
