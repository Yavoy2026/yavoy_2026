import { z } from "zod";
import { TourDateSchema } from "./bookings";
import { ReviewSchema } from "./social";
import { CursorQuerySchema, paginated } from "./common";

export const DurationTypeSchema = z.enum(["one_day", "multi_day"]);
export const TransportTypeSchema = z.enum(["auto", "water", "sea", "bike", "air"]);
export const InterestTypeSchema = z.enum(["city", "educational", "nature", "pilgrimage"]);
export const CategoryTypeSchema = z.enum([
  "agro", "photo", "ethno", "parents", "glamping",
  "animals", "mystic", "wild_animals", "wine", "gastro",
]);
export const SeasonTypeSchema = z.enum(["winter", "spring", "summer", "autumn", "all_year"]);
export const TourSortSchema = z.enum(["popularity", "newest", "price_asc", "price_desc"]);

export type DurationType = z.infer<typeof DurationTypeSchema>;
export type TransportType = z.infer<typeof TransportTypeSchema>;
export type InterestType = z.infer<typeof InterestTypeSchema>;
export type CategoryType = z.infer<typeof CategoryTypeSchema>;
export type SeasonType = z.infer<typeof SeasonTypeSchema>;
export type TourSort = z.infer<typeof TourSortSchema>;

export const CitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  emoji: z.string(),
  image_url: z.string().url(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  tours_count: z.number().int(),
});
export type City = z.infer<typeof CitySchema>;

/** Отображаемые данные организатора; в M6 заменяется ссылкой на partner_profile */
export const OrganizerSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number(),
  review_count: z.number().int(),
  avatar: z.string().nullable(),
  verified: z.boolean(),
  tours_count: z.number().int(),
});
export type Organizer = z.infer<typeof OrganizerSchema>;

/** Усечённая модель для списков */
export const TourCardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  image_url: z.string(),
  price_kopeks: z.number().int(),
  original_price_kopeks: z.number().int().nullable(),
  currency: z.string(),
  duration_type: DurationTypeSchema,
  duration_text: z.string(),
  transport: TransportTypeSchema,
  interest: InterestTypeSchema,
  category: CategoryTypeSchema.nullable(),
  season: SeasonTypeSchema.nullable(),
  city_id: z.string(),
  city_name: z.string(),
  organizer: OrganizerSchema,
  is_bestseller: z.boolean(),
  is_likely_to_sell_out: z.boolean(),
  popularity: z.number().int(),
  /** Ближайшая будущая дата с местами; null — дат пока нет */
  next_available_date: z.string().nullable(),
  /** Рейтинг тура по опубликованным отзывам; null — отзывов ещё нет */
  rating: z.number().nullable(),
  reviews_count: z.number().int(),
});
export type TourCard = z.infer<typeof TourCardSchema>;

export const TourDetailSchema = TourCardSchema.extend({
  description: z.string(),
  gallery: z.array(z.string()),
  highlights: z.array(z.string()),
  includes: z.array(z.string()),
  excludes: z.array(z.string()),
  what_to_bring: z.array(z.string()),
  schedule: z.string().nullable(),
  group_size: z.string().nullable(),
  languages: z.array(z.string()),
  meeting_point: z.string().nullable(),
  meeting_lat: z.number().nullable(),
  meeting_lng: z.number().nullable(),
  start_time: z.string().nullable(),
  booking_conditions: z.string().nullable(),
  prepayment: z.string().nullable(),
  cancellation_policy: z.string().nullable(),
  group_joining_conditions: z.string().nullable(),
  is_instant_confirmation: z.boolean(),
  is_free_cancellation: z.boolean(),
  /** Опубликованные отзывы (до 20 последних) */
  reviews: z.array(ReviewSchema),
  /** Будущие даты с местами (для выбора при бронировании) */
  dates: z.array(TourDateSchema),
});
export type TourDetail = z.infer<typeof TourDetailSchema>;

export const TourListQuerySchema = CursorQuerySchema.extend({
  city: z.string().optional(),
  duration: DurationTypeSchema.optional(),
  transport: TransportTypeSchema.optional(),
  interest: z
    .union([InterestTypeSchema, z.array(InterestTypeSchema)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  category: z
    .union([CategoryTypeSchema, z.array(CategoryTypeSchema)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  season: SeasonTypeSchema.optional(),
  price_min: z.coerce.number().int().optional(),
  price_max: z.coerce.number().int().optional(),
  q: z.string().max(200).optional(),
  sort: TourSortSchema.default("popularity"),
});
export type TourListQuery = z.infer<typeof TourListQuerySchema>;

export const TourListResponseSchema = paginated(TourCardSchema);
export type TourListResponse = z.infer<typeof TourListResponseSchema>;

export const CityListResponseSchema = z.object({ items: z.array(CitySchema) });
export type CityListResponse = z.infer<typeof CityListResponseSchema>;
