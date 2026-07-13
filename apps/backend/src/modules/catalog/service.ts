import type { City, TourCard, TourDate, TourDetail, TourListQuery, TourListResponse } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { badRequest, notFound } from "../../errors.ts";
import type { tours } from "../../db/schema.ts";
import { getTourById, listAllPublished, listCities, listFutureDates, listTours, type Cursor } from "./repo.ts";

type TourRow = typeof tours.$inferSelect;

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString()) as Cursor;
    if (typeof parsed.id !== "string") throw new Error("bad cursor");
    return parsed;
  } catch {
    throw badRequest("invalid_cursor", "Некорректный курсор пагинации");
  }
}

function sortValue(row: TourRow, sort: TourListQuery["sort"]): string | number {
  switch (sort) {
    case "popularity":
      return row.popularity;
    case "newest":
      return row.publishedAt.toISOString();
    case "price_asc":
    case "price_desc":
      return row.priceKopeks;
  }
}

function toCard(row: TourRow, cityName: string, nextDate: string | null): TourCard {
  return {
    id: row.id,
    title: row.title,
    image_url: row.imageUrl,
    price_kopeks: row.priceKopeks,
    original_price_kopeks: row.originalPriceKopeks,
    currency: row.currency,
    duration_type: row.durationType,
    duration_text: row.durationText,
    transport: row.transport,
    interest: row.interest,
    category: row.category,
    season: row.season,
    city_id: row.cityId,
    city_name: cityName,
    organizer: row.organizer,
    is_bestseller: row.isBestseller,
    is_likely_to_sell_out: row.isLikelyToSellOut,
    popularity: row.popularity,
    next_available_date: nextDate,
  };
}

type DateRow = { date: { id: string; tourId: string; startsOn: string; seatsTotal: number; seatsLeft: number; priceOverrideKopeks: number | null }; basePrice: number };

function toTourDate(r: DateRow): TourDate {
  return {
    id: r.date.id,
    tour_id: r.date.tourId,
    starts_on: r.date.startsOn,
    seats_total: r.date.seatsTotal,
    seats_left: r.date.seatsLeft,
    price_kopeks: r.date.priceOverrideKopeks ?? r.basePrice,
  };
}

export async function getCities(db: Db): Promise<City[]> {
  const rows = await listCities(db);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    emoji: r.emoji,
    image_url: r.imageUrl,
    lat: r.lat,
    lng: r.lng,
    tours_count: r.toursCount,
  }));
}

export async function getTours(db: Db, query: TourListQuery): Promise<TourListResponse> {
  const cursor = decodeCursor(query.cursor);
  const rows = await listTours(db, query, cursor);

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const last = page[page.length - 1];

  return {
    items: page.map((r) => toCard(r.tour, r.cityName, r.nextDate)),
    next_cursor:
      hasMore && last
        ? encodeCursor({ v: sortValue(last.tour, query.sort), id: last.tour.id })
        : null,
  };
}

function toDetail(t: TourRow, cityName: string, nextDate: string | null, dates: TourDate[]): TourDetail {
  return {
    ...toCard(t, cityName, nextDate),
    description: t.description,
    gallery: t.gallery,
    highlights: t.highlights,
    includes: t.includes,
    excludes: t.excludes,
    what_to_bring: t.whatToBring,
    schedule: t.schedule,
    group_size: t.groupSize,
    languages: t.languages,
    meeting_point: t.meetingPoint,
    meeting_lat: t.meetingLat,
    meeting_lng: t.meetingLng,
    start_time: t.startTime,
    booking_conditions: t.bookingConditions,
    prepayment: t.prepayment,
    cancellation_policy: t.cancellationPolicy,
    group_joining_conditions: t.groupJoiningConditions,
    is_instant_confirmation: t.isInstantConfirmation,
    is_free_cancellation: t.isFreeCancellation,
    reviews: [], // отзывы — M5
    dates,
  };
}

export async function getTourDetail(db: Db, id: string): Promise<TourDetail> {
  const row = await getTourById(db, id);
  if (!row) throw notFound("tour_not_found", "Тур не найден");
  const dates = (await listFutureDates(db, id)).map(toTourDate);
  return toDetail(row.tour, row.cityName, row.nextDate, dates);
}

/**
 * Bootstrap для мобильного приложения: весь опубликованный каталог одним запросом.
 * Оправдано, пока каталог мал (десятки туров) и приложение фильтрует на клиенте;
 * при росте каталога приложение переходит на GET /tours с серверными фильтрами.
 */
export async function getCatalogBundle(db: Db): Promise<{ cities: City[]; tours: TourDetail[] }> {
  const [cityList, tourRows, dateRows] = await Promise.all([
    getCities(db),
    listAllPublished(db),
    listFutureDates(db),
  ]);
  const datesByTour = new Map<string, TourDate[]>();
  for (const r of dateRows) {
    const d = toTourDate(r);
    const list = datesByTour.get(d.tour_id) ?? [];
    list.push(d);
    datesByTour.set(d.tour_id, list);
  }
  return {
    cities: cityList,
    tours: tourRows.map((r) => toDetail(r.tour, r.cityName, r.nextDate, datesByTour.get(r.tour.id) ?? [])),
  };
}
