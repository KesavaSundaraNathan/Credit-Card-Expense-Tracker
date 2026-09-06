import { uid } from "./id.js";
import { CATEGORIES } from "./categories.js";
import { periodContaining, periodToRecord, parseISODate } from "./date.js";

const MONTHS_SHORT = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

function tokenizeCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\r") {
      // skip
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

function normalizeDate(raw) {
  if (!raw) return null;
  const s = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const monIdx = MONTHS_SHORT.indexOf(m[2].toLowerCase().slice(0, 3));
    const year = parseInt(m[3], 10);
    if (monIdx !== -1 && day >= 1 && day <= 31) {
      return `${year}-${String(monIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return null;
}

function labelToCategoryId(label) {
  const found = CATEGORIES.find((c) => c.label.toLowerCase() === String(label).toLowerCase());
  return found ? found.id : "other";
}

/** Parses a CardLedger-format expense CSV (S.No, Date, Category, Description, Amount).
 * Returns { rows, error } where error is null | "empty" | "format" | "no-rows". */
export function parseCsvExpenses(text) {
  const clean = String(text).replace(/^\uFEFF/, "");
  const allRows = tokenizeCsv(clean);
  if (allRows.length < 2) return { rows: [], error: "empty" };

  const header = allRows[0].map((h) => h.trim().toLowerCase());
  const dateIdx = header.indexOf("date");
  const catIdx = header.indexOf("category");
  const descIdx = header.indexOf("description");
  const amtIdx = header.indexOf("amount");
  if (dateIdx === -1 || amtIdx === -1) return { rows: [], error: "format" };

  const rows = [];
  for (let i = 1; i < allRows.length; i++) {
    const cols = allRows[i];
    const date = normalizeDate(cols[dateIdx]);
    const amount = parseFloat(String(cols[amtIdx] || "").replace(/[^0-9.\-]/g, ""));
    if (!date || !amount || amount <= 0) continue;
    rows.push({
      date,
      category: labelToCategoryId(cols[catIdx] || ""),
      description: (cols[descIdx] || "").trim(),
      amount,
    });
  }
  return { rows, error: rows.length ? null : "no-rows" };
}

/** Applies parsed rows to a profile: rows in the active period go to
 * currentExpenses, rows in an elapsed period are grouped into (or merged
 * with) the matching log entry. Mutates `profile` in place. */
export function applyImportToProfile(profile, rows) {
  const startDay = profile.settings.startDay;
  let addedToCurrent = 0;
  const archivedTouched = new Set();

  for (const row of rows) {
    const per = periodToRecord(periodContaining(parseISODate(row.date), startDay));
    const expense = { id: uid(), date: row.date, category: row.category, description: row.description, amount: row.amount };

    if (profile.currentPeriod && per.start === profile.currentPeriod.start && per.end === profile.currentPeriod.end) {
      profile.currentExpenses.push(expense);
      addedToCurrent++;
    } else {
      let bill = profile.log.find((b) => b.start === per.start && b.end === per.end);
      if (!bill) {
        bill = { id: uid(), start: per.start, end: per.end, total: 0, count: 0, expenses: [] };
        profile.log.push(bill);
      }
      bill.expenses.push(expense);
      bill.count = bill.expenses.length;
      bill.total = bill.expenses.reduce((s, e) => s + Number(e.amount), 0);
      archivedTouched.add(bill.id);
    }
  }

  profile.log.sort((a, b) => b.start.localeCompare(a.start));
  return { imported: rows.length, addedToCurrent, archivedPeriods: archivedTouched.size };
}
