import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Booking, BookingStatus, CreateBookingPayload, CreateBookingResponse } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { bookings, tourDates, tours } from "../../db/schema.ts";
import { offer } from "@yavoy/legal";
import { env } from "../../env.ts";
import { badRequest, conflict, forbidden, notFound } from "../../errors.ts";
import {
  bookingConfirmedClientMail,
  bookingRequestedAdminMail,
  type Mailer,
} from "../../mail/mailer.ts";
import {
  getActivePayUrl,
  getBookingViewById,
  listBookingsByStatuses,
  listStaleBookings,
  listUserBookings,
  releaseSeats,
  reserveSeats,
  type BookingViewRow,
} from "./repo.ts";
import type { PaymentProvider } from "../payments/provider.ts";
import { assertTransition, holdsSeats } from "./transitions.ts";

function generateConfirmationCode(): string {
  return `YV-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Ссылка на точку сбора в картах; без координат — нечего показывать */
function mapsUrl(lat: number | null, lng: number | null): string | null {
  return lat != null && lng != null ? `https://maps.google.com/?q=${lat},${lng}` : null;
}

function toBooking(row: BookingViewRow, payUrl: string | null = null): Booking {
  const b = row.booking;
  return {
    id: b.id,
    status: b.status,
    tour_id: b.tourId,
    tour_title: row.tourTitle,
    tour_image_url: row.tourImageUrl,
    tour_city_id: row.tourCityId,
    tour_date: row.startsOn,
    start_time: row.startTime,
    tickets_count: b.ticketsCount,
    amount_kopeks: b.amountKopeks,
    currency: b.currency,
    confirmation_code: b.confirmationCode,
    first_name: b.firstName,
    last_name: b.lastName,
    contact: b.contact,
    organizer_name: row.organizer.name,
    organizer_phone: row.partnerPhone || null,
    meeting_point: row.meetingPoint,
    meeting_map_url: mapsUrl(row.meetingLat, row.meetingLng),
    payment_url: payUrl,
    offer_version: b.offerVersion,
    offer_accepted_at: b.offerAcceptedAt?.toISOString() ?? null,
    created_at: b.createdAt.toISOString(),
    cancelled_at: b.cancelledAt?.toISOString() ?? null,
  };
}

/** Бронь вместе с актуальной ссылкой на оплату, если она сейчас нужна */
async function loadBooking(db: Db, bookingId: string): Promise<Booking> {
  const view = (await getBookingViewById(db, bookingId))!;
  const payUrl = view.booking.status === "awaiting_payment" ? await getActivePayUrl(db, bookingId) : null;
  return toBooking(view, payUrl);
}

/**
 * Создаёт заявку на бронирование (YAV-27). Места удерживаются сразу — иначе
 * организатор подтверждал бы бронь, на которую мест уже не осталось. Деньги
 * на этом шаге не берутся: сначала организатор проверяет доступность.
 */
export async function createBooking(
  db: Db,
  mailer: Mailer,
  userId: string,
  payload: CreateBookingPayload,
): Promise<CreateBookingResponse> {
  // клиент мог держать открытой старую страницу: согласие с прошлой редакцией
  // оферты нам не подходит — акцепт должен относиться к действующему тексту
  if (payload.offer_version !== offer.version) {
    throw badRequest("offer_version_stale", "Оферта обновилась — перечитайте её и повторите бронирование");
  }

  const bookingId = await db.transaction(async (tx) => {
    const date = await reserveSeats(tx, payload.tour_date_id, payload.tickets_count);
    if (!date) {
      throw conflict("no_seats_left", "На выбранную дату не осталось мест");
    }

    const tourRows = await tx.select().from(tours).where(eq(tours.id, date.tourId)).limit(1);
    const tour = tourRows[0];
    if (!tour || tour.status !== "published") {
      throw badRequest("tour_not_available", "Тур недоступен для бронирования");
    }

    const pricePerTicket = date.priceOverrideKopeks ?? tour.priceKopeks;
    const inserted = await tx
      .insert(bookings)
      .values({
        userId,
        tourId: tour.id,
        tourDateId: date.id,
        ticketsCount: payload.tickets_count,
        amountKopeks: pricePerTicket * payload.tickets_count,
        currency: tour.currency,
        confirmationCode: generateConfirmationCode(),
        firstName: payload.first_name.trim(),
        lastName: payload.last_name.trim(),
        contact: payload.contact.trim(),
        offerVersion: payload.offer_version,
        offerAcceptedAt: new Date(),
        status: "requested",
      })
      .returning({ id: bookings.id });
    return inserted[0]!.id;
  });

  // Заявка уходит организатору. Отдельный шаг, а не начальный статус: сюда
  // встанет отправка уведомления, когда появится её подсистема.
  const view = (await getBookingViewById(db, bookingId))!;
  await changeStatus(db, view, "awaiting_partner");

  // письмо не должно ронять бронирование
  const booking = await loadBooking(db, bookingId);
  const adminMail = bookingRequestedAdminMail(booking);
  if (adminMail) await mailer.send(adminMail).catch(() => {});

  return { booking, payment_url: null };
}

/**
 * Решение организатора по заявке. Подтверждение ведёт к оплате; если эквайринг
 * на инсталляции не подключён, платить негде — бронь сразу подтверждается.
 */
export async function respondToBooking(
  db: Db,
  mailer: Mailer,
  provider: PaymentProvider | null,
  bookingId: string,
  decision: "approve" | "reject",
  scopePartnerId?: string,
): Promise<Booking> {
  const view = await getBookingViewById(db, bookingId);
  if (!view) throw notFound("booking_not_found", "Бронь не найдена");
  // чужая бронь для организатора — 404, как и чужой тур: не палим существование
  if (scopePartnerId && view.tourPartnerId !== scopePartnerId) {
    throw notFound("booking_not_found", "Бронь не найдена");
  }

  if (decision === "reject") {
    await changeStatus(db, view, "rejected");
    return loadBooking(db, bookingId);
  }

  if (!provider) {
    await changeStatus(db, view, "confirmed");
    const confirmed = await loadBooking(db, bookingId);
    const mail = bookingConfirmedClientMail(confirmed);
    if (mail) await mailer.send(mail).catch(() => {});
    return confirmed;
  }

  await changeStatus(db, view, "awaiting_payment");
  // startPayment импортируется лениво: modules/payments зависит от bookings,
  // статический импорт замкнул бы цикл
  const { startPayment } = await import("../payments/service.ts");
  await startPayment(db, provider, {
    id: view.booking.id,
    amountKopeks: view.booking.amountKopeks,
    currency: view.booking.currency,
    contact: view.booking.contact,
    userId: view.booking.userId,
    tourTitle: view.tourTitle,
  });

  return loadBooking(db, bookingId);
}

/**
 * Оплата прошла: подтверждаем бронь и шлём ваучер. Вызывается из обработчика
 * коллбэка; повторный вызов по уже подтверждённой броне ничего не делает —
 * провайдеры ретраят уведомления.
 */
export async function confirmPaidBooking(db: Db, mailer: Mailer, bookingId: string): Promise<void> {
  const view = await getBookingViewById(db, bookingId);
  if (!view || view.booking.status !== "awaiting_payment") return;

  await changeStatus(db, view, "confirmed");
  const booking = await loadBooking(db, bookingId);
  const clientMail = bookingConfirmedClientMail(booking);
  if (clientMail) await mailer.send(clientMail).catch(() => {});
}

/** Платёж отменён на стороне банка или провайдера */
export async function cancelUnpaidBooking(db: Db, bookingId: string): Promise<void> {
  const view = await getBookingViewById(db, bookingId);
  if (!view || view.booking.status !== "awaiting_payment") return;
  await changeStatus(db, view, "cancelled");
}

/** Истёк срок оплаты: место возвращается в продажу */
export async function expireUnpaidBooking(db: Db, bookingId: string): Promise<void> {
  const view = await getBookingViewById(db, bookingId);
  if (!view || view.booking.status !== "awaiting_payment") return;
  await changeStatus(db, view, "expired");
}

/**
 * Организатор не ответил в срок — снимаем заявку и возвращаем места.
 * Без этого один молчащий организатор морозил бы даты навсегда: места
 * удерживаются с момента заявки.
 */
export async function expireStaleRequests(db: Db): Promise<number> {
  const deadline = new Date(Date.now() - env.PARTNER_RESPONSE_TTL_H * 3_600_000);
  // requested — статус броней, созданных до YAV-27; они точно так же держат места
  const stale = [
    ...(await listStaleBookings(db, "awaiting_partner", deadline)),
    ...(await listStaleBookings(db, "requested", deadline)),
  ];
  for (const view of stale) {
    await changeStatus(db, view, "expired");
  }
  return stale.length;
}

export async function listMyBookings(db: Db, userId: string): Promise<Booking[]> {
  const rows = await listUserBookings(db, userId);
  return Promise.all(
    rows.map(async (row) =>
      toBooking(
        row,
        row.booking.status === "awaiting_payment" ? await getActivePayUrl(db, row.booking.id) : null,
      ),
    ),
  );
}

/** Очередь панели: staff видит все брони, организатор — только по своим турам */
export async function listAdminBookings(
  db: Db,
  statuses: readonly BookingStatus[],
  scopePartnerId?: string,
): Promise<Booking[]> {
  const rows = await listBookingsByStatuses(db, statuses, scopePartnerId);
  return rows.map((row) => toBooking(row));
}

async function changeStatus(
  db: Db,
  view: BookingViewRow,
  to: BookingStatus,
): Promise<void> {
  const from = view.booking.status;
  assertTransition(from, to);

  await db.transaction(async (tx) => {
    const patch: Partial<typeof bookings.$inferInsert> = { status: to, statusChangedAt: new Date() };
    if (to === "confirmed") patch.confirmedAt = new Date();
    if (to === "cancelled" || to === "rejected" || to === "expired") patch.cancelledAt = new Date();
    await tx.update(bookings).set(patch).where(eq(bookings.id, view.booking.id));

    if (holdsSeats(from) && !holdsSeats(to) && to !== "completed") {
      await releaseSeats(tx, view.booking.tourDateId, view.booking.ticketsCount);
    }
  });
}

export async function cancelBooking(
  db: Db,
  actor: { userId: string; isStaff: boolean },
  bookingId: string,
): Promise<Booking> {
  const view = await getBookingViewById(db, bookingId);
  if (!view) throw notFound("booking_not_found", "Бронь не найдена");
  if (!actor.isStaff && view.booking.userId !== actor.userId) {
    throw forbidden("not_your_booking", "Это не ваша бронь");
  }

  await changeStatus(db, view, "cancelled");
  return loadBooking(db, bookingId);
}

export async function completeBooking(db: Db, bookingId: string): Promise<Booking> {
  const view = await getBookingViewById(db, bookingId);
  if (!view) throw notFound("booking_not_found", "Бронь не найдена");
  await changeStatus(db, view, "completed");
  return loadBooking(db, bookingId);
}
