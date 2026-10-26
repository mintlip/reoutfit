import { icon } from './icons.mjs';

// The password is a public demonstration code, never a real credential.
export const DEMO_PASSWORD = 'reoutfit123';

export function demoPasswordError(value) {
  if (!String(value || '')) return 'Isi kata sandi demo untuk melanjutkan.';
  return value === DEMO_PASSWORD ? '' : `Gunakan kata sandi demo ${DEMO_PASSWORD}.`;
}

export function safeAuthReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020#]/.test(value)) return '/';
  const path = value.split('?')[0].replace(/\/+$/, '') || '/';
  if (['/login', '/register'].includes(path.toLowerCase())) return '/';
  return value;
}

export function authHref(mode = 'login', returnTo = '/', role = '') {
  const params = new URLSearchParams({ next: safeAuthReturnPath(returnTo) });
  if (['renter', 'owner'].includes(role)) params.set('role', role);
  return `#/${mode === 'register' ? 'register' : 'login'}?${params}`;
}

const PHOTOS = Object.freeze([
  { file: 'friends.webp', alt: 'Dua teman tertawa memakai kacamata hitam dan outfit kasual' },
  { file: 'style.webp', alt: 'Dua teman tersenyum dengan mantel merah dan mantel kotak-kotak' },
  { file: 'city.webp', alt: 'Perempuan tersenyum memakai kemeja putih dan jeans di jalan kota' }
]);

export function authPageMarkup({ mode = 'login', returnTo = '/', role = '', form = '' } = {}) {
  const register = mode === 'register';
  return `<section class="page-shell auth-page" aria-labelledby="authPageTitle">
    <div class="auth-layout">
      <div class="auth-visual" aria-label="Inspirasi gaya reoutfit" aria-roledescription="slideshow">
        <div class="auth-slides">${PHOTOS.map((photo, index) => `<img class="auth-slide ${index === 0 ? 'is-active' : ''}" src="assets/auth/${photo.file}" alt="${photo.alt}" width="1000" height="1400" ${index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-auth-slide="${index}" aria-hidden="${index !== 0}">`).join('')}</div>
        <div class="auth-visual-copy"><span class="auth-visual-tag">Pakai. Nikmati. Kembalikan.</span><h2>Outfit baru,<br>cerita baru.</h2><p>Temukan gaya untuk setiap momen,<br>tanpa menambah isi lemari.</p></div>
        <div class="auth-slideshow-controls"><div class="auth-dots" aria-label="Pilih foto">${PHOTOS.map((_, index) => `<button type="button" class="auth-dot" data-auth-dot="${index}" aria-label="Tampilkan foto ${index + 1}" aria-pressed="${index === 0}"><span></span></button>`).join('')}</div><button type="button" class="auth-play" data-auth-play aria-label="Jeda slideshow foto" aria-pressed="false"><span data-auth-play-icon aria-hidden="true">${icon('pause')}</span><span data-auth-play-text>Jeda</span></button></div>
      </div>
      <div class="auth-form-panel"><div class="auth-form-shell"><p class="auth-eyebrow">Lebih banyak gaya, lebih sedikit barang.</p><h1 id="authPageTitle">${register ? 'Buat akun reoutfit' : 'Masuk ke reoutfit'}</h1><p class="auth-intro">${register ? 'Siap menyewa atau menyewakan? Mulai dari akun contoh pilihanmu.' : 'Outfit untuk momen berikutnya sudah menunggu. Yuk, masuk.'}</p>${form}
        <p class="auth-switch">${register ? 'Sudah punya akun?' : 'Baru di reoutfit?'} <a href="${authHref(register ? 'login' : 'register', returnTo, role)}" data-account-mode="${register ? 'login' : 'register'}">${register ? 'Masuk' : 'Buat akun'}</a></p>
        <p class="auth-local-note">Akun dan verifikasi masih simulasi. Gunakan alias dan kata sandi contoh; sesi masuk berlaku di tab ini.</p>
      </div></div>
    </div>
  </section>`;
}

// One controller per rendered auth page. Timers and observers never outlive it.
export function bindAuthSlideshow(root) {
  const visual = root?.querySelector('.auth-visual');
  if (!visual) return () => {};
  const abort = new AbortController();
  const slides = [...visual.querySelectorAll('[data-auth-slide]')];
  const dots = [...visual.querySelectorAll('[data-auth-dot]')];
  const play = visual.querySelector('[data-auth-play]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, timer = null, paused = reduced.matches, visible = false, destroyed = false;
  const photoMotion = globalThis.gsap?.matchMedia();
  const photoTweens = new Map();
  let motionIndex = -1;
  const stop = () => { clearInterval(timer); timer = null; };
  function syncPhotoMotion() {
    for (const [slideIndex, tween] of photoTweens) {
      if (slideIndex !== index) tween.pause();
      else {
        if (motionIndex !== index) tween.restart();
        if (timer) tween.play();
        else tween.pause();
      }
    }
    motionIndex = index;
  }
  function paint() {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === index);
      slide.setAttribute('aria-hidden', String(slideIndex !== index));
    });
    dots.forEach((dot, dotIndex) => dot.setAttribute('aria-pressed', String(dotIndex === index)));
    const stopped = paused || reduced.matches;
    play.setAttribute('aria-pressed', String(stopped));
    play.setAttribute('aria-label', reduced.matches ? 'Slideshow statis, pengurangan gerakan aktif' : stopped ? 'Putar slideshow foto' : 'Jeda slideshow foto');
    play.querySelector('[data-auth-play-icon]').innerHTML = icon(stopped ? 'play' : 'pause');
    play.querySelector('[data-auth-play-text]').textContent = reduced.matches ? 'Statis' : stopped ? 'Putar' : 'Jeda';
    play.disabled = reduced.matches;
    visual.dataset.active = String(index);
  }
  function schedule() {
    stop();
    const playing = !destroyed && !paused && !reduced.matches && visible && !document.hidden && slides.length > 1;
    if (playing) {
      slides.forEach(slide => { slide.loading = 'eager'; });
      timer = setInterval(() => { index = (index + 1) % slides.length; paint(); syncPhotoMotion(); }, 3000);
    }
    visual.dataset.playing = String(playing);
    syncPhotoMotion();
  }
  function pause() { paused = true; paint(); schedule(); }
  play.addEventListener('click', () => { paused = !paused; paint(); schedule(); }, { signal: abort.signal });
  dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => { index = dotIndex; pause(); }, { signal: abort.signal }));
  visual.addEventListener('focusin', event => { if (!event.target.closest('[data-auth-play]')) pause(); }, { signal: abort.signal });
  document.addEventListener('visibilitychange', schedule, { signal: abort.signal });
  const onReduced = () => { if (reduced.matches) paused = true; paint(); schedule(); };
  reduced.addEventListener('change', onReduced);
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    schedule();
  }, { threshold: .15 }) : null;
  if (observer) observer.observe(visual);
  else visible = true;
  slides.forEach(slide => {
    const fallback = () => {
      if (slide.dataset.fallback) return;
      slide.dataset.fallback = 'true';
      slide.src = 'assets/korean.webp';
      slide.alt = 'Inspirasi outfit reoutfit';
    };
    slide.addEventListener('error', fallback, { signal: abort.signal });
    if (slide.complete && !slide.naturalWidth) fallback();
  });
  photoMotion?.add('(prefers-reduced-motion: no-preference)', () => {
    motionIndex = -1;
    slides.forEach((slide, slideIndex) => photoTweens.set(slideIndex, globalThis.gsap.fromTo(slide,
      { scale: 1.035 },
      { scale: 1, duration: 3.65, ease: 'none', paused: true, immediateRender: false }
    )));
    syncPhotoMotion();
    return () => photoTweens.clear();
  }, visual);
  paint();
  schedule();
  return () => {
    destroyed = true;
    stop();
    photoMotion?.revert();
    abort.abort();
    observer?.disconnect();
    reduced.removeEventListener('change', onReduced);
  };
}
