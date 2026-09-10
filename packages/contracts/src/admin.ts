import { z } from "zod";
import {
  CategoryTypeSchema,
  DurationTypeSchema,
  InterestTypeSchema,
  OrganizerSchema,
  SeasonTypeSchema,
  TransportTypeSchema,
} from "./catalog";

// ─── Бэкофис: управление турами ──────────────────────────────

export const TourStatusSchema = z.enum(["draft", "pending", "published", "rejected", "archived"]);
export type TourStatus = z.infer<typeof TourStatusSchema>;

/** Полная модель тура для бэкофиса: все поля + статус; rating/reviews_count — read-only денормализация отзывов */
export const AdminTourSchema = z.object({
  id: z.string().uuid(),
  status: TourStatusSchema,
  partner_id: z.string().uuid().nullable(),
  city_id: z.string(),
  city_name: z.string(),
  title: z.string(),
  description: z.string(),
  image_url: z.string(),
  gallery: z.array(z.string()),
  price_kopeks: z.number().int(),
  original_price_kopeks: z.number().int().nullable(),
  currency: z.string(),
  duration_type: DurationTypeSchema,
  duration_text: z.string(),
  transport: TransportTypeSchema,
  interest: InterestTypeSchema,
  category: CategoryTypeSchema.nullable(),
  season: SeasonTypeSchema.nullable(),
  organizer: OrganizerSchema,
  highlights: z.array(z.string()),
  includes: z.array(z.string()),
  excludes: z.array(z.string()),
  what_to_bring: z.array(z.string()),
  languages: z.array(z.string()),
  schedule: z.string().nullable(),
  group_size: z.string().nullable(),
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
  is_bestseller: z.boolean(),
  is_likely_to_sell_out: z.boolean(),
  popularity: z.number().int(),
  rating: z.number().nullable(),
  reviews_count: z.number().int(),
  published_at: z.string(),
  created_at: z.string(),
});
export type AdminTour = z.infer<typeof AdminTourSchema>;

export const AdminTourListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  status: TourStatusSchema.optional(),
  city: z.string().optional(),
});
export type AdminTourListQuery = z.infer<typeof AdminTourListQuerySchema>;

export const AdminTourListResponseSchema = z.object({ items: z.array(AdminTourSchema) });
export type AdminTourListResponse = z.infer<typeof AdminTourListResponseSchema>;

/**
 * Все редактируемые поля тура; статус меняется отдельным эндпоинтом, создание — всегда draft.
 * partner_id (только staff): владелец тура — organizer заполнится из профиля партнёра;
 * без partner_id organizer обязателен. Для партнёра partner_id всегда принудительно свой.
 */
export const TourWritePayloadSchema = z.object({
  partner_id: z.string().uuid().nullable().optional(),
  city_id: z.string().min(1),
  title: z.string().min(1).max(300),
  description: z.string().default(""),
  image_url: z.string().min(1),
  gallery: z.array(z.string()).default([]),
  price_kopeks: z.number().int().min(0),
  original_price_kopeks: z.number().int().min(0).nullable().optional(),
  // валюта не редактируется: она одна на инсталляцию и берётся из CURRENCY (YAV-21)
  duration_type: DurationTypeSchema,
  duration_text: z.string().default(""),
  transport: TransportTypeSchema,
  interest: InterestTypeSchema,
  category: CategoryTypeSchema.nullable().optional(),
  season: SeasonTypeSchema.nullable().optional(),
  organizer: OrganizerSchema.optional(),
  highlights: z.array(z.string()).default([]),
  includes: z.array(z.string()).default([]),
  excludes: z.array(z.string()).default([]),
  what_to_bring: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  schedule: z.string().nullable().optional(),
  group_size: z.string().nullable().optional(),
  meeting_point: z.string().nullable().optional(),
  meeting_lat: z.number().nullable().optional(),
  meeting_lng: z.number().nullable().optional(),
  start_time: z.string().nullable().optional(),
  booking_conditions: z.string().nullable().optional(),
  prepayment: z.string().nullable().optional(),
  cancellation_policy: z.string().nullable().optional(),
  group_joining_conditions: z.string().nullable().optional(),
  is_instant_confirmation: z.boolean().default(false),
  is_free_cancellation: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  is_likely_to_sell_out: z.boolean().default(false),
  popularity: z.number().int().default(0),
});
export type TourWritePayload = z.infer<typeof TourWritePayloadSchema>;

export const UpdateTourPayloadSchema = TourWritePayloadSchema.partial();
export type UpdateTourPayload = z.infer<typeof UpdateTourPayloadSchema>;

/**
 * Правка тура на модерации (YAV-28). Опубликованный тур продолжает работать,
 * пока правка не одобрена, поэтому её содержимое живёт отдельно от тура.
 */
export const RevisionStatusSchema = z.enum(["draft", "pending", "approved", "rejected"]);
export type RevisionStatus = z.infer<typeof RevisionStatusSchema>;

export const TourRevisionSchema = z.object({
  id: z.string().uuid(),
  tour_id: z.string().uuid(),
  tour_title: z.string(),
  /** Статус самого тура: показывает, правка это нового тура или уже опубликованного */
  tour_status: TourStatusSchema,
  organizer_name: z.string(),
  status: RevisionStatusSchema,
  /** Причина отказа — партнёр видит её и правит */
  comment: z.string().nullable(),
  created_at: z.string(),
  reviewed_at: z.string().nullable(),
});
export type TourRevision = z.infer<typeof TourRevisionSchema>;

/** Ревизия вместе с содержимым: менеджер смотрит, что именно предлагают опубликовать */
export const TourRevisionDetailSchema = TourRevisionSchema.extend({
  payload: TourWritePayloadSchema,
});
export type TourRevisionDetail = z.infer<typeof TourRevisionDetailSchema>;

export const RejectRevisionPayloadSchema = z.object({
  comment: z.string().min(1).max(2000),
});
export type RejectRevisionPayload = z.infer<typeof RejectRevisionPayloadSchema>;

export const TourRevisionListResponseSchema = z.object({ items: z.array(TourRevisionSchema) });
export type TourRevisionListResponse = z.infer<typeof TourRevisionListResponseSchema>;

export const AdminSetTourStatusPayloadSchema = z.object({
  status: z.enum(["draft", "published"]),
});
export type AdminSetTourStatusPayload = z.infer<typeof AdminSetTourStatusPayloadSchema>;

// ─── Бэкофис: даты выездов ───────────────────────────────────

export const AdminTourDateSchema = z.object({
  id: z.string().uuid(),
  tour_id: z.string().uuid(),
  starts_on: z.string(),
  seats_total: z.number().int(),
  seats_left: z.number().int(),
  price_override_kopeks: z.number().int().nullable(),
  /** Сколько броней ссылается на дату (включая отменённые) — такие даты нельзя удалять */
  bookings_count: z.number().int(),
});
export type AdminTourDate = z.infer<typeof AdminTourDateSchema>;

export const AdminTourDateListResponseSchema = z.object({ items: z.array(AdminTourDateSchema) });
export type AdminTourDateListResponse = z.infer<typeof AdminTourDateListResponseSchema>;

export const CreateTourDatePayloadSchema = z.object({
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seats_total: z.number().int().min(1).max(1000),
  price_override_kopeks: z.number().int().min(0).nullable().optional(),
});
export type CreateTourDatePayload = z.infer<typeof CreateTourDatePayloadSchema>;

export const UpdateTourDatePayloadSchema = z.object({
  seats_total: z.number().int().min(1).max(1000).optional(),
  price_override_kopeks: z.number().int().min(0).nullable().optional(),
});
export type UpdateTourDatePayload = z.infer<typeof UpdateTourDatePayloadSchema>;

// ─── Бэкофис: партнёры ───────────────────────────────────────

export const PartnerProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  org_name: z.string(),
  description: z.string(),
  phone: z.string(),
  inn: z.string(),
  verified: z.boolean(),
  created_at: z.string(),
  user_email: z.string(),
  user_name: z.string(),
});
export type PartnerProfile = z.infer<typeof PartnerProfileSchema>;

export const PartnerListResponseSchema = z.object({ items: z.array(PartnerProfileSchema) });
export type PartnerListResponse = z.infer<typeof PartnerListResponseSchema>;

/** Назначение партнёра: существующему пользователю (admin-only) */
/**
 * Заявка на партнёрство (YAV-29): Pending Review → Approved | Rejected.
 * Подаёт обычный пользователь, рассматривает менеджер или админ; одобрение
 * создаёт профиль организации и выдаёт роль partner одной транзакцией.
 */
export const ApplicationStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export const SubmitApplicationPayloadSchema = z.object({
  org_name: z.string().min(2).max(200),
  /** СТИР в Узбекистане, ИНН в РФ; проверяется менеджером глазами */
  inn: z.string().min(4).max(20),
  phone: z.string().max(50).default(""),
  description: z.string().max(2000).default(""),
  /** Номер принятой редакции партнёрской оферты; без него акцепт недоказуем */
  offer_version: z.number().int().min(1),
});
export type SubmitApplicationPayload = z.infer<typeof SubmitApplicationPayloadSchema>;

export const PartnerApplicationSchema = z.object({
  id: z.string().uuid(),
  status: ApplicationStatusSchema,
  user_id: z.string().uuid(),
  user_email: z.string(),
  user_name: z.string(),
  org_name: z.string(),
  inn: z.string(),
  phone: z.string(),
  description: z.string(),
  offer_version: z.number().int(),
  offer_accepted_at: z.string(),
  comment: z.string().nullable(),
  created_at: z.string(),
  reviewed_at: z.string().nullable(),
});
export type PartnerApplication = z.infer<typeof PartnerApplicationSchema>;

export const PartnerApplicationListResponseSchema = z.object({
  items: z.array(PartnerApplicationSchema),
});
export type PartnerApplicationListResponse = z.infer<typeof PartnerApplicationListResponseSchema>;

export const RejectApplicationPayloadSchema = z.object({
  comment: z.string().min(1).max(2000),
});
export type RejectApplicationPayload = z.infer<typeof RejectApplicationPayloadSchema>;

export const CreatePartnerPayloadSchema = z.object({
  user_id: z.string().uuid(),
  org_name: z.string().min(1).max(300),
  description: z.string().default(""),
  phone: z.string().default(""),
  inn: z.string().default(""),
});
export type CreatePartnerPayload = z.infer<typeof CreatePartnerPayloadSchema>;

/** Правка staff'ом: поля организации + verified */
export const UpdatePartnerPayloadSchema = z.object({
  org_name: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  inn: z.string().optional(),
  verified: z.boolean().optional(),
});
export type UpdatePartnerPayload = z.infer<typeof UpdatePartnerPayloadSchema>;

/** Самоправка партнёром — без verified */
export const UpdateMyPartnerProfilePayloadSchema = UpdatePartnerPayloadSchema.omit({ verified: true });
export type UpdateMyPartnerProfilePayload = z.infer<typeof UpdateMyPartnerProfilePayloadSchema>;
