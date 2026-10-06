import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

export async function healthRoutes(app: FastifyInstance) {
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: z.object({ status: z.literal("ok"), db: z.boolean() }),
        },
      },
    },
    async () => {
      let db = false;
      try {
        await app.db.execute(sql`select 1`);
        db = true;
      } catch {
        // health отвечает 200 и при недоступной БД — статус виден в поле
      }
      return { status: "ok" as const, db };
    },
  );
}
