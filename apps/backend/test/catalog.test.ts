import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance, InjectOptions } from "fastify";
import { createTestApp, seedCatalogFixture } from "./helpers.ts";

let app: FastifyInstance;
let teardown: () => Promise<void>;

async function call(opts: InjectOptions) {
  const res = await app.inject(opts);
  return res;
}

beforeAll(async () => {
  ({ app, teardown } = await createTestApp());
  await seedCatalogFixture(app);
});

afterAll(() => teardown());

describe("GET /v1/health", () => {
  it("отвечает ok с живой БД", async () => {
    const res = await call({ method: "GET", url: "/v1/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok", db: true });
  });
});

describe("GET /v1/cities", () => {
  it("возвращает города с числом опубликованных туров", async () => {
    const res = await call({ method: "GET", url: "/v1/cities" });
    expect(res.statusCode).toBe(200);
    const { items } = res.json();
    expect(items).toHaveLength(2);
    const spb = items.find((c: { id: string }) => c.id === "spb");
    expect(spb.tours_count).toBe(1); // черновик не считается
  });
});

describe("GET /v1/tours", () => {
  it("отдаёт только опубликованные, сортировка по популярности", async () => {
    const res = await call({ method: "GET", url: "/v1/tours" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toHaveLength(3);
    expect(body.items[0].title).toBe("Обзорная по Москве");
    expect(body.items.map((t: { popularity: number }) => t.popularity)).toEqual([95, 90, 80]);
    expect(body.next_cursor).toBeNull();
  });

  it("фильтрует по городу и транспорту", async () => {
    const res = await call({ method: "GET", url: "/v1/tours?city=moscow&transport=water" });
    const body = res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].title).toBe("Речная прогулка");
  });

  it("ищет по тексту", async () => {
    const res = await call({ method: "GET", url: "/v1/tours?q=ночной" });
    expect(res.json().items).toHaveLength(1);
  });

  it("фильтрует по цене (в копейках)", async () => {
    const res = await call({ method: "GET", url: "/v1/tours?price_max=200000" });
    const body = res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].price_kopeks).toBe(180_000);
  });

  it("cursor-пагинация обходит всё без дублей", async () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const url: string = `/v1/tours?limit=1${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const res = await call({ method: "GET", url });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      seen.push(...body.items.map((t: { id: string }) => t.id));
      cursor = body.next_cursor;
    } while (cursor);
    expect(seen).toHaveLength(3);
    expect(new Set(seen).size).toBe(3);
  });

  it("отвергает мусорный курсор", async () => {
    const res = await call({ method: "GET", url: "/v1/tours?cursor=%%%garbage" });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("invalid_cursor");
  });
});

describe("GET /v1/tours/:id", () => {
  it("отдаёт детали с пустыми отзывами (M5)", async () => {
    const list = await call({ method: "GET", url: "/v1/tours" });
    const id = list.json().items[0].id;
    const res = await call({ method: "GET", url: `/v1/tours/${id}` });
    expect(res.statusCode).toBe(200);
    const tour = res.json();
    expect(tour.title).toBe("Обзорная по Москве");
    expect(tour.reviews).toEqual([]);
    expect(tour.organizer.name).toBe("МосТур");
  });

  it("404 по несуществующему id", async () => {
    const res = await call({
      method: "GET",
      url: "/v1/tours/00000000-0000-4000-8000-000000000000",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("tour_not_found");
  });
});
