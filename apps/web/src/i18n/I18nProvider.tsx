import {
  CATALOGS,
  createTranslator,
  FALLBACK_LOCALE,
  LOCALES,
  formatDate as fmtDate,
  formatMoney as fmtMoney,
  formatMoneyKopeks as fmtMoneyKopeks,
  formatNumber as fmtNumber,
  isLocale,
  type Catalog,
  type Locale,
  type Params,
} from "@yavoy/i18n";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { fetchAppConfig, type AppConfig } from "@/services/config";

import type { TKey } from "./keys";

const LOCALE_KEY = "yavoy_locale";
const CONFIG_KEY = "yavoy_app_config";

interface I18nValue {
  locale: Locale;
  supported: Locale[];
  setLocale: (locale: Locale) => void;
  t: (key: TKey, params?: Params & { count?: number }) => string;
  formatMoney: (rubles: number, currency?: string) => string;
  formatMoneyKopeks: (kopeks: number, currency?: string) => string;
  formatNumber: (value: number) => string;
  formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const readStoredLocale = (): Locale | null => {
  const raw = localStorage.getItem(LOCALE_KEY);
  return isLocale(raw) ? raw : null;
};

const readCachedConfig = (): AppConfig | null => {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as AppConfig;
    return isLocale(cfg.default_locale) && Array.isArray(cfg.supported_locales) ? cfg : null;
  } catch {
    return null;
  }
};

/**
 * Язык устройства не читаем: дефолт задаёт сервер (GET /v1/config), поэтому его
 * можно менять без пересборки клиентов. Выбор пользователя перекрывает дефолт
 * навсегда. Ответ конфига кэшируется, чтобы повторные запуски стартовали без сети.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const stored = readStoredLocale();
  const cached = readCachedConfig();

  const [locale, setLocaleState] = useState<Locale>(stored ?? cached?.default_locale ?? FALLBACK_LOCALE);
  const [supported, setSupported] = useState<Locale[]>(cached?.supported_locales ?? [...LOCALES]);
  // ждать сеть нужно только на самом первом запуске: ни выбора, ни кэша нет
  const [ready, setReady] = useState(stored !== null || cached !== null);

  useEffect(() => {
    let cancelled = false;
    fetchAppConfig()
      .then((cfg) => {
        if (cancelled) return;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
        setSupported(cfg.supported_locales);
        if (readStoredLocale() === null) setLocaleState(cfg.default_locale);
      })
      .catch(() => {
        // офлайн или бэкенд лежит — остаёмся на кэше/фолбэке, приложение работает
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(LOCALE_KEY, next);
    setLocaleState(next);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const translate = createTranslator<Catalog>(CATALOGS, locale);
    return {
      locale,
      supported,
      setLocale,
      t: translate as I18nValue["t"],
      formatMoney: (rubles, currency) => fmtMoney(rubles, locale, currency),
      formatMoneyKopeks: (kopeks, currency) => fmtMoneyKopeks(kopeks, locale, currency),
      formatNumber: (v) => fmtNumber(v, locale),
      formatDate: (v, options) => fmtDate(v, locale, options),
    };
  }, [locale, supported, setLocale]);

  // короткий скелетон вместо мигания языка на первом кадре
  if (!ready) return <div className="min-h-screen bg-background" />;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n called outside I18nProvider");
  return ctx;
}

/** Короткий доступ к переводчику — самый частый импорт в экранах */
export const useT = () => useI18n().t;
