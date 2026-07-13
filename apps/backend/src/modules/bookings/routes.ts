import {
  BookingListResponseSchema,
  BookingSchema,
  BookingStatusSchema,
  CreateBookingPayloadSchema,
  ErrorEnvelopeSchema,
} from "@yavoy/contracts";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  cancelBooking,
  confirmBooking,
  createBooking,
  listAdminBookings,
  listMyBookings,
} from "./service.ts";

const IdParams = z.object({ id: z.string().uuid() });

export async function bookingsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/bookings",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["bookings"],
        body: CreateBookingPayloadSchema,
        response: { 200: BookingSchema, 401: ErrorEnvelopeSchema, 409: ErrorEnvelopeSchema },
      },
    },
    async (req) => createBooking(app.db, app.mailer, req.user!.sub, req.body),
  );

  app.get(
    "/me/bookings",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["bookings"],
        response: { 200: BookingListResponseSchema, 401: ErrorEnvelopeSchema },
      },
    },
    async (req) => ({ items: await listMyBookings(app.db, req.user!.sub) }),
  );

  app.post(
    "/bookings/:id/cancel",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["bookings"],
        params: IdParams,
        response: {
          200: BookingSchema,
          403: ErrorEnvelopeSchema,
          404: ErrorEnvelopeSchema,
          409: ErrorEnvelopeSchema,
        },
      },
    },
    async (req) =>
      cancelBooking(
        app.db,
        { userId: req.user!.sub, isStaff: req.user!.role !== "user" },
        req.params.id,
      ),
  );

  app.post(
    "/bookings/:id/confirm",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["bookings"],
        params: IdParams,
        response: {
          200: BookingSchema,
          403: ErrorEnvelopeSchema,
          404: ErrorEnvelopeSchema,
          409: ErrorEnvelopeSchema,
        },
      },
    },
    async (req) => confirmBooking(app.db, app.mailer, req.params.id),
  );

  app.get(
    "/admin/bookings",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["bookings"],
        querystring: z.object({ status: BookingStatusSchema.default("requested") }),
        response: { 200: BookingListResponseSchema, 403: ErrorEnvelopeSchema },
      },
    },
    async (req) => ({ items: await listAdminBookings(app.db, req.query.status) }),
  );
}
