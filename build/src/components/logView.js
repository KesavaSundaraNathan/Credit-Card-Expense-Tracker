import { formatMoney } from "../utils/format.js";
import { formatBillHeading, formatPeriodLabel } from "../utils/date.js";
import { getActiveProfile } from "../utils/profiles.js";

export function renderLog(state) {
  const wrap = document.getElementById("log-list");
  const profile = getActiveProfile(state);

  if (profile.log.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h4"/>
        </svg>
        <div>No bills yet.<br/>Your first statement will land here<br/>once the current billing period ends.</div>
      </div>`;
    return;
  }

  wrap.innerHTML = profile.log
    .map(
      (bill) => `
      <button type="button" class="log-item" data-id="${bill.id}">
        <div>
          <div class="li-name">${formatBillHeading(bill)}</div>
          <div class="li-range">${formatPeriodLabel(bill)}</div>
        </div>
        <div class="li-total">
          ${formatMoney(bill.total, profile.settings.currency)}
          <span class="cnt">${bill.count} item${bill.count === 1 ? "" : "s"}</span>
        </div>
      </button>`
    )
    .join("");
}
