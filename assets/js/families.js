// Horizontal bar chart of the 220K corpus by fibre family (native SVG, no chart library).
// The viewBox matches the rendered width so labels stay at their real pixel size on phones.

const svg = document.getElementById('families-chart');
const data = await fetch('data/families.json').then((r) => r.json());
const rows = [...data].sort((a, b) => b.count - a.count);
const max = Math.max(...rows.map((d) => d.count));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function render() {
  const W = Math.max(300, Math.round(svg.parentElement.clientWidth - 2 * 22));
  const ROW = 24, PAD_L = W < 420 ? 150 : 172, PAD_R = 46;
  svg.setAttribute('viewBox', `0 0 ${W} ${ROW * rows.length + 4}`);
  svg.innerHTML = rows.map((d, i) => {
    const y = i * ROW;
    const w = ((W - PAD_L - PAD_R) * d.count) / max;
    return `<g>
      <text class="lbl" x="${PAD_L - 10}" y="${y + 16}" text-anchor="end">${esc(d.label)}</text>
      <rect class="bar" x="${PAD_L}" y="${y + 6}" width="${w.toFixed(1)}" height="13" rx="1.5" style="--d:${(i * 0.035).toFixed(3)}s">
        <title>${esc(d.label)}: ${d.count.toLocaleString('en-US')} samples</title></rect>
      <text class="val" x="${(PAD_L + w + 6).toFixed(1)}" y="${y + 16}">${(d.count / 1000).toFixed(1)}k</text>
    </g>`;
  }).join('');
}

render();
let lastW = svg.parentElement.clientWidth;
new ResizeObserver(() => {
  const w = svg.parentElement.clientWidth;
  if (Math.abs(w - lastW) > 8) { lastW = w; render(); }
}).observe(svg.parentElement);

new IntersectionObserver(([e], obs) => {
  if (e.isIntersecting) { svg.classList.add('in'); obs.disconnect(); }
}, { threshold: 0.25 }).observe(svg);
