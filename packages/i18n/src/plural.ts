import type { Locale } from "./locales";

/**
 * Формы множественного числа. `other` обязателен — он же форма по умолчанию;
 * `few`/`many` нужны только русскому, поэтому опциональны.
 */
export interface Plural {
  one: string;
  few?: string;
  many?: string;
  other: string;
}

/** Помечает значение как набор форм, а не как объект вложенных ключей. */
export const p = (forms: Plural): Plural => forms;

export const isPlural = (value: unknown): value is Plural =>
  typeof value === "object" && value !== null && "other" in value;

type Category = "one" | "few" | "many" | "other";

/**
 * Правила CLDR зашиты руками намеренно: Intl.PluralRules в Hermes зависит от
 * платформенного ICU и для uz может отсутствовать. Языков три, правила стабильны —
 * детерминированный код надёжнее рантайм-зависимости.
 */
const category = (locale: Locale, n: number): Category => {
  const abs = Math.abs(n);
  if (locale === "ru") {
    if (!Number.isInteger(abs)) return "other";
    const mod10 = abs % 10;
    const mod100 = abs % 100;
    if (mod10 === 1 && mod100 !== 11) return "one";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "few";
    return "many";
  }
  // en, uz: одна форма единственного числа, всё остальное — other
  return abs === 1 ? "one" : "other";
};

export const selectPlural = (locale: Locale, forms: Plural, count: number): string =>
  forms[category(locale, count)] ?? forms.other;
