import {
  CreateReviewPayloadSchema,
  ErrorEnvelopeSchema,
  MyReviewListResponseSchema,
  MyReviewSchema,
  ReviewListResponseSchema,
} from "@yavoy/contracts";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createReview,
  listMyReviews,
  listPendingReviews,
  listTourReviews,
  moderateReview,
} from "./service.ts";

const IdParams = z.object({ id: z.string().uuid() });

export async function reviewsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/bookings/:id/review",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["reviews"],
        params: IdParams,
        body: CreateReviewPayloadSchema,
        response: {
          200: MyReviewSchema,
          400: ErrorEnvelopeSchema,
          403: ErrorEnvelopeSchema,
          409: ErrorEnvelopeSchema,
        },
      },
    },
    async (req) => createReview(app.db, req.user!.sub, req.params.id, req.body),
  );

  app.get(
    "/tours/:id/reviews",
    {
      schema: {
        tags: ["reviews"],
        params: IdParams,
        response: { 200: ReviewListResponseSchema },
      },
    },
    async (req) => ({ items: await listTourReviews(app.db, req.params.id) }),
  );

  app.get(
    "/me/reviews",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["reviews"],
        response: { 200: MyReviewListResponseSchema, 401: ErrorEnvelopeSchema },
      },
    },
    async (req) => ({ items: await listMyReviews(app.db, req.user!.sub) }),
  );

  app.get(
    "/admin/reviews",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["reviews"],
        response: { 200: MyReviewListResponseSchema, 403: ErrorEnvelopeSchema },
      },
    },
    async () => ({ items: await listPendingReviews(app.db) }),
  );

  app.post(
    "/admin/reviews/:id/approve",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["reviews"],
        params: IdParams,
        response: { 200: MyReviewSchema, 404: ErrorEnvelopeSchema, 409: ErrorEnvelopeSchema },
      },
    },
    async (req) => moderateReview(app.db, req.params.id, "approve"),
  );

  app.post(
    "/admin/reviews/:id/reject",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["reviews"],
        params: IdParams,
        body: z.object({ reason: z.string().max(500).optional() }),
        response: { 200: MyReviewSchema, 404: ErrorEnvelopeSchema, 409: ErrorEnvelopeSchema },
      },
    },
    async (req) => moderateReview(app.db, req.params.id, "reject", req.body.reason),
  );
}
