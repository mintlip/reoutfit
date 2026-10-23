export function homePage({ products, card, icon }) {
  const initial = products.length > 2 ? 1 : 0;
  return `<div class="container home-page">
    <section class="home-intro" aria-labelledby="home-title">
      <div><h1 id="home-title">Sewa outfit</h1><p>Cek ukuran dan kondisi, pilih jadwal, lalu lihat rincian biaya sewa.</p></div>
      <a href="#/jelajah" class="btn">Jelajahi outfit ${icon('search')}</a>
    </section>
    <section class="home-featured" aria-labelledby="featured-heading">
      <div class="section-heading"><h2 id="featured-heading">Pilihan outfit</h2><p class="small" id="featured-help">Geser atau gunakan tombol panah.</p></div>
      <div class="featured-rail" id="featured-outfits" tabindex="0" role="region" aria-roledescription="karusel" aria-label="Pilihan outfit" aria-describedby="featured-help" data-initial="${initial}">
        ${products.map((product, index) => `<div class="featured-item${index === initial ? ' is-active' : ''}" role="group" aria-label="${index + 1} dari ${products.length}">${card(product)}</div>`).join('')}
      </div>
      <div class="featured-controls">
        <button class="btn secondary featured-prev" type="button" aria-label="Outfit sebelumnya" aria-controls="featured-outfits"><span aria-hidden="true">←</span><span>Sebelumnya</span></button>
        <span class="small muted featured-position" aria-live="polite" aria-atomic="true">${products.length ? initial + 1 : 0} / ${products.length}</span>
        <button class="btn secondary featured-next" type="button" aria-label="Outfit berikutnya" aria-controls="featured-outfits"><span>Berikutnya</span><span aria-hidden="true">→</span></button>
      </div>
    </section>
    <section class="section">
      <div class="section-heading"><h2>Jelajahi kategori</h2><a class="btn ghost" href="#/jelajah">Lihat semua outfit</a></div>
      <div class="chips"><button class="chip active" data-home-cat="Semua">Semua outfit</button><button class="chip" data-home-cat="Korean style">Korean style</button><button class="chip" data-home-cat="Cosplay">Cosplay</button><button class="chip" data-home-cat="Dress">Dress</button><button class="chip" data-home-cat="Vest & formal">Vest &amp; formal</button></div>
      <div class="outfits" id="home-products">${products.map(card).join('')}</div>
    </section>
    <section class="section home-steps"><div class="section-heading"><h2>Cara sewa</h2></div><div class="steps">${[
      ['01', 'Pilih outfit & tanggal', 'Cek ukuran, kondisi, dan jadwal tersedia.'],
      ['02', 'Periksa ringkasan', 'Baca syarat, rincian biaya, dan total sewa.'],
      ['03', 'Konfirmasi pesanan', 'Lengkapi data dan konfirmasi untuk membuat pesanan.']
    ].map(step => `<div class="step"><b>${step[0]}</b><h3>${step[1]}</h3><p>${step[2]}</p></div>`).join('')}</div><p class="hint">Pengguna baru perlu masuk atau daftar dan verifikasi sebelum konfirmasi. Penerimaan dan pengembalian outfit dilanjutkan melalui Pesanan.</p></section>
    <section class="merchant-banner"><div><h2>Sewakan outfit</h2><p>Upload foto, isi detail, dan tentukan harga sewa.</p></div><a class="btn" href="#/upload">Mulai sewakan ${icon('plus')}</a></section>
  </div>`;
}

let releaseFeatured = () => {};

export function bindFeatured() {
  releaseFeatured();
  const rail = document.querySelector('.featured-rail');
  if (!rail) return () => {};
  const section = rail.closest('.home-featured');
  const items = [...rail.querySelectorAll('.featured-item')];
  const previous = section.querySelector('.featured-prev');
  const next = section.querySelector('.featured-next');
  const position = section.querySelector('.featured-position');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = Math.min(Number(rail.dataset.initial) || 0, Math.max(0, items.length - 1));
  let requested = null;
  let frame = 0;
  let settleTimer = 0;

  const update = index => {
    active = index;
    items.forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === index);
      item.classList.toggle('is-before', itemIndex < index);
      item.classList.toggle('is-after', itemIndex > index);
    });
    previous.disabled = !items.length || index === 0;
    next.disabled = !items.length || index === items.length - 1;
    const label = `${items.length ? index + 1 : 0} / ${items.length}`;
    if (position.textContent !== label) position.textContent = label;
  };

  const moveTo = (index, animate = true) => {
    if (!items.length) return;
    index = Math.max(0, Math.min(index, items.length - 1));
    requested = index;
    const item = items[index];
    // Layout coordinates stay stable while the card itself scales and rotates.
    const left = item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2;
    rail.scrollTo({ left, behavior: animate && !reducedMotion.matches ? 'smooth' : 'instant' });
    update(index);
  };

  const readPosition = () => {
    frame = 0;
    if (!items.length) return;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let closest = 0;
    let distance = Infinity;
    items.forEach((item, index) => {
      const delta = Math.abs(item.offsetLeft + item.offsetWidth / 2 - center);
      if (delta < distance) {
        distance = delta;
        closest = index;
      }
    });
    update(closest);
  };

  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(readPosition);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { requested = null; }, 150);
  };
  const onPrevious = () => moveTo((requested ?? active) - 1);
  const onNext = () => moveTo((requested ?? active) + 1);
  const onKey = event => {
    if (event.target !== rail || event.altKey || event.ctrlKey || event.metaKey) return;
    const destinations = { ArrowLeft: (requested ?? active) - 1, ArrowRight: (requested ?? active) + 1, Home: 0, End: items.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    moveTo(destinations[event.key]);
  };
  const onFocus = event => {
    const item = event.target.closest('.featured-item');
    if (item) moveTo(items.indexOf(item));
  };
  const onGesture = () => { requested = null; };
  const onResize = () => moveTo(active, false);
  rail.addEventListener('scroll', onScroll, { passive: true });
  rail.addEventListener('keydown', onKey);
  rail.addEventListener('focusin', onFocus);
  rail.addEventListener('pointerdown', onGesture, { passive: true });
  rail.addEventListener('wheel', onGesture, { passive: true });
  previous.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);
  window.addEventListener('resize', onResize);
  reducedMotion.addEventListener('change', onResize);
  update(active);
  moveTo(active, false);

  releaseFeatured = () => {
    cancelAnimationFrame(frame);
    clearTimeout(settleTimer);
    rail.removeEventListener('scroll', onScroll);
    rail.removeEventListener('keydown', onKey);
    rail.removeEventListener('focusin', onFocus);
    rail.removeEventListener('pointerdown', onGesture);
    rail.removeEventListener('wheel', onGesture);
    previous.removeEventListener('click', onPrevious);
    next.removeEventListener('click', onNext);
    window.removeEventListener('resize', onResize);
    reducedMotion.removeEventListener('change', onResize);
  };
  return releaseFeatured;
}
