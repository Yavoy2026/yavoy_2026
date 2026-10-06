import type { BookedTour, BookingApiStatus } from "@/types";
import { offer } from "@yavoy/legal";
import { ApiError, authFetch } from "@/services/api";

export interface CreateBookingPayload {
  tour_date_id: string;
  tickets_count: number;
  first_name: string;
  last_name: string;
  contact: string;
}

interface ApiBooking {
  id: string;
  status: BookingApiStatus;
  tour_id: string;
  tour_title: string;
  tour_image_url: string;
  tour_city_id: string;
  tour_date: string;
  start_time: string | null;
  tickets_count: number;
  amount_kopeks: number;
  confirmation_code: string;
  first_name: string;
  last_name: string;
  contact: string;
  organizer_name: string;
  organizer_phone: string | null;
  meeting_point: string | null;
  meeting_map_url: string | null;
  payment_url: string | null;
  created_at: string;
}

function adaptBooking(b: ApiBooking): BookedTour {
  return {
    id: b.id,
    tourId: b.tour_id,
    tourTitle: b.tour_title,
    tourImage: b.tour_image_url,
    tourCity: b.tour_city_id,
    tourDate: b.tour_date,
    tourStartTime: b.start_time ?? "10:00",
    ticketCount: b.tickets_count,
    totalPrice: Math.round(b.amount_kopeks / 100),
    confirmationCode: b.confirmation_code,
    status: b.status === "completed" ? "completed" : "upcoming",
    apiStatus: b.status,
    bookedAt: b.created_at.slice(0, 10),
    firstName: b.first_name,
    lastName: b.last_name,
    contact: b.contact,
    organizerName: b.organizer_name,
    organizerPhone: b.organizer_phone ?? undefined,
    meetingPoint: b.meeting_point ?? undefined,
    meetingMapUrl: b.meeting_map_url ?? undefined,
    paymentUrl: b.payment_url ?? undefined,
  };
}

async function parseOrThrow(res: Response, fallbackCode: string): Promise<ApiBooking> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    throw new ApiError(res.status, body?.error?.code ?? fallbackCode, body?.error?.message ?? fallbackCode);
  }
  return res.json() as Promise<ApiBooking>;
}

/**
 * Создаёт бронь. С подключённым эквайрингом бэкенд возвращает payment_url —
 * ссылку на платёжную страницу банка, куда нужно отправить покупателя.
 * Реквизиты карты вводятся там; наше приложение их не видит (YAV-21).
 */
export async function createBooking(
  payload: CreateBookingPayload,
): Promise<{ booking: BookedTour; paymentUrl: string | null }> {
  // Версию оферты подставляем здесь, а не в экранах: акцепт — свойство самого
  // документа, а экранов бронирования несколько, и забыть её легко (YAV-24).
  const res = await authFetch("/bookings", {
    method: "POST",
    body: JSON.stringify({ ...payload, offer_version: offer.version }),
  });
  if (!res.ok) await parseOrThrow(res, "bookingCreateFailed");
  const body = (await res.json()) as { booking: ApiBooking; payment_url: string | null };
  return { booking: adaptBooking(body.booking), paymentUrl: body.payment_url };
}

export async function fetchMyBookings(): Promise<BookedTour[]> {
  const res = await authFetch("/me/bookings");
  if (!res.ok) throw new ApiError(res.status, "bookingsLoadFailed", "bookingsLoadFailed");
  const body = (await res.json()) as { items: ApiBooking[] };
  // отменённые и отклонённые не прячем: пользователь должен видеть, чем
  // закончилась заявка, иначе она просто исчезает без объяснений
  return body.items.map(adaptBooking);
}

export async function cancelBooking(id: string): Promise<BookedTour> {
  const res = await authFetch(`/bookings/${id}/cancel`, { method: "POST" });
  return adaptBooking(await parseOrThrow(res, "bookingCancelFailed"));
}

/** История платежей (YAV-31). Статус считает сервер — правило одно на обе платформы */
export interface Transaction {
  id: string;
  booking_id: string;
  tour_title: string;
  tour_image_url: string;
  status: "completed" | "pending" | "refunded" | "failed";
  amount_minor: number;
  refunded_minor: number;
  currency: string;
  masked_pan: string | null;
  card_vendor: string | null;
  paid_at: string | null;
  created_at: string;
}

export async function fetchMyTransactions(): Promise<Transaction[]> {
  const res = await authFetch("/me/transactions");
  if (!res.ok) throw new ApiError(res.status, "transactionsLoadFailed", "transactionsLoadFailed");
  const body = (await res.json()) as { items: Transaction[] };
  return body.items;
}
