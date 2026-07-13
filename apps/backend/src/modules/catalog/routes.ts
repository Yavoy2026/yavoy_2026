import {
  CityListResponseSchema,
  ErrorEnvelopeSchema,
  TourDetailSchema,
  TourListQuerySchema,
  TourListResponseSchema,
} from "@yavoy/contracts";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { getCities, getTourDetail, getTours } from "./service.ts";

export async function catalogRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/cities",
    { schema: { tags: ["catalog"], response: { 200: CityListResponseSchema } } },
    async () => ({ items: await getCities(app.db) }),
  );

  app.get(
    "/tours",
    {
      schema: {
        tags: ["catalog"],
        querystring: TourListQuerySchema,
        response: { 200: TourListResponseSchema, 400: ErrorEnvelopeSchema },
      },
    },
    async (req) => getTours(app.db, req.query),
  );

  app.get(
    "/tours/:id",
    {
      schema: {
        tags: ["catalog"],
        params: z.object({ id: z.string().uuid() }),
        response: { 200: TourDetailSchema, 404: ErrorEnvelopeSchema },
      },
    },
    async (req) => getTourDetail(app.db, req.params.id),
  );
}
