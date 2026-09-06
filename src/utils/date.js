function pad(n) {
  return String(n).padStart(2, "0");
}

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function daysInMonth(year, monthIndex0) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function clampDay(year, monthIndex0, day) {
  return Math.min(day, daysInMonth(year, monthIndex0));
}

/** Returns {start, end} Date objects (local, midnight) for the statement
 * period that contains `date`, given a cycle that restarts on `startDay`
 * of every month. */
export function periodContaining(date, startDay) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  let sy = y, sm = m;
  if (d < startDay) {
    sm = m - 1;
    sy = sm < 0 ? y - 1 : y;
    sm = (sm + 12) % 12;
  }
  const start = new Date(sy, sm, clampDay(sy, sm, startDay));

  let ny = start.getFullYear();
  let nm = start.getMonth() + 1;
  if (nm > 11) { nm = 0; ny += 1; }
  const nextStart = new Date(ny, nm, clampDay(ny, nm, startDay));
  const end = new Date(nextStart.getTime() - 86400000);

  return { start, end };
}

export function periodToRecord(period) {
  return { start: toISODate(period.start), end: toISODate(period.end) };
}

/** The period immediately following the given {start,end} (ISO string) record. */
export function nextPeriodRecord(periodRecord, startDay) {
  const afterEnd = new Date(parseISODate(periodRecord.end).getTime() + 86400000);
  return periodToRecord(periodContaining(afterEnd, startDay));
}

const MONTHS = ["January","February","March","April","May","June","July",
  "August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** "August" or "August – September 2026" style heading for a bill. */
export function formatBillHeading(periodRecord) {
  const s = parseISODate(periodRecord.start);
  const e = parseISODate(periodRecord.end);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${MONTHS[s.getMonth()]} – ${MONTHS[e.getMonth()]} ${s.getFullYear()}`;
  }
  return `${MONTHS[s.getMonth()]} ${s.getFullYear()} – ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

/** "05 Aug – 04 Sep 2026" small statement-period label. */
export function formatPeriodLabel(periodRecord) {
  const s = parseISODate(periodRecord.start);
  const e = parseISODate(periodRecord.end);
  const sStr = `${pad(s.getDate())} ${MONTHS_SHORT[s.getMonth()]}`;
  const eStr = `${pad(e.getDate())} ${MONTHS_SHORT[e.getMonth()]} ${e.getFullYear()}`;
  return `${sStr} – ${eStr}`;
}

export function formatDateShort(iso) {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatDateFull(iso) {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
