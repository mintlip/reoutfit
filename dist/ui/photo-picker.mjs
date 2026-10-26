import { icon } from './icons.mjs';
let pickerSequence = 0;

// Progressively enhance the actual file input: label, keyboard access and the
// native picker remain usable. Drag-and-drop dispatches the same change event.
export function enhanceFilePickers(holder = document) {
  const controller = new AbortController();
  const { signal } = controller;
  holder.querySelectorAll('input[type="file"]').forEach(input => {
    if (input.dataset.pickerReady) return;
    input.dataset.pickerReady = 'true';
    if (!input.id) input.id = `photo-input-${++pickerSequence}`;
    input.classList.add('file-native');
    const zone = input.closest('.upload-area,.condition-upload') || input.parentElement;
    zone.classList.add('file-dropzone');
    const row = document.createElement('div');
    row.className = 'file-picker-row';
    row.innerHTML = `<span class="file-picker-icon" aria-hidden="true">${icon('upload')}</span><button type="button" class="btn secondary">Pilih foto</button><p class="hidden text-xs text-muted sm:block">atau seret foto ke area ini</p>`;
    const label = input.closest('label');
    if (label && label.parentElement === zone) label.after(row);
    else input.after(row);
    const button = row.querySelector('button');
    button.setAttribute('aria-controls', input.id);
    button.addEventListener('click', () => input.click(), { signal });
    zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('is-dragging'); }, { signal });
    zone.addEventListener('dragleave', event => { if (!zone.contains(event.relatedTarget)) zone.classList.remove('is-dragging'); }, { signal });
    zone.addEventListener('drop', event => {
      event.preventDefault();
      zone.classList.remove('is-dragging');
      if (input.disabled || !event.dataTransfer?.files.length) return;
      try {
        const transfer = new DataTransfer();
        [...event.dataTransfer.files].slice(0, input.multiple ? undefined : 1).forEach(file => transfer.items.add(file));
        input.files = transfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } catch { button.focus(); }
    }, { signal });
  });
  return () => controller.abort();
}
