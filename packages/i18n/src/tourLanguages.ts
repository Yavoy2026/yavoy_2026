/**
 * Языки проведения экскурсии (поле tours.languages). Хранятся кодами, но в
 * старых записях лежат свободные строки («Русский», «English»), поэтому
 * нормализация терпимая: неизвестное значение возвращается как есть.
 */
export const TOUR_LANGUAGE_CODES = ["ru", "en", "uz", "de", "fr", "zh", "tt"] as const;

export type TourLanguageCode = (typeof TOUR_LANGUAGE_CODES)[number];

const ALIASES: Record<string, TourLanguageCode> = {
  ru: "ru", рус: "ru", русский: "ru", russian: "ru",
  en: "en", eng: "en", английский: "en", english: "en",
  uz: "uz", узбекский: "uz", uzbek: "uz", "o'zbekcha": "uz", "oʻzbekcha": "uz",
  de: "de", немецкий: "de", deutsch: "de", german: "de",
  fr: "fr", французский: "fr", "français": "fr", french: "fr",
  zh: "zh", китайский: "zh", "中文": "zh", chinese: "zh",
  tt: "tt", татарский: "tt", tatar: "tt",
};

export const isTourLanguageCode = (value: string): value is TourLanguageCode =>
  (TOUR_LANGUAGE_CODES as readonly string[]).includes(value);

/** «Русский» → "ru"; неизвестное значение остаётся собой (данные не теряем) */
export const normalizeTourLanguage = (value: string): string => {
  const key = value.trim().toLowerCase();
  return ALIASES[key] ?? value.trim();
};

/** Подпись языка экскурсии: код переводим, свободную строку показываем как есть */
export const tourLanguageLabel = (value: string, translate: (key: string) => string): string => {
  const code = normalizeTourLanguage(value);
  if (!isTourLanguageCode(code)) return value;
  const key = `enums.tourLanguage.${code}`;
  const label = translate(key);
  return label === key ? value : label;
};

export const tourLanguageList = (values: string[], translate: (key: string) => string): string =>
  values.map((v) => tourLanguageLabel(v, translate)).join(", ");
