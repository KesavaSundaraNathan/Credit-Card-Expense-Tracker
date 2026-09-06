import { formatMoneyCompact } from "./format.js";

/** Builds a donut chart (CSS conic-gradient) with a legend.
 * slices: [{ label, value, colorVar }] */
export function buildDonut(slices, currency) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    return `<div class="stat-empty">No spending yet this period.</div>`;
  }
  let acc = 0;
  const stops = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const from = (acc / total) * 360;
      acc += s.value;
      const to = (acc / total) * 360;
      return `var(${s.colorVar}) ${from.toFixed(2)}deg ${to.toFixed(2)}deg`;
    })
    .join(", ");

  const legend = slices
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((s) => {
      const pct = Math.round((s.value / total) * 100);
      return `<div class="legend-item"><span class="legend-dot" style="background:var(${s.colorVar})"></span>${s.label} · ${pct}%</div>`;
    })
    .join("");

  return `
    <div style="display:flex; justify-content:center; margin-bottom:6px;">
      <div style="
        width:168px; height:168px; border-radius:50%;
        background: conic-gradient(${stops});
        display:flex; align-items:center; justify-content:center;
        position:relative;">
        <div style="
          width:104px; height:104px; border-radius:50%; background:var(--bg);
          display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em;">Total</div>
          <div style="font-family:var(--font-mono); font-size:15px; font-weight:600; margin-top:2px;">${formatMoneyCompact(total, currency)}</div>
        </div>
      </div>
    </div>
    <div class="legend">${legend}</div>
  `;
}

/** Builds an SVG dot chart of past statement totals over time.
 * points: [{ label, value }] oldest first */
export function buildDotChart(points, currency) {
  if (points.length < 2) {
    return `<div class="stat-empty">Not enough statement history yet. This fills in as bills close.</div>`;
  }
  const W = 300, H = 150, padL = 8, padR = 8, padT = 18, padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = 0;
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padL + stepX * i;
    const y = padT + innerH - ((p.value - min) / (max - min || 1)) * innerH;
    return { ...p, x, y };
  });

  const gridLines = [0, 0.5, 1]
    .map((f) => {
      const y = padT + innerH * (1 - f);
      const val = max * f;
      return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--border)" stroke-width="1" />
        <text x="${padL}" y="${y - 3}" font-size="7" fill="var(--text-faint)">${formatMoneyCompact(val, currency)}</text>`;
    })
    .join("");

  const dots = coords
    .map(
      (c) => `<circle cx="${c.x}" cy="${c.y}" r="3.2" fill="var(--cat-1)" />`
    )
    .join("");

  const labels = coords
    .map(
      (c) =>
        `<text x="${c.x}" y="${H - 6}" font-size="7.5" fill="var(--text-faint)" text-anchor="middle">${c.label}</text>`
    )
    .join("");

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto;" preserveAspectRatio="xMidYMid meet">
    ${gridLines}
    ${dots}
    ${labels}
  </svg>`;
}
