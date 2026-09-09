import { LOCALES, toCurrency, type Currency, type Locale } from "@yavoy/i18n";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/v1";

export interface AppConfig {
  default_locale: Locale;
  supported_locales: Locale[];
  /** Валюта инсталляции: РФ — RUB, узбекская витрина — UZS (YAV-21) */
  currency: Currency;
}

const isLocaleArray = (v: unknown): v is Locale[] =>
  Array.isArray(v) && v.length > 0 && v.every((x) => (LOCALES as readonly string[]).includes(x));

/** Публичная конфигурация: язык по умолчанию и список языков. Без авторизации. */
export async function fetchAppConfig(): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error(`config ${res.status}`);
  const body = (await res.json()) as unknown;
  const cfg = body as AppConfig;
  if (!isLocaleArray(cfg.supported_locales) || !(LOCALES as readonly string[]).includes(cfg.default_locale)) {
    throw new Error("config: unknown locales");
  }
  // валюта — не повод падать: незнакомый код деградирует до фолбэка
  return { ...cfg, currency: toCurrency(cfg.currency) };
}
