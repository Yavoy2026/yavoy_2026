/** Поддерживаемые языки интерфейса. Порядок = порядок в переключателе. */
export const LOCALES = ["ru", "en", "uz"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Язык последней надежды: используется, пока не приехал GET /v1/config,
 * и если сервер прислал неизвестный код.
 */
export const FALLBACK_LOCALE: Locale = "en";

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

/** Приводит произвольную строку к поддерживаемому языку; иначе — фолбэк. */
export const toLocale = (value: unknown, fallback: Locale = FALLBACK_LOCALE): Locale =>
  isLocale(value) ? value : fallback;

/** Название языка на нём самом — так подписывают переключатель везде. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  uz: "O‘zbekcha",
};

/** BCP-47 для Intl.*; узбекский — латиница (решение по YAV-25). */
export const INTL_LOCALE: Record<Locale, string> = {
  ru: "ru-RU",
  en: "en-US",
  uz: "uz-Latn-UZ",
};
