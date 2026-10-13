// Leaderboard: single-VLM table (41 × 19) and multi-agent table (14 rows × 3 backbones × 3 metrics).
// Numbers are shown exactly as typeset in the paper; top-3 marks come from the paper, not recomputed.

const [lb, mas] = await Promise.all([
  fetch('data/leaderboard.json').then((r) => r.json()),
  fetch('data/mas.json').then((r) => r.json()),
]);

const GROUP_COLOR = {
  geometry: 'var(--dim-geo)', physics: 'var(--dim-phy)', text: 'var(--dim-txt)',
  multimodal: 'var(--dim-mm)', inverse: 'var(--dim-inv)', code: 'var(--dim-code)',
};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rankClass = (r) => (r ? ` r${r}` : '');
const sizeNum = (s) => (s ? parseFloat(s) : Infinity);

const state = { dim: 'all', type: 'all', key: null, dir: 0 };
const single = document.getElementById('lb-single');

// ---------- controls ----------
const dimChips = document.getElementById('dim-chips');
dimChips.innerHTML = `<button class="chip" data-dim="all" aria-pressed="true">All dimensions</button>` +
  lb.groups.map((g) => `<button class="chip" data-dim="${g.key}" aria-pressed="false" style="--c:${GROUP_COLOR[g.key]}"><i></i>${esc(g.label)}</button>`).join('');

function press(container, attr, value) {
  container.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset[attr] === value)));
}
dimChips.addEventListener('click', (e) => {
  const c = e.target.closest('.chip'); if (!c) return;
  state.dim = c.dataset.dim; press(dimChips, 'dim', state.dim); renderSingle();
});
const typeChips = document.getElementById('type-chips');
typeChips.addEventListener('click', (e) => {
  const c = e.target.closest('.chip'); if (!c) return;
  state.type = c.dataset.type; press(typeChips, 'type', state.type); renderSingle();
});

// ---------- single-VLM table ----------
function visibleColumns() {
  return lb.columns.filter((c) => state.dim === 'all' || c.group === state.dim);
}

function sortedModels() {
  let rows = lb.models.map((m, i) => ({ ...m, order: i }));
  if (state.type !== 'all') rows = rows.filter((m) => m.type === state.type);
  if (!state.key) return rows;
  const dir = state.dir;
  const val = state.key === '__size' ? (m) => sizeNum(m.size) : (m) => m.scores[state.key];
  return rows.sort((a, b) => {
    const va = val(a), vb = val(b);
    if (va == null || va === Infinity) return 1;
    if (vb == null || vb === Infinity) return -1;
    return (va - vb) * dir || a.order - b.order;
  });
}

function renderSingle() {
  const cols = visibleColumns();
  const groups = lb.groups.filter((g) => cols.some((c) => c.group === g.key));
  const sortAttr = (key) => (state.key === key ? ` aria-sort="${state.dir > 0 ? 'ascending' : 'descending'}"` : '');
  const head = `<thead>
    <tr class="grp"><th class="mcol" rowspan="2" scope="col"><button class="th-btn" data-key="__model">Model</button></th>
      <th rowspan="2" class="sortable" data-key="__size" scope="col"${sortAttr('__size')}>Size</th>
      ${groups.map((g) => `<th colspan="${cols.filter((c) => c.group === g.key).length}" style="--gc:${GROUP_COLOR[g.key]}" scope="colgroup">${esc(g.label)}</th>`).join('')}</tr>
    <tr class="met">${cols.map((c) => `<th class="sortable" data-key="${c.key}" title="${esc(c.title)}" scope="col"${sortAttr(c.key)}>${esc(c.label)}${c.lower ? ' ↓' : ''}</th>`).join('')}</tr>
  </thead>`;
  const body = sortedModels().map((m) => `<tr>
    <th class="mcol" scope="row"><span class="model"><img src="assets/img/vendors/${m.icon}.svg" alt="" width="20" height="20" loading="lazy">
      <span><b>${esc(m.name)}</b><small>${m.type === 'open' ? 'Open-source' : 'Proprietary'} · ${esc(m.vendor)}</small></span></span></th>
    <td class="size">${esc(m.size || '—')}</td>
    ${cols.map((c) => `<td class="num${rankClass(m.ranks[c.key])}">${esc(m.disp[c.key] ?? '—')}</td>`).join('')}
  </tr>`).join('');
  single.innerHTML = head + `<tbody>${body}</tbody>`;
}

single.addEventListener('click', (e) => {
  const th = e.target.closest('[data-key]'); if (!th) return;
  const key = th.dataset.key;
  if (key === '__model') { state.key = null; state.dir = 0; renderSingle(); return; }
  const col = lb.columns.find((c) => c.key === key);
  const bestFirst = key === '__size' ? 1 : (col && col.lower ? 1 : -1);
  if (state.key === key) state.dir = -state.dir; else { state.key = key; state.dir = bestFirst; }
  renderSingle();
});

// ---------- multi-agent table ----------
function renderMas() {
  const table = document.getElementById('lb-mas');
  const metrics = mas.metrics.map((m) => m.key);
  const head = `<thead>
    <tr class="grp"><th class="mcol" rowspan="2" scope="col">Method</th><th rowspan="2" scope="col">Coordination</th><th rowspan="2" scope="col">Agents</th>
      ${mas.backbones.map((b) => `<th colspan="3" scope="colgroup" style="--gc:var(--ink-soft)">${esc(b)}</th>`).join('')}</tr>
    <tr class="met">${mas.backbones.map(() => metrics.map((k) => `<th scope="col" title="${esc(mas.metrics.find((m) => m.key === k).title)}">${k}</th>`).join('')).join('')}</tr>
  </thead>`;
  let firstOurs = true;
  const body = mas.methods.map((m) => {
    const ours = m.name.startsWith('Seq.');
    const cls = ours && firstOurs ? ' class="ours"' : '';
    if (ours) firstOurs = false;
    return `<tr${cls}><th class="mcol" scope="row">${esc(m.name)}</th><td class="coord">${esc(m.coord)}</td><td class="size">${esc(m.agents)}</td>
      ${m.disp.map((d, i) => `<td class="num${rankClass(m.ranks[i])}">${esc(d)}</td>`).join('')}</tr>`;
  }).join('');
  table.innerHTML = head + `<tbody>${body}</tbody>`;
}

// ---------- tabs + glossary ----------
const tabs = [document.getElementById('tab-single'), document.getElementById('tab-mas')];
tabs.forEach((tab) => tab.addEventListener('click', () => {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
}));

document.getElementById('glossary').innerHTML =
  lb.columns.map((c) => `<dt>${esc(c.label)}</dt><dd>${esc(c.title)}</dd>`).join('') +
  mas.metrics.map((m) => `<dt>${m.key}</dt><dd>${esc(m.title)} (multi-agent table)</dd>`).join('');

renderSingle();
renderMas();
