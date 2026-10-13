// Hero figure: four real design loops from the PCFBench case study, shown side by side and animated in sync
// (perceive → propose one edit → FDTD re-simulation). Data: data/hero_loops.json, built by build_data.py.

const fig = document.getElementById('hero-loop');
const grid = document.getElementById('loop-grid');
const steps = [...fig.querySelectorAll('.loop-steps li')];
const loops = await fetch('data/hero_loops.json').then((r) => r.json());

const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

grid.innerHTML = loops.map((l) => `
  <div class="lc">
    <div class="lc-panes">
      <div class="lp lp-s">
        <img class="b" src="${l.images.struct_before}" alt="${esc(l.label)} cross-section" width="480" height="480">
        <img class="a" src="${l.images.struct_after}" alt="" width="480" height="480">
        <div class="lp-scan"></div>
      </div>
      <div class="lp lp-f">
        <img class="b" src="${l.images.field_before}" alt="${esc(l.label)} mode field at 1550 nm" width="560" height="560">
        <img class="a" src="${l.images.field_after}" alt="" width="560" height="560">
        <div class="lp-sweep"></div>
        <span class="lc-out ${l.improved ? 'down' : 'up'}">loss <b>${l.improved ? '↓' : '↑'}</b></span>
      </div>
    </div>
    <p class="lc-fam">${esc(l.label)}</p>
    <p class="lc-edit">${esc(l.model)}<span class="chg"><i class="sep"> · </i>${esc(l.param_short)} ${fmt(l.before)} → ${fmt(l.after)}${l.unit ? ` ${l.unit}` : ''}</span></p>
  </div>`).join('');

const all = (sel) => [...grid.querySelectorAll(sel)];
const setStep = (k) => steps.forEach((li, j) => li.classList.toggle('on', j === k));

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced || !window.gsap) {
  fig.classList.add('static');
} else {
  const gsap = window.gsap;
  const S = 0.12; // small stagger so the four cards move as a wave, not in lockstep
  const tl = gsap.timeline({ repeat: -1, paused: true });
  tl.call(() => setStep(0), null, 0)
    .fromTo(all('.lp-scan'), { top: '-30%', opacity: 1 }, { top: '100%', duration: 1.2, ease: 'none', stagger: S }, 0.3)
    .set(all('.lp-scan'), { opacity: 0 }, 1.9)
    .call(() => setStep(1), null, 1.9)
    .to(all('.lc-edit .chg'), { opacity: 1, duration: 0.4, stagger: S }, 2.0)
    .call(() => setStep(2), null, 3.2)
    .to(all('.lp-s .a'), { opacity: 1, duration: 1.0, stagger: S }, 3.3)
    .to(all('.lp-s .b'), { opacity: 0, duration: 1.0, stagger: S }, 3.3)
    .fromTo(all('.lp-sweep'), { left: '-45%', opacity: 1 }, { left: '100%', duration: 1.0, ease: 'power1.inOut', stagger: S }, 3.6)
    .to(all('.lp-f .a'), { opacity: 1, duration: 0.9, stagger: S }, 4.1)
    .to(all('.lp-f .b'), { opacity: 0, duration: 0.9, stagger: S }, 4.1)
    .fromTo(all('.lc-out'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', stagger: S }, 4.9)
    // hold on the outcome, then fade back to the starting fibres
    .call(() => setStep(-1), null, 7.4)
    .to(all('.lp .a, .lc-out, .lc-edit .chg'), { opacity: 0, duration: 0.6 }, 7.6)
    .to(all('.lp .b'), { opacity: 1, duration: 0.6 }, 7.6)
    .to({}, { duration: 0.4 }, 8.2);

  // pause while off screen or the tab is hidden
  let visible = true, frozen = false;
  const sync = () => (!frozen && visible && !document.hidden ? tl.play() : tl.pause());
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.2 }).observe(fig);
  document.addEventListener('visibilitychange', sync);

  // screenshot hook: ?ls=<seconds> freezes a frame
  const t = new URLSearchParams(location.search).get('ls');
  if (t !== null) {
    const v = Number(t);
    tl.seek(v).pause();
    setStep(v < 1.9 ? 0 : v < 3.2 ? 1 : v < 7.4 ? 2 : -1);
    frozen = true;
  } else {
    sync();
  }
}
