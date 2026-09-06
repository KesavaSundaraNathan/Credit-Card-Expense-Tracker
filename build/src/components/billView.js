import { getCategory } from "../utils/categories.js";
import { formatMoney } from "../utils/format.js";
import { formatBillHeading, formatPeriodLabel, formatDateShort } from "../utils/date.js";
import { escapeHtml } from "../utils/dom.js";
import { getActiveProfile } from "../utils/profiles.js";

export function renderProfileSwitcherLabel(state) {
  const profile = getActiveProfile(state);
  const nameEl = document.getElementById("ps-name");
  if (nameEl) nameEl.textContent = profile.name;
}

export function renderBill(state) {
  const profile = getActiveProfile(state);
  renderProfileSwitcherLabel(state);

  document.getElementById("bill-title").textContent = profile.heading || "Statement";
  document.getElementById("bill-sub").innerHTML = "&nbsp;";

  if (!profile.currentPeriod) {
    document.getElementById("bill-receipt").innerHTML = "";
    return;
  }

  const heading = formatBillHeading(profile.currentPeriod);
  const periodLabel = formatPeriodLabel(profile.currentPeriod);

  const wrap = document.getElementById("bill-receipt");
  const expenses = [...profile.currentExpenses].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
  );

  if (expenses.length === 0) {
    wrap.innerHTML = `
      <div class="receipt">
        <div class="receipt-head">
          <h2>${heading}</h2>
          <div class="period">${periodLabel}</div>
        </div>
        <div class="receipt-empty">No expenses logged yet.<br/>Tap + to add your first one.</div>
      </div>`;
    return;
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const lines = expenses
    .map((e) => {
      const cat = getCategory(e.category);
      return `<button type="button" class="receipt-line" data-id="${e.id}">
        <div class="li-main">
          <div class="li-cat">${escapeHtml(cat.label)}</div>
          ${e.description ? `<div class="li-desc">${escapeHtml(e.description)}</div>` : ""}
          <div class="li-date">${formatDateShort(e.date)}</div>
        </div>
        <div class="li-amt">${formatMoney(e.amount, profile.settings.currency)}</div>
      </button>`;
    })
    .join("");

  wrap.innerHTML = `
    <div class="receipt">
      <div class="receipt-head">
        <h2>${heading}</h2>
        <div class="period">${periodLabel}</div>
      </div>
      ${lines}
      <div class="receipt-total"><span>Total</span><span class="amt">${formatMoney(total, profile.settings.currency)}</span></div>
      <div class="receipt-count">${expenses.length} item${expenses.length === 1 ? "" : "s"}</div>
    </div>`;
}
