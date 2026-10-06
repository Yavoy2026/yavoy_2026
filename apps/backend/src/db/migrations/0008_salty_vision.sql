-- Жизненный цикл брони по YAV-28. Написано руками: drizzle пересоздавал тип
-- через text, и такая миграция падает на любой базе, где уже есть брони в
-- pending_payment — этого значения в новом типе нет. Переименование сохраняет
-- существующие строки, добавление значений их не трогает.
ALTER TYPE "public"."booking_status" RENAME VALUE 'pending_payment' TO 'awaiting_payment';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE IF NOT EXISTS 'awaiting_partner';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE IF NOT EXISTS 'rejected';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE IF NOT EXISTS 'expired';--> statement-breakpoint
-- по этой отметке сборщик находит брони, просроченные на текущем шаге
ALTER TABLE "bookings" ADD COLUMN "status_changed_at" timestamp with time zone DEFAULT now() NOT NULL;
