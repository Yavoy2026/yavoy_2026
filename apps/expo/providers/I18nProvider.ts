import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import {
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
import { useCallback, useEffect, useMemo, useState } from "react";

import type { TKey } from "@/i18n/keys";
import { fetchAppConfig, type AppConfig } from "@/services/config";

const LOCALE_KEY = "yavoy_locale";
const CONFIG_KEY = "yavoy_app_config";

/**
 * Язык устройства не читаем: дефолт задаёт сервер (GET /v1/config), поэтому его
 * можно менять без пересборки приложения. Выбор пользователя перекрывает дефолт
 * навсегда. Ответ конфига кэшируется — повторные запуски стартуют без сети.
 */
export const [I18nProvider, useI18n] = createContextHook(() => {
  const [locale, setLocaleState] = useState<Locale>(FALLBACK_LOCALE);
  const [supported, setSupported] = useState<Locale[]>([...LOCALES]);
  const [currency, setCurrency] = useState<Currency>(FALLBACK_CURRENCY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const [stored, cachedRaw] = await Promise.all([
        AsyncStorage.getItem(LOCALE_KEY),
        AsyncStorage.getItem(CONFIG_KEY),
      ]);
      if (cancelled) return;

      let cached: AppConfig | null = null;
      try {
        cached = cachedRaw ? (JSON.parse(cachedRaw) as AppConfig) : null;
      } catch {
        cached = null;
      }

      const userChoice = isLocale(stored) ? stored : null;
      if (userChoice) setLocaleState(userChoice);
      else if (cached && isLocale(cached.default_locale)) setLocaleState(cached.default_locale);
      if (cached?.supported_locales?.length) setSupported(cached.supported_locales);
      if (cached?.currency) setCurrency(cached.currency);
      // при наличии выбора или кэша сеть уже не блокирует первый кадр
      if (userChoice || cached) setReady(true);

      try {
        const cfg = await fetchAppConfig();
        if (cancelled) return;
        await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
        setSupported(cfg.supported_locales);
        setCurrency(cfg.currency);
        if (!userChoice) setLocaleState(cfg.default_locale);
      } catch {
        // офлайн или бэкенд лежит — остаёмся на кэше/фолбэке
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void AsyncStorage.setItem(LOCALE_KEY, next);
  }, []);

  const t = useMemo(
    () => createTranslator<Catalog>(CATALOGS, locale) as (key: TKey, params?: Params & { count?: number }) => string,
    [locale],
  );

  return useMemo(
    () => ({
      locale,
      supported,
      /** Валюта инсталляции; приходит с сервера вместе с языком */
      currency,
      setLocale,
      ready,
      t,
      formatNumber: (value: number) => fmtNumber(value, locale),
      formatMoney: (amount: number, override?: Currency) => fmtMoney(amount, locale, override ?? currency),
      formatMoneyMinor: (minor: number, override?: Currency) => fmtMoneyMinor(minor, locale, override ?? currency),
      formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) => fmtDate(value, locale, options),
    }),
    [locale, supported, currency, setLocale, ready, t],
  );
});

/** Короткий доступ к переводчику — самый частый импорт в экранах */
export const useT = () => useI18n().t;
