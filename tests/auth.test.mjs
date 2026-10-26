import test from 'node:test';
import assert from 'node:assert/strict';
import { authHref, safeAuthReturnPath, demoPasswordError } from '../dist/ui/auth.mjs';
import { createAccountFlow } from '../dist/ui/account.mjs';

test('auth continuation keeps internal outfit, chat and checkout context', () => {
  for (const path of ['/checkout', '/upload', '/outfit/korean', '/chat?product=korean&renter=renter-demo&from=%2Fpesanan']) {
    assert.equal(safeAuthReturnPath(path), path);
    const query = authHref('login', path, 'owner').split('?')[1];
    const params = new URLSearchParams(query);
    assert.equal(params.get('next'), path);
    assert.equal(params.get('role'), 'owner');
  }
});

test('auth continuation rejects external paths, controls and login loops', () => {
  for (const path of [null, '', '//example.com', 'https://example.com', 'javascript:alert(1)', '/\\example.com', '/login', '/LOGIN/', '/register?next=/login', '/chat\n', '/#login']) {
    assert.equal(safeAuthReturnPath(path), '/');
  }
  assert.equal(authHref('unknown', '/'), '#/login?next=%2F');
});

test('only the documented demo password is accepted', () => {
  assert.equal(demoPasswordError('reoutfit123'), '');
  assert.match(demoPasswordError(''), /Isi kata sandi/);
  assert.match(demoPasswordError('private-password'), /reoutfit123/);
  assert.notEqual(demoPasswordError(' reoutfit123 '), '');
});

test('legacy account schema remains scoped to the selected preset with no credentials exposed', async () => {
  const previous = Object.fromEntries(['localStorage', 'sessionStorage', 'addEventListener'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const local = new Map([['reoutfit.demo.accounts.v1', JSON.stringify({ version: 1, accounts: {
    'renter-demo': { registered: true, verification: 'verified', password: 'discard', identityImage: 'discard' },
    'renter-demo-2': { registered: true, verification: 'unverified' }
  } })]]);
  const session = new Map([['reoutfit.demo.account.session.v1', 'renter-demo']]);
  const storage = map => ({ getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage(local) });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage(session) });
    Object.defineProperty(globalThis, 'addEventListener', { configurable: true, value: () => {} });
    const verified = createAccountFlow();
    assert.equal(verified.isVerified, true);
    assert.deepEqual(verified.user, { id: 'renter-demo', name: 'Penyewa Demo', role: 'renter', verification: 'verified' });
    let called = 0;
    assert.equal(await verified.ensureVerified(() => { called++; }, { role: 'renter' }), true);
    assert.equal(called, 1);
    session.set('reoutfit.demo.account.session.v1', 'renter-demo-2');
    const other = createAccountFlow();
    assert.equal(other.isVerified, false);
    assert.equal(other.user.verification, 'unverified');
  } finally {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
