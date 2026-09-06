import { loadState, saveState, resetState } from "./utils/storage.js";
import { uid } from "./utils/id.js";
import { periodContaining, periodToRecord, nextPeriodRecord, parseISODate, today } from "./utils/date.js";
import { exportBillPdf } from "./utils/exportPdf.js";
import { exportExpensesCsv } from "./utils/exportCsv.js";
import { parseCsvExpenses, applyImportToProfile } from "./utils/importCsv.js";
import { getActiveProfile, cycleProfile, createProfile, renameProfile, setProfileHeading } from "./utils/profiles.js";
import { showToast } from "./components/toast.js";
import { openExpenseSheet } from "./components/expenseSheet.js";
import { openOnboardingSheet } from "./components/onboardingSheet.js";
import { openBillDetailSheet } from "./components/billDetailSheet.js";
import { openImportConfirmSheet } from "./components/profilesSection.js";
import { renderBill, renderProfileSwitcherLabel } from "./components/billView.js";
import { renderTable } from "./components/tableView.js";
import { renderLog } from "./components/logView.js";
import { renderStats } from "./components/statsView.js";
import { renderSettings } from "./components/settingsView.js";
import { renderBudgets } from "./components/budgetsView.js";
import { formatBillHeading, formatPeriodLabel } from "./utils/date.js";

let state = loadState();
let activeView = "bill";

const fab = () => document.getElementById("fab-add");
const exportBtn = () => document.getElementById("btn-export");

function applyTheme() {
  let effective = state.theme;
  if (effective === "system") {
    effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", effective);
  const meta = document.getElementById("meta-theme-color");
  if (meta) meta.setAttribute("content", effective === "dark" ? "#1A1A19" : "#FFFFFF");
}

function persist() {
  saveState(state);
}

/** Archives any statement periods that have fully elapsed for one profile. */
function checkRolloverForProfile(profile) {
  if (!profile.currentPeriod) return false;
  let changed = false;
  let guard = 0;
  while (parseISODate(profile.currentPeriod.end) < today() && guard < 240) {
    const total = profile.currentExpenses.reduce((s, e) => s + Number(e.amount), 0);
    profile.log.unshift({
      id: uid(),
      start: profile.currentPeriod.start,
      end: profile.currentPeriod.end,
      total,
      count: profile.currentExpenses.length,
      expenses: profile.currentExpenses,
    });
    profile.currentPeriod = nextPeriodRecord(profile.currentPeriod, profile.settings.startDay);
    profile.currentExpenses = [];
    changed = true;
    guard++;
  }
  return changed;
}

/** Runs rollover for every profile (not just the active one) so Log/currentPeriod
 * stay accurate everywhere regardless of which profile the person is viewing. */
function checkRolloverAllProfiles() {
  let changed = false;
  for (const id of state.profileOrder) {
    const p = state.profiles[id];
    if (p && checkRolloverForProfile(p)) changed = true;
  }
  return changed;
}

function refreshAll() {
  renderBill(state);
  renderTable(state);
  if (activeView === "log") renderLog(state);
  if (activeView === "stats") renderStats(state);
  if (activeView === "settings") mountSettings();
  if (activeView === "budgets") mountBudgets();
}

function setActiveView(view) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.dataset.view === view));
  document.querySelectorAll(".dropdown-item").forEach((b) =>
    b.classList.toggle("active", b.dataset.nav === (view === "budgets" ? "settings" : view))
  );
  const showActions = view === "bill" || view === "table";
  fab().style.display = showActions ? "flex" : "none";
  exportBtn().style.display = showActions ? "flex" : "none";
  activeView = view;

  if (view === "log") renderLog(state);
  if (view === "stats") renderStats(state);
  if (view === "settings") mountSettings();
  if (view === "budgets") mountBudgets();

  const container = document.getElementById(`view-${view}`);
  if (container) container.scrollTop = 0;
}

function mountSettings() {
  renderSettings(state, {
    onThemeChange(theme) {
      state.theme = theme;
      persist();
      applyTheme();
      mountSettings();
    },
    onStartDayChange(day) {
      const p = getActiveProfile(state);
      p.settings.startDay = day;
      p.currentPeriod = periodToRecord(periodContaining(today(), day));
      persist();
      refreshAll();
      mountSettings();
      showToast("Statement cycle updated");
    },
    onCurrencyChange(sym) {
      const p = getActiveProfile(state);
      p.settings.currency = sym;
      persist();
      refreshAll();
      showToast("Currency updated");
    },
    onNavigateBudgets() {
      mountBudgets();
      setActiveView("budgets");
    },
    onResetData() {
      resetState();
      state = loadState();
      persist();
      refreshAll();
      setActiveView("bill");
      maybeOnboard();
      showToast("All data erased");
    },
    onAddProfile({ name, heading, startDay, currency }) {
      const p = createProfile(state, { name, heading, startDay, currency });
      persist();
      refreshAll();
      mountSettings();
      showToast(`Created profile "${p.name}" — now active`);
    },
    onRenameProfile(id, name) {
      renameProfile(state, id, name);
      persist();
      refreshAll();
    },
    onHeadingProfile(id, heading) {
      setProfileHeading(state, id, heading);
      persist();
      refreshAll();
    },
    onImportFile(text, fileName) {
      handleImportFile(text, fileName);
    },
  });
}

function mountBudgets() {
  renderBudgets(state, {
    onBudgetChange(catId, value) {
      const p = getActiveProfile(state);
      if (value === undefined) delete p.budgets[catId];
      else p.budgets[catId] = value;
      persist();
    },
  });
}

function handleImportFile(text, fileName) {
  const { rows, error } = parseCsvExpenses(text);
  if (error || rows.length === 0) {
    showToast("Couldn't read that file — check it's a CardLedger CSV export.");
    return;
  }
  const profile = getActiveProfile(state);
  openImportConfirmSheet({
    profileName: profile.name,
    count: rows.length,
    fileName,
    onAccept() {
      const summary = applyImportToProfile(profile, rows);
      persist();
      refreshAll();
      mountSettings();
      showToast(`Imported ${summary.imported} expense${summary.imported === 1 ? "" : "s"} into "${profile.name}"`);
    },
  });
}

function handleSaveExpense(data) {
  const p = getActiveProfile(state);
  if (data.id) {
    const idx = p.currentExpenses.findIndex((e) => e.id === data.id);
    if (idx !== -1) p.currentExpenses[idx] = { ...p.currentExpenses[idx], ...data };
  } else {
    p.currentExpenses.push({ ...data, id: uid() });
  }
  persist();
  refreshAll();
}

function handleDeleteExpense(id) {
  const p = getActiveProfile(state);
  p.currentExpenses = p.currentExpenses.filter((e) => e.id !== id);
  persist();
  refreshAll();
  showToast("Expense deleted");
}

function openAddExpense() {
  const p = getActiveProfile(state);
  openExpenseSheet({
    currency: p.settings.currency,
    onSave: handleSaveExpense,
  });
}

function openEditExpense(id) {
  const p = getActiveProfile(state);
  const expense = p.currentExpenses.find((e) => e.id === id);
  if (!expense) return;
  openExpenseSheet({
    currency: p.settings.currency,
    expense,
    onSave: handleSaveExpense,
    onDelete: handleDeleteExpense,
  });
}

function switchProfile(dir) {
  cycleProfile(state, dir);
  persist();
  refreshAll();
  renderProfileSwitcherLabel(state);
}

function wireNav() {
  const menuTrigger = document.getElementById("menu-trigger");
  const dropdown = document.getElementById("dropdown-menu");

  function openMenu() {
    dropdown.classList.add("open");
    menuTrigger.setAttribute("aria-expanded", "true");
  }
  function closeMenu() {
    dropdown.classList.remove("open");
    menuTrigger.setAttribute("aria-expanded", "false");
  }

  menuTrigger.addEventListener("click", (ev) => {
    ev.stopPropagation();
    dropdown.classList.contains("open") ? closeMenu() : openMenu();
  });

  dropdown.addEventListener("click", (ev) => {
    const item = ev.target.closest(".dropdown-item");
    if (!item) return;
    setActiveView(item.dataset.nav);
    closeMenu();
  });

  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".menu-wrap")) closeMenu();
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeMenu();
  });

  document.getElementById("ps-prev").addEventListener("click", () => switchProfile(-1));
  document.getElementById("ps-next").addEventListener("click", () => switchProfile(1));

  document.getElementById("budgets-back").addEventListener("click", () => setActiveView("settings"));

  fab().addEventListener("click", openAddExpense);

  exportBtn().addEventListener("click", () => {
    const p = getActiveProfile(state);
    if (activeView === "bill") {
      const heading = formatBillHeading(p.currentPeriod);
      exportBillPdf({
        heading,
        sub: `Statement Period: ${formatPeriodLabel(p.currentPeriod)}`,
        expenses: p.currentExpenses,
        currency: p.settings.currency,
        filename: `ExpenseTracker-${heading.replace(/\s+/g, "-")}.pdf`,
      });
    } else if (activeView === "table") {
      exportExpensesCsv(p.currentExpenses, `ExpenseTracker-${formatBillHeading(p.currentPeriod).replace(/\s+/g, "-")}.csv`);
    }
  });

  document.getElementById("bill-receipt").addEventListener("click", (ev) => {
    const line = ev.target.closest(".receipt-line");
    if (line) openEditExpense(line.dataset.id);
  });

  document.getElementById("table-wrap").addEventListener("click", (ev) => {
    const row = ev.target.closest("tr[data-id]");
    if (row) openEditExpense(row.dataset.id);
  });

  document.getElementById("log-list").addEventListener("click", (ev) => {
    const item = ev.target.closest(".log-item");
    if (!item) return;
    const p = getActiveProfile(state);
    const bill = p.log.find((b) => b.id === item.dataset.id);
    if (bill) openBillDetailSheet(bill, p.settings.currency);
  });
}

function maybeOnboard() {
  const primary = state.profiles.primary;
  if (primary.onboarded) return;
  openOnboardingSheet({
    onSave({ startDay, currency }) {
      primary.settings.startDay = startDay;
      primary.settings.currency = currency;
      primary.currentPeriod = periodToRecord(periodContaining(today(), startDay));
      primary.onboarded = true;
      persist();
      refreshAll();
      showToast("You're all set");
    },
  });
}

function applySystemThemeListener() {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    if (state.theme === "system") applyTheme();
  });
}

function handleUrlShortcuts() {
  const params = new URLSearchParams(location.search);
  const view = params.get("view");
  if (view && ["bill", "table", "log", "stats", "settings"].includes(view)) {
    setActiveView(view);
  }
  if (params.get("action") === "add") {
    setTimeout(openAddExpense, 350);
  }
}

export function initApp() {
  applyTheme();
  applySystemThemeListener();
  wireNav();

  if (state.profiles.primary.onboarded) {
    if (checkRolloverAllProfiles()) persist();
  }

  setActiveView("bill");
  refreshAll();

  if (!state.profiles.primary.onboarded) {
    maybeOnboard();
  } else {
    handleUrlShortcuts();
  }
}
