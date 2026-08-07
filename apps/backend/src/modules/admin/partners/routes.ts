import {
  CreatePartnerPayloadSchema,
  ErrorEnvelopeSchema,
  PartnerListResponseSchema,
  PartnerProfileSchema,
  UpdateMyPartnerProfilePayloadSchema,
  UpdatePartnerPayloadSchema,
} from "@yavoy/contracts";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createPartner,
  getMyPartnerProfile,
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
      preHandler: [app.requireRole("admin")],
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
}
