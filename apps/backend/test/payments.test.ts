import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../src/db/schema.ts";
import type { CreatePaymentInput, PaymentEvent, PaymentProvider } from "../src/modules/payments/provider.ts";
import { expireStalePayments } from "../src/modules/payments/service.ts";
import { createTestApp, seedCatalogFixture, signupWithRole, type TestApp } from "./helpers.ts";

/**
 * Провайдер-дубль: настоящий OCTO по сети мы в тестах не дёргаем, а вся логика
 * (статусы, идемпотентность, возврат мест) живёт на нашей стороне.
 */
const created: CreatePaymentInput[] = [];
const fakeProvider: PaymentProvider = {
  id: "octo",
  async createPayment(input) {
    created.push(input);
    return {
      providerPaymentId: `octo-${input.paymentId}`,
      payUrl: `https://pay2.octo.uz/pay/octo-${input.paymentId}`,
      status: "created",
    };
  },
  parseWebhook(body): PaymentEvent {
    const b = body as { paymentId: string; status: PaymentEvent["status"] };
    return {
      providerPaymentId: `octo-${b.paymentId}`,
      paymentId: b.paymentId,
      status: b.status,
      raw: body,
    };
  },
  async refund() {},
};

let t: TestApp;
let token: string;
let tourDateId: string;

beforeAll(async () => {
  t = await createTestApp({ payments: fakeProvider });
  await seedCatalogFixture(t.app);
  const tour = (
    await t.app.db.select().from(schema.tours).where(eq(schema.tours.title, "Обзорная по Москве"))
  )[0]!;
  const date = await t.app.db
    .insert(schema.tourDates)
    .values({ tourId: tour.id, startsOn: "2027-01-10", seatsTotal: 3, seatsLeft: 3 })
    .returning();
  tourDateId = date[0]!.id;
  token = (await signupWithRole(t, "payer@example.com", "user")).token;
});
afterAll(() => t.teardown());

const payload = (tickets = 1) => ({
  tour_date_id: tourDateId,
  tickets_count: tickets,
  first_name: "Иван",
  last_name: "Петров",
  contact: "payer@example.com",
});

const authed = () => ({ authorization: `Bearer ${token}` });

describe("оплата брони", () => {
  let bookingId: string;
  let paymentId: string;

  it("бронь встаёт в pending_payment и отдаёт ссылку на оплату", async () => {
    const res = await t.app.inject({
      method: "POST",
      url: "/v1/bookings",
      headers: authed(),
      payload: payload(2),
    });
    expect(res.statusCode).toBe(200);

    const body = res.json() as { booking: { id: string; status: string }; payment_url: string };
    bookingId = body.booking.id;
    expect(body.booking.status).toBe("pending_payment");
    expect(body.payment_url).toContain("pay2.octo.uz");

    // места удерживаются уже на этапе ожидания оплаты
    const date = (await t.app.db.select().from(schema.tourDates).where(eq(schema.tourDates.id, tourDateId)))[0]!;
    expect(date.seatsLeft).toBe(1);

    const payment = (
      await t.app.db.select().from(schema.payments).where(eq(schema.payments.bookingId, bookingId))
    )[0]!;
    paymentId = payment.id;
    expect(payment.amountMinor).toBe(500_000);
    expect(payment.providerPaymentId).toBe(`octo-${paymentId}`);
    // сумма ушла провайдеру в мажорных единицах — конвертация на границе
    expect(created.at(-1)!.amountMinor).toBe(500_000);
  });

  it("успешный коллбэк подтверждает бронь и шлёт ваучер", async () => {
    const res = await t.app.inject({
      method: "POST",
      url: "/v1/webhooks/octo",
      payload: { paymentId, status: "succeeded" },
    });
    expect(res.statusCode).toBe(200);

    const booking = (
      await t.app.db.select().from(schema.bookings).where(eq(schema.bookings.id, bookingId))
    )[0]!;
    expect(booking.status).toBe("confirmed");

    const payment = (await t.app.db.select().from(schema.payments).where(eq(schema.payments.id, paymentId)))[0]!;
    expect(payment.status).toBe("succeeded");
    expect(payment.paidAt).not.toBeNull();

    const mail = t.outbox.at(-1);
    expect(mail?.to).toBe("payer@example.com");
    expect(mail?.text).toContain(booking.confirmationCode);
  });

  it("повторный коллбэк ничего не ломает (провайдер ретраит доставку)", async () => {
    const mailsBefore = t.outbox.length;
    const res = await t.app.inject({
      method: "POST",
      url: "/v1/webhooks/octo",
      payload: { paymentId, status: "succeeded" },
    });
    expect(res.statusCode).toBe(200);
    expect(t.outbox).toHaveLength(mailsBefore);

    const date = (await t.app.db.select().from(schema.tourDates).where(eq(schema.tourDates.id, tourDateId)))[0]!;
    expect(date.seatsLeft).toBe(1); // места не поехали второй раз
  });

  it("отменённый платёж снимает бронь и возвращает места", async () => {
    const create = await t.app.inject({
      method: "POST",
      url: "/v1/bookings",
      headers: authed(),
      payload: payload(1),
    });
    const second = (create.json() as { booking: { id: string } }).booking.id;
    const secondPayment = (
      await t.app.db.select().from(schema.payments).where(eq(schema.payments.bookingId, second))
    )[0]!;

    await t.app.inject({
      method: "POST",
      url: "/v1/webhooks/octo",
      payload: { paymentId: secondPayment.id, status: "cancelled" },
    });

    const booking = (await t.app.db.select().from(schema.bookings).where(eq(schema.bookings.id, second)))[0]!;
    expect(booking.status).toBe("cancelled");
    const date = (await t.app.db.select().from(schema.tourDates).where(eq(schema.tourDates.id, tourDateId)))[0]!;
    expect(date.seatsLeft).toBe(1); // место вернулось в продажу
  });

  it("коллбэк по несуществующему платежу → 404", async () => {
    const res = await t.app.inject({
      method: "POST",
      url: "/v1/webhooks/octo",
      payload: { paymentId: "00000000-0000-0000-0000-000000000000", status: "succeeded" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("сборщик снимает протухшие неоплаченные брони и возвращает места", async () => {
    const create = await t.app.inject({
      method: "POST",
      url: "/v1/bookings",
      headers: authed(),
      payload: payload(1),
    });
    const stale = (create.json() as { booking: { id: string } }).booking.id;

    // отматываем время создания платежа за пределы ttl
    await t.app.db
      .update(schema.payments)
      .set({ createdAt: new Date(Date.now() - 60 * 60_000) })
      .where(eq(schema.payments.bookingId, stale));

    const expired = await expireStalePayments(t.app.db);
    expect(expired).toBe(1);

    const booking = (await t.app.db.select().from(schema.bookings).where(eq(schema.bookings.id, stale)))[0]!;
    expect(booking.status).toBe("cancelled");
    const date = (await t.app.db.select().from(schema.tourDates).where(eq(schema.tourDates.id, tourDateId)))[0]!;
    expect(date.seatsLeft).toBe(1);
  });
});
