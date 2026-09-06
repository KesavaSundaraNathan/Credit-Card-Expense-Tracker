import { CATEGORIES } from "../utils/categories.js";
import { formatMoney } from "../utils/format.js";
import { formatBillHeading } from "../utils/date.js";
import { buildDonut, buildDotChart } from "../utils/charts.js";
import { getActiveProfile } from "../utils/profiles.js";

function spendByCategory(expenses) {
  const map = {};
  for (const e of expenses) {
    map[e.category] = (map[e.category] || 0) + Number(e.amount);
  }
  return map;
}

export function renderStats(state) {
  const wrap = document.getElementById("stats-content");
  const profile = getActiveProfile(state);
  const spend = spendByCategory(profile.currentExpenses);
  const currency = profile.settings.currency;
  const hasBudgets = Object.values(profile.budgets).some((v) => Number(v) > 0);

  // --- Section 1: budget vs spend bars ---
  let budgetSection;
  const activeCats = CATEGORIES.filter((c) => spend[c.id] || profile.budgets[c.id]);
  if (activeCats.length === 0) {
    budgetSection = `<div class="stat-empty">Log an expense to see budget progress.</div>`;
  } else {
    budgetSection = activeCats
      .map((c) => {
        const spent = spend[c.id] || 0;
        const budget = Number(profile.budgets[c.id]) || 0;
        if (budget > 0) {
          const pct = Math.min(100, (spent / budget) * 100);
          const over = spent > budget;
          const color = over ? "var(--danger)" : pct > 85 ? `var(${c.color})` : "var(--safe)";
          return `<div class="bar-row">
            <div class="bar-row-head">
              <span class="cat">${c.label}</span>
              <span class="val">${formatMoney(spent, currency)} / ${formatMoney(budget, currency)}</span>
            </div>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${color};"></div></div>
          </div>`;
        }
        return `<div class="bar-row">
          <div class="bar-row-head">
            <span class="cat">${c.label}</span>
            <span class="val">${formatMoney(spent, currency)} · no budget set</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:100%; background:var(--border);"></div></div>
        </div>`;
      })
      .join("");
  }

  // --- Section 2: donut of overall category-wise spending ---
  const slices = CATEGORIES.map((c) => ({ label: c.label, value: spend[c.id] || 0, colorVar: c.color }));
  const donut = buildDonut(slices, currency);

  // --- Section 3: dot chart of past bill closing totals ---
  const history = [...profile.log]
    .slice()
    .reverse() // oldest first
    .map((bill) => ({ label: shortLabel(bill), value: bill.total }));
  const dotChart = buildDotChart(history, currency);

  wrap.innerHTML = `
    <div class="stat-section">
      <h3>Budget vs Spend</h3>
      ${!hasBudgets ? '<div class="stat-sub">Set category budgets in Settings to track progress.</div>' : ""}
      ${budgetSection}
    </div>
    <div class="stat-section">
      <h3>Category Breakdown</h3>
      ${donut}
    </div>
    <div class="stat-section">
      <h3>Past Statement Totals</h3>
      ${dotChart}
    </div>
  `;
}

function shortLabel(bill) {
  const full = formatBillHeading(bill);
  return full.split(" ")[0].slice(0, 3);
}
