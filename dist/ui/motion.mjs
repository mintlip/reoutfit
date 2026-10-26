// GSAP core is copied locally by the build; no runtime CDN request.
export function bindPageMotion(root) {
  const gsap = globalThis.gsap;
  if (!root || !gsap) return () => {};
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', context => {
    const intro = root.querySelector('.auth-form-shell, .home-intro, h1') || root.firstElementChild;
    if (intro) {
      const items = intro.matches('.auth-form-shell')
        ? intro.querySelectorAll(':scope > .auth-eyebrow, :scope > h1, :scope > .auth-intro, :scope > form, :scope > .auth-switch')
        : intro.matches('.home-intro') ? intro.querySelectorAll(':scope > div > *, :scope > a') : [intro];
      gsap.fromTo(items, { opacity: .72, y: 12 }, {
        opacity: 1, y: 0, duration: .38, stagger: .04, ease: 'power2.out', clearProps: 'opacity,transform'
      });
    }
    // Content stays visible before observation and clickable throughout animation.
    context.add('reveal', element => {
      gsap.fromTo(element, { opacity: .8, y: 10 }, {
        opacity: 1, y: 0, duration: .4, ease: 'power2.out', clearProps: 'opacity,transform'
      });
      const cards = element.querySelectorAll('.product, .home-steps li');
      if (cards.length) gsap.fromTo(cards, { opacity: .7, y: 12 }, {
        opacity: 1, y: 0, duration: .38, stagger: { each: .045, amount: Math.min(.18, cards.length * .045) },
        ease: 'power2.out', clearProps: 'opacity,transform'
      });
    });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      context.reveal(entry.target);
      observer.unobserve(entry.target);
    }), { threshold: .08 });
    root.querySelectorAll('.section, .merchant-banner').forEach(section => {
      if (section.getBoundingClientRect().top > innerHeight) observer.observe(section);
    });
    // Small feedback after native checkbox/radio changes, with no layout movement.
    context.add('feedback', element => gsap.fromTo(element, { scale: .92 }, {
      scale: 1, duration: .18, ease: 'power2.out', clearProps: 'transform', overwrite: true
    }));
    const change = event => {
      if (event.target.matches('input[type=checkbox], input[type=radio]')) context.feedback(event.target);
    };
    root.addEventListener('change', change);
    return () => { observer.disconnect(); root.removeEventListener('change', change); };
  }, root);
  return () => media.revert();
}
