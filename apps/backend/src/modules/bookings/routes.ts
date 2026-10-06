import {
  BookingListResponseSchema,
  BookingSchema,
  BookingStatusSchema,
  CreateBookingPayloadSchema,
  CreateBookingResponseSchema,
  ErrorEnvelopeSchema,
} from "@yavoy/contracts";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { requirePartnerProfile } from "../admin/partners/service.ts";
import {
  cancelBooking,
  completeBooking,
  createBooking,
  listAdminBookings,
  listMyBookings,
  respondToBooking,
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
        response: {
          200: CreateBookingResponseSchema,
          401: ErrorEnvelopeSchema,
          409: ErrorEnvelopeSchema,
        },
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

  /**
   * Решение по заявке. Организатор отвечает по своим турам, staff — по любым
   * (в том числе по турам самой платформы, у которых организатора нет).
   */
  for (const [path, decision] of [["confirm", "approve"], ["reject", "reject"]] as const) {
    app.post(
      `/bookings/:id/${path}`,
      {
        preHandler: [app.requireRole("partner", "manager", "admin")],
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
      async (req) => {
        const scope = req.user!.role === "partner"
          ? (await requirePartnerProfile(app.db, req.user!.sub)).id
          : undefined;
        return respondToBooking(app.db, app.mailer, app.payments, req.params.id, decision, scope);
      },
    );
  }

  // Ручное завершение поездки (авто-cron появится в M4) — открывает возможность отзыва
  app.post(
    "/bookings/:id/complete",
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
    async (req) => completeBooking(app.db, req.params.id),
  );

  app.get(
    "/admin/bookings",
    {
      preHandler: [app.requireRole("partner", "manager", "admin")],
      schema: {
        tags: ["bookings"],
        querystring: z.object({
          // список статусов через запятую: очередь показывает несколько сразу
          status: z
            .string()
            .default("awaiting_partner")
            .transform((v) => v.split(",").map((x) => x.trim()).filter(Boolean))
            .pipe(z.array(BookingStatusSchema).min(1)),
        }),
        response: { 200: BookingListResponseSchema, 403: ErrorEnvelopeSchema },
      },
    },
    async (req) => {
      const scope = req.user!.role === "partner"
        ? (await requirePartnerProfile(app.db, req.user!.sub)).id
        : undefined;
      return { items: await listAdminBookings(app.db, req.query.status, scope) };
    },
  );
}
