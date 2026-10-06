/**
 * Абстракция эквайринга (YAV-21). Инсталляций две — российская и узбекская, —
 * и провайдер у них разный, поэтому доменный код не знает, кто именно проводит
 * платёж. Реквизиты карт через этот интерфейс не проходят: мы получаем только
 * ссылку на платёжную страницу банка и результат операции.
 */
export type PaymentStatus = "created" | "pending" | "succeeded" | "cancelled" | "failed";

export interface CreatePaymentInput {
  /** Наш идентификатор платежа; уникален на стороне провайдера */
  paymentId: string;
  amountMinor: number;
  currency: string;
  description: string;
  /** Куда провайдер шлёт коллбэк */
  notifyUrl: string;
  /** Куда вернуть покупателя после оплаты */
  returnUrl?: string;
  /** Сколько минут платёж живёт на стороне провайдера */
  ttlMinutes: number;
  language: string;
  customer?: { id: string; email?: string; phone?: string };
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  payUrl: string;
  status: PaymentStatus;
}

/** Разобранный и проверенный коллбэк провайдера */
export interface PaymentEvent {
  providerPaymentId: string;
  /** Наш paymentId, который мы передавали при создании */
  paymentId: string;
  status: PaymentStatus;
  maskedPan?: string;
  cardVendor?: string;
  refundedMinor?: number;
  raw: unknown;
}

export interface PaymentProvider {
  readonly id: "octo";
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /**
   * Проверяет подпись и разбирает коллбэк. Бросает AppError, если подпись
   * не сошлась — необработанный коллбэк лучше потерянных денег.
   */
  parseWebhook(body: unknown): PaymentEvent;
  refund(input: { providerPaymentId: string; refundId: string; amountMinor: number }): Promise<void>;
}
