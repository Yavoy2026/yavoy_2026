import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { BookingStatus } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { bookings, tourDates, tours } from "../../db/schema.ts";

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
  organizer: tours.organizer,
  startsOn: tourDates.startsOn,
};

function baseQuery(db: DbLike) {
  return db
    .select(bookingView)
    .from(bookings)
    .innerJoin(tours, eq(bookings.tourId, tours.id))
    .innerJoin(tourDates, eq(bookings.tourDateId, tourDates.id));
}

export type BookingViewRow = Awaited<ReturnType<ReturnType<typeof baseQuery>["execute"]>>[number];

export async function getBookingViewById(db: DbLike, id: string): Promise<BookingViewRow | null> {
  const rows = await baseQuery(db).where(eq(bookings.id, id)).limit(1);
  return rows[0] ?? null;
}

export function listUserBookings(db: DbLike, userId: string) {
  return baseQuery(db).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
}

export function listBookingsByStatus(db: DbLike, status: BookingStatus) {
  return baseQuery(db).where(eq(bookings.status, status)).orderBy(desc(bookings.createdAt));
}
