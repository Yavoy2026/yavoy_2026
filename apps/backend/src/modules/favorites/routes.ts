import { ErrorEnvelopeSchema, FavoritesResponseSchema } from "@yavoy/contracts";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { cities, favorites, tours } from "../../db/schema.ts";
import { notFound } from "../../errors.ts";

const TourParams = z.object({ id: z.string().uuid() });
const CityParams = z.object({ id: z.string().min(1).max(100) });
const OkSchema = z.object({ ok: z.literal(true) });

export async function favoritesRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/me/favorites",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["favorites"],
        response: { 200: FavoritesResponseSchema, 401: ErrorEnvelopeSchema },
      },
    },
    async (req) => {
      const rows = await app.db
        .select({ entityType: favorites.entityType, entityId: favorites.entityId })
        .from(favorites)
        .where(eq(favorites.userId, req.user!.sub));
      return {
        tours: rows.filter((r) => r.entityType === "tour").map((r) => r.entityId),
        cities: rows.filter((r) => r.entityType === "city").map((r) => r.entityId),
      };
    },
  );

  app.put(
    "/me/favorites/tours/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["favorites"],
        params: TourParams,
        response: { 200: OkSchema, 404: ErrorEnvelopeSchema },
      },
    },
    async (req) => {
      const exists = await app.db.select({ id: tours.id }).from(tours).where(eq(tours.id, req.params.id)).limit(1);
      if (!exists.length) throw notFound("tour_not_found", "Тур не найден");
      await app.db
        .insert(favorites)
        .values({ userId: req.user!.sub, entityType: "tour", entityId: req.params.id })
        .onConflictDoNothing();
      return { ok: true as const };
    },
  );

  app.put(
    "/me/favorites/cities/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["favorites"],
        params: CityParams,
        response: { 200: OkSchema, 404: ErrorEnvelopeSchema },
      },
    },
    async (req) => {
      const exists = await app.db.select({ id: cities.id }).from(cities).where(eq(cities.id, req.params.id)).limit(1);
      if (!exists.length) throw notFound("city_not_found", "Город не найден");
      await app.db
        .insert(favorites)
        .values({ userId: req.user!.sub, entityType: "city", entityId: req.params.id })
        .onConflictDoNothing();
      return { ok: true as const };
    },
  );

  for (const [path, entityType] of [
    ["/me/favorites/tours/:id", "tour"],
    ["/me/favorites/cities/:id", "city"],
  ] as const) {
    app.delete(
      path,
      {
        preHandler: [app.authenticate],
        schema: { tags: ["favorites"], params: CityParams, response: { 200: OkSchema } },
      },
      async (req) => {
        await app.db
          .delete(favorites)
          .where(
            and(
              eq(favorites.userId, req.user!.sub),
              eq(favorites.entityType, entityType),
              eq(favorites.entityId, req.params.id),
            ),
          );
        return { ok: true as const };
      },
    );
  }
}
