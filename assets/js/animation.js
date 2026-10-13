// Darkroom animation: one real inverse-design run (case 7, Sequential Pipeline) replayed step by step.
// Every number shown here is read from data/case07.json, which build_data.py derives from the case-study files.

const stage = document.getElementById('stage');
const stepsEl = document.getElementById('steps');
const toggleBtn = document.getElementById('anim-toggle');
const replayBtn = document.getElementById('anim-replay');
const progressEl = document.getElementById('anim-progress');
const d = await fetch('data/case07.json').then((r) => r.json());

// ---------- derived values ----------
const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);
const words = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven' };
const pb = d.params_before, pa = d.params_after;
const famPred = d.family_pred.replace('solid_core_', 'solid-core ').replace(/_/g, ' ');
const famTrue = d.family_label.toLowerCase();
const mech = d.mechanism.replace(/\bTIR\b/, 'total internal reflection').replace(/^./, (c) => c.toLowerCase());
const decades = Math.log10(d.loss_before / d.predicted_loss);
const gain = d.loss_before / d.loss_after;
const dlBefore = pb.hole_d_um / pb.pitch_um, dlAfter = pa.hole_d_um / pa.pitch_um;
const logPos = (v) => `${((Math.log10(v) + 1) / 4) * 100}%`; // axis spans 0.1 to 1000 dB/km
const mark = (ok) => (ok ? '<span class="ok">✓</span>' : '<span class="x">✗</span>');

const STEPS = [
  { key: 'perception', name: 'Perception', ok: d.family_correct,
    html: `<span class="q">Which fibre is this?</span>Family: <b>${famPred}</b> ${mark(d.family_correct)}, it is actually ${famTrue}. Ring count ${mark(d.rings_correct)}.` },
  { key: 'understanding', name: 'Understanding', ok: false,
    html: `<span class="q">How lossy is it?</span>Predicted <b>${f1(d.predicted_loss)} dB/km</b> ${mark(false)} against a simulated ${f1(d.loss_before)} dB/km, about ${f1(decades)} orders of magnitude too optimistic.` },
  { key: 'reasoning', name: 'Reasoning', ok: d.wl_correct,
    html: `<span class="q">Why does it lose light?</span>Mechanism given as <b>${mech}</b>. Wavelength reasoning ${mark(d.wl_correct)}.` },
  { key: 'design', name: 'Design', ok: d.direction_correct,
    html: `<span class="q">What would you change?</span><b>${d.design_direction === 'increase' ? 'Increase' : 'Decrease'} the ${d.design_param}</b> ${mark(d.direction_correct)}. The benchmark applies a ×${d.step_factor} step, so Λ goes from ${f2(pb.pitch_um)} to ${f2(pa.pitch_um)} μm with the hole diameter fixed at ${f2(pb.hole_d_um)} μm (d/Λ ${f2(dlBefore)} → ${f2(dlAfter)}).` },
  { key: 'verify', name: 'Verify', ok: d.loss_after < d.loss_before,
    html: `<span class="q">Does the new fibre work?</span>FDTD re-simulation drops the loss from <b>${f1(d.loss_before)}</b> to <b>${f1(d.loss_after)} dB/km</b>, ${f1(gain)}× lower.` },
];

stepsEl.innerHTML = STEPS.map((s, i) => `
  <li class="step" data-step="${s.key}">
    <button type="button" aria-label="Jump to step ${i + 1}, ${s.name}">
      <span class="n">0${i + 1}</span><span class="name">${s.name}</span>
      <span class="mark ${s.ok ? 'ok' : 'bad'}">${s.ok ? '✓' : '✗'}</span>
    </button>
    <div class="readout"><div><p>${s.html}</p></div></div>
  </li>`).join('');

const q = (sel) => stage.querySelector(sel);
q('.tag-fam').innerHTML = `Model says ${famPred} ${mark(d.family_correct)}`;
q('.tag-pitch').innerHTML = `Λ ${f2(pb.pitch_um)} → ${f2(pa.pitch_um)} μm`;
q('.tag-mech').innerHTML = `“${d.mechanism}”`;
q('.mk-pred').style.left = logPos(d.predicted_loss);
q('.mk-sim').style.left = logPos(d.loss_before);
q('.mk-after').style.left = logPos(d.loss_after);
q('.outro').textContent = `The right move for the wrong reasons. PCFBench scores every stage, so this run ${d.e2e_success ? 'counts as an end-to-end success' : 'still counts as an end-to-end failure'}.`;
document.getElementById('task-footnote').textContent =
  `Real trajectory from the PCFBench case study. ${d.system} on case 7, a ${words[pb.core_count] || pb.core_count}-core PCF with ${words[pb.rings] || pb.rings} rings of air holes. Losses come from 2D FDTD simulation at 1550 nm.`;

const counterNum = q('.counter-num');
const stepItems = [...stepsEl.querySelectorAll('.step')];
function setActive(key) {
  const idx = STEPS.findIndex((s) => s.key === key);
  stepItems.forEach((li, i) => {
    li.classList.toggle('active', i === idx);
    li.classList.toggle('done', idx >= 0 && i < idx);
  });
}

// ---------- static fallback (reduced motion or GSAP unavailable) ----------
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced || !window.gsap) {
  stage.classList.add('static');
  stepsEl.parentElement.classList.add('static-panel');
  stepItems.forEach((li) => li.classList.add('done'));
  counterNum.textContent = `${f1(d.loss_before)} → ${f1(d.loss_after)}`;
  document.querySelector('.controls').hidden = true;
} else {
  buildTimeline(window.gsap);
}

function buildTimeline(gsap) {
  const counter = { v: d.loss_before };
  const sync = () => {
    counterNum.textContent = f1(counter.v);
    progressEl.style.width = `${tl.progress() * 100}%`;
    const label = tl.currentLabel();
    setActive(STEPS.some((s) => s.key === label) ? label : (label === 'outro' ? 'verify' : null));
  };
  const tl = gsap.timeline({ paused: true, onUpdate: sync, onComplete: () => { toggleBtn.textContent = 'Play'; } });

  gsap.set(stage.querySelectorAll('.tag'), { xPercent: -50, x: 0 });

  // stroke-draw setup for the glass rod
  const drawn = [...stage.querySelectorAll('.rod-body, .rod-back, .rod-face, .rod-beam')];
  drawn.forEach((el) => {
    const len = el.getTotalLength();
    gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
  });

  tl.addLabel('intro', 0)
    .to('.rod', { opacity: 1, duration: 0.4 }, 0)
    .to(drawn, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.12 }, 0.1)
    .fromTo('.rod-core', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'back.out(2)' }, 1.2)
    .addLabel('imaging', 2.2)
    .to('.rod', { opacity: 0, x: 60, duration: 0.6, ease: 'power2.in' }, 'imaging')
    .fromTo('.splate', { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 'imaging+=0.3')
    .fromTo('.fplate', { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 'imaging+=0.9')
    .fromTo('.halo', { opacity: 0 }, { opacity: 1, duration: 0.5, yoyo: true, repeat: 1 }, 'imaging+=1.3')

    .addLabel('perception', 4.4)
    .fromTo('.scan', { opacity: 1, top: '-25%' }, { top: '100%', duration: 1.6, ease: 'none' }, 'perception')
    .to('.scan', { opacity: 0, duration: 0.2 }, 'perception+=1.6')
    .fromTo('.tag-fam', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45 }, 'perception+=1.4')

    .addLabel('understanding', 7.4)
    .to('.logbar', { opacity: 1, duration: 0.5 }, 'understanding')
    .fromTo('.mk-sim', { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.45, transformOrigin: '50% 100%' }, 'understanding+=0.4')
    .fromTo('.mk-pred', { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'bounce.out' }, 'understanding+=1.0')

    .addLabel('reasoning', 10.2)
    .fromTo('.tag-mech', { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.45 }, 'reasoning')
    .fromTo('.halo', { opacity: 0 }, { opacity: 0.9, duration: 0.6, yoyo: true, repeat: 1 }, 'reasoning+=0.3')

    .addLabel('design', 12.8)
    .to('.tag-fam', { opacity: 0, duration: 0.3 }, 'design')
    .to('.s-after', { opacity: 1, duration: 1.2, ease: 'power1.inOut' }, 'design+=0.3')
    .to('.s-before', { opacity: 0, duration: 1.2, ease: 'power1.inOut' }, 'design+=0.3')
    .fromTo('.tag-pitch', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45 }, 'design+=0.5')

    .addLabel('verify', 15.8)
    .to('.tag-mech', { opacity: 0, duration: 0.3 }, 'verify')
    .to('.f-after', { opacity: 1, duration: 1.2 }, 'verify+=0.2')
    .to('.f-before', { opacity: 0, duration: 1.2 }, 'verify+=0.2')
    .to('.counter', { opacity: 1, duration: 0.4 }, 'verify+=0.5')
    .to(counter, { v: d.loss_after, duration: 1.8, ease: 'power2.out' }, 'verify+=0.8')
    .fromTo('.mk-after', { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.45, transformOrigin: '50% 100%' }, 'verify+=1.6')
    .to('.mk-pred', { opacity: 0.35, duration: 0.4 }, 'verify+=1.6')

    .addLabel('outro', 19.6)
    .to('.counter', { opacity: 0, duration: 0.4 }, 'outro')
    .fromTo('.outro', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7 }, 'outro+=0.3')
    .to({}, { duration: 3 }, 'outro+=1');

  // controls
  const play = () => { if (tl.progress() === 1) tl.restart(); else tl.play(); toggleBtn.textContent = 'Pause'; };
  const pause = () => { tl.pause(); toggleBtn.textContent = 'Play'; };
  toggleBtn.addEventListener('click', () => (tl.isActive() ? pause() : play()));
  replayBtn.addEventListener('click', () => { tl.restart(); toggleBtn.textContent = 'Pause'; });
  stepItems.forEach((li) => li.querySelector('button').addEventListener('click', () => {
    tl.seek(li.dataset.step).play();
    toggleBtn.textContent = 'Pause';
    sync();
  }));

  // debug / screenshot hook: ?t=<label> freezes the timeline at that step
  const t = new URLSearchParams(location.search).get('t');
  if (t) { tl.seek(t === 'end' ? tl.duration() : `${t}+=2.2`); tl.pause(); sync(); toggleBtn.textContent = 'Play'; return; }

  // autoplay once the stage is on screen, pause while it is off screen
  let started = false, wasPlaying = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      if (!started) { started = true; play(); } else if (wasPlaying) play();
    } else if (started) {
      wasPlaying = tl.isActive();
      if (wasPlaying) pause();
    }
  }, { threshold: 0.45 }).observe(stage);
  toggleBtn.textContent = 'Play';
  sync();
}
