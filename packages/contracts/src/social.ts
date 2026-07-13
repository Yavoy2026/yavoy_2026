import { z } from "zod";

// ─── Избранное ───────────────────────────────────────────────

export const FavoriteEntitySchema = z.enum(["tour", "city"]);
export type FavoriteEntity = z.infer<typeof FavoriteEntitySchema>;

export const FavoritesResponseSchema = z.object({
  tours: z.array(z.string()),
  cities: z.array(z.string()),
});
export type FavoritesResponse = z.infer<typeof FavoritesResponseSchema>;

// ─── Отзывы ──────────────────────────────────────────────────

export const ReviewStatusSchema = z.enum(["pending", "published", "rejected"]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

/** Публичный отзыв (в деталях тура) */
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  tour_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string(),
  author_name: z.string(),
  created_at: z.string(),
});
export type Review = z.infer<typeof ReviewSchema>;

/** Мой отзыв (со статусом модерации) */
export const MyReviewSchema = ReviewSchema.extend({
  status: ReviewStatusSchema,
  booking_id: z.string().uuid(),
  tour_title: z.string(),
  tour_image_url: z.string(),
  rejected_reason: z.string().nullable(),
});
export type MyReview = z.infer<typeof MyReviewSchema>;

export const CreateReviewPayloadSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(3).max(2000),
});
export type CreateReviewPayload = z.infer<typeof CreateReviewPayloadSchema>;

export const ReviewListResponseSchema = z.object({ items: z.array(ReviewSchema) });
export const MyReviewListResponseSchema = z.object({ items: z.array(MyReviewSchema) });
