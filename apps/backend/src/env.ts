import { CurrencySchema } from "@yavoy/contracts";
import { LOCALES } from "@yavoy/i18n";
import { z } from "zod";

const LocaleEnum = z.enum(LOCALES);

/** "ru,en" → ["ru","en"]; пустая строка означает «все поддерживаемые» */
const LocaleList = z
  .string()
  .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(LocaleEnum).min(1));

/**
 * Пустая строка = переменная не задана. docker compose подставляет "" вместо
 * незаполненного значения из .env, и без этого пустой ADMIN_EMAIL валил бы старт
 * на email-валидации, а пустой MAIL_FROM уезжал бы в заголовок From.
 */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().default(3000),
  HOST: z.string().default("0.0.0.0"),
  JWT_PRIVATE_KEY_PEM: optional(z.string()),
  JWT_PUBLIC_KEY_PEM: optional(z.string()),
  SMTP_URL: optional(z.string()),
  MAIL_FROM: optional(z.string()),
  ADMIN_EMAIL: optional(z.string().email()),
  /** Язык, который клиенты берут при первом запуске (GET /v1/config) */
  DEFAULT_LOCALE: LocaleEnum.default("en"),
  /** Языки в переключателе клиентов; невычитанный язык можно скрыть, не пересобирая приложения */
  SUPPORTED_LOCALES: LocaleList.default(LOCALES.join(",")),
  /** Язык всех исходящих писем — один на установку (решение по YAV-25) */
  MAIL_LOCALE: LocaleEnum.default("ru"),

  // ─── Платежи (YAV-21) ──────────────────────────────────────
  /**
   * Провайдер эквайринга инсталляции. none — оплаты нет: бронь создаётся
   * в requested и подтверждается менеджером вручную (текущее поведение РФ).
   */
  PAYMENT_PROVIDER: z.enum(["none", "octo"]).default("none"),
  /** Валюта инсталляции: UZS для узбекской витрины, RUB для российской */
  CURRENCY: CurrencySchema.default("RUB"),
  /** Публичный URL API — на него провайдер шлёт коллбэк, а клиент возвращается после оплаты */
  PUBLIC_API_URL: optional(z.string().url()),
  /** Куда вернуть покупателя с платёжной страницы */
  PAYMENT_RETURN_URL: optional(z.string().url()),
  /** Сколько минут бронь ждёт оплату, потом отменяется и места возвращаются */
  PAYMENT_TTL_MIN: z.coerce.number().int().min(5).max(120).default(30),
  /**
   * Сколько часов заявка ждёт ответа организатора. Места удерживаются с момента
   * заявки, поэтому молчание не может длиться вечно (YAV-27).
   */
  PARTNER_RESPONSE_TTL_H: z.coerce.number().int().min(1).max(168).default(24),

  OCTO_SHOP_ID: z.coerce.number().int().optional(),
  OCTO_SECRET: optional(z.string()),
  /** Отдельный ключ для проверки подписи коллбэка; выдаётся техподдержкой OCTO */
  OCTO_NOTIFY_SECRET: optional(z.string()),
  OCTO_TEST: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

if (env.NODE_ENV === "production" && (!env.JWT_PRIVATE_KEY_PEM || !env.JWT_PUBLIC_KEY_PEM)) {
  throw new Error("JWT_PRIVATE_KEY_PEM / JWT_PUBLIC_KEY_PEM обязательны в production");
}

// Полконфига платежей хуже, чем её отсутствие: бронь уйдёт в pending_payment,
// а платёж создать будет нечем — деньги не возьмём и места заблокируем.
if (env.PAYMENT_PROVIDER === "octo") {
  const missing = (
    [
      ["OCTO_SHOP_ID", env.OCTO_SHOP_ID],
      ["OCTO_SECRET", env.OCTO_SECRET],
      ["OCTO_NOTIFY_SECRET", env.OCTO_NOTIFY_SECRET],
      ["PUBLIC_API_URL", env.PUBLIC_API_URL],
    ] as const
  )
    .filter(([, value]) => value === undefined)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`PAYMENT_PROVIDER=octo требует переменные: ${missing.join(", ")}`);
  }
}
