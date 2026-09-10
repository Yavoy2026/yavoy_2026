import { and, desc, eq, lt } from "drizzle-orm";
import type { Transaction, TransactionStatus } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { bookings, payments, tours } from "../../db/schema.ts";
import { env } from "../../env.ts";
import { notFound } from "../../errors.ts";
import type { Mailer } from "../../mail/mailer.ts";
import { cancelUnpaidBooking, confirmPaidBooking, expireUnpaidBooking } from "../bookings/service.ts";
import type { PaymentEvent, PaymentProvider, PaymentStatus } from "./provider.ts";

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
    // банк закрыл платёж — это отмена, а не истёкший срок: сроком занят сборщик
    await cancelUnpaidBooking(db, payment.bookingId);
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
        eq(bookings.status, "awaiting_payment"),
        lt(payments.createdAt, deadline),
      ),
    );

  for (const row of stale) {
    await db.update(payments).set({ status: "cancelled", updatedAt: new Date() }).where(eq(payments.id, row.id));
    await expireUnpaidBooking(db, row.bookingId);
  }
  return stale.length;
}

/**
 * История платежей пользователя (YAV-31). Идёт по броням: платёж всегда
 * привязан к брони, а бронь — к пользователю. Возврат считается по
 * refunded_minor, а не по статусу: провайдер помечает succeeded и при
 * частичном возврате тоже.
 */
export async function listMyTransactions(db: Db, userId: string): Promise<Transaction[]> {
  const rows = await db
    .select({
      payment: payments,
      tourTitle: tours.title,
      tourImageUrl: tours.imageUrl,
    })
    .from(payments)
    .innerJoin(bookings, eq(bookings.id, payments.bookingId))
    .innerJoin(tours, eq(tours.id, bookings.tourId))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(payments.createdAt));

  return rows.map(({ payment, tourTitle, tourImageUrl }) => ({
    id: payment.id,
    booking_id: payment.bookingId,
    tour_title: tourTitle,
    tour_image_url: tourImageUrl,
    status: transactionStatus(payment.status, payment.refundedMinor),
    amount_minor: payment.amountMinor,
    refunded_minor: payment.refundedMinor,
    currency: payment.currency,
    masked_pan: payment.maskedPan,
    card_vendor: payment.cardVendor,
    paid_at: payment.paidAt?.toISOString() ?? null,
    created_at: payment.createdAt.toISOString(),
  }));
}

/** Состояний у провайдера больше, чем имеет смысл показывать человеку */
function transactionStatus(status: PaymentStatus, refundedMinor: number): TransactionStatus {
  if (refundedMinor > 0) return "refunded";
  if (status === "succeeded") return "completed";
  if (status === "cancelled" || status === "failed") return "failed";
  return "pending";
}
