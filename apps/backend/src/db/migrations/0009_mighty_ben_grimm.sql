CREATE TYPE "public"."revision_status" AS ENUM('draft', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "tour_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid NOT NULL,
	"status" "revision_status" DEFAULT 'draft' NOT NULL,
	"payload" jsonb NOT NULL,
	"comment" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "tour_revisions" ADD CONSTRAINT "tour_revisions_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_revisions" ADD CONSTRAINT "tour_revisions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_revisions" ADD CONSTRAINT "tour_revisions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tour_revisions_tour_idx" ON "tour_revisions" USING btree ("tour_id","created_at");--> statement-breakpoint
CREATE INDEX "tour_revisions_status_idx" ON "tour_revisions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tour_revisions_open_idx" ON "tour_revisions" USING btree ("tour_id") WHERE "tour_revisions"."status" in ('draft', 'pending');