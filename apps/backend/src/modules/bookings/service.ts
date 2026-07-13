import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Booking, BookingStatus, CreateBookingPayload } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { bookings, tourDates, tours } from "../../db/schema.ts";
import { badRequest, conflict, forbidden, notFound } from "../../errors.ts";
import {
  bookingConfirmedClientMail,
  bookingRequestedAdminMail,
  type Mailer,
} from "../../mail/mailer.ts";
import { getBookingViewById, listBookingsByStatus, listUserBookings, releaseSeats, reserveSeats, type BookingViewRow } from "./repo.ts";
import { assertTransition, holdsSeats } from "./transitions.ts";

function generateConfirmationCode(): string {
  return `YV-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function toBooking(row: BookingViewRow): Booking {
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
    meeting_point: row.meetingPoint,
    created_at: b.createdAt.toISOString(),
    cancelled_at: b.cancelledAt?.toISOString() ?? null,
  };
}

export async function createBooking(
  db: Db,
  mailer: Mailer,
  userId: string,
  payload: CreateBookingPayload,
): Promise<Booking> {
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
      })
      .returning({ id: bookings.id });
    return inserted[0]!.id;
  });

  const view = (await getBookingViewById(db, bookingId))!;
  const booking = toBooking(view);

  // письмо не должно ронять бронирование
  const adminMail = bookingRequestedAdminMail(booking);
  if (adminMail) await mailer.send(adminMail).catch(() => {});

  return booking;
}

export async function listMyBookings(db: Db, userId: string): Promise<Booking[]> {
  const rows = await listUserBookings(db, userId);
  return rows.map(toBooking);
}

export async function listAdminBookings(db: Db, status: BookingStatus): Promise<Booking[]> {
  const rows = await listBookingsByStatus(db, status);
  return rows.map(toBooking);
}

async function changeStatus(
  db: Db,
  view: BookingViewRow,
  to: BookingStatus,
): Promise<void> {
  const from = view.booking.status;
  assertTransition(from, to);

  await db.transaction(async (tx) => {
    const patch: Partial<typeof bookings.$inferInsert> = { status: to };
    if (to === "confirmed") patch.confirmedAt = new Date();
    if (to === "cancelled") patch.cancelledAt = new Date();
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
  return toBooking((await getBookingViewById(db, bookingId))!);
}

export async function completeBooking(db: Db, bookingId: string): Promise<Booking> {
  const view = await getBookingViewById(db, bookingId);
  if (!view) throw notFound("booking_not_found", "Бронь не найдена");
  await changeStatus(db, view, "completed");
  return toBooking((await getBookingViewById(db, bookingId))!);
}

export async function confirmBooking(db: Db, mailer: Mailer, bookingId: string): Promise<Booking> {
  const view = await getBookingViewById(db, bookingId);
  if (!view) throw notFound("booking_not_found", "Бронь не найдена");

  await changeStatus(db, view, "confirmed");
  const booking = toBooking((await getBookingViewById(db, bookingId))!);

  const clientMail = bookingConfirmedClientMail(booking);
  if (clientMail) await mailer.send(clientMail).catch(() => {});

  return booking;
}
