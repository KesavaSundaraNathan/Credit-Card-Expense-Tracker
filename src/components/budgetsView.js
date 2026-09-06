import { CATEGORIES } from "../utils/categories.js";
import { getActiveProfile } from "../utils/profiles.js";

export function renderBudgets(state, handlers) {
  const wrap = document.getElementById("budgets-list");
  const profile = getActiveProfile(state);
  const currency = profile.settings.currency;

  document.getElementById("budgets-sub").textContent = `Monthly budget per category — ${profile.name}`;

  wrap.innerHTML = CATEGORIES.map((c) => {
    const val = profile.budgets[c.id];
    return `<div class="budget-row">
      <div class="cat-name"><span class="cat-dot" style="background:var(${c.color})"></span>${c.label}</div>
      <input class="text-input amt-input" type="number" min="0" step="1" inputmode="decimal"
        placeholder="${currency}0" value="${val ? val : ""}" data-cat="${c.id}" />
    </div>`;
  }).join("");

  wrap.querySelectorAll(".amt-input").forEach((input) => {
    let t;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const v = parseFloat(input.value);
        handlers.onBudgetChange(input.dataset.cat, v > 0 ? v : undefined);
      }, 350);
    });
    input.addEventListener("blur", () => {
      const v = parseFloat(input.value);
      handlers.onBudgetChange(input.dataset.cat, v > 0 ? v : undefined);
    });
  });
}
