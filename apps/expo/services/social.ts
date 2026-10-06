import { ApiError, authFetch } from "@/services/api";

// ─── Избранное ───────────────────────────────────────────────

export interface FavoritesResponse {
  tours: string[];
  cities: string[];
}

export async function fetchFavorites(): Promise<FavoritesResponse> {
  const res = await authFetch("/me/favorites");
  if (!res.ok) throw new ApiError(res.status, "favoritesLoadFailed", "favoritesLoadFailed");
  return res.json() as Promise<FavoritesResponse>;
}

export type FavoriteKind = "tours" | "cities";

export async function addFavorite(kind: FavoriteKind, id: string): Promise<void> {
  await authFetch(`/me/favorites/${kind}/${encodeURIComponent(id)}`, { method: "PUT" });
}

export async function removeFavorite(kind: FavoriteKind, id: string): Promise<void> {
  await authFetch(`/me/favorites/${kind}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ─── Отзывы ──────────────────────────────────────────────────

export interface MyReview {
  id: string;
  bookingId: string;
  tourTitle: string;
  tourImage: string;
  rating: number;
  text: string;
  date: string;
  status: "pending" | "published" | "rejected";
  rejectedReason: string | null;
}

interface ApiMyReview {
  id: string;
  booking_id: string;
  tour_title: string;
  tour_image_url: string;
  rating: number;
  text: string;
  created_at: string;
  status: "pending" | "published" | "rejected";
  rejected_reason: string | null;
}

function adaptMyReview(r: ApiMyReview): MyReview {
  return {
    id: r.id,
    bookingId: r.booking_id,
    tourTitle: r.tour_title,
    tourImage: r.tour_image_url,
    rating: r.rating,
    text: r.text,
    date: r.created_at.slice(0, 10),
    status: r.status,
    rejectedReason: r.rejected_reason,
  };
}

export async function fetchMyReviews(): Promise<MyReview[]> {
  const res = await authFetch("/me/reviews");
  if (!res.ok) throw new ApiError(res.status, "reviewsLoadFailed", "reviewsLoadFailed");
  const body = (await res.json()) as { items: ApiMyReview[] };
  return body.items.map(adaptMyReview);
}

export async function createReview(
  bookingId: string,
  rating: number,
  text: string,
): Promise<MyReview> {
  const res = await authFetch(`/bookings/${bookingId}/review`, {
    method: "POST",
    body: JSON.stringify({ rating, text }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    throw new ApiError(res.status, body?.error?.code ?? "unknown", body?.error?.message ?? "reviewSendFailed");
  }
  return adaptMyReview((await res.json()) as ApiMyReview);
}
