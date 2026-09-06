import { escapeHtml } from "../utils/dom.js";
import { openSheet, closeSheet } from "./sheet.js";

export function renderProfilesSection(container, state, handlers) {
  const active = state.profiles[state.activeProfileId];
  const otherIds = state.profileOrder.filter((id) => id !== "primary");

  container.innerHTML = `
    <div class="profile-row">
      <div>
        <div class="row-label">Expense Tracker <span class="tag-pill">Primary</span></div>
        <div class="row-desc">Default profile — name can't be changed</div>
      </div>
      ${state.activeProfileId === "primary" ? '<span class="tag-pill tag-active">Active</span>' : ""}
    </div>

    ${otherIds
      .map((id) => {
        const p = state.profiles[id];
        return `
        <div class="profile-row" data-id="${id}">
          <div class="profile-fields">
            <input class="text-input profile-name-input" data-id="${id}" value="${escapeHtml(p.name)}" maxlength="30" placeholder="Profile name" />
            <input class="text-input profile-heading-input" data-id="${id}" value="${escapeHtml(p.heading || "")}" maxlength="40" placeholder="Heading on Bill/Table (optional)" />
          </div>
          ${state.activeProfileId === id ? '<span class="tag-pill tag-active">Active</span>' : ""}
        </div>`;
      })
      .join("")}

    <button type="button" class="btn btn-secondary" id="btn-add-profile" style="margin-top:12px;">+ Add profile</button>

    <div class="import-block">
      <div class="row-desc">Importing adds data to your active profile: <strong>${escapeHtml(active.name)}</strong></div>
      <button type="button" class="btn btn-secondary" id="btn-import-csv">Import CSV backup</button>
      <input type="file" id="import-file-input" accept=".csv,text/csv" class="hidden" />
    </div>
  `;

  container.querySelectorAll(".profile-name-input").forEach((input) => {
    input.addEventListener("blur", () => handlers.onRenameProfile(input.dataset.id, input.value));
  });
  container.querySelectorAll(".profile-heading-input").forEach((input) => {
    input.addEventListener("blur", () => handlers.onHeadingProfile(input.dataset.id, input.value));
  });

  container.querySelector("#btn-add-profile").addEventListener("click", () => {
    openAddProfileSheet(handlers.onAddProfile);
  });

  const fileInput = container.querySelector("#import-file-input");
  container.querySelector("#btn-import-csv").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    fileInput.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handlers.onImportFile(String(reader.result || ""), file.name);
    reader.readAsText(file);
  });
}

function openAddProfileSheet(onCreate) {
  const html = `
    <h2 class="sheet-title">Add profile</h2>
    <p class="sheet-desc">Creates a separate profile with its own statement cycle, expenses and budgets.</p>
    <form id="add-profile-form" novalidate>
      <div class="field">
        <label>Profile name</label>
        <input class="text-input" type="text" name="name" maxlength="30" placeholder="e.g. Business Card" required />
      </div>
      <div class="field">
        <label>Heading on Bill/Table (optional)</label>
        <input class="text-input" type="text" name="heading" maxlength="40" placeholder="Defaults to profile name" />
      </div>
      <div class="field-row">
        <div class="field">
          <label>Statement start day</label>
          <input class="text-input" type="number" name="startDay" min="1" max="31" value="1" required />
        </div>
        <div class="field">
          <label>Currency symbol</label>
          <input class="text-input" type="text" name="currency" maxlength="3" value="$" required />
        </div>
      </div>
      <button type="submit" class="btn btn-primary">Create profile</button>
    </form>
  `;
  openSheet(html, {
    onMount(el) {
      el.querySelector("#add-profile-form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const name = (fd.get("name") || "").trim();
        if (!name) return;
        let startDay = parseInt(fd.get("startDay"), 10);
        if (!startDay || startDay < 1) startDay = 1;
        if (startDay > 31) startDay = 31;
        onCreate({
          name,
          heading: (fd.get("heading") || "").trim(),
          startDay,
          currency: (fd.get("currency") || "$").trim() || "$",
        });
        closeSheet();
      });
    },
  });
}

export function openImportConfirmSheet({ profileName, count, fileName, onAccept, onDecline }) {
  const html = `
    <h2 class="sheet-title">Import into "${escapeHtml(profileName)}"?</h2>
    <p class="sheet-desc">
      ${count} expense${count === 1 ? "" : "s"} from <strong>${escapeHtml(fileName)}</strong> will be added to your
      currently active profile, <strong>${escapeHtml(profileName)}</strong>. Each row is filed into the right
      statement automatically. Importing the same file twice will duplicate its entries.
    </p>
    <div class="sheet-actions">
      <button type="button" class="btn btn-secondary" id="btn-decline-import">Decline</button>
      <button type="button" class="btn btn-primary" id="btn-accept-import">Accept</button>
    </div>
  `;
  openSheet(html, {
    onMount(el) {
      el.querySelector("#btn-decline-import").addEventListener("click", () => {
        closeSheet();
        if (onDecline) onDecline();
      });
      el.querySelector("#btn-accept-import").addEventListener("click", () => {
        closeSheet();
        onAccept();
      });
    },
  });
}
