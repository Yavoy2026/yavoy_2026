import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { AdminTourListQuery } from "@yavoy/contracts";
import type { Db } from "../../../db/client.ts";
import { cities, tourDates, tours } from "../../../db/schema.ts";

type TourInsert = typeof tours.$inferInsert;

/** Брони, ссылающиеся на дату (любой статус — FK не даст удалить дату и с отменённой бронью) */
const BOOKINGS_COUNT_SQL = sql<number>`(select count(*)::int from bookings b where b.tour_date_id = tour_dates.id)`;

export function listAdminTourRows(db: Db, q: AdminTourListQuery) {
  const filters: (SQL | undefined)[] = [];
  if (q.status) filters.push(eq(tours.status, q.status));
  if (q.city) filters.push(eq(tours.cityId, q.city));
  if (q.q) {
    const pattern = `%${q.q}%`;
    filters.push(or(ilike(tours.title, pattern), ilike(cities.name, pattern)));
  }
  return db
    .select({ tour: tours, cityName: cities.name })
    .from(tours)
    .innerJoin(cities, eq(tours.cityId, cities.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(tours.createdAt), desc(tours.id))
    .limit(200);
}

export async function getAdminTourRow(db: Db, id: string) {
  const rows = await db
    .select({ tour: tours, cityName: cities.name })
    .from(tours)
    .innerJoin(cities, eq(tours.cityId, cities.id))
    .where(eq(tours.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function cityExists(db: Db, cityId: string): Promise<boolean> {
  const rows = await db.select({ id: cities.id }).from(cities).where(eq(cities.id, cityId)).limit(1);
  return rows.length > 0;
}

export async function insertTour(db: Db, values: TourInsert) {
  const rows = await db.insert(tours).values(values).returning();
  return rows[0]!;
}

export async function updateTourRow(db: Db, id: string, patch: Partial<TourInsert>) {
  const rows = await db.update(tours).set(patch).where(eq(tours.id, id)).returning();
  return rows[0] ?? null;
}

// ─── Даты выездов ────────────────────────────────────────────

export function listAdminDateRows(db: Db, tourId: string) {
  return db
    .select({ date: tourDates, bookingsCount: BOOKINGS_COUNT_SQL })
    .from(tourDates)
    .where(eq(tourDates.tourId, tourId))
    .orderBy(asc(tourDates.startsOn));
}

export async function getAdminDateRow(db: Db, tourId: string, dateId: string) {
  const rows = await db
    .select({ date: tourDates, bookingsCount: BOOKINGS_COUNT_SQL })
    .from(tourDates)
    .where(and(eq(tourDates.id, dateId), eq(tourDates.tourId, tourId)))
    .limit(1);
  return rows[0] ?? null;
}

/** null → дата на этот день уже существует (unique tour_id+starts_on) */
export async function insertDate(
  db: Db,
  values: { tourId: string; startsOn: string; seatsTotal: number; priceOverrideKopeks: number | null },
) {
  const rows = await db
    .insert(tourDates)
    .values({ ...values, seatsLeft: values.seatsTotal })
    .onConflictDoNothing()
    .returning();
  return rows[0] ?? null;
}

/**
 * Смена вместимости с сохранением инварианта «занято мест неизменно»:
 * seats_left сдвигается на ту же дельту одним условным UPDATE (как reserveSeats).
 * null → новый total меньше уже забронированного.
 */
export async function updateSeatsTotal(db: Db, tourId: string, dateId: string, newTotal: number) {
  const rows = await db
    .update(tourDates)
    .set({
      seatsTotal: newTotal,
      seatsLeft: sql`${tourDates.seatsLeft} + (${newTotal} - ${tourDates.seatsTotal})`,
    })
    .where(
      and(
        eq(tourDates.id, dateId),
        eq(tourDates.tourId, tourId),
        sql`${tourDates.seatsLeft} + (${newTotal} - ${tourDates.seatsTotal}) >= 0`,
      ),
    )
    .returning();
  return rows[0] ?? null;
}

export async function updatePriceOverride(db: Db, tourId: string, dateId: string, priceOverrideKopeks: number | null) {
  const rows = await db
    .update(tourDates)
    .set({ priceOverrideKopeks })
    .where(and(eq(tourDates.id, dateId), eq(tourDates.tourId, tourId)))
    .returning();
  return rows[0] ?? null;
}

/** null → дата не удалена (есть брони); наличие даты проверять отдельно */
export async function deleteDateRow(db: Db, tourId: string, dateId: string) {
  const rows = await db
    .delete(tourDates)
    .where(
      and(
        eq(tourDates.id, dateId),
        eq(tourDates.tourId, tourId),
        sql`not exists (select 1 from bookings b where b.tour_date_id = ${dateId})`,
      ),
    )
    .returning({ id: tourDates.id });
  return rows[0] ?? null;
}
