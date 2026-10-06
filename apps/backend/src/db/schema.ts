import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Деньги — только целые минорные единицы, и только bigint: в int4 помещается
 * 21,5 млн сум, а групповая бронь узбекского тура это пробивает (YAV-21).
 * mode "number" безопасен — 2^53 тийинов это 90 трлн сум.
 */
const money = (name: string) => bigint(name, { mode: "number" });

// ─── Enums ───────────────────────────────────────────────────

export const durationTypeEnum = pgEnum("duration_type", ["one_day", "multi_day"]);
export const transportTypeEnum = pgEnum("transport_type", ["auto", "water", "sea", "bike", "air"]);
export const interestTypeEnum = pgEnum("interest_type", ["city", "educational", "nature", "pilgrimage"]);
export const categoryTypeEnum = pgEnum("category_type", [
  "agro", "photo", "ethno", "parents", "glamping",
  "animals", "mystic", "wild_animals", "wine", "gastro",
]);
export const seasonTypeEnum = pgEnum("season_type", ["winter", "spring", "summer", "autumn", "all_year"]);
export const tourStatusEnum = pgEnum("tour_status", ["draft", "pending", "published", "rejected", "archived"]);
export const userRoleEnum = pgEnum("user_role", ["user", "partner", "manager", "admin"]);
// Жизненный цикл брони — см. BookingStatusSchema в @yavoy/contracts (YAV-28)
export const bookingStatusEnum = pgEnum("booking_status", [
  "requested",
  "awaiting_partner",
  "awaiting_payment",
  "confirmed",
  "completed",
  "rejected",
  "expired",
  "cancelled",
]);
export const paymentProviderEnum = pgEnum("payment_provider", ["octo", "yookassa"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "pending",
  "succeeded",
  "cancelled",
  "failed",
]);
export const favoriteEntityEnum = pgEnum("favorite_entity", ["tour", "city"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "published", "rejected"]);
/** Жизненный цикл правки тура: draft → pending → approved | rejected (YAV-29) */
export const revisionStatusEnum = pgEnum("revision_status", ["draft", "pending", "approved", "rejected"]);
/** Заявка на партнёрство: Pending Review → Approved | Rejected (YAV-24) */
export const applicationStatusEnum = pgEnum("application_status", ["pending", "approved", "rejected"]);

// ─── Каталог (M1) ────────────────────────────────────────────

export const cities = pgTable("cities", {
  id: text("id").primaryKey(), // slug: moscow, spb, ...
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  emoji: text("emoji").notNull().default(""),
  imageUrl: text("image_url").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  position: integer("position").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
});

export const tours = pgTable(
  "tours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cityId: text("city_id").notNull().references(() => cities.id),
    status: tourStatusEnum("status").notNull().default("published"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull(),
    gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
    priceKopeks: money("price_kopeks").notNull(),
    originalPriceKopeks: money("original_price_kopeks"),
    currency: text("currency").notNull().default("RUB"),
    durationType: durationTypeEnum("duration_type").notNull(),
    durationText: text("duration_text").notNull().default(""),
    transport: transportTypeEnum("transport").notNull(),
    interest: interestTypeEnum("interest").notNull(),
    category: categoryTypeEnum("category"),
    season: seasonTypeEnum("season"),
    // Отображаемые данные организатора; заменяется на partner_profiles в M6
    organizer: jsonb("organizer")
      .$type<{
        id: string;
        name: string;
        rating: number;
        review_count: number;
        avatar: string | null;
        verified: boolean;
        tours_count: number;
      }>()
      .notNull(),
    highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
    includes: jsonb("includes").$type<string[]>().notNull().default([]),
    excludes: jsonb("excludes").$type<string[]>().notNull().default([]),
    whatToBring: jsonb("what_to_bring").$type<string[]>().notNull().default([]),
    languages: jsonb("languages").$type<string[]>().notNull().default([]),
    schedule: text("schedule"),
    groupSize: text("group_size"),
    meetingPoint: text("meeting_point"),
    meetingLat: doublePrecision("meeting_lat"),
    meetingLng: doublePrecision("meeting_lng"),
    startTime: text("start_time"),
    bookingConditions: text("booking_conditions"),
    prepayment: text("prepayment"),
    cancellationPolicy: text("cancellation_policy"),
    groupJoiningConditions: text("group_joining_conditions"),
    isInstantConfirmation: boolean("is_instant_confirmation").notNull().default(false),
    isFreeCancellation: boolean("is_free_cancellation").notNull().default(false),
    isBestseller: boolean("is_bestseller").notNull().default(false),
    isLikelyToSellOut: boolean("is_likely_to_sell_out").notNull().default(false),
    popularity: integer("popularity").notNull().default(0),
    // владелец-партнёр; null — туры самой платформы. organizer-jsonb остаётся витриной,
    // для партнёрских туров синхронизируется из partner_profiles на write-пути
    partnerId: uuid("partner_id").references(() => partnerProfiles.id),
    // денормализация по опубликованным отзывам; пересчёт при модерации (M5)
    rating: doublePrecision("rating"),
    reviewsCount: integer("reviews_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tours_city_idx").on(t.cityId),
    index("tours_status_idx").on(t.status),
    index("tours_partner_idx").on(t.partnerId),
    index("tours_popularity_idx").on(t.popularity),
    index("tours_price_idx").on(t.priceKopeks),
  ],
);

/**
 * Правки тура, ждущие модерации (YAV-29).
 *
 * Опубликованный тур трогать нельзя, пока правку не одобрили, — иначе он
 * пропадёт с витрины. Поэтому изменения живут здесь, а не в строке тура:
 * payload — это то, чем тур станет после одобрения.
 *
 * Расписание и места сюда не попадают: закрыть дату или добавить мест —
 * операционная задача, партнёр делает это сразу (решение владельца).
 */
export const tourRevisions = pgTable(
  "tour_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tourId: uuid("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
    status: revisionStatusEnum("status").notNull().default("draft"),
    /** Содержимое тура целиком — снимок на момент отправки, чтобы автор не правил его под модератором */
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    /** Причина отказа; относится к попытке, а не к туру, поэтому живёт здесь */
    comment: text("comment"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    index("tour_revisions_tour_idx").on(t.tourId, t.createdAt),
    index("tour_revisions_status_idx").on(t.status),
    // незакрытая правка у тура может быть только одна: две параллельные
    // гонялись бы за одну и ту же строку тура при одобрении
    uniqueIndex("tour_revisions_open_idx")
      .on(t.tourId)
      .where(sql`${t.status} in ('draft', 'pending')`),
  ],
);

// Расписание/наличие мест: таблица создаётся в M1, наполняется и используется с M3
export const tourDates = pgTable(
  "tour_dates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tourId: uuid("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
    startsOn: date("starts_on").notNull(),
    seatsTotal: integer("seats_total").notNull(),
    seatsLeft: integer("seats_left").notNull(),
    priceOverrideKopeks: money("price_override_kopeks"),
  },
  (t) => [
    uniqueIndex("tour_dates_tour_date_idx").on(t.tourId, t.startsOn),
    check("tour_dates_seats_nonneg", sql`${t.seatsLeft} >= 0`),
  ],
);

// ─── Бронирования (M3: заявки без онлайн-оплаты) ─────────────

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    tourId: uuid("tour_id").notNull().references(() => tours.id),
    tourDateId: uuid("tour_date_id").notNull().references(() => tourDates.id),
    status: bookingStatusEnum("status").notNull().default("requested"),
    ticketsCount: integer("tickets_count").notNull(),
    amountKopeks: money("amount_kopeks").notNull(),
    currency: text("currency").notNull().default("RUB"),
    confirmationCode: text("confirmation_code").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    contact: text("contact").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Когда бронь вошла в текущий статус: по этому полю сборщик ищет протухшие */
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true }).notNull().defaultNow(),
    /**
     * Акцепт оферты до оплаты — требование банка (п.7). Храним номер редакции,
     * а не факт «согласился»: текст меняется, и без версии акцепт недоказуем.
     */
    offerVersion: integer("offer_version"),
    offerAcceptedAt: timestamp("offer_accepted_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    index("bookings_user_idx").on(t.userId),
    index("bookings_status_idx").on(t.status),
    uniqueIndex("bookings_code_idx").on(t.confirmationCode),
    check("bookings_tickets_positive", sql`${t.ticketsCount} > 0`),
  ],
);

// ─── Платежи (YAV-21) ────────────────────────────────────────

/**
 * Платёж по брони. Таблица общая для всех инсталляций: провайдер отличается
 * колонкой, а не схемой. Реквизиты карт здесь не хранятся и храниться не могут —
 * платёж проходит на стороне банка, нам приходит только его результат.
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull(),
    /** ID платежа на стороне провайдера; появляется после создания платежа */
    providerPaymentId: text("provider_payment_id"),
    status: paymentStatusEnum("status").notNull().default("created"),
    /** Сумма в минорных единицах валюты (тийин для UZS, копейка для RUB) */
    amountMinor: money("amount_minor").notNull(),
    currency: text("currency").notNull(),
    /** Платёжная страница провайдера */
    payUrl: text("pay_url"),
    refundedMinor: money("refunded_minor").notNull().default(0),
    /** Последний коллбэк провайдера целиком — для разбора инцидентов */
    lastEvent: jsonb("last_event"),
    maskedPan: text("masked_pan"),
    cardVendor: text("card_vendor"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [
    index("payments_booking_idx").on(t.bookingId),
    // повторный коллбэк по тому же платежу не должен создавать вторую строку
    uniqueIndex("payments_provider_id_idx").on(t.provider, t.providerPaymentId),
    check("payments_amount_positive", sql`${t.amountMinor} > 0`),
  ],
);

// ─── Auth (M2) ───────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    isActive: boolean("is_active").notNull().default(true),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    photoKey: text("photo_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

// Одноразовые коды входа: одна строка на email (upsert по PK инвалидирует прежний код).
// Хранится только хэш кода; attempts_left списывается условным UPDATE (гонко-безопасно).
export const emailOtps = pgTable("email_otps", {
  email: text("email").primaryKey(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attemptsLeft: integer("attempts_left").notNull().default(5),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const refreshSessions = pgTable(
  "refresh_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    replacedBy: uuid("replaced_by"),
    userAgent: text("user_agent"),
    ip: text("ip"),
  },
  (t) => [uniqueIndex("refresh_sessions_hash_idx").on(t.tokenHash), index("refresh_sessions_user_idx").on(t.userId)],
);

// ─── Партнёры (организаторы туров) ───────────────────────────

// Профиль организации; users.role='partner' + строка здесь. Верификация ИНН — ручная менеджером.
/**
 * Заявка на партнёрство (YAV-24). Отдельно от partner_profiles намеренно:
 * профиль означает действующего партнёра, и если сложить заявки туда, каждый
 * список партнёров пришлось бы фильтровать, а отклонённые заявки — хранить
 * как мусорные профили. Здесь же живёт причина отказа.
 */
export const partnerApplications = pgTable(
  "partner_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    status: applicationStatusEnum("status").notNull().default("pending"),
    orgName: text("org_name").notNull(),
    /** СТИР в Узбекистане, ИНН в РФ — одно поле, проверка глазами менеджера */
    inn: text("inn").notNull(),
    phone: text("phone").notNull().default(""),
    description: text("description").notNull().default(""),
    /** Принятая редакция партнёрской оферты: без номера версии акцепт недоказуем */
    offerVersion: integer("offer_version").notNull(),
    offerAcceptedAt: timestamp("offer_accepted_at", { withTimezone: true }).notNull().defaultNow(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    index("partner_applications_status_idx").on(t.status),
    // вторую заявку, пока первая на рассмотрении, подавать нельзя
    uniqueIndex("partner_applications_open_idx").on(t.userId).where(sql`${t.status} = 'pending'`),
  ],
);

export const partnerProfiles = pgTable("partner_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  orgName: text("org_name").notNull(),
  description: text("description").notNull().default(""),
  phone: text("phone").notNull().default(""),
  inn: text("inn").notNull().default(""),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Избранное и отзывы (M5) ─────────────────────────────────

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    entityType: favoriteEntityEnum("entity_type").notNull(),
    // text: tour — uuid, city — slug; целостность проверяется в сервисе
    entityId: text("entity_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.entityType, t.entityId] })],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    tourId: uuid("tour_id").notNull().references(() => tours.id),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id),
    rating: integer("rating").notNull(),
    text: text("text").notNull(),
    status: reviewStatusEnum("status").notNull().default("pending"),
    rejectedReason: text("rejected_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("reviews_booking_idx").on(t.bookingId), // один отзыв на бронь
    index("reviews_tour_status_idx").on(t.tourId, t.status),
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);
