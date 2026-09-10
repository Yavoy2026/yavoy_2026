import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InjectOptions } from "fastify";
import { createTestApp, seedCatalogFixture, signupWithRole, type TestApp } from "./helpers.ts";
import { offer } from "@yavoy/legal";

let t: TestApp;
let managerToken: string;
let userToken: string;

async function call(opts: InjectOptions) {
  return t.app.inject(opts);
}

const authed = (token: string) => ({ authorization: `Bearer ${token}` });

const organizer = {
  id: "org-new",
  name: "Новый организатор",
  rating: 0,
  review_count: 0,
  avatar: null,
  verified: false,
  tours_count: 0,
};

const tourPayload = {
  city_id: "moscow",
  title: "Тестовый тур из админки",
  description: "Описание",
  image_url: "https://img/new-tour.jpg",
  price_kopeks: 150_000,
  duration_type: "one_day",
  transport: "auto",
  interest: "city",
  organizer,
};

beforeAll(async () => {
  t = await createTestApp();
  await seedCatalogFixture(t.app);
  managerToken = (await signupWithRole(t, "mgr@test.ru", "manager")).token;
  userToken = (await signupWithRole(t, "user@test.ru", "user")).token;
});

afterAll(() => t.teardown());

describe("бэкофис: CRUD туров", () => {
  let tourId: string;
  let dateId: string;

  it("обычному пользователю всё запрещено", async () => {
    const list = await call({ method: "GET", url: "/v1/admin/tours", headers: authed(userToken) });
    expect(list.statusCode).toBe(403);
    const create = await call({
      method: "POST",
      url: "/v1/admin/tours",
      headers: authed(userToken),
      payload: tourPayload,
    });
    expect(create.statusCode).toBe(403);
  });

  it("менеджер создаёт тур — всегда draft, гостю не виден, в админ-списке есть", async () => {
    const res = await call({
      method: "POST",
      url: "/v1/admin/tours",
      headers: authed(managerToken),
      payload: tourPayload,
    });
    expect(res.statusCode).toBe(200);
    const tour = res.json();
    expect(tour.status).toBe("draft");
    expect(tour.city_name).toBe("Москва");
    tourId = tour.id;

    // гость не видит ни в списке, ни по id
    const publicList = await call({ method: "GET", url: "/v1/tours?limit=50" });
    expect(publicList.json().items.map((i: { id: string }) => i.id)).not.toContain(tourId);
    const publicDetail = await call({ method: "GET", url: `/v1/tours/${tourId}` });
    expect(publicDetail.statusCode).toBe(404);

    // в админ-списке виден с фильтром по статусу
    const adminList = await call({
      method: "GET",
      url: "/v1/admin/tours?status=draft",
      headers: authed(managerToken),
    });
    expect(adminList.json().items.map((i: { id: string }) => i.id)).toContain(tourId);
  });

  it("создание с несуществующим городом → 400", async () => {
    const res = await call({
      method: "POST",
      url: "/v1/admin/tours",
      headers: authed(managerToken),
      payload: { ...tourPayload, city_id: "atlantis" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("city_not_found");
  });

  it("PATCH правит поля", async () => {
    const res = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}`,
      headers: authed(managerToken),
      payload: { title: "Переименованный тур", price_kopeks: 200_000 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().title).toBe("Переименованный тур");
    expect(res.json().price_kopeks).toBe(200_000);
  });

  it("публикация выводит тур в каталог и обновляет published_at", async () => {
    const before = (
      await call({ method: "GET", url: `/v1/admin/tours/${tourId}`, headers: authed(managerToken) })
    ).json().published_at;

    const res = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}/status`,
      headers: authed(managerToken),
      payload: { status: "published" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("published");
    expect(new Date(res.json().published_at).getTime()).toBeGreaterThan(new Date(before).getTime());

    const publicDetail = await call({ method: "GET", url: `/v1/tours/${tourId}` });
    expect(publicDetail.statusCode).toBe(200);
  });

  it("снятие с публикации прячет тур от гостей", async () => {
    await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}/status`,
      headers: authed(managerToken),
      payload: { status: "draft" },
    });
    const publicDetail = await call({ method: "GET", url: `/v1/tours/${tourId}` });
    expect(publicDetail.statusCode).toBe(404);
    // возвращаем для тестов дат
    await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}/status`,
      headers: authed(managerToken),
      payload: { status: "published" },
    });
  });

  it("добавление даты; дубль дня → 409", async () => {
    const res = await call({
      method: "POST",
      url: `/v1/admin/tours/${tourId}/dates`,
      headers: authed(managerToken),
      payload: { starts_on: "2099-07-01", seats_total: 10 },
    });
    expect(res.statusCode).toBe(200);
    const date = res.json();
    expect(date.seats_left).toBe(10);
    expect(date.bookings_count).toBe(0);
    dateId = date.id;

    const dup = await call({
      method: "POST",
      url: `/v1/admin/tours/${tourId}/dates`,
      headers: authed(managerToken),
      payload: { starts_on: "2099-07-01", seats_total: 5 },
    });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().error.code).toBe("date_exists");
  });

  it("смена вместимости сохраняет «занято»: бронь 4 мест, потом менять seats_total", async () => {
    // бронь на 4 места
    const booking = await call({
      method: "POST",
      url: "/v1/bookings",
      headers: authed(userToken),
      payload: { tour_date_id: dateId, tickets_count: 4, first_name: "И", last_name: "Т", contact: "u@test.ru", offer_version: offer.version },
    });
    expect(booking.statusCode).toBe(200);

    // 10 → 6: занято 4, свободно станет 2
    const shrink = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}/dates/${dateId}`,
      headers: authed(managerToken),
      payload: { seats_total: 6 },
    });
    expect(shrink.statusCode).toBe(200);
    expect(shrink.json().seats_left).toBe(2);
    expect(shrink.json().bookings_count).toBe(1);

    // 6 → 3: занято 4 > 3 — нельзя
    const tooSmall = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}/dates/${dateId}`,
      headers: authed(managerToken),
      payload: { seats_total: 3 },
    });
    expect(tooSmall.statusCode).toBe(409);
    expect(tooSmall.json().error.code).toBe("seats_total_below_booked");

    // 6 → 20: свободно 16
    const grow = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}/dates/${dateId}`,
      headers: authed(managerToken),
      payload: { seats_total: 20, price_override_kopeks: 99_000 },
    });
    expect(grow.statusCode).toBe(200);
    expect(grow.json().seats_left).toBe(16);
    expect(grow.json().price_override_kopeks).toBe(99_000);
  });

  it("удалить дату с бронями нельзя, без броней — можно", async () => {
    const res = await call({
      method: "DELETE",
      url: `/v1/admin/tours/${tourId}/dates/${dateId}`,
      headers: authed(managerToken),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("tour_date_has_bookings");

    const fresh = await call({
      method: "POST",
      url: `/v1/admin/tours/${tourId}/dates`,
      headers: authed(managerToken),
      payload: { starts_on: "2099-08-01", seats_total: 5 },
    });
    const freshId = fresh.json().id;
    const del = await call({
      method: "DELETE",
      url: `/v1/admin/tours/${tourId}/dates/${freshId}`,
      headers: authed(managerToken),
    });
    expect(del.statusCode).toBe(200);

    const dates = await call({
      method: "GET",
      url: `/v1/admin/tours/${tourId}/dates`,
      headers: authed(managerToken),
    });
    expect(dates.json().items.map((d: { id: string }) => d.id)).not.toContain(freshId);
  });

  it("поиск по названию в админ-списке", async () => {
    const res = await call({
      method: "GET",
      url: "/v1/admin/tours?q=Переименованный",
      headers: authed(managerToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toHaveLength(1);
    expect(res.json().items[0].id).toBe(tourId);
  });
});

/**
 * Модерация правок (YAV-29). Главное, что здесь проверяется: опубликованный
 * тур продолжает работать на витрине, пока его правка ждёт решения менеджера.
 */
describe("модерация правок тура", () => {
  let partnerToken: string;
  let tourId: string;

  beforeAll(async () => {
    // назначение партнёра — операция админа, менеджеру она закрыта
    const adminToken = (await signupWithRole(t, "root@test.ru", "admin")).token;
    const partnerUserId = (await signupWithRole(t, "org2@test.ru", "user", "Организатор")).id;
    const assigned = await call({
      method: "POST",
      url: "/v1/admin/partners",
      headers: authed(adminToken),
      payload: { user_id: partnerUserId, org_name: "ООО Ревизии" },
    });
    expect(assigned.statusCode).toBe(200);
    partnerToken = (await signupWithRole(t, "org2@test.ru", "partner")).token;

    const created = await call({
      method: "POST",
      url: "/v1/admin/tours",
      headers: authed(partnerToken),
      payload: { ...tourPayload, title: "Тур под модерацию" },
    });
    expect(created.statusCode).toBe(200);
    tourId = created.json().id;
  });

  const publishedTitle = async () => {
    const res = await call({ method: "GET", url: `/v1/admin/tours/${tourId}`, headers: authed(managerToken) });
    return res.json() as { title: string; status: string };
  };

  it("новый тур проходит путь черновик → модерация → публикация", async () => {
    expect((await publishedTitle()).status).toBe("draft");

    const submitted = await call({
      method: "POST",
      url: `/v1/admin/tours/${tourId}/submit`,
      headers: authed(partnerToken),
    });
    expect(submitted.statusCode).toBe(200);
    expect(submitted.json().status).toBe("pending");

    const queue = await call({ method: "GET", url: "/v1/admin/revisions?status=pending", headers: authed(managerToken) });
    const revisionId = queue.json().items[0].id;

    const approved = await call({
      method: "POST",
      url: `/v1/admin/revisions/${revisionId}/approve`,
      headers: authed(managerToken),
    });
    expect(approved.statusCode).toBe(200);
    expect((await publishedTitle()).status).toBe("published");
  });

  it("правка опубликованного тура не снимает его с витрины", async () => {
    const edit = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}`,
      headers: authed(partnerToken),
      payload: { title: "Новое название, ещё не одобрено" },
    });
    expect(edit.statusCode).toBe(200);

    // на витрине всё по-прежнему: и статус, и старое название
    const live = await publishedTitle();
    expect(live.status).toBe("published");
    expect(live.title).toBe("Тур под модерацию");
  });

  it("после одобрения правка становится туром", async () => {
    await call({ method: "POST", url: `/v1/admin/tours/${tourId}/submit`, headers: authed(partnerToken) });
    const queue = await call({ method: "GET", url: "/v1/admin/revisions?status=pending", headers: authed(managerToken) });
    const revisionId = queue.json().items[0].id;

    await call({
      method: "POST",
      url: `/v1/admin/revisions/${revisionId}/approve`,
      headers: authed(managerToken),
    });
    expect((await publishedTitle()).title).toBe("Новое название, ещё не одобрено");
  });

  it("отказ приходит с комментарием, тур остаётся опубликованным", async () => {
    await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}`,
      headers: authed(partnerToken),
      payload: { title: "Спорное название" },
    });
    await call({ method: "POST", url: `/v1/admin/tours/${tourId}/submit`, headers: authed(partnerToken) });
    const queue = await call({ method: "GET", url: "/v1/admin/revisions?status=pending", headers: authed(managerToken) });
    const revisionId = queue.json().items[0].id;

    const rejected = await call({
      method: "POST",
      url: `/v1/admin/revisions/${revisionId}/reject`,
      headers: authed(managerToken),
      payload: { comment: "Название вводит в заблуждение" },
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json().comment).toBe("Название вводит в заблуждение");

    const live = await publishedTitle();
    expect(live.status).toBe("published");
    expect(live.title).toBe("Новое название, ещё не одобрено"); // прошлая одобренная версия
  });

  it("вторая правка не уходит, пока первая на модерации", async () => {
    await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}`,
      headers: authed(partnerToken),
      payload: { title: "Ещё вариант" },
    });
    await call({ method: "POST", url: `/v1/admin/tours/${tourId}/submit`, headers: authed(partnerToken) });

    const again = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}`,
      headers: authed(partnerToken),
      payload: { title: "И ещё один" },
    });
    expect(again.statusCode).toBe(409);
    expect(again.json().error.code).toBe("revision_on_moderation");
  });

  it("менеджер правит опубликованный тур напрямую, без модерации", async () => {
    const res = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${tourId}`,
      headers: authed(managerToken),
      payload: { description: "Правка менеджера" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().description).toBe("Правка менеджера");
  });
});
