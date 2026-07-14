import type { BookedTour } from "@/types";
import { authFetch, type UserProfile } from "@/services/api";
import type { MyReview } from "@/services/social";

async function ensureOk<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? fallback);
  }
  return res.json() as Promise<T>;
}

// ─── Заявки на бронирование ──────────────────────────────────

interface ApiBooking {
  id: string;
  status: string;
  tour_title: string;
  tour_image_url: string;
  tour_date: string;
  tickets_count: number;
  amount_kopeks: number;
  confirmation_code: string;
  first_name: string;
  last_name: string;
  contact: string;
}

export interface AdminBooking {
  id: string;
  status: string;
  tourTitle: string;
  tourImage: string;
  tourDate: string;
  tickets: number;
  amount: number;
  code: string;
  guest: string;
  contact: string;
}

function adaptAdminBooking(b: ApiBooking): AdminBooking {
  return {
    id: b.id,
    status: b.status,
    tourTitle: b.tour_title,
    tourImage: b.tour_image_url,
    tourDate: b.tour_date,
    tickets: b.tickets_count,
    amount: Math.round(b.amount_kopeks / 100),
    code: b.confirmation_code,
    guest: `${b.first_name} ${b.last_name}`,
    contact: b.contact,
  };
}

export async function fetchAdminBookings(status: "requested" | "confirmed"): Promise<AdminBooking[]> {
  const res = await authFetch(`/admin/bookings?status=${status}`);
  const body = await ensureOk<{ items: ApiBooking[] }>(res, "Не удалось загрузить заявки");
  return body.items.map(adaptAdminBooking);
}

export async function confirmBooking(id: string): Promise<void> {
  await ensureOk(await authFetch(`/bookings/${id}/confirm`, { method: "POST" }), "Не удалось подтвердить");
}

export async function completeBooking(id: string): Promise<void> {
  await ensureOk(await authFetch(`/bookings/${id}/complete`, { method: "POST" }), "Не удалось завершить");
}

export async function cancelBookingAdmin(id: string): Promise<void> {
  await ensureOk(await authFetch(`/bookings/${id}/cancel`, { method: "POST" }), "Не удалось отменить");
}

// ─── Модерация отзывов ───────────────────────────────────────

export async function fetchPendingReviews(): Promise<MyReview[]> {
  const res = await authFetch("/admin/reviews");
  const body = await ensureOk<{ items: unknown[] }>(res, "Не удалось загрузить отзывы");
  // формат совпадает с MyReview API — переиспользуем адаптацию через social нельзя (приватная), поля ниже
  return (body.items as {
    id: string; booking_id: string; tour_title: string; tour_image_url: string;
    rating: number; text: string; created_at: string; status: MyReview["status"];
    rejected_reason: string | null; author_name: string;
  }[]).map((r) => ({
    id: r.id,
    bookingId: r.booking_id,
    tourTitle: r.tour_title,
    tourImage: r.tour_image_url,
    rating: r.rating,
    text: `${r.author_name}: ${r.text}`,
    date: r.created_at.slice(0, 10),
    status: r.status,
    rejectedReason: r.rejected_reason,
  }));
}

export async function approveReview(id: string): Promise<void> {
  await ensureOk(await authFetch(`/admin/reviews/${id}/approve`, { method: "POST" }), "Не удалось опубликовать");
}

export async function rejectReview(id: string): Promise<void> {
  await ensureOk(
    await authFetch(`/admin/reviews/${id}/reject`, { method: "POST", body: JSON.stringify({}) }),
    "Не удалось отклонить",
  );
}
