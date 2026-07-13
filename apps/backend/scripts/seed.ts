/**
 * Seed каталога из моков Expo (единственное место, где моки ещё нужны).
 * Импорт TS-моков напрямую: type-only импорты внутри них вырезаются tsx/esbuild.
 * Запуск: pnpm db:seed (идемпотентен — очищает каталог и заливает заново).
 */
import { cities as mockCities } from "../../../expo/mocks/cities";
import { tours as mockTours } from "../../../expo/mocks/tours";
import { createDb } from "../src/db/client.ts";
import { cities, tourDates, tours } from "../src/db/schema.ts";

const VALID_CATEGORIES = new Set([
  "agro", "photo", "ethno", "parents", "glamping",
  "animals", "mystic", "wild_animals", "wine", "gastro",
]);
const VALID_SEASONS = new Set(["winter", "spring", "summer", "autumn", "all_year"]);

const { db, sql } = createDb();

await db.delete(tourDates);
await db.delete(tours);
await db.delete(cities);

await db.insert(cities).values(
  mockCities.map((c, i) => ({
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

const knownCityIds = new Set(mockCities.map((c) => c.id));
const skipped: string[] = [];

const rows = mockTours
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
    category:
      "category" in t && typeof t.category === "string" && VALID_CATEGORIES.has(t.category)
        ? (t.category as never)
        : null,
    season:
      "season" in t && typeof t.season === "string" && VALID_SEASONS.has(t.season)
        ? (t.season as never)
        : null,
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

console.log(`Seeded: ${mockCities.length} городов, ${rows.length} туров`);
if (skipped.length) console.warn(`Пропущено:\n  ${skipped.join("\n  ")}`);
await sql.end();
