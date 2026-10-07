export { LOCALES, FALLBACK_LOCALE, isLocale, toLocale, LOCALE_LABELS, INTL_LOCALE } from "./locales";
export type { Locale } from "./locales";
export {
  CURRENCIES,
  FALLBACK_CURRENCY,
  isCurrency,
  toCurrency,
  CURRENCY_SYMBOL,
  isPrefixCurrency,
  MINOR_UNITS,
} from "./currency";
export type { Currency } from "./currency";
export { p, selectPlural, isPlural } from "./plural";
export type { Plural } from "./plural";
export { createTranslator } from "./translate";
export type { CatalogPath, Params, Translator } from "./translate";
export {
  formatNumber,
  formatMoney,
  formatMoneyMinor,
  formatDate,
  formatDateShort,
  formatMonthYear,
  monthNames,
  weekdayNamesShort,
} from "./format";
export {
  TOUR_LANGUAGE_CODES,
  isTourLanguageCode,
  normalizeTourLanguage,
  tourLanguageLabel,
  tourLanguageList,
} from "./tourLanguages";
export type { TourLanguageCode } from "./tourLanguages";
export { ru } from "./catalog/ru";
export type { Catalog } from "./catalog/ru";
export { en } from "./catalog/en";
export { uz } from "./catalog/uz";

import { FALLBACK_LOCALE, type Locale } from "./locales";
import { ru, type Catalog } from "./catalog/ru";
import { en } from "./catalog/en";
import { uz } from "./catalog/uz";

export const CATALOGS: Record<Locale, Catalog> = { ru, en, uz };

export type TKey = import("./translate").CatalogPath<Catalog>;
export type TFunction = (key: TKey, params?: import("./translate").Params & { count?: number }) => string;

/** Страны, под которые заведены тексты витрины (см. `countries` в каталогах) */
export const COUNTRIES = ["RU", "UZ"] as const;
export type Country = (typeof COUNTRIES)[number];
export const FALLBACK_COUNTRY: Country = "RU";
export const isCountry = (v: unknown): v is Country => COUNTRIES.includes(v as Country);

/**
 * Формы названия страны для подстановки в строки витрины. Падеж выбирает сама
 * строка: в русском «Откройте Узбекистан», но «городов Узбекистана», и одной
 * формой это не покрыть. Клиенты передают все формы, каталог берёт нужную.
 */
export function countryParams(locale: Locale, country: Country) {
  const forms = (CATALOGS[locale] ?? CATALOGS[FALLBACK_LOCALE]).countries[country];
  return {
    countryNom: forms.nom,
    countryAcc: forms.acc,
    countryGen: forms.gen,
    countryDat: forms.dat,
  };
}
