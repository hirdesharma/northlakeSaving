/** Display formatting. Locale is pinned so server and client render identically. */

const LOCALE = "en-US";

export const money = (n: number, decimals = 2) =>
  n.toLocaleString(LOCALE, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** Axis-scale abbreviation: $70K, $1.2M. */
export function moneyCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `$${Math.round(n)}`;
}

export const pct = (n: number, decimals = 2) => `${(n * 100).toFixed(decimals)}%`;

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parses `yyyy-mm-dd` positionally — never through Date(), which shifts by timezone. */
const parts = (isoDate: string) => ({
  y: Number(isoDate.slice(0, 4)),
  m: Number(isoDate.slice(5, 7)) - 1,
  d: Number(isoDate.slice(8, 10)),
});

export function dateLong(isoDate: string): string {
  const { y, m, d } = parts(isoDate);
  return `${MONTHS_LONG[m]} ${d}, ${y}`;
}

export function dateShort(isoDate: string): string {
  const { y, m, d } = parts(isoDate);
  return `${MONTHS_SHORT[m]} ${d}, ${y}`;
}
