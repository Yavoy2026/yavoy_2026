import { INTL_LOCALE, type Locale } from "./locales";

/**
 * Intl в Hermes опирается на платформенный ICU и на части устройств урезан,
 * поэтому каждый форматтер деградирует до нейтрального вида, а не падает.
 */
const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const formatNumber = (value: number, locale: Locale): string =>
  safe(() => new Intl.NumberFormat(INTL_LOCALE[locale]).format(value), String(value));

/** Деньги приходят из API в копейках; в рубли переводим здесь, на границе UI. */
export const formatMoneyKopeks = (kopeks: number, locale: Locale, currency = "₽"): string =>
  `${formatNumber(Math.round(kopeks / 100), locale)} ${currency}`;

export const formatMoney = (rubles: number, locale: Locale, currency = "₽"): string =>
  `${formatNumber(rubles, locale)} ${currency}`;

const toDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

export const formatDate = (
  value: Date | string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "";
  return safe(() => new Intl.DateTimeFormat(INTL_LOCALE[locale], options).format(date), date.toISOString().slice(0, 10));
};

export const formatDateShort = (value: Date | string, locale: Locale): string =>
  formatDate(value, locale, { day: "numeric", month: "short" });

export const formatMonthYear = (value: Date | string, locale: Locale): string =>
  formatDate(value, locale, { month: "long", year: "numeric" });

/** Названия месяцев/дней для самодельных календарей (DateSelector). */
export const monthNames = (locale: Locale): string[] =>
  Array.from({ length: 12 }, (_, month) =>
    safe(
      () => new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "long" }).format(new Date(2021, month, 1)),
      String(month + 1),
    ),
  );

export const weekdayNamesShort = (locale: Locale): string[] =>
  // 2021-03-01 — понедельник; неделя начинается с понедельника во всех трёх языках
  Array.from({ length: 7 }, (_, day) =>
    safe(
      () => new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: "short" }).format(new Date(2021, 2, 1 + day)),
      String(day),
    ),
  );
