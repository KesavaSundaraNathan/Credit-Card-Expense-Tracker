import { getCategory } from "../utils/categories.js";
import { formatMoney } from "../utils/format.js";
import { formatDateShort, formatPeriodLabel } from "../utils/date.js";
import { escapeHtml } from "../utils/dom.js";
import { getActiveProfile } from "../utils/profiles.js";

export function renderTable(state) {
  const wrap = document.getElementById("table-wrap");
  const profile = getActiveProfile(state);

  document.getElementById("table-title").textContent = profile.heading || "Table";

  if (!profile.currentPeriod) {
    document.getElementById("table-sub").innerHTML = "&nbsp;";
    wrap.innerHTML = "";
    return;
  }

  document.getElementById("table-sub").textContent = formatPeriodLabel(profile.currentPeriod);
  const expenses = [...profile.currentExpenses].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
  );

  if (expenses.length === 0) {
    wrap.innerHTML = `<div class="table-empty">No expenses logged yet.<br/>Tap + to add your first one.</div>`;
    return;
  }

  const rows = expenses
    .map((e, i) => {
      const cat = getCategory(e.category);
      return `<tr data-id="${e.id}">
        <td class="sno">${i + 1}</td>
        <td>${formatDateShort(e.date)}</td>
        <td>${escapeHtml(cat.label)}</td>
        <td class="desc">${escapeHtml(e.description || "—")}</td>
        <td class="amt">${formatMoney(e.amount, profile.settings.currency)}</td>
      </tr>`;
    })
    .join("");

  wrap.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>S.No</th><th>Date</th><th>Category</th><th>Description</th><th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
