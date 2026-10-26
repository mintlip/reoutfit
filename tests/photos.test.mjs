import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPhotos } from '../dist/core/photos.mjs';

const photo = (name = 'outfit.webp', size = 100) => ({ name, type: 'image/webp', size });
test('a mixed upload accepts valid photos without losing previously accepted files', () => {
  const existing = [photo('cover.webp')];
  const valid = photo('detail.webp');
  const result = selectPhotos(existing, [{ name: 'notes.txt', type: 'text/plain', size: 5 }, valid]);
  assert.deepEqual(result.accepted, [valid]);
  assert.equal(result.rejected.length, 1);
  assert.match(result.rejected[0], /notes.txt/);
  assert.equal(existing.length, 1);
});
test('upload capacity is checked after per-file validation and keeps input order', () => {
  const result = selectPhotos([photo(), photo(), photo()], [photo('too-big.webp', 5 * 1024 * 1024 + 1), photo('last.webp'), photo('extra.webp')]);
  assert.deepEqual(result.accepted.map(file => file.name), ['last.webp']);
  assert.equal(result.rejected.length, 2);
  assert.match(result.rejected[1], /maksimal 4 foto/);
});
test('exactly 5 MB is accepted and extension plus MIME must match', () => {
  const result = selectPhotos([], [photo('valid.webp', 5 * 1024 * 1024), photo('wrong.jpg')]);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.rejected.length, 1);
});
