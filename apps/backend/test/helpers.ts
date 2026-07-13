import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.ts";
import * as schema from "../src/db/schema.ts";

const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL ?? "postgres://yavoy:yavoy@localhost:5434/yavoy";

/** Каждый тест-файл получает свежую БД — изоляция без очисток между тестами */
export async function createTestApp(): Promise<{ app: FastifyInstance; teardown: () => Promise<void> }> {
  const dbName = `yavoy_test_${Math.random().toString(36).slice(2, 10)}`;
  const admin = postgres(ADMIN_URL, { max: 1 });
  await admin.unsafe(`CREATE DATABASE ${dbName}`);

  const url = ADMIN_URL.replace(/\/[^/]+$/, `/${dbName}`);
  const sql = postgres(url, { max: 5, onnotice: () => {} });
  const db = drizzle(sql, { schema });
  await migrate(db, { migrationsFolder: new URL("../src/db/migrations", import.meta.url).pathname });

  const app = await buildApp(db);

  return {
    app,
    teardown: async () => {
      await app.close();
      await sql.end();
      await admin.unsafe(`DROP DATABASE ${dbName} WITH (FORCE)`);
      await admin.end();
    },
  };
}

export async function seedCatalogFixture(app: FastifyInstance) {
  const db = app.db;
  await db.insert(schema.cities).values([
    { id: "moscow", name: "Москва", imageUrl: "https://img/msk.jpg", position: 0 },
    { id: "spb", name: "Санкт-Петербург", imageUrl: "https://img/spb.jpg", position: 1 },
  ]);

  const organizer = {
    id: "org1",
    name: "МосТур",
    rating: 4.8,
    review_count: 100,
    avatar: null,
    verified: true,
    tours_count: 5,
  };

  const base = {
    description: "Описание",
    imageUrl: "https://img/tour.jpg",
    durationType: "one_day" as const,
    transport: "auto" as const,
    interest: "city" as const,
    organizer,
  };

  await db.insert(schema.tours).values([
    { ...base, cityId: "moscow", title: "Обзорная по Москве", priceKopeks: 250_000, popularity: 95 },
    { ...base, cityId: "moscow", title: "Речная прогулка", priceKopeks: 180_000, popularity: 80, transport: "water" },
    { ...base, cityId: "spb", title: "Ночной Петербург", priceKopeks: 320_000, popularity: 90 },
    {
      ...base,
      cityId: "spb",
      title: "Черновик — не должен отдаваться",
      priceKopeks: 100_000,
      popularity: 99,
      status: "draft",
    },
  ]);
}
