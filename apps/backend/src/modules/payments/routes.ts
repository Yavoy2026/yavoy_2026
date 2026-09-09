import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ErrorEnvelopeSchema } from "@yavoy/contracts";
import { notFound } from "../../errors.ts";
import { applyPaymentEvent } from "./service.ts";

/**
 * Коллбэки провайдера. Без авторизации — подлинность проверяется подписью
 * в теле (parseWebhook). Отвечаем 200 на уже обработанное событие: провайдер
 * ретраит доставку, и повторы не должны выглядеть как сбой.
 */
export async function paymentsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/webhooks/:provider",
    {
      schema: {
        tags: ["payments"],
        params: z.object({ provider: z.string() }),
        body: z.unknown(),
        response: { 200: z.object({ ok: z.literal(true) }), 401: ErrorEnvelopeSchema, 404: ErrorEnvelopeSchema },
      },
    },
    async (req) => {
      const provider = app.payments;
      if (!provider || provider.id !== req.params.provider) {
        throw notFound("provider_not_configured", "Платёжный провайдер не подключён");
      }
      const event = provider.parseWebhook(req.body);
      req.log.info({ payment: event.paymentId, status: event.status }, "payment webhook");
      await applyPaymentEvent(app.db, app.mailer, event);
      return { ok: true as const };
    },
  );
}
