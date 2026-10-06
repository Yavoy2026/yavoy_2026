import { and, asc, desc, eq, gt, gte, ilike, inArray, lt, lte, or, sql, type SQL } from "drizzle-orm";
import type { TourListQuery } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { cities, tourDates, tours } from "../../db/schema.ts";

export interface Cursor {
  v: string | number;
  id: string;
}

const SORTS = {
  popularity: { col: tours.popularity, dir: "desc" },
  newest: { col: tours.publishedAt, dir: "desc" },
  price_asc: { col: tours.priceKopeks, dir: "asc" },
  price_desc: { col: tours.priceKopeks, dir: "desc" },
} as const;


/** Ближайшая будущая дата с местами (null — дат нет) */
const NEXT_DATE_SQL = sql<string | null>`(
  select min(td.starts_on)::text from tour_dates td
  where td.tour_id = tours.id and td.starts_on >= current_date and td.seats_left > 0
)`;

export function listCities(db: Db) {
  return db
    .select({
      id: cities.id,
      name: cities.name,
      description: cities.description,
      emoji: cities.emoji,
      imageUrl: cities.imageUrl,
      lat: cities.lat,
      lng: cities.lng,
      // алиасы вручную: drizzle не квалифицирует колонки внутри raw-подзапроса
      toursCount: sql<number>`(select count(*)::int from tours t where t.city_id = cities.id and t.status = 'published')`,
    })
    .from(cities)
    .where(eq(cities.isPublished, true))
    .orderBy(asc(cities.position), asc(cities.name));
}

export async function listTours(db: Db, q: TourListQuery, cursor: Cursor | null) {
  const sort = SORTS[q.sort];
  const filters: (SQL | undefined)[] = [eq(tours.status, "published")];

  if (q.city) filters.push(eq(tours.cityId, q.city));
  if (q.duration) filters.push(eq(tours.durationType, q.duration));
  if (q.transport) filters.push(eq(tours.transport, q.transport));
  if (q.interest?.length) filters.push(inArray(tours.interest, q.interest));
  if (q.category?.length) filters.push(inArray(tours.category, q.category));
  if (q.season) filters.push(eq(tours.season, q.season));
  if (q.price_min !== undefined) filters.push(gte(tours.priceKopeks, q.price_min));
  if (q.price_max !== undefined) filters.push(lte(tours.priceKopeks, q.price_max));
  if (q.q) {
    const pattern = `%${q.q}%`;
    filters.push(
      or(
        ilike(tours.title, pattern),
        ilike(tours.description, pattern),
        ilike(cities.name, pattern),
        sql`${tours.organizer}->>'name' ilike ${pattern}`,
      ),
    );
  }

  if (cursor) {
    const cursorValue =
      q.sort === "newest" ? sql`${cursor.v}::timestamptz` : sql`${cursor.v}`;
    filters.push(
      sort.dir === "desc"
        ? or(
            lt(sort.col, cursorValue),
            and(eq(sort.col, cursorValue), lt(tours.id, cursor.id)),
          )
        : or(
            gt(sort.col, cursorValue),
            and(eq(sort.col, cursorValue), gt(tours.id, cursor.id)),
          ),
    );
  }

  const order =
    sort.dir === "desc"
      ? [desc(sort.col), desc(tours.id)]
      : [asc(sort.col), asc(tours.id)];

  return db
    .select({ tour: tours, cityName: cities.name, nextDate: NEXT_DATE_SQL })
    .from(tours)
    .innerJoin(cities, eq(tours.cityId, cities.id))
    .where(and(...filters))
    .orderBy(...order)
    .limit(q.limit + 1); // +1 чтобы понять, есть ли следующая страница
}

/** Все опубликованные туры целиком — для bootstrap-эндпоинта мобильного приложения */
export function listAllPublished(db: Db) {
  return db
    .select({ tour: tours, cityName: cities.name, nextDate: NEXT_DATE_SQL })
    .from(tours)
    .innerJoin(cities, eq(tours.cityId, cities.id))
    .where(eq(tours.status, "published"))
    .orderBy(desc(tours.popularity), desc(tours.id));
}

export async function getTourById(db: Db, id: string) {
  const rows = await db
    .select({ tour: tours, cityName: cities.name, nextDate: NEXT_DATE_SQL })
    .from(tours)
    .innerJoin(cities, eq(tours.cityId, cities.id))
    .where(and(eq(tours.id, id), eq(tours.status, "published")))
    .limit(1);
  return rows[0] ?? null;
}

/** Будущие даты с местами; tourId не задан — для всего каталога */
export function listFutureDates(db: Db, tourId?: string) {
  const conditions = [gte(tourDates.startsOn, sql`current_date`), gt(tourDates.seatsLeft, 0)];
  if (tourId) conditions.push(eq(tourDates.tourId, tourId));
  return db
    .select({ date: tourDates, basePrice: tours.priceKopeks })
    .from(tourDates)
    .innerJoin(tours, eq(tourDates.tourId, tours.id))
    .where(and(...conditions))
    .orderBy(asc(tourDates.startsOn));
}
