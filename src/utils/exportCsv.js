import { getCategory } from "./categories.js";

function csvEscape(val) {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportExpensesCsv(expenses, filename) {
  const header = ["S.No", "Date", "Category", "Description", "Amount"];
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  const rows = sorted.map((e, i) => [
    i + 1,
    e.date,
    getCategory(e.category).label,
    e.description || "",
    Number(e.amount).toFixed(2),
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
  downloadBlob("\ufeff" + csv, filename, "text/csv;charset=utf-8;");
}
