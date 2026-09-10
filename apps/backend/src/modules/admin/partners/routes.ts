import {
  ApplicationStatusSchema,
  CreatePartnerPayloadSchema,
  ErrorEnvelopeSchema,
  PartnerApplicationListResponseSchema,
  PartnerApplicationSchema,
  RejectApplicationPayloadSchema,
  SubmitApplicationPayloadSchema,
  PartnerListResponseSchema,
  PartnerProfileSchema,
  UpdateMyPartnerProfilePayloadSchema,
  UpdatePartnerPayloadSchema,
} from "@yavoy/contracts";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { getMyApplication, listApplications, submitApplication } from "./applications.ts";
import {
  approveApplication,
  createPartner,
  getMyPartnerProfile,
  rejectApplication,
  listPartners,
  updateMyPartnerProfile,
  updatePartner,
} from "./service.ts";

const IdParams = z.object({ id: z.string().uuid() });

export async function adminPartnersRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/admin/partners",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["admin"],
        response: { 200: PartnerListResponseSchema, 403: ErrorEnvelopeSchema },
      },
    },
    async () => ({ items: await listPartners(app.db) }),
  );

  app.post(
    "/admin/partners",
    {
      // менеджер рассматривает заявки, значит и назначить напрямую может:
      // иначе он просто обошёл бы очередь (решение владельца, YAV-24)
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["admin"],
        body: CreatePartnerPayloadSchema,
        response: { 200: PartnerProfileSchema, 404: ErrorEnvelopeSchema, 409: ErrorEnvelopeSchema },
      },
    },
    async (req) => createPartner(app.db, req.body),
  );

  // статические /me раньше параметрического /:id — здесь ради читаемости, роутер и так разрулит
  app.get(
    "/admin/partners/me",
    {
      preHandler: [app.requireRole("partner")],
      schema: {
        tags: ["admin"],
        response: { 200: PartnerProfileSchema, 403: ErrorEnvelopeSchema },
      },
    },
    async (req) => getMyPartnerProfile(app.db, req.user!.sub),
  );

  app.patch(
    "/admin/partners/me",
    {
      preHandler: [app.requireRole("partner")],
      schema: {
        tags: ["admin"],
        body: UpdateMyPartnerProfilePayloadSchema,
        response: { 200: PartnerProfileSchema, 403: ErrorEnvelopeSchema },
      },
    },
    async (req) => updateMyPartnerProfile(app.db, req.user!.sub, req.body),
  );

  app.patch(
    "/admin/partners/:id",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["admin"],
        params: IdParams,
        body: UpdatePartnerPayloadSchema,
        response: { 200: PartnerProfileSchema, 404: ErrorEnvelopeSchema },
      },
    },
    async (req) => updatePartner(app.db, req.params.id, req.body),
  );

  // ─── Заявки на партнёрство (YAV-24) ─────────────────────────

  /** Подаёт обычный пользователь; акцепт партнёрской оферты обязателен */
  app.post(
    "/partner-applications",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["partners"],
        body: SubmitApplicationPayloadSchema,
        response: {
          200: PartnerApplicationSchema,
          400: ErrorEnvelopeSchema,
          401: ErrorEnvelopeSchema,
          409: ErrorEnvelopeSchema,
        },
      },
    },
    async (req) => submitApplication(app.db, req.user!.sub, req.body),
  );

  /** Своя последняя заявка: статус и причина отказа */
  app.get(
    "/partner-applications/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["partners"],
        response: { 200: PartnerApplicationSchema.nullable(), 401: ErrorEnvelopeSchema },
      },
    },
    async (req) => getMyApplication(app.db, req.user!.sub),
  );

  app.get(
    "/admin/partner-applications",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["admin"],
        querystring: z.object({ status: ApplicationStatusSchema.default("pending") }),
        response: { 200: PartnerApplicationListResponseSchema, 403: ErrorEnvelopeSchema },
      },
    },
    async (req) => ({ items: await listApplications(app.db, req.query.status) }),
  );

  app.post(
    "/admin/partner-applications/:id/approve",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["admin"],
        params: IdParams,
        response: {
          200: PartnerProfileSchema,
          400: ErrorEnvelopeSchema,
          403: ErrorEnvelopeSchema,
          404: ErrorEnvelopeSchema,
          409: ErrorEnvelopeSchema,
        },
      },
    },
    async (req) => approveApplication(app.db, req.user!.sub, req.params.id),
  );

  app.post(
    "/admin/partner-applications/:id/reject",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["admin"],
        params: IdParams,
        body: RejectApplicationPayloadSchema,
        response: {
          200: PartnerApplicationSchema,
          400: ErrorEnvelopeSchema,
          403: ErrorEnvelopeSchema,
          404: ErrorEnvelopeSchema,
        },
      },
    },
    async (req) => rejectApplication(app.db, req.user!.sub, req.params.id, req.body.comment),
  );
}
