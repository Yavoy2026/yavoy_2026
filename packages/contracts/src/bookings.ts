import { z } from "zod";

/**
 * Жизненный цикл брони (YAV-27):
 *
 *   requested → awaiting_partner → awaiting_payment → confirmed → completed
 *
 * requested        — заявка создана, места удержаны, клиенту показано «ожидаем подтверждения»
 * awaiting_partner — заявка ушла организатору, ждём проверки доступности
 * awaiting_payment — организатор подтвердил, ждём оплату
 * confirmed        — оплачено, выдан ваучер
 * completed        — поездка состоялась
 *
 * Тупики разделены намеренно: rejected (организатор отказал), expired (истёк
 * срок ответа или оплаты), cancelled (отменил клиент или менеджер). У них
 * разные письма и разный смысл в отчётах, схлопывать их в один нельзя.
 */
export const BookingStatusSchema = z.enum([
  "requested",
  "awaiting_partner",
  "awaiting_payment",
  "confirmed",
  "completed",
  "rejected",
  "expired",
  "cancelled",
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

/** Статусы, в которых бронь ещё живая: занимает места и ждёт чьего-то действия */
export const ACTIVE_BOOKING_STATUSES = [
  "requested",
  "awaiting_partner",
  "awaiting_payment",
  "confirmed",
] as const;

export const TourDateSchema = z.object({
  id: z.string().uuid(),
  tour_id: z.string().uuid(),
  starts_on: z.string(), // ISO date (YYYY-MM-DD)
  seats_total: z.number().int(),
  seats_left: z.number().int(),
  price_kopeks: z.number().int(), // с учётом price_override
});
export type TourDate = z.infer<typeof TourDateSchema>;

export const CreateBookingPayloadSchema = z.object({
  tour_date_id: z.string().uuid(),
  tickets_count: z.number().int().min(1).max(20),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  contact: z.string().min(3).max(200), // телефон или email
  /**
   * Номер принятой редакции оферты. Акцепт до оплаты — требование банка (п.7),
   * и без версии он недоказуем: текст оферты меняется (YAV-29).
   */
  offer_version: z.number().int().min(1),
});
export type CreateBookingPayload = z.infer<typeof CreateBookingPayloadSchema>;

export const BookingSchema = z.object({
  id: z.string().uuid(),
  status: BookingStatusSchema,
  tour_id: z.string().uuid(),
  tour_title: z.string(),
  tour_image_url: z.string(),
  tour_city_id: z.string(),
  tour_date: z.string(), // YYYY-MM-DD
  start_time: z.string().nullable(),
  tickets_count: z.number().int(),
  amount_kopeks: z.number().int(),
  currency: z.string(),
  confirmation_code: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  contact: z.string(),
  organizer_name: z.string(),
  /** Телефон организатора для ваучера; у туров самой платформы партнёра нет */
  organizer_phone: z.string().nullable(),
  meeting_point: z.string().nullable(),
  /** Точка сбора в картах — собирается из координат тура */
  meeting_map_url: z.string().nullable(),
  /** Заполнена, пока бронь ждёт оплату: кнопка «оплатить» ведёт сюда */
  payment_url: z.string().nullable(),
  /** Принятая редакция оферты и момент акцепта */
  offer_version: z.number().int().nullable(),
  offer_accepted_at: z.string().nullable(),
  created_at: z.string(),
  cancelled_at: z.string().nullable(),
});
export type Booking = z.infer<typeof BookingSchema>;

/**
 * Ответ на создание брони. payment_url всегда null: платить можно только
 * после того, как организатор подтвердит доступность (YAV-27). Ссылка на
 * оплату появляется в самой броне, когда та переходит в awaiting_payment.
 * Поле оставлено, чтобы клиенты не ломались на форме ответа.
 */
export const CreateBookingResponseSchema = z.object({
  booking: BookingSchema,
  payment_url: z.string().url().nullable(),
});
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;

export const BookingListResponseSchema = z.object({ items: z.array(BookingSchema) });
export type BookingListResponse = z.infer<typeof BookingListResponseSchema>;

/**
 * История платежей пользователя (YAV-30). Статус выводится на сервере, а не
 * в клиентах: у провайдера состояний больше, чем имеет смысл показывать
 * человеку, и правило «частичный возврат — это возврат» должно быть одно
 * на обе платформы.
 */
export const TransactionStatusSchema = z.enum(["completed", "pending", "refunded", "failed"]);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid(),
  tour_title: z.string(),
  tour_image_url: z.string(),
  status: TransactionStatusSchema,
  amount_minor: z.number().int(),
  refunded_minor: z.number().int(),
  currency: z.string(),
  /** Маска карты и платёжная система приходят от банка; до оплаты их нет */
  masked_pan: z.string().nullable(),
  card_vendor: z.string().nullable(),
  paid_at: z.string().nullable(),
  created_at: z.string(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const TransactionListResponseSchema = z.object({ items: z.array(TransactionSchema) });
export type TransactionListResponse = z.infer<typeof TransactionListResponseSchema>;
