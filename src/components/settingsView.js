import { ordinal } from "../utils/date.js";
import { openSheet, closeSheet } from "./sheet.js";
import { escapeHtml } from "../utils/dom.js";
import { getActiveProfile } from "../utils/profiles.js";
import { renderProfilesSection } from "./profilesSection.js";

export function renderSettings(state, handlers) {
  const wrap = document.getElementById("settings-content");
  const theme = state.theme;
  const profile = getActiveProfile(state);
  const { startDay, currency } = profile.settings;

  wrap.innerHTML = `
    <div class="settings-group">
      <div class="grp-label">Appearance</div>
      <div class="settings-row">
        <div>
          <div class="row-label">Theme</div>
        </div>
        <div class="seg-control" id="theme-seg">
          <button type="button" data-v="system" class="${theme === "system" ? "active" : ""}">System</button>
          <button type="button" data-v="light" class="${theme === "light" ? "active" : ""}">Light</button>
          <button type="button" data-v="dark" class="${theme === "dark" ? "active" : ""}">Dark</button>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="grp-label">Billing — ${escapeHtml(profile.name)}</div>
      <button type="button" class="settings-row linklike" id="row-startday" style="width:100%; background:none; border:none; border-bottom:1px solid var(--border); text-align:left;">
        <div>
          <div class="row-label">Statement start day</div>
          <div class="row-desc">Cycle restarts on the ${ordinal(startDay)} each month</div>
        </div>
        <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></div>
      </button>
      <button type="button" class="settings-row linklike" id="row-currency" style="width:100%; background:none; border:none; text-align:left;">
        <div>
          <div class="row-label">Currency symbol</div>
          <div class="row-desc">Used across bills, table and exports for this profile</div>
        </div>
        <div class="chev">${escapeHtml(currency)}</div>
      </button>
    </div>

    <div class="settings-group">
      <div class="grp-label">Budgets — ${escapeHtml(profile.name)}</div>
      <button type="button" class="settings-row linklike" id="row-budgets" style="width:100%; background:none; border:none; text-align:left;">
        <div>
          <div class="row-label">Category budgets</div>
          <div class="row-desc">Set a monthly limit per category</div>
        </div>
        <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></div>
      </button>
    </div>

    <div class="settings-group">
      <div class="grp-label">Profiles</div>
      <div id="profiles-section"></div>
    </div>

    <div class="settings-group">
      <div class="grp-label">Data</div>
      <div class="danger-zone">
        <div class="settings-row" style="border:none; padding:0;">
          <div>
            <div class="row-label">Reset all data</div>
            <div class="row-desc">Erases every profile, their expenses, log history and budgets on this device</div>
          </div>
        </div>
        <button type="button" class="btn-danger-text" id="btn-reset">Reset Expense Tracker</button>
      </div>
    </div>

    <div class="app-version">Authenwrite Studio's Expense Tracker · v1.2.0 · stored only on this device</div>
  `;

  wrap.querySelectorAll("#theme-seg button").forEach((b) => {
    b.addEventListener("click", () => handlers.onThemeChange(b.dataset.v));
  });

  wrap.querySelector("#row-startday").addEventListener("click", () => {
    openStartDaySheet(startDay, handlers.onStartDayChange);
  });

  wrap.querySelector("#row-currency").addEventListener("click", () => {
    openCurrencySheet(currency, handlers.onCurrencyChange);
  });

  wrap.querySelector("#row-budgets").addEventListener("click", handlers.onNavigateBudgets);

  renderProfilesSection(wrap.querySelector("#profiles-section"), state, {
    onAddProfile: handlers.onAddProfile,
    onRenameProfile: handlers.onRenameProfile,
    onHeadingProfile: handlers.onHeadingProfile,
    onImportFile: handlers.onImportFile,
  });

  wrap.querySelector("#btn-reset").addEventListener("click", () => {
    openResetConfirmSheet(handlers.onResetData);
  });
}

function openStartDaySheet(current, onSave) {
  const html = `
    <h2 class="sheet-title">Statement start day</h2>
    <p class="sheet-desc">The day of the month your billing cycle restarts.</p>
    <form id="sd-form">
      <div class="field">
        <label>Day (1–31)</label>
        <input class="text-input" type="number" name="startDay" min="1" max="31" value="${current}" required />
      </div>
      <button type="submit" class="btn btn-primary">Save</button>
    </form>
  `;
  openSheet(html, {
    onMount(el) {
      el.querySelector("#sd-form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        let v = parseInt(new FormData(ev.target).get("startDay"), 10);
        if (!v || v < 1) v = 1;
        if (v > 31) v = 31;
        onSave(v);
        closeSheet();
      });
    },
  });
}

function openCurrencySheet(current, onSave) {
  const html = `
    <h2 class="sheet-title">Currency symbol</h2>
    <form id="cur-form">
      <div class="field">
        <label>Symbol</label>
        <input class="text-input" type="text" name="currency" maxlength="3" value="${escapeHtml(current)}" required />
      </div>
      <button type="submit" class="btn btn-primary">Save</button>
    </form>
  `;
  openSheet(html, {
    onMount(el) {
      el.querySelector("#cur-form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const v = (new FormData(ev.target).get("currency") || "$").trim() || "$";
        onSave(v);
        closeSheet();
      });
    },
  });
}

function openResetConfirmSheet(onConfirm) {
  const html = `
    <h2 class="sheet-title">Reset Expense Tracker?</h2>
    <p class="sheet-desc">This permanently erases every profile — all expenses, past statements and budgets stored on this device. This cannot be undone.</p>
    <div class="sheet-actions">
      <button type="button" class="btn btn-secondary" id="btn-cancel-reset">Cancel</button>
      <button type="button" class="btn btn-primary" style="background:var(--danger); color:#fff;" id="btn-confirm-reset">Erase everything</button>
    </div>
  `;
  openSheet(html, {
    onMount(el) {
      el.querySelector("#btn-cancel-reset").addEventListener("click", () => closeSheet());
      el.querySelector("#btn-confirm-reset").addEventListener("click", () => {
        closeSheet();
        onConfirm();
      });
    },
  });
}
