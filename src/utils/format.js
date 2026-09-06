export function formatMoney(amount, currency) {
  const n = Number(amount) || 0;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${currency}${abs}`;
}

export function formatMoneyCompact(amount, currency) {
  const n = Math.abs(Number(amount) || 0);
  if (n >= 100000) return `${currency}${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${currency}${(n / 1000).toFixed(1)}k`;
  return `${currency}${Math.round(n)}`;
}
