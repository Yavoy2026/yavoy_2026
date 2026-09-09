import { LOCALES } from "@yavoy/i18n";
import { z } from "zod";

const LocaleEnum = z.enum(LOCALES);

/** "ru,en" → ["ru","en"]; пустая строка означает «все поддерживаемые» */
const LocaleList = z
  .string()
  .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(LocaleEnum).min(1));

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().default(3000),
  HOST: z.string().default("0.0.0.0"),
  JWT_PRIVATE_KEY_PEM: z.string().optional(),
  JWT_PUBLIC_KEY_PEM: z.string().optional(),
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  /** Язык, который клиенты берут при первом запуске (GET /v1/config) */
  DEFAULT_LOCALE: LocaleEnum.default("en"),
  /** Языки в переключателе клиентов; невычитанный язык можно скрыть, не пересобирая приложения */
  SUPPORTED_LOCALES: LocaleList.default(LOCALES.join(",")),
  /** Язык всех исходящих писем — один на установку (решение по YAV-25) */
  MAIL_LOCALE: LocaleEnum.default("ru"),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

if (env.NODE_ENV === "production" && (!env.JWT_PRIVATE_KEY_PEM || !env.JWT_PUBLIC_KEY_PEM)) {
  throw new Error("JWT_PRIVATE_KEY_PEM / JWT_PUBLIC_KEY_PEM обязательны в production");
}
