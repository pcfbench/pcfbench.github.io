// Hero figure: cycles through four real design loops from the PCFBench case study
// (perceive → propose one edit → FDTD re-simulation). Data: data/hero_loops.json, built by build_data.py.

const fig = document.getElementById('hero-loop');
const loops = await fetch('data/hero_loops.json').then((r) => r.json());
const q = (s) => fig.querySelector(s);
const sB = q('.lp-s .b'), sA = q('.lp-s .a'), fB = q('.lp-f .b'), fA = q('.lp-f .a');
const edit = q('.lp-tag.edit'), out = q('.lp-tag.out'), scan = q('.lp-scan'), sweep = q('.lp-sweep');
const fam = q('.fam'), who = q('.who');
const steps = [...fig.querySelectorAll('.loop-steps li')];
const dotsBox = q('.loop-dots');

const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// preload every frame so swaps never flash
loops.forEach((l) => Object.values(l.images).forEach((src) => { const im = new Image(); im.src = src; }));

dotsBox.innerHTML = loops.map((l, i) =>
  `<button type="button" aria-pressed="${i === 0}" aria-label="Design loop ${i + 1}: ${esc(l.label)}"></button>`).join('');
const dots = [...dotsBox.querySelectorAll('button')];

function setContent(l, i) {
  sB.src = l.images.struct_before; sA.src = l.images.struct_after;
  fB.src = l.images.field_before; fA.src = l.images.field_after;
  sB.alt = `${l.label} cross-section before the edit`;
  fB.alt = `${l.label} mode field before the edit`;
  edit.textContent = `${l.param_label} ${fmt(l.before)} → ${fmt(l.after)}${l.unit ? ` ${l.unit}` : ''}`;
  out.innerHTML = `loss ${l.improved ? '<span class="down">↓</span>' : '<span class="up">↑</span>'} after re-simulation`;
  fam.textContent = l.label;
  who.textContent = `edit by ${l.model}`;
  dots.forEach((d, k) => d.setAttribute('aria-pressed', String(k === i)));
}
const setStep = (k) => steps.forEach((li, j) => li.classList.toggle('on', j === k));

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced || !window.gsap) {
  // static: show each loop's outcome, dots switch between loops
  fig.classList.add('static');
  setContent(loops[0], 0);
  setStep(2);
  dots.forEach((d, i) => d.addEventListener('click', () => setContent(loops[i], i)));
} else {
  const gsap = window.gsap;
  gsap.set([edit, out], { xPercent: -50, x: 0 });
  let current = null, idx = 0, visible = true;

  const build = (i) => {
    const l = loops[i];
    setContent(l, i);
    setStep(0);
    const tl = gsap.timeline({ paused: true, onComplete: () => show((i + 1) % loops.length) });
    tl.set([sA, fA, sB, fB], { opacity: 0 })
      .set([edit, out], { opacity: 0, y: 6 })
      .to([sB, fB], { opacity: 1, duration: 0.6, stagger: 0.15 }, 0.05)
      .fromTo(scan, { top: '-30%', opacity: 1 }, { top: '100%', duration: 1.2, ease: 'none' }, 0.4)
      .set(scan, { opacity: 0 }, 1.6)
      .call(() => setStep(1), null, 1.7)
      .to(edit, { opacity: 1, y: 0, duration: 0.4 }, 1.8)
      .call(() => setStep(2), null, 3.1)
      .to(sA, { opacity: 1, duration: 1.0 }, 3.2)
      .to(sB, { opacity: 0, duration: 1.0 }, 3.2)
      .fromTo(sweep, { left: '-40%', opacity: 1 }, { left: '100%', duration: 1.0, ease: 'power1.inOut' }, 3.5)
      .to(fA, { opacity: 1, duration: 0.9 }, 4.0)
      .to(fB, { opacity: 0, duration: 0.9 }, 4.0)
      .to(out, { opacity: 1, y: 0, duration: 0.4 }, 4.8)
      .to([sA, fA, edit, out], { opacity: 0, duration: 0.45 }, 7.0);
    return tl;
  };

  function show(i) {
    current?.kill();
    idx = i;
    current = build(i);
    if (visible && !document.hidden) current.play();
  }
  dots.forEach((d, i) => d.addEventListener('click', () => show(i)));

  // pause while the hero is off screen or the tab is hidden
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!current) return;
    if (visible && !document.hidden) current.play(); else current.pause();
  }, { threshold: 0.2 }).observe(fig);
  document.addEventListener('visibilitychange', () => {
    if (!current) return;
    if (document.hidden) current.pause(); else if (visible) current.play();
  });

  // screenshot hook: ?loop=<i>&ls=<seconds> freezes a frame
  const p = new URLSearchParams(location.search);
  if (p.has('loop')) {
    show(Number(p.get('loop')));
    const t = Number(p.get('ls') || 6);
    current.seek(t).pause();
    setStep(t < 1.7 ? 0 : t < 3.1 ? 1 : 2);
  } else {
    show(0);
  }
}
