import { openSheet, closeSheet } from "./sheet.js";
import { getCategory } from "../utils/categories.js";
import { formatMoney } from "../utils/format.js";
import { formatBillHeading, formatPeriodLabel, formatDateShort } from "../utils/date.js";
import { escapeHtml } from "../utils/dom.js";
import { exportBillPdf } from "../utils/exportPdf.js";

export function openBillDetailSheet(bill, currency) {
  const heading = formatBillHeading(bill);
  const periodLabel = formatPeriodLabel(bill);
  const expenses = [...bill.expenses].sort((a, b) => a.date.localeCompare(b.date));

  const lines = expenses.length
    ? expenses
        .map((e) => {
          const cat = getCategory(e.category);
          return `<div class="receipt-line" style="cursor:default;">
            <div class="li-main">
              <div class="li-cat">${escapeHtml(cat.label)}</div>
              ${e.description ? `<div class="li-desc">${escapeHtml(e.description)}</div>` : ""}
              <div class="li-date">${formatDateShort(e.date)}</div>
            </div>
            <div class="li-amt">${formatMoney(e.amount, currency)}</div>
          </div>`;
        })
        .join("")
    : `<div class="receipt-empty">No expenses were logged this period.</div>`;

  const html = `
    <div class="receipt" style="padding:22px 4px 4px;">
      <div class="receipt-head">
        <h2>${heading}</h2>
        <div class="period">${periodLabel}</div>
      </div>
      ${lines}
      ${expenses.length ? `<div class="receipt-total"><span>Total</span><span class="amt">${formatMoney(bill.total, currency)}</span></div>` : ""}
    </div>
    <div class="sheet-actions">
      <button type="button" class="btn btn-secondary" id="btn-close-detail">Close</button>
      <button type="button" class="btn btn-primary" id="btn-pdf-detail">Export PDF</button>
    </div>
  `;

  openSheet(html, {
    onMount(el) {
      el.querySelector("#btn-close-detail").addEventListener("click", () => {
        closeSheet();
      });
      el.querySelector("#btn-pdf-detail").addEventListener("click", () => {
        exportBillPdf({
          heading,
          sub: `Statement Period: ${periodLabel}`,
          expenses: bill.expenses,
          currency,
          filename: `ExpenseTracker-${heading.replace(/\s+/g, "-")}.pdf`,
        });
      });
    },
  });
}
