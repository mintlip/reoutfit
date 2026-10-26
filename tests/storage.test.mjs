import test from 'node:test';
import assert from 'node:assert/strict';
import { safeSharedOrder, safeSharedProduct, mergeSharedDemo } from '../dist/core/storage.mjs';

const product = { id: 'test', name: 'Outfit demo', price: 55000, deposit: 100000, img: 'assets/korean.webp', ownerId: 'owner-lemari-nara' };
const order = { id: 'o1', product, start: '2026-11-10', days: 3, step: 0, total: 281500, renterId: 'renter-demo', ownerId: 'owner-lemari-nara' };
test('storage rejects corrupt date, duration, status and price instead of breaking rendering', () => {
  for (const change of [{ start: 'invalid' }, { days: -3 }, { days: 1.5 }, { step: 1.5 }, { step: 4 }, { product: { ...product, price: -1 } }]) {
    assert.equal(safeSharedOrder({ ...order, ...change }), null);
  }
});
test('order storage keeps identity/status metadata but drops personal and identity fields', () => {
  const clean = safeSharedOrder({ ...order, paymentStatus: 'unpaid-demo', receiver: 'private', address: 'private', nik: 'private', identityImage: 'private', verification: 'verified' });
  assert.equal(clean.renterId, order.renterId);
  assert.equal(clean.paymentStatus, 'unpaid-demo');
  for (const key of ['receiver', 'address', 'nik', 'identityImage']) assert.equal(Object.hasOwn(clean, key), false);
});
test('listing metadata preserves account ownership and forbids unknown fields and external image URLs', () => {
  const clean = safeSharedProduct({ ...product, custom: true, verification: 'verified', nik: 'private', img: 'javascript:alert(1)' });
  assert.equal(clean.ownerId, product.ownerId);
  assert.equal(clean.verification, 'verified');
  assert.equal(clean.img, '');
  assert.equal(Object.hasOwn(clean, 'nik'), false);
});
test('merging tabs preserves unrelated records and takes the latest edited order', () => {
  const remote = { listings: [], orders: [{ ...order, updatedAt: '2026-10-22T00:00:00Z' }], chats: {} };
  const local = { listings: [], orders: [{ ...order, step: 1, updatedAt: '2026-10-22T00:01:00Z' }, { ...order, id: 'o2' }], chats: {} };
  const merged = mergeSharedDemo(remote, local);
  assert.equal(merged.orders.length, 2);
  assert.equal(merged.orders.find(o => o.id === 'o1').step, 1);
});
test('chat merging preserves separate renter threads and keeps legacy records without assigning them', () => {
  const message = { id: 'm1', sender: 'renter', text: 'Contoh pesan', createdAt: '2026-10-22T00:00:00Z' };
  const remote = { chats: { 'product:test:renter-demo': [message], 'product:test': [message] } };
  const local = { chats: { 'product:test:renter-demo-2': [{ ...message, id: 'm2' }] } };
  const merged = mergeSharedDemo(remote, local);
  assert.equal(merged.chats['product:test:renter-demo'][0].id, 'm1');
  assert.equal(merged.chats['product:test:renter-demo-2'][0].id, 'm2');
  assert.equal(merged.chats['product:test'][0].id, 'm1');
});
