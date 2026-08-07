import {
  AdminSetTourStatusPayloadSchema,
  AdminTourDateListResponseSchema,
  AdminTourDateSchema,
  AdminTourListQuerySchema,
  AdminTourListResponseSchema,
  AdminTourSchema,
  CreateTourDatePayloadSchema,
  ErrorEnvelopeSchema,
  TourWritePayloadSchema,
  UpdateTourDatePayloadSchema,
  UpdateTourPayloadSchema,
} from "@yavoy/contracts";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  addTourDate,
  createTour,
  deleteTourDate,
  getAdminTour,
  listAdminTours,
  listTourDatesAdmin,
  setTourStatus,
  updateTour,
  updateTourDate,
} from "./service.ts";

const IdParams = z.object({ id: z.string().uuid() });
const DateParams = z.object({ id: z.string().uuid(), dateId: z.string().uuid() });

export async function adminToursRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const staff = { preHandler: [app.requireRole("manager", "admin")] };

  app.get(
    "/admin/tours",
    {
      ...staff,
      schema: {
        tags: ["admin"],
        querystring: AdminTourListQuerySchema,
        response: { 200: AdminTourListResponseSchema, 403: ErrorEnvelopeSchema },
      },
    },
    async (req) => ({ items: await listAdminTours(app.db, req.query) }),
  );

  app.post(
    "/admin/tours",
    {
      ...staff,
      schema: {
        tags: ["admin"],
        body: TourWritePayloadSchema,
        response: { 200: AdminTourSchema, 400: ErrorEnvelopeSchema, 403: ErrorEnvelopeSchema },
      },
    },
    async (req) => createTour(app.db, req.body),
  );

  app.get(
    "/admin/tours/:id",
    {
      ...staff,
      schema: {
        tags: ["admin"],
        params: IdParams,
        response: { 200: AdminTourSchema, 404: ErrorEnvelopeSchema },
      },
    },
    async (req) => getAdminTour(app.db, req.params.id),
  );

  app.patch(
    "/admin/tours/:id",
    {
      ...staff,
      schema: {
        tags: ["admin"],
        params: IdParams,
        body: UpdateTourPayloadSchema,
        response: { 200: AdminTourSchema, 400: ErrorEnvelopeSchema, 404: ErrorEnvelopeSchema },
      },
    },
    async (req) => updateTour(app.db, req.params.id, req.body),
  );

  app.patch(
    "/admin/tours/:id/status",
    {
      ...staff,
      schema: {
        tags: ["admin"],
        params: IdParams,
        body: AdminSetTourStatusPayloadSchema,
        response: { 200: AdminTourSchema, 404: ErrorEnvelopeSchema },
      },
    },
    async (req) => setTourStatus(app.db, req.params.id, req.body.status),
  );

  app.get(
    "/admin/tours/:id/dates",
    {
      ...staff,
      schema: {
        tags: ["admin"],
        params: IdParams,
        response: { 200: AdminTourDateListResponseSchema, 404: ErrorEnvelopeSchema },
      },
    },
    async (req) => ({ items: await listTourDatesAdmin(app.db, req.params.id) }),
  );

  app.post(
    "/admin/tours/:id/dates",
    {
      ...staff,
      schema: {
        tags: ["admin"],
        params: IdParams,
        body: CreateTourDatePayloadSchema,
        response: { 200: AdminTourDateSchema, 404: ErrorEnvelopeSchema, 409: ErrorEnvelopeSchema },
      },
    },
    async (req) => addTourDate(app.db, req.params.id, req.body),
  );

  app.patch(
    "/admin/tours/:id/dates/:dateId",
    {
      ...staff,
      schema: {
        tags: ["admin"],
        params: DateParams,
        body: UpdateTourDatePayloadSchema,
        response: { 200: AdminTourDateSchema, 404: ErrorEnvelopeSchema, 409: ErrorEnvelopeSchema },
      },
    },
    async (req) => updateTourDate(app.db, req.params.id, req.params.dateId, req.body),
  );

  app.delete(
    "/admin/tours/:id/dates/:dateId",
    {
      ...staff,
      schema: {
        tags: ["admin"],
        params: DateParams,
        response: { 200: z.object({ ok: z.literal(true) }), 404: ErrorEnvelopeSchema, 409: ErrorEnvelopeSchema },
      },
    },
    async (req) => {
      await deleteTourDate(app.db, req.params.id, req.params.dateId);
      return { ok: true as const };
    },
  );
}
