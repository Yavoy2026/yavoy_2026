import { createHash } from "node:crypto";
import { badRequest, unauthorized } from "../../../errors.ts";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentEvent,
  PaymentProvider,
  PaymentStatus,
} from "../provider.ts";

const API_BASE = "https://secure.octo.uz";

/**
 * OCTO принимает и отдаёт суммы в мажорных единицах (1000.0 = 1000 сум),
 * а храним мы в минорных — конвертация только здесь, на границе.
 */
const toMajor = (minor: number): number => Math.round(minor) / 100;
const toMinor = (major: number): number => Math.round(major * 100);

/** Статусы OCTO → наши (help.octo.uz/statuses.html) */
const STATUS_MAP: Record<string, PaymentStatus> = {
  created: "created",
  wait_user_action: "pending",
  waiting_for_capture: "pending",
  succeeded: "succeeded",
  canceled: "cancelled",
};

/** OCTO ждёт время в локальном формате без таймзоны */
const formatInitTime = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")} ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(
    2,
    "0",
  )}:${String(date.getUTCSeconds()).padStart(2, "0")}`;

interface OctoEnvelope<T> {
  error: number;
  errMessage?: string | null;
  data?: T | null;
  apiMessageForDevelopers?: string;
}

interface OctoPrepareData {
  shop_transaction_id: string;
  octo_payment_UUID: string;
  status: string;
  octo_pay_url: string;
  total_sum: number;
}

export interface OctoConfig {
  shopId: number;
  secret: string;
  /** Отдельный ключ подписи коллбэков; выдаётся техподдержкой OCTO */
  notifySecret: string;
  test: boolean;
}

async function call<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await res.json().catch(() => null)) as OctoEnvelope<T> | null;
  if (!body) throw badRequest("payment_provider_error", `OCTO ${path}: пустой ответ (${res.status})`);
  // у OCTO HTTP всегда 200, ошибка приходит в теле
  if (body.error !== 0 || !body.data) {
    throw badRequest("payment_provider_error", `OCTO ${path}: ${body.errMessage ?? "неизвестная ошибка"}`);
  }
  return body.data;
}

export function createOctoProvider(config: OctoConfig): PaymentProvider {
  return {
    id: "octo",

    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      const data = await call<OctoPrepareData>("/prepare_payment", {
        octo_shop_id: config.shopId,
        octo_secret: config.secret,
        shop_transaction_id: input.paymentId,
        // одностадийная оплата: списываем сразу, без отдельного capture
        auto_capture: true,
        test: config.test,
        init_time: formatInitTime(new Date()),
        total_sum: toMajor(input.amountMinor),
        currency: input.currency,
        description: input.description,
        ...(input.customer
          ? {
              user_data: {
                user_id: input.customer.id,
                ...(input.customer.email ? { email: input.customer.email } : {}),
                ...(input.customer.phone ? { phone: input.customer.phone } : {}),
              },
            }
          : {}),
        payment_methods: [{ method: "bank_card" }, { method: "uzcard" }, { method: "humo" }],
        notify_url: input.notifyUrl,
        ...(input.returnUrl ? { return_url: input.returnUrl } : {}),
        language: input.language,
        ttl: input.ttlMinutes,
      });

      return {
        providerPaymentId: data.octo_payment_UUID,
        payUrl: data.octo_pay_url,
        status: STATUS_MAP[data.status] ?? "created",
      };
    },

    parseWebhook(body: unknown): PaymentEvent {
      const b = body as Record<string, unknown> | null;
      const uuid = typeof b?.octo_payment_UUID === "string" ? b.octo_payment_UUID : null;
      const status = typeof b?.status === "string" ? b.status : null;
      const signature = typeof b?.signature === "string" ? b.signature : null;
      const shopTransactionId = typeof b?.shop_transaction_id === "string" ? b.shop_transaction_id : null;

      if (!uuid || !status || !signature || !shopTransactionId) {
        throw badRequest("invalid_webhook", "Коллбэк OCTO без обязательных полей");
      }

      // sha1(unique_key + uuid + status) — help.octo.uz/notifications.html
      const expected = createHash("sha1")
        .update(`${config.notifySecret}${uuid}${status}`)
        .digest("hex");
      if (expected.toLowerCase() !== signature.toLowerCase()) {
        throw unauthorized("invalid_webhook_signature", "Подпись коллбэка не совпала");
      }

      const refunded = typeof b?.refunded_sum === "number" ? toMinor(b.refunded_sum) : undefined;
      return {
        providerPaymentId: uuid,
        paymentId: shopTransactionId,
        status: STATUS_MAP[status] ?? "pending",
        maskedPan: typeof b?.maskedPan === "string" ? b.maskedPan : undefined,
        cardVendor: typeof b?.card_vendor === "string" ? b.card_vendor : undefined,
        refundedMinor: refunded,
        raw: body,
      };
    },

    async refund({ providerPaymentId, refundId, amountMinor }): Promise<void> {
      await call("/refund", {
        octo_shop_id: config.shopId,
        octo_secret: config.secret,
        shop_refund_id: refundId,
        octo_payment_UUID: providerPaymentId,
        amount: toMajor(amountMinor),
      });
    },
  };
}
