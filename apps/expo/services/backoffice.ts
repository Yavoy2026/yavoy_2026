/**
 * Бэкофис (роли partner/manager/admin) — зеркало apps/web/src/services/admin.ts.
 * Все вызовы идут на /v1/admin/* и /v1/bookings/*; скоупинг партнёра делает сервер.
 */
import { authFetch, type UserProfile, type UserRole } from "@/services/api";

async function ensureOk<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? fallback);
  }
  return res.json() as Promise<T>;
}

// ─── Заявки на бронирование ──────────────────────────────────

interface ApiAdminBooking {
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

export interface BackofficeBooking {
  id: string;
  status: string;
  tourTitle: string;
  tourImage: string;
  tourDate: string;
  tickets: number;
  amountRub: number;
  code: string;
  guest: string;
  contact: string;
}

export async function fetchBackofficeBookings(status: "requested" | "confirmed"): Promise<BackofficeBooking[]> {
  const res = await authFetch(`/admin/bookings?status=${status}`);
  const body = await ensureOk<{ items: ApiAdminBooking[] }>(res, "Не удалось загрузить заявки");
  return body.items.map((b) => ({
    id: b.id,
    status: b.status,
    tourTitle: b.tour_title,
    tourImage: b.tour_image_url,
    tourDate: b.tour_date,
    tickets: b.tickets_count,
    amountRub: Math.round(b.amount_kopeks / 100),
    code: b.confirmation_code,
    guest: `${b.first_name} ${b.last_name}`,
    contact: b.contact,
  }));
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

interface ApiPendingReview {
  id: string;
  tour_title: string;
  tour_image_url: string;
  rating: number;
  text: string;
  created_at: string;
  author_name: string;
}

export interface PendingReview {
  id: string;
  tourTitle: string;
  tourImage: string;
  rating: number;
  text: string;
  date: string;
  authorName: string;
}

export async function fetchPendingReviews(): Promise<PendingReview[]> {
  const res = await authFetch("/admin/reviews");
  const body = await ensureOk<{ items: ApiPendingReview[] }>(res, "Не удалось загрузить отзывы");
  return body.items.map((r) => ({
    id: r.id,
    tourTitle: r.tour_title,
    tourImage: r.tour_image_url,
    rating: r.rating,
    text: r.text,
    date: r.created_at.slice(0, 10),
    authorName: r.author_name,
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

// ─── Пользователи ────────────────────────────────────────────

export async function listUsers(q?: string): Promise<UserProfile[]> {
  const res = await authFetch(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  const body = await ensureOk<{ items: UserProfile[] }>(res, "Не удалось загрузить пользователей");
  return body.items;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<UserProfile> {
  const res = await authFetch(`/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) });
  return ensureOk<UserProfile>(res, "Не удалось изменить роль");
}

export async function setUserActive(userId: string, isActive: boolean): Promise<UserProfile> {
  const res = await authFetch(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
  return ensureOk<UserProfile>(res, "Не удалось изменить статус пользователя");
}

// ─── Туры ────────────────────────────────────────────────────

export type BackofficeTourStatus = "draft" | "pending" | "published" | "rejected" | "archived";

/** Модель тура бэкофиса — snake_case как в API (редактор работает с полями напрямую) */
export interface BackofficeTour {
  id: string;
  status: BackofficeTourStatus;
  partner_id: string | null;
  city_id: string;
  city_name: string;
  title: string;
  description: string;
  image_url: string;
  gallery: string[];
  price_kopeks: number;
  original_price_kopeks: number | null;
  currency: string;
  duration_type: "one_day" | "multi_day";
  duration_text: string;
  transport: "auto" | "water" | "sea" | "bike" | "air";
  interest: "city" | "educational" | "nature" | "pilgrimage";
  category: string | null;
  season: string | null;
  organizer: {
    id: string;
    name: string;
    rating: number;
    review_count: number;
    avatar: string | null;
    verified: boolean;
    tours_count: number;
  };
  highlights: string[];
  includes: string[];
  excludes: string[];
  what_to_bring: string[];
  languages: string[];
  schedule: string | null;
  group_size: string | null;
  meeting_point: string | null;
  meeting_lat: number | null;
  meeting_lng: number | null;
  start_time: string | null;
  booking_conditions: string | null;
  prepayment: string | null;
  cancellation_policy: string | null;
  group_joining_conditions: string | null;
  is_instant_confirmation: boolean;
  is_free_cancellation: boolean;
  is_bestseller: boolean;
  is_likely_to_sell_out: boolean;
  popularity: number;
  rating: number | null;
  reviews_count: number;
  published_at: string;
  created_at: string;
}

export type TourWritePayload = Partial<
  Omit<BackofficeTour, "id" | "status" | "city_name" | "rating" | "reviews_count" | "published_at" | "created_at">
>;

export interface BackofficeTourDate {
  id: string;
  tour_id: string;
  starts_on: string;
  seats_total: number;
  seats_left: number;
  price_override_kopeks: number | null;
  bookings_count: number;
}

export async function fetchBackofficeTours(): Promise<BackofficeTour[]> {
  const res = await authFetch("/admin/tours");
  const body = await ensureOk<{ items: BackofficeTour[] }>(res, "Не удалось загрузить туры");
  return body.items;
}

export async function createTour(payload: TourWritePayload): Promise<BackofficeTour> {
  const res = await authFetch("/admin/tours", { method: "POST", body: JSON.stringify(payload) });
  return ensureOk<BackofficeTour>(res, "Не удалось создать тур");
}

export async function updateTour(id: string, payload: TourWritePayload): Promise<BackofficeTour> {
  const res = await authFetch(`/admin/tours/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  return ensureOk<BackofficeTour>(res, "Не удалось сохранить тур");
}

export async function setTourStatus(id: string, status: "draft" | "published"): Promise<BackofficeTour> {
  const res = await authFetch(`/admin/tours/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  return ensureOk<BackofficeTour>(res, "Не удалось изменить статус");
}

export async function fetchTourDates(tourId: string): Promise<BackofficeTourDate[]> {
  const res = await authFetch(`/admin/tours/${tourId}/dates`);
  const body = await ensureOk<{ items: BackofficeTourDate[] }>(res, "Не удалось загрузить даты");
  return body.items;
}

export async function addTourDate(
  tourId: string,
  payload: { starts_on: string; seats_total: number; price_override_kopeks?: number | null },
): Promise<BackofficeTourDate> {
  const res = await authFetch(`/admin/tours/${tourId}/dates`, { method: "POST", body: JSON.stringify(payload) });
  return ensureOk<BackofficeTourDate>(res, "Не удалось добавить дату");
}

export async function updateTourDate(
  tourId: string,
  dateId: string,
  payload: { seats_total?: number; price_override_kopeks?: number | null },
): Promise<BackofficeTourDate> {
  const res = await authFetch(`/admin/tours/${tourId}/dates/${dateId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return ensureOk<BackofficeTourDate>(res, "Не удалось изменить дату");
}

export async function deleteTourDate(tourId: string, dateId: string): Promise<void> {
  await ensureOk(
    await authFetch(`/admin/tours/${tourId}/dates/${dateId}`, { method: "DELETE" }),
    "Не удалось удалить дату",
  );
}

// ─── Партнёры ────────────────────────────────────────────────

export interface PartnerProfile {
  id: string;
  user_id: string;
  org_name: string;
  description: string;
  phone: string;
  inn: string;
  verified: boolean;
  created_at: string;
  user_email: string;
  user_name: string;
}

export async function fetchPartners(): Promise<PartnerProfile[]> {
  const res = await authFetch("/admin/partners");
  const body = await ensureOk<{ items: PartnerProfile[] }>(res, "Не удалось загрузить партнёров");
  return body.items;
}

export async function createPartner(payload: {
  user_id: string;
  org_name: string;
  description?: string;
  phone?: string;
  inn?: string;
}): Promise<PartnerProfile> {
  const res = await authFetch("/admin/partners", { method: "POST", body: JSON.stringify(payload) });
  return ensureOk<PartnerProfile>(res, "Не удалось назначить партнёра");
}

export async function updatePartner(
  id: string,
  payload: { org_name?: string; description?: string; phone?: string; inn?: string; verified?: boolean },
): Promise<PartnerProfile> {
  const res = await authFetch(`/admin/partners/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  return ensureOk<PartnerProfile>(res, "Не удалось сохранить партнёра");
}

export async function fetchMyPartnerProfile(): Promise<PartnerProfile> {
  const res = await authFetch("/admin/partners/me");
  return ensureOk<PartnerProfile>(res, "Не удалось загрузить профиль организации");
}

export async function updateMyPartnerProfile(payload: {
  org_name?: string;
  description?: string;
  phone?: string;
  inn?: string;
}): Promise<PartnerProfile> {
  const res = await authFetch("/admin/partners/me", { method: "PATCH", body: JSON.stringify(payload) });
  return ensureOk<PartnerProfile>(res, "Не удалось сохранить профиль");
}
