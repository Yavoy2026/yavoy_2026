import { and, eq, lt } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { bookings, payments } from "../../db/schema.ts";
import { env } from "../../env.ts";
import { notFound } from "../../errors.ts";
import type { Mailer } from "../../mail/mailer.ts";
import { confirmPaidBooking, expirePendingBooking } from "../bookings/service.ts";
import type { PaymentEvent, PaymentProvider } from "./provider.ts";

/**
 * Создаёт платёж по броне и возвращает ссылку на платёжную страницу банка.
 * Строку payments заводим ДО обращения к провайдеру: её id уходит туда как
 * shop_transaction_id, и по нему потом опознаётся коллбэк.
 */
export async function startPayment(
  db: Db,
  provider: PaymentProvider,
  booking: { id: string; amountKopeks: number; currency: string; contact: string; userId: string; tourTitle: string },
): Promise<string> {
  const inserted = await db
    .insert(payments)
    .values({
      bookingId: booking.id,
      provider: provider.id,
      amountMinor: booking.amountKopeks,
      currency: booking.currency,
    })
    .returning({ id: payments.id });
  const paymentId = inserted[0]!.id;

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.contact.trim());
  const created = await provider.createPayment({
    paymentId,
    amountMinor: booking.amountKopeks,
    currency: booking.currency,
    description: booking.tourTitle,
    notifyUrl: `${env.PUBLIC_API_URL}/v1/webhooks/${provider.id}`,
    returnUrl: env.PAYMENT_RETURN_URL,
    ttlMinutes: env.PAYMENT_TTL_MIN,
    language: env.DEFAULT_LOCALE,
    customer: {
      id: booking.userId,
      ...(isEmail ? { email: booking.contact.trim() } : { phone: booking.contact.replace(/\D/g, "") }),
    },
  });

  await db
    .update(payments)
    .set({
      providerPaymentId: created.providerPaymentId,
      payUrl: created.payUrl,
      status: created.status,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));

  return created.payUrl;
}

/**
 * Обработка коллбэка провайдера. Идемпотентна: повторная доставка того же
 * события не меняет ни платёж, ни бронь — провайдеры ретраят коллбэки.
 */
export async function applyPaymentEvent(db: Db, mailer: Mailer, event: PaymentEvent): Promise<void> {
  const rows = await db.select().from(payments).where(eq(payments.id, event.paymentId)).limit(1);
  const payment = rows[0];
  if (!payment) throw notFound("payment_not_found", "Платёж не найден");

  if (payment.status === event.status) return; // повторная доставка

  await db
    .update(payments)
    .set({
      status: event.status,
      providerPaymentId: event.providerPaymentId,
      maskedPan: event.maskedPan ?? payment.maskedPan,
      cardVendor: event.cardVendor ?? payment.cardVendor,
      refundedMinor: event.refundedMinor ?? payment.refundedMinor,
      lastEvent: event.raw,
      paidAt: event.status === "succeeded" ? new Date() : payment.paidAt,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  if (event.status === "succeeded") {
    await confirmPaidBooking(db, mailer, payment.bookingId);
  } else if (event.status === "cancelled" || event.status === "failed") {
    await expirePendingBooking(db, payment.bookingId);
  }
}

/**
 * Снимает брони, которые так и не оплатили: возвращает места в продажу.
 * Провайдер закрывает платёж по своему ttl, но места держим мы — значит и
 * освобождать их наша задача.
 */
export async function expireStalePayments(db: Db): Promise<number> {
  const deadline = new Date(Date.now() - env.PAYMENT_TTL_MIN * 60_000);
  const stale = await db
    .select({ bookingId: payments.bookingId, id: payments.id })
    .from(payments)
    .innerJoin(bookings, eq(bookings.id, payments.bookingId))
    .where(
      and(
        eq(bookings.status, "pending_payment"),
        lt(payments.createdAt, deadline),
      ),
    );

  for (const row of stale) {
    await db.update(payments).set({ status: "cancelled", updatedAt: new Date() }).where(eq(payments.id, row.id));
    await expirePendingBooking(db, row.bookingId);
  }
  return stale.length;
}
