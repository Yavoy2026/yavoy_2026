/**
 * Seed каталога из src/db/seed-data.json (снапшот бывших моков Expo,
 * см. scripts/snapshot-mocks.ts). Очищает каталог целиком и заливает заново.
 * Запуск: pnpm db:seed
 *
 * **Разрушительный и не для прода.** Каталог в нём демонстрационный, российский,
 * а очистка задевает не только туры: по каскаду уезжают даты выездов и правки
 * туров. Брони и отзывы каскадом НЕ удаляются — внешние ключи у них без
 * onDelete, — поэтому на базе с ними очистка падает с ошибкой FK. И это
 * опаснее, чем кажется: если броней нет, а отзывы есть, падение случается уже
 * после удаления дат, и каталог остаётся без единой даты выезда — кнопка брони
 * мертва на всей витрине. Поэтому ниже стоит предохранитель, а сама очистка
 * идёт одной транзакцией.
 */
import { readFileSync } from "node:fs";
import { createDb } from "../src/db/client.ts";
import { env } from "../src/env.ts";
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

/**
 * Предохранитель. Документации тут мало: сид запускают редко и обычно второпях,
 * а цена ошибки — каталог инсталляции. SEED_FORCE=1 снимает проверку осознанно.
 */
const force = process.env.SEED_FORCE === "1";
const [{ bookings: bookingCount, reviews: reviewCount }] = await sql`
  select (select count(*) from bookings) as bookings,
         (select count(*) from reviews) as reviews
`;
const liveData = Number(bookingCount) > 0 || Number(reviewCount) > 0;

if (!force && (env.NODE_ENV === "production" || liveData)) {
  const why = env.NODE_ENV === "production"
    ? "NODE_ENV=production"
    : `в базе есть живые данные (броней: ${bookingCount}, отзывов: ${reviewCount})`;
  console.error(
    `Сид остановлен: ${why}.\n` +
    "Он стирает каталог целиком и заливает демонстрационные туры по России.\n" +
    "Если это действительно нужно — SEED_FORCE=1 pnpm db:seed",
  );
  await sql.end();
  process.exit(1);
}

// Одной транзакцией: падение на втором удалении иначе оставит каталог без дат выездов
await db.transaction(async (tx) => {
  await tx.delete(tourDates);
  await tx.delete(tours);
  await tx.delete(cities);
});

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
    currency: env.CURRENCY,
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

const insertedTours = await db.insert(tours).values(rows).returning({ id: tours.id });

// Даты выездов: каждому туру 4 даты в ближайший месяц (M3: брони-заявки)
const DATE_OFFSETS_DAYS = [3, 10, 17, 24];
const SEATS_PER_DATE = 12;
const today = new Date();
const dateRows = insertedTours.flatMap((t) =>
  DATE_OFFSETS_DAYS.map((offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return {
      tourId: t.id,
      startsOn: d.toISOString().slice(0, 10),
      seatsTotal: SEATS_PER_DATE,
      seatsLeft: SEATS_PER_DATE,
    };
  }),
);
await db.insert(tourDates).values(dateRows);

console.log(`Seeded: ${data.cities.length} городов, ${rows.length} туров, ${dateRows.length} дат`);
if (skipped.length) console.warn(`Пропущено:\n  ${skipped.join("\n  ")}`);
await sql.end();
