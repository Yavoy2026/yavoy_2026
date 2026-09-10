export type Currency = "UZS" | "USD";

/** Курс пересчёта сум → доллар США для отображения цен. */
export const USD_RATE = 12900;

export function formatPriceWith(amountUzs: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${Math.round(amountUzs / USD_RATE).toLocaleString("ru-RU")}`;
  }
  return `${amountUzs.toLocaleString("ru-RU")} сум`;
}
