import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const BASE = process.env.REOUTFIT_TEST_URL || 'http://127.0.0.1:8000/';
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function connectBrowser() {
  const endpoint = process.env.REOUTFIT_CDP_URL || 'http://127.0.0.1:9222';
  const version = await (await fetch(`${endpoint}/json/version`)).json();
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map(), listeners = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timeout);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    } else for (const listener of listeners.get(message.sessionId) || []) listener(message);
  };
  function command(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  return {
    command,
    close() { socket.close(); },
    async context() {
      const { browserContextId } = await command('Target.createBrowserContext');
      return {
        async close() { await command('Target.disposeBrowserContext', { browserContextId }); },
        async page(width = 1440, height = 1000) {
          const { targetId } = await command('Target.createTarget', { url: 'about:blank', browserContextId });
          const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
          const call = (method, params) => command(method, params, sessionId);
          const errors = [], failedRequests = [];
          listeners.set(sessionId, [message => {
            if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
            if (message.method === 'Network.loadingFailed' && !message.params.canceled) failedRequests.push(message.params.errorText);
            if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) failedRequests.push(`${message.params.response.status} ${message.params.response.url}`);
          }]);
          await Promise.all([call('Page.enable'), call('Runtime.enable'), call('Network.enable')]);
          await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
          const page = {
            call, errors, failedRequests,
            async evaluate(fn, ...args) {
              const expression = typeof fn === 'function' ? `(${fn.toString()})(...${JSON.stringify(args)})` : fn;
              const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
              if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
              return result.result.value;
            },
            async waitFor(fn, timeout = 7000) {
              const start = Date.now();
              while (Date.now() - start < timeout) {
                if (await page.evaluate(fn)) return;
                await delay(60);
              }
              throw new Error(`Condition timeout: ${fn}`);
            },
            async goto(route = '') {
              await call('Page.navigate', { url: route.startsWith('http') ? route : BASE + route });
              await page.waitFor(() => document.readyState === 'complete' && !!document.querySelector('main h1'));
              await page.evaluate(() => document.fonts.ready);
              await delay(150);
            },
            async click(selector) {
              await page.evaluate(selector => { const el = document.querySelector(selector); if (!el) throw new Error(`Missing ${selector}`); el.click(); }, selector);
              await delay(80);
            },
            async fill(selector, value) {
              await page.evaluate((selector, value) => {
                const el = document.querySelector(selector);
                if (!el) throw new Error(`Missing ${selector}`);
                el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
              }, selector, value);
            },
            async setFiles(selector, paths) {
              const { root } = await call('DOM.getDocument');
              const { nodeId } = await call('DOM.querySelector', { nodeId: root.nodeId, selector });
              if (!nodeId) throw new Error(`Missing ${selector}`);
              await call('DOM.setFileInputFiles', { nodeId, files: paths });
              await delay(150);
            },
            async key(key, code = key) {
              const windowsVirtualKeyCode = { Escape: 27, Enter: 13, Tab: 9, ' ': 32, ArrowLeft: 37, ArrowRight: 39, Home: 36, End: 35 }[key] || 0;
              await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode });
              await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
              await delay(100);
            },
            async screenshot(path, selector = null) {
              await mkdir(dirname(path), { recursive: true });
              const clip = await page.evaluate(selector => {
                const el = selector ? document.querySelector(selector) : document.documentElement;
                const box = el.getBoundingClientRect();
                return selector ? { x: Math.max(0, box.x + scrollX), y: Math.max(0, box.y + scrollY), width: box.width, height: box.height, scale: 1 } : { x: 0, y: 0, width: innerWidth, height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight), scale: 1 };
              }, selector);
              const { data } = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
              await writeFile(path, Buffer.from(data, 'base64'));
            },
            async seedAccount(id = 'renter-demo', verification = 'verified') {
              await page.evaluate((id, verification) => {
                const saved = JSON.parse(localStorage.getItem('reoutfit.demo.accounts.v1') || '{"version":1,"accounts":{}}');
                saved.accounts[id] = { ...saved.accounts[id], registered: true, verification };
                localStorage.setItem('reoutfit.demo.accounts.v1', JSON.stringify(saved));
                sessionStorage.setItem('reoutfit.demo.account.session.v1', id);
              }, id, verification);
              await call('Page.reload');
              await delay(350);
              await page.waitFor(() => document.readyState === 'complete' && !!document.querySelector('[data-account]'));
            }
          };
          return page;
        }
      };
    }
  };
}
