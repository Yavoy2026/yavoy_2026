import { ConfigResponseSchema } from "@yavoy/contracts";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "../../env.ts";

/**
 * Публичная конфигурация клиентов. Отдельный эндпоинт, а не поле в /catalog:
 * язык нужен уже на экране входа, который рисуется до загрузки каталога.
 */
export async function configRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/config",
    { schema: { tags: ["config"], response: { 200: ConfigResponseSchema } } },
    async () => ({
      default_locale: env.DEFAULT_LOCALE,
      // дефолт обязан быть в списке, иначе клиент не сможет его показать
      supported_locales: env.SUPPORTED_LOCALES.includes(env.DEFAULT_LOCALE)
        ? env.SUPPORTED_LOCALES
        : [env.DEFAULT_LOCALE, ...env.SUPPORTED_LOCALES],
      currency: env.CURRENCY,
      country: env.COUNTRY,
    }),
  );
}
