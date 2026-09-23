/** Prices live in the database as integer kopiyky. 450 ₴ is stored as 45000. */

export function toKopiyky(input: string | number): number | null {
  const normalized = String(input).replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

export function toHryvnia(kopiyky: number): string {
  return (kopiyky / 100).toFixed(2).replace(/\.00$/, "");
}

const formatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});

/** Display form: «450 ₴». */
export function formatPrice(kopiyky: number): string {
  return formatter.format(kopiyky / 100);
}
