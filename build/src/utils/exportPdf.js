import { getCategory } from "./categories.js";
import { formatDateShort } from "./date.js";

export function exportBillPdf({ heading, sub, expenses, currency, filename }) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    console.error("CardLedger: jsPDF not loaded.");
    return false;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const rightX = 548;
  const pageBottom = 770;
  let y = 64;

  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  const total = sorted.reduce((s, e) => s + Number(e.amount), 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(20, 20, 20);
  doc.text(heading, marginX, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(sub, marginX, y);
  y += 20;

  doc.setDrawColor(210, 210, 210);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(marginX, y, rightX, y);
  doc.setLineDashPattern([], 0);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(140, 140, 140);
  doc.text("DATE", marginX, y);
  doc.text("CATEGORY / DESCRIPTION", marginX + 66, y);
  doc.text("AMOUNT", rightX, y, { align: "right" });
  y += 8;
  doc.setDrawColor(225, 225, 225);
  doc.line(marginX, y, rightX, y);
  y += 16;

  if (sorted.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("No expenses logged for this statement.", marginX, y);
    y += 20;
  }

  sorted.forEach((e) => {
    const hasDesc = !!e.description;
    const rowH = hasDesc ? 25 : 17;
    if (y + rowH > pageBottom) {
      doc.addPage();
      y = 60;
    }
    const cat = getCategory(e.category);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(formatDateShort(e.date), marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(25, 25, 25);
    doc.text(cat.label, marginX + 66, y);

    if (hasDesc) {
      doc.setFontSize(8.5);
      doc.setTextColor(150, 150, 150);
      doc.text(e.description, marginX + 66, y + 12);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(25, 25, 25);
    doc.text(`${currency}${Number(e.amount).toFixed(2)}`, rightX, y, { align: "right" });

    y += rowH;
  });

  y += 4;
  doc.setDrawColor(20, 20, 20);
  doc.line(marginX, y, rightX, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(15, 15, 15);
  doc.text("TOTAL", marginX, y);
  doc.text(`${currency}${total.toFixed(2)}`, rightX, y, { align: "right" });
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(170, 170, 170);
  doc.text(`Generated ${new Date().toLocaleString()} · Authenwrite Studio`, marginX, y);

  doc.save(filename);
  return true;
}
