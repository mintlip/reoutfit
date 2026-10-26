export function stableId(prefix) {
  const suffix = globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  return `${prefix}-${suffix}`
}
