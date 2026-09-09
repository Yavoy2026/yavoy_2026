ALTER TABLE "bookings" ALTER COLUMN "amount_kopeks" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount_minor" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "refunded_minor" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "tour_dates" ALTER COLUMN "price_override_kopeks" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "tours" ALTER COLUMN "price_kopeks" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "tours" ALTER COLUMN "original_price_kopeks" SET DATA TYPE bigint;