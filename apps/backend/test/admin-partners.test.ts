import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InjectOptions } from "fastify";
import { partnerOffer } from "@yavoy/legal";
import * as schema from "../src/db/schema.ts";
import { createTestApp, loginViaOtp, seedCatalogFixture, signupWithRole, type TestApp } from "./helpers.ts";

let t: TestApp;
let adminToken: string;
let managerToken: string;
let partnerUserId: string;
let partnerToken: string;
let partnerProfileId: string;

async function call(opts: InjectOptions) {
  return t.app.inject(opts);
}

const authed = (token: string) => ({ authorization: `Bearer ${token}` });

const tourPayload = {
  city_id: "moscow",
  title: "Партнёрский тур",
  description: "Создан партнёром",
  image_url: "https://img/partner-tour.jpg",
  price_kopeks: 500_000,
  duration_type: "one_day",
  transport: "auto",
  interest: "city",
};

beforeAll(async () => {
  t = await createTestApp();
  await seedCatalogFixture(t.app);
  adminToken = (await signupWithRole(t, "root@test.ru", "admin")).token;
  managerToken = (await signupWithRole(t, "mgr@test.ru", "manager")).token;
  partnerUserId = (await signupWithRole(t, "org@test.ru", "user", "Организатор")).id;
});

afterAll(() => t.teardown());

describe("бэкофис: партнёры", () => {
  it("партнёра назначает менеджер или админ; повторно → 409", async () => {
    // раньше это было заперто на админа; с появлением заявок менеджер их
    // рассматривает, поэтому и назначить напрямую может (YAV-29)
    const byAdmin = await call({
      method: "POST",
      url: "/v1/admin/partners",
      headers: authed(adminToken),
      payload: { user_id: partnerUserId, org_name: "ООО Тестовые туры", inn: "7712345678" },
    });
    expect(byAdmin.statusCode).toBe(200);
    const profile = byAdmin.json();
    expect(profile.org_name).toBe("ООО Тестовые туры");
    expect(profile.verified).toBe(false);
    expect(profile.user_email).toBe("org@test.ru");
    partnerProfileId = profile.id;

    const again = await call({
      method: "POST",
      url: "/v1/admin/partners",
      headers: authed(adminToken),
      payload: { user_id: partnerUserId, org_name: "Дубль" },
    });
    expect(again.statusCode).toBe(409);
    expect(again.json().error.code).toBe("partner_exists");

    // роль сменилась — перелогин выдаёт partner-токен
    const relogin = await loginViaOtp(t, "org@test.ru");
    expect(relogin.user.role).toBe("partner");
    partnerToken = relogin.tokens.access_token;
  });

  it("партнёр видит свой профиль и правит его (без verified)", async () => {
    const me = await call({ method: "GET", url: "/v1/admin/partners/me", headers: authed(partnerToken) });
    expect(me.statusCode).toBe(200);
    expect(me.json().org_name).toBe("ООО Тестовые туры");

    const patch = await call({
      method: "PATCH",
      url: "/v1/admin/partners/me",
      headers: authed(partnerToken),
      payload: { phone: "+7 900 000-00-00", verified: true },
    });
    // verified в самоправке не принимается схемой → 400 (лишнее поле отбрасывается или ошибка?)
    // UpdateMyPartnerProfilePayloadSchema.omit: неизвестные ключи strip'ятся — verified игнорируется
    expect(patch.statusCode).toBe(200);
    expect(patch.json().phone).toBe("+7 900 000-00-00");
    expect(patch.json().verified).toBe(false);
  });

  it("партнёр создаёт тур: draft, partner_id свой, organizer из профиля", async () => {
    const res = await call({
      method: "POST",
      url: "/v1/admin/tours",
      headers: authed(partnerToken),
      payload: { ...tourPayload, partner_id: null }, // partner_id игнорируется — принудительно свой
    });
    expect(res.statusCode).toBe(200);
    const tour = res.json();
    expect(tour.status).toBe("draft");
    expect(tour.partner_id).toBe(partnerProfileId);
    expect(tour.organizer.name).toBe("ООО Тестовые туры");
    expect(tour.organizer.verified).toBe(false);
  });

  it("партнёр видит только свои туры; чужой тур → 404", async () => {
    const list = await call({ method: "GET", url: "/v1/admin/tours", headers: authed(partnerToken) });
    expect(list.statusCode).toBe(200);
    const items = list.json().items as { partner_id: string | null; title: string }[];
    expect(items).toHaveLength(1);
    expect(items[0]!.partner_id).toBe(partnerProfileId);

    // чужой (платформенный) тур из фикстуры
    const foreign = (await t.app.db.select().from(schema.tours).where(eq(schema.tours.title, "Обзорная по Москве")))[0]!;
    const get = await call({ method: "GET", url: `/v1/admin/tours/${foreign.id}`, headers: authed(partnerToken) });
    expect(get.statusCode).toBe(404);
    const patch = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${foreign.id}`,
      headers: authed(partnerToken),
      payload: { title: "Взломанный" },
    });
    expect(patch.statusCode).toBe(404);
    const dates = await call({
      method: "POST",
      url: `/v1/admin/tours/${foreign.id}/dates`,
      headers: authed(partnerToken),
      payload: { starts_on: "2099-09-01", seats_total: 5 },
    });
    expect(dates.statusCode).toBe(404);
  });

  it("публикация партнёром → 403; менеджером → 200 и тур в каталоге", async () => {
    const own = (await t.app.db.select().from(schema.tours).where(eq(schema.tours.title, "Партнёрский тур")))[0]!;

    const byPartner = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${own.id}/status`,
      headers: authed(partnerToken),
      payload: { status: "published" },
    });
    expect(byPartner.statusCode).toBe(403);

    const byManager = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${own.id}/status`,
      headers: authed(managerToken),
      payload: { status: "published" },
    });
    expect(byManager.statusCode).toBe(200);

    const publicView = await call({ method: "GET", url: `/v1/tours/${own.id}` });
    expect(publicView.statusCode).toBe(200);
    expect(publicView.json().organizer.name).toBe("ООО Тестовые туры");
  });

  it("правка опубликованного тура партнёром не снимает его с витрины (YAV-28)", async () => {
    const own = (await t.app.db.select().from(schema.tours).where(eq(schema.tours.title, "Партнёрский тур")))[0]!;

    const res = await call({
      method: "PATCH",
      url: `/v1/admin/tours/${own.id}`,
      headers: authed(partnerToken),
      payload: { title: "Партнёрский тур (обновлён)" },
    });
    expect(res.statusCode).toBe(200);
    // правка ушла в ревизию: тур остался опубликованным со старым названием
    expect(res.json().status).toBe("published");
    expect(res.json().title).toBe("Партнёрский тур");

    const publicView = await call({ method: "GET", url: `/v1/tours/${own.id}` });
    expect(publicView.statusCode).toBe(200);
    expect(publicView.json().title).toBe("Партнёрский тур");
  });

  it("verified от менеджера синхронизируется в organizer публичного тура", async () => {
    const res = await call({
      method: "PATCH",
      url: `/v1/admin/partners/${partnerProfileId}`,
      headers: authed(managerToken),
      payload: { verified: true, org_name: "ООО Тестовые туры ✓" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().verified).toBe(true);

    const own = (
      await t.app.db.select().from(schema.tours).where(eq(schema.tours.partnerId, partnerProfileId))
    )[0]!;
    const publicView = await call({ method: "GET", url: `/v1/tours/${own.id}` });
    expect(publicView.statusCode).toBe(200);
    expect(publicView.json().organizer.verified).toBe(true);
    expect(publicView.json().organizer.name).toBe("ООО Тестовые туры ✓");
  });

  it("роль partner без профиля → 403 partner_profile_missing", async () => {
    const orphan = await signupWithRole(t, "orphan@test.ru", "user");
    await t.app.db.update(schema.users).set({ role: "partner" }).where(eq(schema.users.id, orphan.id));
    const token = (await loginViaOtp(t, "orphan@test.ru")).tokens.access_token;

    const res = await call({ method: "GET", url: "/v1/admin/tours", headers: authed(token) });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("partner_profile_missing");
  });

  it("список партнёров для staff", async () => {
    const res = await call({ method: "GET", url: "/v1/admin/partners", headers: authed(managerToken) });
    expect(res.statusCode).toBe(200);
    expect(res.json().items.length).toBeGreaterThanOrEqual(1);

    const byPartner = await call({ method: "GET", url: "/v1/admin/partners", headers: authed(partnerToken) });
    expect(byPartner.statusCode).toBe(403);
  });
});

/**
 * Заявка на партнёрство (YAV-29): Pending Review → Approved | Rejected.
 * Одобрение выдаёт роль и создаёт профиль данными из самой заявки.
 */
describe("заявка на партнёрство", () => {
  let applicantToken: string;
  let applicantId: string;

  beforeAll(async () => {
    const applicant = await signupWithRole(t, "wannabe@test.ru", "user", "Соискатель");
    applicantId = applicant.id;
    applicantToken = applicant.token;
  });

  const form = (over: Record<string, unknown> = {}) => ({
    org_name: "ООО Заявочные Туры",
    inn: "7799887766",
    phone: "+998 90 000-00-00",
    description: "Организуем экскурсии по Самарканду",
    offer_version: partnerOffer.version,
    ...over,
  });

  it("редакция оферты, отличная от действующей, не принимается", async () => {
    const res = await call({
      method: "POST",
      url: "/v1/partner-applications",
      headers: authed(applicantToken),
      // не version-1: ноль отсекла бы схема раньше, а нам нужен именно наш барьер
      payload: form({ offer_version: partnerOffer.version + 1 }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("offer_version_stale");
  });

  it("заявка подаётся и видна заявителю со статусом pending", async () => {
    const res = await call({
      method: "POST",
      url: "/v1/partner-applications",
      headers: authed(applicantToken),
      payload: form(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("pending");
    // акцепт зафиксирован с версией — иначе он недоказуем
    expect(res.json().offer_version).toBe(partnerOffer.version);
    expect(res.json().offer_accepted_at).toBeTruthy();

    const mine = await call({
      method: "GET",
      url: "/v1/partner-applications/me",
      headers: authed(applicantToken),
    });
    expect(mine.json().org_name).toBe("ООО Заявочные Туры");
  });

  it("вторую заявку, пока первая на рассмотрении, подать нельзя", async () => {
    const res = await call({
      method: "POST",
      url: "/v1/partner-applications",
      headers: authed(applicantToken),
      payload: form(),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("application_pending");
  });

  it("отказ приходит с причиной, роль не выдаётся", async () => {
    const queue = await call({
      method: "GET",
      url: "/v1/admin/partner-applications?status=pending",
      headers: authed(managerToken),
    });
    const id = queue.json().items[0].id;

    const rejected = await call({
      method: "POST",
      url: `/v1/admin/partner-applications/${id}/reject`,
      headers: authed(managerToken),
      payload: { comment: "СТИР не проходит проверку" },
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json().comment).toBe("СТИР не проходит проверку");

    const user = (await t.app.db.select().from(schema.users).where(eq(schema.users.id, applicantId)))[0]!;
    expect(user.role).toBe("user");
  });

  it("после отказа можно подать заново, одобрение выдаёт роль и профиль", async () => {
    const again = await call({
      method: "POST",
      url: "/v1/partner-applications",
      headers: authed(applicantToken),
      payload: form({ org_name: "ООО Заявочные Туры (исправлено)" }),
    });
    expect(again.statusCode).toBe(200);

    const approved = await call({
      method: "POST",
      url: `/v1/admin/partner-applications/${again.json().id}/approve`,
      headers: authed(managerToken),
    });
    expect(approved.statusCode).toBe(200);
    // профиль создан данными из заявки — вводить их повторно не нужно
    expect(approved.json().org_name).toBe("ООО Заявочные Туры (исправлено)");
    expect(approved.json().inn).toBe("7799887766");

    const user = (await t.app.db.select().from(schema.users).where(eq(schema.users.id, applicantId)))[0]!;
    expect(user.role).toBe("partner");
  });

  it("повторное решение по рассмотренной заявке → 400", async () => {
    const handled = await call({
      method: "GET",
      url: "/v1/admin/partner-applications?status=approved",
      headers: authed(managerToken),
    });
    const id = handled.json().items[0].id;
    const res = await call({
      method: "POST",
      url: `/v1/admin/partner-applications/${id}/approve`,
      headers: authed(managerToken),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("application_not_pending");
  });
});
