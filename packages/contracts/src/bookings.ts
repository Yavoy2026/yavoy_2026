import { z } from "zod";

export const BookingStatusSchema = z.enum(["requested", "confirmed", "completed", "cancelled"]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const TourDateSchema = z.object({
  id: z.string().uuid(),
  tour_id: z.string().uuid(),
  starts_on: z.string(), // ISO date (YYYY-MM-DD)
  seats_total: z.number().int(),
  seats_left: z.number().int(),
  price_kopeks: z.number().int(), // с учётом price_override
});
export type TourDate = z.infer<typeof TourDateSchema>;

export const CreateBookingPayloadSchema = z.object({
  tour_date_id: z.string().uuid(),
  tickets_count: z.number().int().min(1).max(20),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  contact: z.string().min(3).max(200), // телефон или email
});
export type CreateBookingPayload = z.infer<typeof CreateBookingPayloadSchema>;

export const BookingSchema = z.object({
  id: z.string().uuid(),
  status: BookingStatusSchema,
  tour_id: z.string().uuid(),
  tour_title: z.string(),
  tour_image_url: z.string(),
  tour_city_id: z.string(),
  tour_date: z.string(), // YYYY-MM-DD
  start_time: z.string().nullable(),
  tickets_count: z.number().int(),
  amount_kopeks: z.number().int(),
  currency: z.string(),
  confirmation_code: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  contact: z.string(),
  organizer_name: z.string(),
  meeting_point: z.string().nullable(),
  created_at: z.string(),
  cancelled_at: z.string().nullable(),
});
export type Booking = z.infer<typeof BookingSchema>;

export const BookingListResponseSchema = z.object({ items: z.array(BookingSchema) });
export type BookingListResponse = z.infer<typeof BookingListResponseSchema>;
