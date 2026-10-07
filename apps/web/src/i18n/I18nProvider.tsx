import {
  countryParams,
  isCountry,
  FALLBACK_COUNTRY,
  type Country,
  CATALOGS,
  createTranslator,
  FALLBACK_LOCALE,
  LOCALES,
  formatDate as fmtDate,
  FALLBACK_CURRENCY,
  formatMoney as fmtMoney,
  formatMoneyMinor as fmtMoneyMinor,
  formatNumber as fmtNumber,
  isLocale,
  type Catalog,
  type Currency,
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
  /** Валюта инсталляции; приходит с сервера вместе с языком */
  currency: Currency;
  /** Страна инсталляции: от неё зависят тексты витрины */
  country: Country;
  /** Формы названия страны для подстановки в строки (падежи русского) */
  countryForms: ReturnType<typeof countryParams>;
  setLocale: (locale: Locale) => void;
  t: (key: TKey, params?: Params & { count?: number }) => string;
  formatMoney: (amount: number, currency?: Currency) => string;
  formatMoneyMinor: (minor: number, currency?: Currency) => string;
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
  const [currency, setCurrency] = useState<Currency>(cached?.currency ?? FALLBACK_CURRENCY);
  const [country, setCountry] = useState<Country>(
    isCountry(cached?.country) ? cached.country : FALLBACK_COUNTRY,
  );
  // ждать сеть нужно только на самом первом запуске: ни выбора, ни кэша нет
  const [ready, setReady] = useState(stored !== null || cached !== null);

  useEffect(() => {
    let cancelled = false;
    fetchAppConfig()
      .then((cfg) => {
        if (cancelled) return;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
        setSupported(cfg.supported_locales);
        setCurrency(cfg.currency);
        if (isCountry(cfg.country)) setCountry(cfg.country);
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
    // index.html статичен, поэтому заголовок вкладки переводим здесь
    document.title = createTranslator<Catalog>(CATALOGS, locale)("meta.title");
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
      currency,
      country,
      countryForms: countryParams(locale, country),
      setLocale,
      t: translate as I18nValue["t"],
      formatMoney: (amount, override) => fmtMoney(amount, locale, override ?? currency),
      formatMoneyMinor: (minor, override) => fmtMoneyMinor(minor, locale, override ?? currency),
      formatNumber: (v) => fmtNumber(v, locale),
      formatDate: (v, options) => fmtDate(v, locale, options),
    };
  }, [locale, supported, currency, country, setLocale]);

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
