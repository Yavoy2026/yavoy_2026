import type { BookedTour, BookingApiStatus } from "@/types";
import { ApiError, authFetch, type UserProfile } from "@/services/api";
import type { MyReview } from "@/services/social";

/** fallbackCode — ключ каталога `api.*`; UI переводит ошибку по коду, а не по тексту */
async function ensureOk<T>(res: Response, fallbackCode: string): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(res.status, body?.error?.code ?? fallbackCode, body?.error?.message ?? fallbackCode);
  }
  return res.json() as Promise<T>;
}

// ─── Заявки на бронирование ──────────────────────────────────

interface ApiBooking {
  id: string;
  status: BookingApiStatus;
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
  status: BookingApiStatus;
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

/** Очередь панели; несколько статусов сразу — список через запятую (YAV-28) */
export async function fetchAdminBookings(...statuses: BookingApiStatus[]): Promise<AdminBooking[]> {
  const res = await authFetch(`/admin/bookings?status=${statuses.join(",")}`);
  const body = await ensureOk<{ items: ApiBooking[] }>(res, "requestsLoadFailed");
  return body.items.map(adaptAdminBooking);
}

export async function confirmBooking(id: string): Promise<void> {
  await ensureOk(await authFetch(`/bookings/${id}/confirm`, { method: "POST" }), "bookingConfirmFailed");
}

/** Отказ организатора: места сразу возвращаются в продажу */
export async function rejectBooking(id: string): Promise<void> {
  await ensureOk(await authFetch(`/bookings/${id}/reject`, { method: "POST" }), "bookingRejectFailed");
}

export async function completeBooking(id: string): Promise<void> {
  await ensureOk(await authFetch(`/bookings/${id}/complete`, { method: "POST" }), "bookingCompleteFailed");
}

export async function cancelBookingAdmin(id: string): Promise<void> {
  await ensureOk(await authFetch(`/bookings/${id}/cancel`, { method: "POST" }), "bookingCancelActionFailed");
}

// ─── Модерация отзывов ───────────────────────────────────────

export async function fetchPendingReviews(): Promise<MyReview[]> {
  const res = await authFetch("/admin/reviews");
  const body = await ensureOk<{ items: unknown[] }>(res, "reviewsLoadFailed");
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
  await ensureOk(await authFetch(`/admin/reviews/${id}/approve`, { method: "POST" }), "reviewApproveFailed");
}

export async function rejectReview(id: string): Promise<void> {
  await ensureOk(
    await authFetch(`/admin/reviews/${id}/reject`, { method: "POST", body: JSON.stringify({}) }),
    "reviewRejectFailed",
  );
}

// ─── Управление турами (бэкофис) ─────────────────────────────

export type AdminTourStatus = "draft" | "pending" | "published" | "rejected" | "archived";

/** Модель тура бэкофиса — snake_case как в API, без адаптации (редактор работает с полями напрямую) */
export interface AdminTour {
  id: string;
  status: AdminTourStatus;
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
  Omit<AdminTour, "id" | "status" | "city_name" | "rating" | "reviews_count" | "published_at" | "created_at">
>;

export interface AdminTourDate {
  id: string;
  tour_id: string;
  starts_on: string;
  seats_total: number;
  seats_left: number;
  price_override_kopeks: number | null;
  bookings_count: number;
}

export async function fetchAdminTours(q?: { status?: AdminTourStatus; q?: string }): Promise<AdminTour[]> {
  const params = new URLSearchParams();
  if (q?.status) params.set("status", q.status);
  if (q?.q) params.set("q", q.q);
  const qs = params.toString();
  const res = await authFetch(`/admin/tours${qs ? `?${qs}` : ""}`);
  const body = await ensureOk<{ items: AdminTour[] }>(res, "toursLoadFailed");
  return body.items;
}

export async function createTour(payload: TourWritePayload): Promise<AdminTour> {
  const res = await authFetch("/admin/tours", { method: "POST", body: JSON.stringify(payload) });
  return ensureOk<AdminTour>(res, "tourCreateFailed");
}

export async function updateTour(id: string, payload: TourWritePayload): Promise<AdminTour> {
  const res = await authFetch(`/admin/tours/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  return ensureOk<AdminTour>(res, "tourSaveFailed");
}

export async function setTourStatus(id: string, status: "draft" | "published"): Promise<AdminTour> {
  const res = await authFetch(`/admin/tours/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  return ensureOk<AdminTour>(res, "tourStatusFailed");
}

export async function fetchTourDates(tourId: string): Promise<AdminTourDate[]> {
  const res = await authFetch(`/admin/tours/${tourId}/dates`);
  const body = await ensureOk<{ items: AdminTourDate[] }>(res, "datesLoadFailed");
  return body.items;
}

export async function addTourDate(
  tourId: string,
  payload: { starts_on: string; seats_total: number; price_override_kopeks?: number | null },
): Promise<AdminTourDate> {
  const res = await authFetch(`/admin/tours/${tourId}/dates`, { method: "POST", body: JSON.stringify(payload) });
  return ensureOk<AdminTourDate>(res, "dateAddFailed");
}

export async function updateTourDate(
  tourId: string,
  dateId: string,
  payload: { seats_total?: number; price_override_kopeks?: number | null },
): Promise<AdminTourDate> {
  const res = await authFetch(`/admin/tours/${tourId}/dates/${dateId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return ensureOk<AdminTourDate>(res, "dateUpdateFailed");
}

export async function deleteTourDate(tourId: string, dateId: string): Promise<void> {
  await ensureOk(await authFetch(`/admin/tours/${tourId}/dates/${dateId}`, { method: "DELETE" }), "dateDeleteFailed");
}

// ─── Партнёры (бэкофис) ──────────────────────────────────────

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
  const body = await ensureOk<{ items: PartnerProfile[] }>(res, "partnersLoadFailed");
  return body.items;
}

/** Назначение партнёра существующему пользователю (admin-only) */
export async function createPartner(payload: {
  user_id: string;
  org_name: string;
  description?: string;
  phone?: string;
  inn?: string;
}): Promise<PartnerProfile> {
  const res = await authFetch("/admin/partners", { method: "POST", body: JSON.stringify(payload) });
  return ensureOk<PartnerProfile>(res, "partnerAssignFailed");
}

export async function updatePartner(
  id: string,
  payload: { org_name?: string; description?: string; phone?: string; inn?: string; verified?: boolean },
): Promise<PartnerProfile> {
  const res = await authFetch(`/admin/partners/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  return ensureOk<PartnerProfile>(res, "partnerSaveFailed");
}

export async function fetchMyPartnerProfile(): Promise<PartnerProfile> {
  const res = await authFetch("/admin/partners/me");
  return ensureOk<PartnerProfile>(res, "orgProfileLoadFailed");
}

export async function updateMyPartnerProfile(payload: {
  org_name?: string;
  description?: string;
  phone?: string;
  inn?: string;
}): Promise<PartnerProfile> {
  const res = await authFetch("/admin/partners/me", { method: "PATCH", body: JSON.stringify(payload) });
  return ensureOk<PartnerProfile>(res, "orgProfileSaveFailed");
}

// ─── Модерация правок туров (YAV-29) ─────────────────────────

export interface TourRevision {
  id: string;
  tour_id: string;
  tour_title: string;
  tour_status: string;
  organizer_name: string;
  status: "draft" | "pending" | "approved" | "rejected";
  comment: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export async function fetchRevisions(status = "pending"): Promise<TourRevision[]> {
  const res = await authFetch(`/admin/revisions?status=${status}`);
  const body = await ensureOk<{ items: TourRevision[] }>(res, "revisionsLoadFailed");
  return body.items;
}

export async function approveRevision(id: string): Promise<void> {
  await ensureOk(await authFetch(`/admin/revisions/${id}/approve`, { method: "POST" }), "revisionApproveFailed");
}

export async function rejectRevision(id: string, comment: string): Promise<void> {
  await ensureOk(
    await authFetch(`/admin/revisions/${id}/reject`, { method: "POST", body: JSON.stringify({ comment }) }),
    "revisionRejectFailed",
  );
}

/** Партнёр отправляет тур или накопленную правку на проверку */
export async function submitTourForModeration(tourId: string): Promise<void> {
  await ensureOk(await authFetch(`/admin/tours/${tourId}/submit`, { method: "POST" }), "tourSubmitFailed");
}

// ─── Заявки на партнёрство (YAV-24) ──────────────────────────

export interface AdminApplication {
  id: string;
  status: "pending" | "approved" | "rejected";
  user_email: string;
  user_name: string;
  org_name: string;
  inn: string;
  phone: string;
  description: string;
  offer_version: number;
  offer_accepted_at: string;
  comment: string | null;
  created_at: string;
}

export async function fetchApplications(status = "pending"): Promise<AdminApplication[]> {
  const res = await authFetch(`/admin/partner-applications?status=${status}`);
  const body = await ensureOk<{ items: AdminApplication[] }>(res, "applicationsLoadFailed");
  return body.items;
}

export async function approveApplication(id: string): Promise<void> {
  await ensureOk(
    await authFetch(`/admin/partner-applications/${id}/approve`, { method: "POST" }),
    "applicationApproveFailed",
  );
}

export async function rejectApplication(id: string, comment: string): Promise<void> {
  await ensureOk(
    await authFetch(`/admin/partner-applications/${id}/reject`, { method: "POST", body: JSON.stringify({ comment }) }),
    "applicationRejectFailed",
  );
}
