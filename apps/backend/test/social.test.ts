import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { FastifyInstance, InjectOptions } from "fastify";
import * as schema from "../src/db/schema.ts";
import { createTestApp, seedCatalogFixture, signupWithRole, type TestApp } from "./helpers.ts";

let t: TestApp;
let app: FastifyInstance;
let userToken: string;
let adminToken: string;
let tourId: string;
let bookingId: string;

async function call(opts: InjectOptions) {
  const res = await app.inject(opts);
  return res;
}

const authed = (token: string) => ({ authorization: `Bearer ${token}` });

beforeAll(async () => {
  t = await createTestApp();
  app = t.app;
  await seedCatalogFixture(app);

  const tour = (await app.db.select().from(schema.tours).where(eq(schema.tours.status, "published")).limit(1))[0]!;
  tourId = tour.id;
  const date = (
    await app.db
      .insert(schema.tourDates)
      .values({ tourId, startsOn: "2099-05-01", seatsTotal: 10, seatsLeft: 10 })
      .returning()
  )[0]!;

  userToken = (await signupWithRole(t, "fan@test.ru", "user", "Фанат")).token;
  adminToken = (await signupWithRole(t, "mod@test.ru", "manager", "Модер")).token;

  const booking = await call({
    method: "POST",
    url: "/v1/bookings",
    headers: authed(userToken),
    payload: { tour_date_id: date.id, tickets_count: 1, first_name: "Ф", last_name: "Т", contact: "fan@test.ru" },
  });
  bookingId = booking.json().booking.id;
});

afterAll(() => t.teardown());

describe("избранное", () => {
  it("добавление идемпотентно, список возвращает оба типа", async () => {
    for (let i = 0; i < 2; i++) {
      const res = await call({ method: "PUT", url: `/v1/me/favorites/tours/${tourId}`, headers: authed(userToken) });
      expect(res.statusCode).toBe(200);
    }
    await call({ method: "PUT", url: "/v1/me/favorites/cities/moscow", headers: authed(userToken) });

    const list = await call({ method: "GET", url: "/v1/me/favorites", headers: authed(userToken) });
    expect(list.json()).toEqual({ tours: [tourId], cities: ["moscow"] });
  });

  it("несуществующий город → 404", async () => {
    const res = await call({ method: "PUT", url: "/v1/me/favorites/cities/narnia", headers: authed(userToken) });
    expect(res.statusCode).toBe(404);
  });

  it("удаление работает", async () => {
    await call({ method: "DELETE", url: "/v1/me/favorites/cities/moscow", headers: authed(userToken) });
    const list = await call({ method: "GET", url: "/v1/me/favorites", headers: authed(userToken) });
    expect(list.json().cities).toEqual([]);
  });
});

describe("отзывы", () => {
  it("нельзя оставить отзыв до завершения поездки", async () => {
    const res = await call({
      method: "POST",
      url: `/v1/bookings/${bookingId}/review`,
      headers: authed(userToken),
      payload: { rating: 5, text: "Отлично!" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("booking_not_completed");
  });

  it("после завершения — отзыв уходит в pending", async () => {
    await call({ method: "POST", url: `/v1/bookings/${bookingId}/confirm`, headers: authed(adminToken) });
    await call({ method: "POST", url: `/v1/bookings/${bookingId}/complete`, headers: authed(adminToken) });

    const res = await call({
      method: "POST",
      url: `/v1/bookings/${bookingId}/review`,
      headers: authed(userToken),
      payload: { rating: 4, text: "Хорошая экскурсия, но мало времени" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("pending");

    // до модерации в публичном списке пусто
    const pub = await call({ method: "GET", url: `/v1/tours/${tourId}/reviews` });
    expect(pub.json().items).toHaveLength(0);
  });

  it("второй отзыв на ту же бронь → 409", async () => {
    const res = await call({
      method: "POST",
      url: `/v1/bookings/${bookingId}/review`,
      headers: authed(userToken),
      payload: { rating: 5, text: "Ещё раз!" },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("already_reviewed");
  });

  it("модерация: approve публикует и пересчитывает рейтинг тура", async () => {
    const queue = await call({ method: "GET", url: "/v1/admin/reviews", headers: authed(adminToken) });
    expect(queue.json().items).toHaveLength(1);
    const reviewId = queue.json().items[0].id;

    const approved = await call({
      method: "POST",
      url: `/v1/admin/reviews/${reviewId}/approve`,
      headers: authed(adminToken),
    });
    expect(approved.statusCode).toBe(200);
    expect(approved.json().status).toBe("published");

    const pub = await call({ method: "GET", url: `/v1/tours/${tourId}/reviews` });
    expect(pub.json().items).toHaveLength(1);
    expect(pub.json().items[0].author_name).toBe("Фанат");

    const detail = await call({ method: "GET", url: `/v1/tours/${tourId}` });
    expect(detail.json().rating).toBe(4);
    expect(detail.json().reviews_count).toBe(1);
    expect(detail.json().reviews).toHaveLength(1);
  });

  it("повторная модерация → 409", async () => {
    const mine = await call({ method: "GET", url: "/v1/me/reviews", headers: authed(userToken) });
    const reviewId = mine.json().items[0].id;
    const res = await call({
      method: "POST",
      url: `/v1/admin/reviews/${reviewId}/reject`,
      headers: authed(adminToken),
      payload: {},
    });
    expect(res.statusCode).toBe(409);
  });

  it("мои отзывы показывают статус", async () => {
    const res = await call({ method: "GET", url: "/v1/me/reviews", headers: authed(userToken) });
    expect(res.json().items[0].status).toBe("published");
    expect(res.json().items[0].tour_title).toBe("Обзорная по Москве");
  });

  it("обычному пользователю модерация запрещена", async () => {
    const res = await call({ method: "GET", url: "/v1/admin/reviews", headers: authed(userToken) });
    expect(res.statusCode).toBe(403);
  });
});
