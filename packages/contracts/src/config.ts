import { z } from "zod";

/** Языки интерфейса; узбекский — латиница (YAV-25) */
export const LocaleSchema = z.enum(["ru", "en", "uz"]);
export type Locale = z.infer<typeof LocaleSchema>;

/**
 * Публичная конфигурация клиентов. Запрашивается до каталога и до авторизации:
 * язык нужен уже на экране входа. Дефолт задаётся на сервере, поэтому меняется
 * без пересборки приложений.
 */
export const ConfigResponseSchema = z.object({
  default_locale: LocaleSchema,
  /** Языки, которые клиент показывает в переключателе */
  supported_locales: z.array(LocaleSchema).min(1),
});
export type ConfigResponse = z.infer<typeof ConfigResponseSchema>;
