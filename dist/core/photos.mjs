import { validatePhotos } from './rules.mjs';

// Validate each file independently so a rejected file never discards valid work.
export function selectPhotos(existing = [], incoming = [], limit = 4) {
  const accepted = [];
  const rejected = [];
  for (const file of incoming) {
    const error = validatePhotos([file]);
    if (error) rejected.push(`${file.name}: ${error}`);
    else if (existing.length + accepted.length >= limit) rejected.push(`${file.name}: maksimal ${limit} foto.`);
    else accepted.push(file);
  }
  return { accepted, rejected };
}
