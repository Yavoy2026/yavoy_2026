import { and, avg, count, desc, eq } from "drizzle-orm";
import type { CreateReviewPayload, MyReview, Review } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { bookings, reviews, tours, users } from "../../db/schema.ts";
import { badRequest, conflict, forbidden, notFound } from "../../errors.ts";

type ReviewRow = typeof reviews.$inferSelect;

function toReview(r: ReviewRow, authorName: string): Review {
  return {
    id: r.id,
    tour_id: r.tourId,
    rating: r.rating,
    text: r.text,
    author_name: authorName,
    created_at: r.createdAt.toISOString(),
  };
}

export async function createReview(
  db: Db,
  userId: string,
  bookingId: string,
  payload: CreateReviewPayload,
): Promise<MyReview> {
  const bookingRows = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const booking = bookingRows[0];
  if (!booking) throw notFound("booking_not_found", "Бронь не найдена");
  if (booking.userId !== userId) throw forbidden("not_your_booking", "Это не ваша бронь");
  if (booking.status !== "completed") {
    throw badRequest("booking_not_completed", "Отзыв можно оставить после завершения поездки");
  }

  const existing = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
  if (existing.length) throw conflict("already_reviewed", "Отзыв на эту поездку уже оставлен");

  const inserted = await db
    .insert(reviews)
    .values({
      userId,
      tourId: booking.tourId,
      bookingId,
      rating: payload.rating,
      text: payload.text.trim(),
    })
    .returning();

  return (await getMyReviewById(db, inserted[0]!.id))!;
}

export async function listTourReviews(db: Db, tourId: string): Promise<Review[]> {
  const rows = await db
    .select({ review: reviews, authorName: users.firstName })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(and(eq(reviews.tourId, tourId), eq(reviews.status, "published")))
    .orderBy(desc(reviews.createdAt))
    .limit(50);
  return rows.map((r) => toReview(r.review, r.authorName));
}

/** Опубликованные отзывы для всех туров каталога (bundle), до 20 на тур */
export async function listPublishedReviewsByTour(db: Db): Promise<Map<string, Review[]>> {
  const rows = await db
    .select({ review: reviews, authorName: users.firstName })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.status, "published"))
    .orderBy(desc(reviews.createdAt));

  const byTour = new Map<string, Review[]>();
  for (const r of rows) {
    const list = byTour.get(r.review.tourId) ?? [];
    if (list.length < 20) list.push(toReview(r.review, r.authorName));
    byTour.set(r.review.tourId, list);
  }
  return byTour;
}

async function getMyReviewById(db: Db, id: string): Promise<MyReview | null> {
  const rows = await db
    .select({ review: reviews, authorName: users.firstName, tourTitle: tours.title, tourImageUrl: tours.imageUrl })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(tours, eq(reviews.tourId, tours.id))
    .where(eq(reviews.id, id))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    ...toReview(r.review, r.authorName),
    status: r.review.status,
    booking_id: r.review.bookingId,
    tour_title: r.tourTitle,
    tour_image_url: r.tourImageUrl,
    rejected_reason: r.review.rejectedReason,
  };
}

export async function listMyReviews(db: Db, userId: string): Promise<MyReview[]> {
  const rows = await db
    .select({ review: reviews, authorName: users.firstName, tourTitle: tours.title, tourImageUrl: tours.imageUrl })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(tours, eq(reviews.tourId, tours.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));
  return rows.map((r) => ({
    ...toReview(r.review, r.authorName),
    status: r.review.status,
    booking_id: r.review.bookingId,
    tour_title: r.tourTitle,
    tour_image_url: r.tourImageUrl,
    rejected_reason: r.review.rejectedReason,
  }));
}

export async function listPendingReviews(db: Db): Promise<MyReview[]> {
  const rows = await db
    .select({ review: reviews, authorName: users.firstName, tourTitle: tours.title, tourImageUrl: tours.imageUrl })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(tours, eq(reviews.tourId, tours.id))
    .where(eq(reviews.status, "pending"))
    .orderBy(desc(reviews.createdAt));
  return rows.map((r) => ({
    ...toReview(r.review, r.authorName),
    status: r.review.status,
    booking_id: r.review.bookingId,
    tour_title: r.tourTitle,
    tour_image_url: r.tourImageUrl,
    rejected_reason: r.review.rejectedReason,
  }));
}

/** Пересчёт денормализованного рейтинга тура по опубликованным отзывам */
async function recalcTourRating(db: Db, tourId: string): Promise<void> {
  const agg = await db
    .select({ avgRating: avg(reviews.rating), total: count() })
    .from(reviews)
    .where(and(eq(reviews.tourId, tourId), eq(reviews.status, "published")));
  const { avgRating, total } = agg[0]!;
  await db
    .update(tours)
    .set({
      rating: avgRating != null ? Math.round(Number(avgRating) * 10) / 10 : null,
      reviewsCount: total,
    })
    .where(eq(tours.id, tourId));
}

export async function moderateReview(
  db: Db,
  reviewId: string,
  decision: "approve" | "reject",
  reason?: string,
): Promise<MyReview> {
  const rows = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  const review = rows[0];
  if (!review) throw notFound("review_not_found", "Отзыв не найден");
  if (review.status !== "pending") {
    throw conflict("review_already_moderated", "Отзыв уже прошёл модерацию");
  }

  await db
    .update(reviews)
    .set(
      decision === "approve"
        ? { status: "published", publishedAt: new Date() }
        : { status: "rejected", rejectedReason: reason ?? null },
    )
    .where(eq(reviews.id, reviewId));

  if (decision === "approve") await recalcTourRating(db, review.tourId);

  return (await getMyReviewById(db, reviewId))!;
}
