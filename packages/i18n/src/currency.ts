/**
 * Валюта инсталляции (YAV-21). Одна на установку: РФ торгует в рублях,
 * узбекская витрина — в сумах. В API и БД ходят коды ISO, символ появляется
 * только здесь, на границе UI.
 */
export const CURRENCIES = ["RUB", "UZS", "USD"] as const;

export type Currency = (typeof CURRENCIES)[number];

/** Пока не приехал GET /v1/config — и если сервер прислал неизвестный код. */
export const FALLBACK_CURRENCY: Currency = "RUB";

export const isCurrency = (value: unknown): value is Currency =>
  typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);

export const toCurrency = (value: unknown, fallback: Currency = FALLBACK_CURRENCY): Currency =>
  isCurrency(value) ? value : fallback;

/** «soʻm» — латинская форма, принятая в узбекских ценниках. */
export const CURRENCY_SYMBOL: Record<Currency, string> = {
  RUB: "₽",
  UZS: "so‘m",
  USD: "$",
};

/** Доллар пишется перед суммой, рубль и сум — после. */
const PREFIXED: readonly Currency[] = ["USD"];

export const isPrefixCurrency = (currency: Currency): boolean => PREFIXED.includes(currency);

/**
 * Сколько минорных единиц в мажорной. У сума тийины давно вышли из оборота,
 * но суммы всё равно храним в минорных — чтобы арифметика денег везде была
 * целочисленной и одинаковой для обеих инсталляций.
 */
export const MINOR_UNITS = 100;
