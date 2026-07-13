import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { FastifyInstance, InjectOptions } from "fastify";
import * as schema from "../src/db/schema.ts";
import { createTestApp, seedCatalogFixture } from "./helpers.ts";

let app: FastifyInstance;
let teardown: () => Promise<void>;
let userToken: string;
let adminToken: string;
let tourDateId: string;

async function call(opts: InjectOptions) {
  const res = await app.inject(opts);
  return res;
}

const authed = (token: string) => ({ authorization: `Bearer ${token}` });

beforeAll(async () => {
  ({ app, teardown } = await createTestApp());
  await seedCatalogFixture(app);

  // дата с 3 местами у первого опубликованного тура
  const tour = (await app.db.select().from(schema.tours).where(eq(schema.tours.status, "published")).limit(1))[0]!;
  const inserted = await app.db
    .insert(schema.tourDates)
    .values({ tourId: tour.id, startsOn: "2099-06-01", seatsTotal: 3, seatsLeft: 3 })
    .returning();
  tourDateId = inserted[0]!.id;

  const u = await call({
    method: "POST",
    url: "/v1/auth/signup",
    payload: { email: "guest@test.ru", password: "password-123", first_name: "Гость" },
  });
  userToken = u.json().tokens.access_token;

  const a = await call({
    method: "POST",
    url: "/v1/auth/signup",
    payload: { email: "boss@test.ru", password: "password-123", first_name: "Босс" },
  });
  const adminId = a.json().user.id;
  await app.db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, adminId));
  // токен с ролью admin — после смены роли нужен новый JWT
  const a2 = await call({
    method: "POST",
    url: "/v1/auth/signin",
    payload: { email: "boss@test.ru", password: "password-123" },
  });
  adminToken = a2.json().tokens.access_token;
});

afterAll(() => teardown());

const bookingPayload = (tickets = 1) => ({
  tour_date_id: tourDateId,
  tickets_count: tickets,
  first_name: "Иван",
  last_name: "Тестов",
  contact: "ivan@test.ru",
});

describe("бронирования", () => {
  let bookingId: string;

  it("без auth → 401", async () => {
    const res = await call({ method: "POST", url: "/v1/bookings", payload: bookingPayload() });
    expect(res.statusCode).toBe(401);
  });

  it("создаёт заявку и списывает места", async () => {
    const res = await call({
      method: "POST",
      url: "/v1/bookings",
      headers: authed(userToken),
      payload: bookingPayload(2),
    });
    expect(res.statusCode).toBe(200);
    const b = res.json();
    bookingId = b.id;
    expect(b.status).toBe("requested");
    expect(b.amount_kopeks).toBe(500_000); // 2 × 250 000
    expect(b.confirmation_code).toMatch(/^YV-/);

    const date = (await app.db.select().from(schema.tourDates).where(eq(schema.tourDates.id, tourDateId)))[0]!;
    expect(date.seatsLeft).toBe(1);
  });

  it("не даёт увести места в минус", async () => {
    const res = await call({
      method: "POST",
      url: "/v1/bookings",
      headers: authed(userToken),
      payload: bookingPayload(2), // осталось 1
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("no_seats_left");
  });

  it("список моих броней", async () => {
    const res = await call({ method: "GET", url: "/v1/me/bookings", headers: authed(userToken) });
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toHaveLength(1);
    expect(res.json().items[0].tour_title).toBe("Обзорная по Москве");
  });

  it("подтверждение: обычному пользователю нельзя, админу можно", async () => {
    const forbidden = await call({
      method: "POST",
      url: `/v1/bookings/${bookingId}/confirm`,
      headers: authed(userToken),
    });
    expect(forbidden.statusCode).toBe(403);

    const ok = await call({
      method: "POST",
      url: `/v1/bookings/${bookingId}/confirm`,
      headers: authed(adminToken),
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().status).toBe("confirmed");
  });

  it("повторное подтверждение → 409 (машина состояний)", async () => {
    const res = await call({
      method: "POST",
      url: `/v1/bookings/${bookingId}/confirm`,
      headers: authed(adminToken),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("invalid_booking_transition");
  });

  it("отмена возвращает места", async () => {
    const res = await call({
      method: "POST",
      url: `/v1/bookings/${bookingId}/cancel`,
      headers: authed(userToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("cancelled");

    const date = (await app.db.select().from(schema.tourDates).where(eq(schema.tourDates.id, tourDateId)))[0]!;
    expect(date.seatsLeft).toBe(3);
  });

  it("чужую бронь отменить нельзя", async () => {
    const created = await call({
      method: "POST",
      url: "/v1/bookings",
      headers: authed(userToken),
      payload: bookingPayload(1),
    });
    const otherId = created.json().id;

    const stranger = await call({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email: "stranger@test.ru", password: "password-123", first_name: "Чужой" },
    });
    const res = await call({
      method: "POST",
      url: `/v1/bookings/${otherId}/cancel`,
      headers: authed(stranger.json().tokens.access_token),
    });
    expect(res.statusCode).toBe(403);
  });

  it("админ видит очередь заявок", async () => {
    const res = await call({
      method: "GET",
      url: "/v1/admin/bookings?status=requested",
      headers: authed(adminToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().items.length).toBeGreaterThan(0);
  });

  it("детали тура содержат даты с местами", async () => {
    const tours = await call({ method: "GET", url: "/v1/tours" });
    const withDates = tours.json().items.find((t: { title: string }) => t.title === "Обзорная по Москве");
    const detail = await call({ method: "GET", url: `/v1/tours/${withDates.id}` });
    expect(detail.statusCode).toBe(200);
    const body = detail.json();
    expect(body.dates.length).toBeGreaterThan(0);
    expect(body.next_available_date).toBe("2099-06-01");
  });
});
