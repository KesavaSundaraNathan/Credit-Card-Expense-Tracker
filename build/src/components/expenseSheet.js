import { openSheet, closeSheet } from "./sheet.js";
import { escapeHtml } from "../utils/dom.js";
import { CATEGORIES } from "../utils/categories.js";
import { toISODate } from "../utils/date.js";

export function openExpenseSheet({ currency, expense, onSave, onDelete }) {
  const isEdit = !!expense;
  const todayIso = toISODate(new Date());
  let selectedCat = expense ? expense.category : CATEGORIES[0].id;

  const chips = CATEGORIES.map(
    (c) => `<button type="button" class="chip${c.id === selectedCat ? " active" : ""}" data-cat="${c.id}">
      <span class="cdot" style="background:var(${c.color})"></span>${c.label}
    </button>`
  ).join("");

  const html = `
    <h2 class="sheet-title">${isEdit ? "Edit expense" : "Add expense"}</h2>
    <form id="expense-form" novalidate>
      <div class="field">
        <label>Category</label>
        <div class="chip-group" id="cat-chips">${chips}</div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Date</label>
          <input class="text-input" type="date" name="date" value="${expense ? expense.date : todayIso}" max="${todayIso}" required />
        </div>
        <div class="field">
          <label>Amount (${escapeHtml(currency)})</label>
          <input class="text-input" type="number" name="amount" inputmode="decimal" step="0.01" min="0.01"
            value="${expense ? expense.amount : ""}" placeholder="0.00" required />
        </div>
      </div>
      <div class="field">
        <label>Description (optional)</label>
        <input class="text-input" type="text" name="description" maxlength="60"
          value="${expense ? escapeHtml(expense.description || "") : ""}" placeholder="e.g. Groceries" />
      </div>
      <div class="sheet-actions">
        ${isEdit ? '<button type="button" class="btn btn-secondary" id="btn-delete-exp">Delete</button>' : ""}
        <button type="submit" class="btn btn-primary">${isEdit ? "Save changes" : "Add expense"}</button>
      </div>
    </form>
  `;

  openSheet(html, {
    onMount(el) {
      el.querySelectorAll("#cat-chips .chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          el.querySelectorAll("#cat-chips .chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          selectedCat = chip.dataset.cat;
        });
      });

      const form = el.querySelector("#expense-form");
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const amount = parseFloat(fd.get("amount"));
        if (!amount || amount <= 0) return;
        onSave({
          id: expense ? expense.id : undefined,
          category: selectedCat,
          date: fd.get("date") || todayIso,
          description: (fd.get("description") || "").trim(),
          amount,
        });
        closeSheet();
      });

      const delBtn = el.querySelector("#btn-delete-exp");
      if (delBtn) {
        delBtn.addEventListener("click", () => {
          onDelete(expense.id);
          closeSheet();
        });
      }

      const amountInput = el.querySelector('input[name="amount"]');
      setTimeout(() => amountInput && amountInput.focus(), 260);
    },
  });
}
