import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

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
export const userRoleEnum = pgEnum("user_role", ["user", "manager", "admin"]);

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
    priceKopeks: integer("price_kopeks").notNull(),
    originalPriceKopeks: integer("original_price_kopeks"),
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
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tours_city_idx").on(t.cityId),
    index("tours_status_idx").on(t.status),
    index("tours_popularity_idx").on(t.popularity),
    index("tours_price_idx").on(t.priceKopeks),
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
    priceOverrideKopeks: integer("price_override_kopeks"),
  },
  (t) => [uniqueIndex("tour_dates_tour_date_idx").on(t.tourId, t.startsOn)],
);

// ─── Auth (M2) ───────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
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
