/**
 * Импорт каталога инсталляции из src/db/catalog-uz.json.
 *
 * В отличие от сида — **ничего не удаляет**. Города обновляются по slug'у,
 * туры ищутся по паре «город + название»: своего стабильного ключа у туров
 * в схеме нет, а uuid генерируется базой. Поэтому переименование тура в файле
 * создаст новый тур, а не отредактирует прежний — это осознанный размен в пользу
 * безопасности: лучше лишний тур в черновиках, чем потерянная бронь.
 *
 * Повторный запуск безопасен и даже полезен: он досыпает будущие даты выездов,
 * не трогая прошедшие и уже забронированные.
 *
 * Запуск: pnpm --filter @yavoy/backend exec tsx scripts/import-catalog.ts
 *         (на проде: docker compose exec backend node dist/import-catalog.js)
 */
import { readFileSync } from "node:fs";
import { and, eq, sql } from "drizzle-orm";
import { createDb } from "../src/db/client.ts";
import { cities, tourDates, tours } from "../src/db/schema.ts";

/** На сколько дней вперёд раскладываются выезды */
const HORIZON_DAYS = Number(process.env.IMPORT_HORIZON_DAYS ?? 90);

interface SeedCity {
  id: string; name: string; description: string; emoji: string; image: string; position: number;
}
interface SeedTour {
  city: string; title: string; description: string; image: string; gallery: string[];
  priceMinor: number; originalPriceMinor: number | null; currency: string;
  duration: "one_day" | "multi_day"; durationText: string;
  transport: string; interest: string; category: string | null; season: string | null;
  organizer: Record<string, unknown> | null;
  highlights: string[]; includes: string[]; excludes: string[]; whatToBring: string[]; languages: string[];
  schedule: string | null; groupSize: string | null; meetingPoint: string | null; startTime: string | null;
  isInstantConfirmation: boolean; isFreeCancellation: boolean; isBestseller: boolean;
  isLikelyToSellOut: boolean; popularity: number;
}

const data = JSON.parse(
  readFileSync(new URL("../src/db/catalog-uz.json", import.meta.url), "utf-8"),
) as { cities: SeedCity[]; tours: SeedTour[] };

// ─── Расписание → конкретные даты ─────────────────────────────────────────
//
// В данных расписание — человеческий текст: «Ежедневно в 09:00, 14:00»,
// «Вт, Чт, Сб в 07:00», «Май–октябрь, выезд по субботам». Разбираем то, что
// влияет на даты: дни недели и сезонное окно. Время выезда живёт отдельным
// полем start_time и на сетку дат не влияет.

const WEEKDAYS: Record<string, number> = {
  вс: 0, пн: 1, вт: 2, ср: 3, чт: 4, пт: 5, сб: 6,
  воскресень: 0, понедельник: 1, вторник: 2, сред: 3, четверг: 4, пятниц: 5, суббот: 6,
};
const MONTHS = [
  "январ", "феврал", "март", "апрел", "ма", "июн",
  "июл", "август", "сентябр", "октябр", "ноябр", "декабр",
];

function parseSchedule(text: string | null): { days: number[]; months: number[] } {
  const all = { days: [0, 1, 2, 3, 4, 5, 6], months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
  if (!text) return all;
  const low = text.toLowerCase();

  // сезонное окно: «апрель–октябрь», «май-октябрь»
  let months = all.months;
  const range = low.match(/([а-я]+)\s*[–—-]\s*([а-я]+)/);
  if (range) {
    const from = MONTHS.findIndex((m) => range[1]!.startsWith(m));
    const to = MONTHS.findIndex((m) => range[2]!.startsWith(m));
    if (from >= 0 && to >= 0) {
      months = [];
      for (let m = from; ; m = (m + 1) % 12) {
        months.push(m);
        if (m === to) break;
      }
    }
  }

  if (low.includes("ежедневн") || low.includes("заезды ежедневн")) return { days: all.days, months };

  const days = new Set<number>();
  for (const [word, day] of Object.entries(WEEKDAYS)) {
    // «вт, чт, сб в 07:00» и «по субботам» — оба варианта ловятся по основе слова
    if (new RegExp(`(^|[^а-я])${word}`, "i").test(low)) days.add(day);
  }
  return { days: days.size ? [...days].sort() : all.days, months };
}

/** «до 15 человек» → 15, «4–10 человек» → 10, иначе дефолт */
function parseSeats(groupSize: string | null): number {
  const nums = (groupSize ?? "").match(/\d+/g);
  return nums?.length ? Math.max(...nums.map(Number)) : 12;
}

function datesFor(tour: SeedTour): string[] {
  const { days, months } = parseSchedule(tour.schedule);
  const out: string[] = [];
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCDate(cursor.getUTCDate() + 1); // с завтрашнего дня
  for (let i = 0; i < HORIZON_DAYS; i++) {
    if (days.includes(cursor.getUTCDay()) && months.includes(cursor.getUTCMonth())) {
      out.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

// ─── Импорт ───────────────────────────────────────────────────────────────

const { db, sql: conn } = createDb();
let citiesUpserted = 0, toursInserted = 0, toursUpdated = 0, datesAdded = 0;

for (const c of data.cities) {
  const row = {
    id: c.id, name: c.name, description: c.description,
    emoji: c.emoji, imageUrl: c.image, position: c.position,
  };
  await db.insert(cities).values(row).onConflictDoUpdate({ target: cities.id, set: row });
  citiesUpserted++;
}

for (const t of data.tours) {
  const row = {
    cityId: t.city,
    status: "published" as const,
    title: t.title,
    description: t.description,
    imageUrl: t.image,
    gallery: t.gallery,
    priceKopeks: t.priceMinor,
    originalPriceKopeks: t.originalPriceMinor,
    currency: t.currency,
    durationType: t.duration,
    durationText: t.durationText,
    transport: t.transport as never,
    interest: t.interest as never,
    category: (t.category ?? null) as never,
    season: (t.season ?? null) as never,
    organizer: t.organizer as never,
    highlights: t.highlights,
    includes: t.includes,
    excludes: t.excludes,
    whatToBring: t.whatToBring,
    languages: t.languages,
    schedule: t.schedule,
    groupSize: t.groupSize,
    meetingPoint: t.meetingPoint,
    startTime: t.startTime,
    isInstantConfirmation: t.isInstantConfirmation,
    isFreeCancellation: t.isFreeCancellation,
    isBestseller: t.isBestseller,
    isLikelyToSellOut: t.isLikelyToSellOut,
    popularity: t.popularity,
  };

  const existing = await db
    .select({ id: tours.id })
    .from(tours)
    .where(and(eq(tours.cityId, t.city), eq(tours.title, t.title)))
    .limit(1);

  let tourId: string;
  if (existing.length) {
    tourId = existing[0]!.id;
    await db.update(tours).set(row).where(eq(tours.id, tourId));
    toursUpdated++;
  } else {
    const inserted = await db.insert(tours).values(row).returning({ id: tours.id });
    tourId = inserted[0]!.id;
    toursInserted++;
  }

  const seats = parseSeats(t.groupSize);
  const dates = datesFor(t);
  if (dates.length) {
    const res = await db
      .insert(tourDates)
      .values(dates.map((d) => ({ tourId, startsOn: d, seatsTotal: seats, seatsLeft: seats })))
      // уже существующие даты не трогаем: там может быть занятая вместимость
      .onConflictDoNothing({ target: [tourDates.tourId, tourDates.startsOn] })
      .returning({ id: tourDates.id });
    datesAdded += res.length;
  }
}

const [counts] = await conn<{ tours: string; dates: string; future: string }[]>`
  select (select count(*) from tours) as tours,
         (select count(*) from tour_dates) as dates,
         (select count(*) from tour_dates where starts_on >= current_date) as future
`;

console.log(`Города: ${citiesUpserted} записано`);
console.log(`Туры: ${toursInserted} создано, ${toursUpdated} обновлено`);
console.log(`Даты выездов: ${datesAdded} добавлено (горизонт ${HORIZON_DAYS} дней)`);
console.log(`Сейчас в базе: туров ${counts!.tours}, дат ${counts!.dates}, из них будущих ${counts!.future}`);
await conn.end();
