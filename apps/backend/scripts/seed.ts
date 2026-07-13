/**
 * Seed каталога из src/db/seed-data.json (снапшот бывших моков Expo,
 * см. scripts/snapshot-mocks.ts). Идемпотентен: очищает каталог и заливает заново.
 * Запуск: pnpm db:seed
 */
import { readFileSync } from "node:fs";
import { createDb } from "../src/db/client.ts";
import { cities, tourDates, tours } from "../src/db/schema.ts";

interface SeedCity {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  image: string;
  lat?: number;
  lng?: number;
}

interface SeedTour {
  id: string;
  title: string;
  description: string;
  image: string;
  gallery?: string[];
  price: number;
  originalPrice?: number;
  duration: "one_day" | "multi_day";
  durationText?: string;
  transport: "auto" | "water" | "sea" | "bike" | "air";
  interest: "city" | "educational" | "nature" | "pilgrimage";
  category?: string;
  season?: string;
  city: string;
  organizer: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    avatar?: string;
    verified?: boolean;
    toursCount?: number;
  };
  highlights?: string[];
  includes?: string[];
  excludes?: string[];
  whatToBring?: string[];
  languages?: string[];
  schedule?: string;
  groupSize?: string;
  meetingPoint?: string;
  meetingPointCoords?: { lat: number; lng: number };
  startTime?: string;
  bookingConditions?: string;
  prepayment?: string;
  cancellationPolicy?: string;
  groupJoiningConditions?: string;
  isInstantConfirmation?: boolean;
  isFreeCancellation?: boolean;
  isBestseller?: boolean;
  isLikelyToSellOut?: boolean;
  popularity?: number;
}

const VALID_CATEGORIES = new Set([
  "agro", "photo", "ethno", "parents", "glamping",
  "animals", "mystic", "wild_animals", "wine", "gastro",
]);
const VALID_SEASONS = new Set(["winter", "spring", "summer", "autumn", "all_year"]);

const data = JSON.parse(
  readFileSync(new URL("../src/db/seed-data.json", import.meta.url), "utf-8"),
) as { cities: SeedCity[]; tours: SeedTour[] };

const { db, sql } = createDb();

await db.delete(tourDates);
await db.delete(tours);
await db.delete(cities);

await db.insert(cities).values(
  data.cities.map((c, i) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    emoji: c.emoji ?? "",
    imageUrl: c.image,
    lat: c.lat ?? null,
    lng: c.lng ?? null,
    position: i,
  })),
);

const knownCityIds = new Set(data.cities.map((c) => c.id));
const skipped: string[] = [];

const rows = data.tours
  .filter((t) => {
    if (!knownCityIds.has(t.city)) {
      skipped.push(`${t.id} (${t.title}): неизвестный город ${t.city}`);
      return false;
    }
    return true;
  })
  .map((t) => ({
    cityId: t.city,
    title: t.title,
    description: t.description,
    imageUrl: t.image,
    gallery: t.gallery ?? [],
    priceKopeks: Math.round(t.price * 100),
    originalPriceKopeks: t.originalPrice ? Math.round(t.originalPrice * 100) : null,
    currency: "RUB",
    durationType: t.duration,
    durationText: t.durationText ?? "",
    transport: t.transport,
    interest: t.interest,
    category: t.category && VALID_CATEGORIES.has(t.category) ? (t.category as never) : null,
    season: t.season && VALID_SEASONS.has(t.season) ? (t.season as never) : null,
    organizer: {
      id: t.organizer.id,
      name: t.organizer.name,
      rating: t.organizer.rating,
      review_count: t.organizer.reviewCount,
      avatar: t.organizer.avatar ?? null,
      verified: t.organizer.verified ?? false,
      tours_count: t.organizer.toursCount ?? 0,
    },
    highlights: t.highlights ?? [],
    includes: t.includes ?? [],
    excludes: t.excludes ?? [],
    whatToBring: t.whatToBring ?? [],
    languages: t.languages ?? [],
    schedule: t.schedule ?? null,
    groupSize: t.groupSize ?? null,
    meetingPoint: t.meetingPoint ?? null,
    meetingLat: t.meetingPointCoords?.lat ?? null,
    meetingLng: t.meetingPointCoords?.lng ?? null,
    startTime: t.startTime ?? null,
    bookingConditions: t.bookingConditions ?? null,
    prepayment: t.prepayment ?? null,
    cancellationPolicy: t.cancellationPolicy ?? null,
    groupJoiningConditions: t.groupJoiningConditions ?? null,
    isInstantConfirmation: t.isInstantConfirmation ?? false,
    isFreeCancellation: t.isFreeCancellation ?? false,
    isBestseller: t.isBestseller ?? false,
    isLikelyToSellOut: t.isLikelyToSellOut ?? false,
    popularity: t.popularity ?? 0,
  }));

await db.insert(tours).values(rows);

console.log(`Seeded: ${data.cities.length} городов, ${rows.length} туров`);
if (skipped.length) console.warn(`Пропущено:\n  ${skipped.join("\n  ")}`);
await sql.end();
