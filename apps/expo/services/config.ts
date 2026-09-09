import { LOCALES, type Locale } from "@yavoy/i18n";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/v1";

export interface AppConfig {
  default_locale: Locale;
  supported_locales: Locale[];
}

const isLocaleArray = (v: unknown): v is Locale[] =>
  Array.isArray(v) && v.length > 0 && v.every((x) => (LOCALES as readonly string[]).includes(x as string));

/** Публичная конфигурация: язык по умолчанию и список языков. Без авторизации. */
export async function fetchAppConfig(): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error(`config ${res.status}`);
  const cfg = (await res.json()) as AppConfig;
  if (!isLocaleArray(cfg.supported_locales) || !(LOCALES as readonly string[]).includes(cfg.default_locale)) {
    throw new Error("config: unknown locales");
  }
  return cfg;
}
