CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "partner_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"org_name" text NOT NULL,
	"inn" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"offer_version" integer NOT NULL,
	"offer_accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "offer_version" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "offer_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_applications_status_idx" ON "partner_applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_applications_open_idx" ON "partner_applications" USING btree ("user_id") WHERE "partner_applications"."status" = 'pending';