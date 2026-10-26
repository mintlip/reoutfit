import { money } from '../core/rules.mjs';
import { icon } from './icons.mjs';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const playbackIcon = playing => icon(playing ? 'pause' : 'play');

function featuredOutfit(product, index, count) {
  const href = `#/outfit/${encodeURIComponent(product.id)}`;
  return `<article class="featured-item${index === 0 ? ' is-active' : ''}" data-featured-original data-featured-index="${index}" role="group" aria-roledescription="slide" aria-label="${index + 1} dari ${count}">
    <a class="featured-photo block aspect-[4/5] overflow-hidden rounded-panel bg-pink-soft focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus" href="${href}" aria-label="Lihat ${escapeHtml(product.name)}" draggable="false"><img class="h-full w-full object-cover" src="${escapeHtml(product.img)}" alt="${escapeHtml(product.name)}" width="400" height="500" ${index < 2 ? 'fetchpriority="high"' : 'loading="lazy"'} draggable="false"></a>
    <div class="px-1 pt-4"><h3 class="text-base font-semibold leading-snug tracking-normal sm:text-lg"><a class="hover:text-berry focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus" href="${href}">${escapeHtml(product.name)}</a></h3><p class="mt-1 text-sm text-muted"><strong class="font-semibold tabular-nums text-berry">${money(product.price)}</strong> / hari</p></div>
  </article>`;
}

export function homePage({ products, card }) {
  return `<div class="page-shell home-page min-w-0 pb-12">
    <section class="home-intro flex flex-col items-start justify-between gap-6 py-8 sm:py-12 lg:flex-row lg:items-end" aria-labelledby="home-title">
      <div class="max-w-2xl"><p class="mb-3 text-sm font-semibold tracking-wide text-berry">Gaya baru, cerita baru.</p><h1 id="home-title" class="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Sewa outfit</h1><p class="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">Outfit untuk setiap rencana. Pilih yang kamu suka, tentukan tanggal, lalu siap tampil.</p></div>
      <a href="#/jelajah" class="btn shrink-0">Jelajahi outfit ${icon('search')}</a>
    </section>
    <section class="home-featured min-w-0 pb-10" aria-labelledby="featured-heading">
      <h2 id="featured-heading" class="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">Pilihan outfit</h2>
      ${products.length ? `<div class="featured-rail" id="featured-outfits" tabindex="0" role="region" aria-roledescription="karusel" aria-label="Pilihan outfit" aria-describedby="featured-help" data-initial="0">
        <div class="featured-track">${products.map((product, index) => featuredOutfit(product, index, products.length)).join('')}</div>
      </div>
      <p id="featured-help" class="sr-only">Gunakan panah kiri dan kanan untuk mengganti outfit, atau pilih titik di bawah. Tombol Home ke outfit pertama dan End ke outfit terakhir. Tekan Spasi saat karusel terfokus untuk memutar atau menjeda pergantian otomatis.</p>
      <div class="featured-controls relative mt-3 flex flex-wrap items-center justify-center gap-3">
        <div class="flex flex-wrap items-center justify-center" role="group" aria-label="Pilih outfit">${products.map((product, index) => `<button class="featured-dot inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus" type="button" data-featured-dot="${index}" aria-label="Tampilkan ${escapeHtml(product.name)}" aria-controls="featured-outfits" aria-pressed="${index === 0}"><span aria-hidden="true"></span></button>`).join('')}</div>
        <button class="featured-playback sr-only focus:not-sr-only focus:absolute focus:top-full focus:left-1/2 focus:z-10 focus:mt-2 focus:inline-flex focus:min-h-11 focus:-translate-x-1/2 focus:items-center focus:gap-2 focus:rounded-full focus:border focus:border-border focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:whitespace-nowrap focus:text-ink focus:outline-3 focus:outline-offset-2 focus:outline-focus" type="button" aria-controls="featured-outfits" aria-label="Jeda pergantian outfit otomatis">${playbackIcon(true)}<span>Jeda</span></button>
      </div><p class="featured-announcement sr-only" role="status" aria-live="off" aria-atomic="true"></p>` : '<p class="py-12 text-muted">Belum ada outfit. Koleksi baru akan tampil di sini.</p>'}
    </section>
    <section class="section py-10" aria-labelledby="category-heading">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 id="category-heading" class="text-2xl font-semibold tracking-tight sm:text-3xl">Temukan gayamu</h2><a class="text-sm font-semibold text-berry underline-offset-4 hover:underline" href="#/jelajah">Lihat semua outfit ${icon('arrow-up-right')}</a></div>
      <div class="chips" role="group" aria-label="Kategori outfit"><button class="chip active" data-home-cat="Semua">Semua outfit</button><button class="chip" data-home-cat="Korean style">Korean style</button><button class="chip" data-home-cat="Cosplay">Cosplay</button><button class="chip" data-home-cat="Dress">Dress</button><button class="chip" data-home-cat="Vest & formal">Vest &amp; formal</button></div>
      <div class="outfits" id="home-products">${products.map(card).join('')}</div>
    </section>
    <section class="section home-steps border-t border-border py-10" aria-labelledby="steps-heading"><div class="mb-8"><p class="mb-2 text-sm font-semibold text-berry">Sesimpel itu.</p><h2 id="steps-heading" class="text-2xl font-semibold tracking-tight sm:text-3xl">Cara sewa</h2></div><ol class="grid gap-8 md:grid-cols-3">${[
      ['01', 'Pilih outfit & tanggal', 'Temukan gaya yang cocok. Cek ukuran, kondisi, dan jadwal tersedia.'],
      ['02', 'Periksa ringkasan', 'Lihat harga sewa, deposit, dan cara menerima outfit dalam satu tempat.'],
      ['03', 'Konfirmasi pesanan', 'Selesaikan verifikasi akun, lalu konfirmasi. Pantau semuanya di Pesanan.']
    ].map(step => `<li><span class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-pink-soft text-sm font-semibold text-berry" aria-hidden="true">${step[0]}</span><h3 class="text-lg font-semibold tracking-tight">${step[1]}</h3><p class="mt-2 max-w-sm text-sm leading-relaxed text-muted">${step[2]}</p></li>`).join('')}</ol></section>
    <section class="merchant-banner mt-8 flex flex-col items-start justify-between gap-6 rounded-panel bg-pink-soft p-6 sm:p-8 md:flex-row md:items-center"><div><p class="mb-2 text-sm font-semibold text-berry">Dari lemarimu, untuk cerita baru.</p><h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">Punya outfit yang jarang dipakai?</h2><p class="mt-3 text-muted">Foto, tentukan harga, dan mulai sewakan.</p></div><a class="btn shrink-0" href="#/upload">Mulai sewakan ${icon('plus')}</a></section>
  </div>`;
}

let releaseFeatured = () => {};

export function bindFeatured() {
  releaseFeatured();
  const rail = document.querySelector('.featured-rail');
  if (!rail) return () => {};
  const section = rail.closest('.home-featured');
  const track = rail.querySelector('.featured-track');
  const originals = [...track.querySelectorAll('[data-featured-original]')];
  const dots = [...section.querySelectorAll('[data-featured-dot]')];
  const playback = section.querySelector('.featured-playback');
  const announcement = section.querySelector('.featured-announcement');
  const help = section.querySelector('#featured-help');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const count = originals.length;
  const looping = count > 1;
  const leadingClones = looping ? 2 : 0;
  let active = 0;
  let slot = leadingClones;
  let wantsPlay = looping && !reducedMotion.matches;
  let visible = rail.getBoundingClientRect().top < window.innerHeight && rail.getBoundingClientRect().bottom > 0;
  let timer = 0;
  let settleTimer = 0;
  let frame = 0;
  let disposed = false;
  let gesture = null;
  let suppressClick = false;
  let playbackIntent = null;
  const listeners = [];

  const listen = (target, name, handler, options) => {
    target.addEventListener(name, handler, options);
    listeners.push(() => target.removeEventListener(name, handler, options));
  };

  // End clones keep the final-to-first transition moving in the same direction.
  // They are presentation only; keyboard and assistive tech use the originals.
  if (looping) {
    const clone = item => {
      const copy = item.cloneNode(true);
      copy.removeAttribute('data-featured-original');
      copy.dataset.featuredClone = '';
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('a, button').forEach(link => link.tabIndex = -1);
      return copy;
    };
    track.prepend(clone(originals[count - 2]), clone(originals[count - 1]));
    track.append(clone(originals[0]), clone(originals[1]));
  }
  const items = [...track.children];

  const clearAutoplay = () => {
    clearTimeout(timer);
    timer = 0;
  };

  const renderPlayback = () => {
    const manual = reducedMotion.matches || !looping;
    playback.disabled = manual;
    playback.setAttribute('aria-label', manual ? 'Pergantian otomatis nonaktif' : wantsPlay ? 'Jeda pergantian outfit otomatis' : 'Putar pergantian outfit otomatis');
    playback.innerHTML = playbackIcon(wantsPlay) + `<span>${manual ? 'Manual' : wantsPlay ? 'Jeda' : 'Putar'}</span>`;
    help.textContent = 'Gunakan panah kiri dan kanan untuk mengganti outfit, atau pilih titik di bawah. Tombol Home ke outfit pertama dan End ke outfit terakhir.' + (manual ? ' Pergantian otomatis nonaktif.' : ' Tekan Spasi saat karusel terfokus untuk memutar atau menjeda pergantian otomatis.');
    announcement.setAttribute('aria-live', wantsPlay ? 'off' : 'polite');
    rail.dataset.playing = String(wantsPlay && visible && !gesture && !document.hidden && !manual);
  };

  const schedule = () => {
    clearAutoplay();
    renderPlayback();
    if (disposed || !wantsPlay || !visible || gesture || document.hidden || reducedMotion.matches || !looping) return;
    timer = setTimeout(() => move(active + 1), 3000);
  };

  const pause = () => {
    wantsPlay = false;
    clearAutoplay();
    renderPlayback();
  };

  const place = animate => {
    cancelAnimationFrame(frame);
    track.classList.toggle('is-instant', !animate || reducedMotion.matches);
    const itemWidth = originals[0]?.offsetWidth || 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.style.transform = `translate3d(${(rail.clientWidth - itemWidth) / 2 - slot * (itemWidth + gap)}px, 0, 0)`;
    if (!animate) {
      // Commit the new position while transitions are disabled. Otherwise the
      // first animation frame can coalesce both writes and animate an initial
      // layout, resize or wrap, leaving the active photo visibly off-center.
      track.getBoundingClientRect();
      frame = requestAnimationFrame(() => track.classList.remove('is-instant'));
    }
  };

  const settle = () => {
    clearTimeout(settleTimer);
    if (!looping || (slot >= leadingClones && slot < count + leadingClones)) return;
    slot = active + leadingClones;
    place(false);
  };

  const update = () => {
    items.forEach(item => item.classList.toggle('is-active', Number(item.dataset.featuredIndex) === active));
    dots.forEach((dot, index) => dot.setAttribute('aria-pressed', String(index === active)));
    rail.dataset.active = String(active);
    announcement.textContent = `Outfit ${active + 1} dari ${count}: ${originals[active]?.querySelector('h3').textContent || ''}`;
  };

  function move(index, animate = true) {
    if (disposed || !count) return;
    settle();
    if (track.classList.contains('is-instant')) {
      // Commit a seamless wrap before beginning a subsequent user transition.
      track.getBoundingClientRect();
    }
    active = ((index % count) + count) % count;
    slot = looping ? index < 0 ? leadingClones - 1 : index >= count ? count + leadingClones : active + leadingClones : 0;
    update();
    place(animate);
    clearTimeout(settleTimer);
    if (reducedMotion.matches || !animate) settle();
    else settleTimer = setTimeout(settle, 460);
    schedule();
  }

  listen(track, 'transitionend', event => {
    if (event.target === track && event.propertyName === 'transform') settle();
  });
  dots.forEach((dot, index) => listen(dot, 'click', () => {
    pause();
    move(index);
  }));
  listen(playback, 'pointerdown', () => { playbackIntent = !wantsPlay; });
  listen(playback, 'click', () => {
    wantsPlay = !reducedMotion.matches && looping && (playbackIntent ?? !wantsPlay);
    playbackIntent = null;
    schedule();
  });
  listen(section, 'focusin', event => {
    // Pointer focus (including touching the page to scroll) is not a request to
    // stop playback. Keyboard focus deliberately keeps the carousel still.
    if (!event.target.matches(':focus-visible')) return;
    pause();
    const item = event.target.closest('[data-featured-original]');
    if (item && Number(item.dataset.featuredIndex) !== active) move(Number(item.dataset.featuredIndex));
  });
  listen(section, 'keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target === rail && event.key === ' ') {
      event.preventDefault();
      if (event.repeat) return;
      wantsPlay = looping && !reducedMotion.matches && !wantsPlay;
      schedule();
      return;
    }
    const destinations = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: count - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    pause();
    move(destinations[event.key]);
  });
  // Hover and ordinary page scrolling leave autoplay running. Only a gesture
  // in progress temporarily holds it; deliberate slide navigation pauses it.
  listen(rail, 'pointerdown', event => {
    if (event.button !== 0) return;
    suppressClick = false;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    schedule();
  }, { passive: true });
  listen(window, 'pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.25) { schedule(); return; }
    pause();
    suppressClick = true;
    move(active + (dx < 0 ? 1 : -1));
  }, { passive: true });
  listen(window, 'pointercancel', () => { gesture = null; schedule(); });
  listen(rail, 'click', event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);
  listen(window, 'resize', () => {
    settle();
    place(false);
  });
  listen(document, 'visibilitychange', schedule);
  listen(reducedMotion, 'change', () => {
    pause();
    settle();
    place(false);
  });

  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    schedule();
  }, { threshold: 0.1 }) : null;
  observer?.observe(rail);
  update();
  place(false);
  schedule();

  releaseFeatured = () => {
    if (disposed) return;
    disposed = true;
    clearAutoplay();
    clearTimeout(settleTimer);
    cancelAnimationFrame(frame);
    observer?.disconnect();
    listeners.forEach(remove => remove());
    track.querySelectorAll('[data-featured-clone]').forEach(item => item.remove());
  };
  return releaseFeatured;
}
