// Sample plates (one per family) and the detail sheet with L1–L4 annotations.

const grid = document.getElementById('sample-grid');
const sheet = document.getElementById('sheet');
const samples = await fetch('data/samples.json').then((r) => r.json());

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shortId = (id) => id.replace(/^PCF_.*_/, '#');

grid.innerHTML = samples.map((s, i) => `
  <button class="plate" type="button" data-i="${i}" aria-label="Open the ${esc(s.label)} sample">
    <span class="pair">
      <span class="pane"><img src="${s.struct}" alt="" loading="lazy" width="336" height="336"></span>
      <span class="pane fld">
        <img class="f1550" src="${s.field_1550}" alt="" loading="lazy" width="640" height="640">
        <img class="f1310" src="${s.field_1310}" alt="" loading="lazy" width="640" height="640">
        <span class="wl" aria-hidden="true"></span>
      </span>
    </span>
    <span class="name">${esc(s.label)}</span>
    <small>${esc(shortId(s.id))}</small>
  </button>`).join('');

// minimal, injection-safe markdown: escape first, then fences, ### headings and **bold**
function renderMarkdown(text) {
  return String(text ?? '').split(/```[a-zA-Z]*\n?/).map((part, i) => {
    if (i % 2) return `<pre><code>${esc(part.replace(/\n$/, ''))}</code></pre>`;
    return esc(part.trim())
      .replace(/^#{1,4}\s*(.+?)\s*$/gm, '<strong class="md-h">$1</strong>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }).filter(Boolean).join('\n');
}

const $ = (id) => document.getElementById(id);
const tabs = [...sheet.querySelectorAll('[role="tab"]')];
let current = null;

function showLevel(level) {
  tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.level === level)));
  const lv = current.levels[level] || {};
  $('sheet-q').textContent = lv.q || '';
  $('sheet-a').innerHTML = renderMarkdown(lv.a);
}

function open(i) {
  current = samples[i];
  $('sheet-title').textContent = current.label;
  $('sheet-id').textContent = current.id;
  const img = (id, src, alt) => { $(id).src = src; $(id).alt = alt; };
  img('sheet-struct', current.struct, `${current.label} cross-section`);
  img('sheet-f1310', current.field_1310, `${current.label} mode field at 1310 nm`);
  img('sheet-f1550', current.field_1550, `${current.label} mode field at 1550 nm`);
  showLevel('level1');
  sheet.showModal();
  sheet.querySelector('.sheet-in').scrollTop = 0;
}

grid.addEventListener('click', (e) => {
  const plate = e.target.closest('.plate');
  if (plate) open(Number(plate.dataset.i));
});
tabs.forEach((t) => t.addEventListener('click', () => showLevel(t.dataset.level)));
sheet.querySelector('.sheet-close').addEventListener('click', () => sheet.close());
sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });
