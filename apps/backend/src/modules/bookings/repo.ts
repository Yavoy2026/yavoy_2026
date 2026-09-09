import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import type { BookingStatus } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { bookings, partnerProfiles, payments, tourDates, tours } from "../../db/schema.ts";

export type BookingRow = typeof bookings.$inferSelect;
export type TourDateRow = typeof tourDates.$inferSelect;

/** Транзакционный клиент drizzle имеет тот же query-интерфейс, что и Db */
type DbLike = Pick<Db, "select" | "insert" | "update" | "execute">;

/**
 * Атомарное резервирование мест: одна команда UPDATE с условием —
 * конкурентные заявки не могут увести места в минус (плюс CHECK в БД).
 * Возвращает null, если мест не хватает или дата в прошлом.
 */
export async function reserveSeats(
  db: DbLike,
  tourDateId: string,
  count: number,
): Promise<TourDateRow | null> {
  const rows = await db
    .update(tourDates)
    .set({ seatsLeft: sql`${tourDates.seatsLeft} - ${count}` })
    .where(
      and(
        eq(tourDates.id, tourDateId),
        gte(tourDates.seatsLeft, count),
        gte(tourDates.startsOn, sql`current_date`),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

export async function releaseSeats(db: DbLike, tourDateId: string, count: number): Promise<void> {
  await db
    .update(tourDates)
    .set({ seatsLeft: sql`least(${tourDates.seatsLeft} + ${count}, ${tourDates.seatsTotal})` })
    .where(eq(tourDates.id, tourDateId));
}

const bookingView = {
  booking: bookings,
  tourTitle: tours.title,
  tourImageUrl: tours.imageUrl,
  tourCityId: tours.cityId,
  startTime: tours.startTime,
  meetingPoint: tours.meetingPoint,
  // координаты нужны ваучеру: из них собирается ссылка на карты
  meetingLat: tours.meetingLat,
  meetingLng: tours.meetingLng,
  organizer: tours.organizer,
  // владелец тура; по нему скоупится очередь партнёра
  tourPartnerId: tours.partnerId,
  // телефон организатора — в ваучер; у туров самой платформы партнёра нет
  partnerPhone: partnerProfiles.phone,
  startsOn: tourDates.startsOn,
};

function baseQuery(db: DbLike) {
  return db
    .select(bookingView)
    .from(bookings)
    .innerJoin(tours, eq(bookings.tourId, tours.id))
    .innerJoin(tourDates, eq(bookings.tourDateId, tourDates.id))
    .leftJoin(partnerProfiles, eq(tours.partnerId, partnerProfiles.id));
}

export type BookingViewRow = Awaited<ReturnType<ReturnType<typeof baseQuery>["execute"]>>[number];

export async function getBookingViewById(db: DbLike, id: string): Promise<BookingViewRow | null> {
  const rows = await baseQuery(db).where(eq(bookings.id, id)).limit(1);
  return rows[0] ?? null;
}

export function listUserBookings(db: DbLike, userId: string) {
  return baseQuery(db).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
}

/**
 * Очередь броней. partnerId ограничивает выборку турами этого организатора —
 * чужие он не должен видеть даже в списке.
 */
export function listBookingsByStatuses(
  db: DbLike,
  statuses: readonly BookingStatus[],
  partnerId?: string,
) {
  const scope = partnerId ? eq(tours.partnerId, partnerId) : undefined;
  return baseQuery(db)
    .where(scope ? and(inArray(bookings.status, [...statuses]), scope) : inArray(bookings.status, [...statuses]))
    .orderBy(desc(bookings.createdAt));
}

/**
 * Брони, застрявшие в статусе дольше срока: организатор молчит или клиент
 * не платит. Ищем по statusChangedAt, а не по createdAt, — иначе после
 * подтверждения организатором отсчёт оплаты шёл бы от создания заявки.
 */
export function listStaleBookings(db: DbLike, status: BookingStatus, olderThan: Date) {
  return baseQuery(db).where(
    and(eq(bookings.status, status), lt(bookings.statusChangedAt, olderThan)),
  );
}

/**
 * Ссылка на платёжную страницу активного платежа брони. Нужна клиенту, пока
 * бронь ждёт оплату: кнопка «оплатить» ведёт туда же, куда вёл бы редирект.
 */
export async function getActivePayUrl(db: DbLike, bookingId: string): Promise<string | null> {
  const rows = await db
    .select({ payUrl: payments.payUrl })
    .from(payments)
    .where(
      and(
        eq(payments.bookingId, bookingId),
        inArray(payments.status, ["created", "pending"]),
      ),
    )
    .orderBy(desc(payments.createdAt))
    .limit(1);
  return rows[0]?.payUrl ?? null;
}
