import { openSheet, closeSheet } from "./sheet.js";

export function openOnboardingSheet({ onSave }) {
  const html = `
    <div class="onboard-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/><path d="M6 14.5h4"/>
      </svg>
    </div>
    <h2 class="sheet-title" style="text-align:center">Set your statement period</h2>
    <p class="sheet-desc" style="text-align:center">
      Enter the day your credit card billing cycle starts. It repeats every month —
      you can change it later in Settings.
    </p>
    <form id="onboard-form" novalidate>
      <div class="field">
        <label>Statement start day (1–31)</label>
        <input class="text-input" type="number" name="startDay" min="1" max="31" value="1" required />
      </div>
      <div class="field">
        <label>Currency symbol</label>
        <input class="text-input" type="text" name="currency" maxlength="3" value="$" required />
      </div>
      <button type="submit" class="btn btn-primary">Get started</button>
    </form>
  `;

  openSheet(html, {
    dismissible: false,
    onMount(el) {
      const form = el.querySelector("#onboard-form");
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        let startDay = parseInt(fd.get("startDay"), 10);
        if (!startDay || startDay < 1) startDay = 1;
        if (startDay > 31) startDay = 31;
        const currency = (fd.get("currency") || "$").trim() || "$";
        onSave({ startDay, currency });
        closeSheet(true);
      });
    },
  });
}
