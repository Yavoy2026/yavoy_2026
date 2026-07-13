CREATE TYPE "public"."category_type" AS ENUM('agro', 'photo', 'ethno', 'parents', 'glamping', 'animals', 'mystic', 'wild_animals', 'wine', 'gastro');--> statement-breakpoint
CREATE TYPE "public"."duration_type" AS ENUM('one_day', 'multi_day');--> statement-breakpoint
CREATE TYPE "public"."interest_type" AS ENUM('city', 'educational', 'nature', 'pilgrimage');--> statement-breakpoint
CREATE TYPE "public"."season_type" AS ENUM('winter', 'spring', 'summer', 'autumn', 'all_year');--> statement-breakpoint
CREATE TYPE "public"."tour_status" AS ENUM('draft', 'pending', 'published', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."transport_type" AS ENUM('auto', 'water', 'sea', 'bike', 'air');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'manager', 'admin');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"emoji" text DEFAULT '' NOT NULL,
	"image_url" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"position" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"replaced_by" uuid,
	"user_agent" text,
	"ip" text
);
--> statement-breakpoint
CREATE TABLE "tour_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"seats_total" integer NOT NULL,
	"seats_left" integer NOT NULL,
	"price_override_kopeks" integer
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" text NOT NULL,
	"status" "tour_status" DEFAULT 'published' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_kopeks" integer NOT NULL,
	"original_price_kopeks" integer,
	"currency" text DEFAULT 'RUB' NOT NULL,
	"duration_type" "duration_type" NOT NULL,
	"duration_text" text DEFAULT '' NOT NULL,
	"transport" "transport_type" NOT NULL,
	"interest" "interest_type" NOT NULL,
	"category" "category_type",
	"season" "season_type",
	"organizer" jsonb NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"includes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"excludes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"what_to_bring" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"schedule" text,
	"group_size" text,
	"meeting_point" text,
	"meeting_lat" double precision,
	"meeting_lng" double precision,
	"start_time" text,
	"booking_conditions" text,
	"prepayment" text,
	"cancellation_policy" text,
	"group_joining_conditions" text,
	"is_instant_confirmation" boolean DEFAULT false NOT NULL,
	"is_free_cancellation" boolean DEFAULT false NOT NULL,
	"is_bestseller" boolean DEFAULT false NOT NULL,
	"is_likely_to_sell_out" boolean DEFAULT false NOT NULL,
	"popularity" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"photo_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_dates" ADD CONSTRAINT "tour_dates_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_sessions_hash_idx" ON "refresh_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "refresh_sessions_user_idx" ON "refresh_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tour_dates_tour_date_idx" ON "tour_dates" USING btree ("tour_id","starts_on");--> statement-breakpoint
CREATE INDEX "tours_city_idx" ON "tours" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "tours_status_idx" ON "tours" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tours_popularity_idx" ON "tours" USING btree ("popularity");--> statement-breakpoint
CREATE INDEX "tours_price_idx" ON "tours" USING btree ("price_kopeks");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");