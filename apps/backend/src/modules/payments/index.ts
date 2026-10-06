import { env } from "../../env.ts";
import { createOctoProvider } from "./providers/octo.ts";
import type { PaymentProvider } from "./provider.ts";

export type { PaymentProvider, PaymentEvent, PaymentStatus } from "./provider.ts";

/**
 * Провайдер инсталляции или null, если эквайринг не подключён (PAYMENT_PROVIDER=none).
 * Валидность конфига проверена в env.ts на старте, поэтому здесь без проверок.
 */
export function createPaymentProvider(): PaymentProvider | null {
  if (env.PAYMENT_PROVIDER === "octo") {
    return createOctoProvider({
      shopId: env.OCTO_SHOP_ID!,
      secret: env.OCTO_SECRET!,
      notifySecret: env.OCTO_NOTIFY_SECRET!,
      test: env.OCTO_TEST,
    });
  }
  return null;
}
