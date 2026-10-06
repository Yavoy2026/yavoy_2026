import { z } from "zod";

/** Языки интерфейса; узбекский — латиница (YAV-25) */
export const LocaleSchema = z.enum(["ru", "en", "uz"]);
export type Locale = z.infer<typeof LocaleSchema>;

/**
 * Валюта инсталляции (YAV-21). Одна на установку: витрина РФ торгует в рублях,
 * узбекская — в сумах. Коды ISO, а не символы: символ рисует UI.
 */
export const CurrencySchema = z.enum(["RUB", "UZS", "USD"]);
export type Currency = z.infer<typeof CurrencySchema>;

/**
 * Публичная конфигурация клиентов. Запрашивается до каталога и до авторизации:
 * язык нужен уже на экране входа. Дефолт задаётся на сервере, поэтому меняется
 * без пересборки приложений.
 */
export const ConfigResponseSchema = z.object({
  default_locale: LocaleSchema,
  /** Языки, которые клиент показывает в переключателе */
  supported_locales: z.array(LocaleSchema).min(1),
  /** Валюта цен и сумм; клиент по ней выбирает символ */
  currency: CurrencySchema,
});
export type ConfigResponse = z.infer<typeof ConfigResponseSchema>;
