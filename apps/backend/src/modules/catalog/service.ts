import type { City, TourCard, TourDetail, TourListQuery, TourListResponse } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { badRequest, notFound } from "../../errors.ts";
import type { tours } from "../../db/schema.ts";
import { getTourById, listCities, listTours, type Cursor } from "./repo.ts";

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

function toCard(row: TourRow, cityName: string): TourCard {
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
    items: page.map((r) => toCard(r.tour, r.cityName)),
    next_cursor:
      hasMore && last
        ? encodeCursor({ v: sortValue(last.tour, query.sort), id: last.tour.id })
        : null,
  };
}

export async function getTourDetail(db: Db, id: string): Promise<TourDetail> {
  const row = await getTourById(db, id);
  if (!row) throw notFound("tour_not_found", "Тур не найден");
  const t = row.tour;
  return {
    ...toCard(t, row.cityName),
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
  };
}
