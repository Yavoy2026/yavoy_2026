import {
  AdminUpdateUserPayloadSchema,
  ErrorEnvelopeSchema,
  UserListResponseSchema,
  UserProfileSchema,
} from "@yavoy/contracts";
import { desc, eq, ilike, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { users } from "../../db/schema.ts";
import { badRequest, forbidden, notFound } from "../../errors.ts";
import { toProfile } from "../auth/service.ts";

export async function adminRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/admin/users",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["admin"],
        querystring: z.object({ q: z.string().max(200).optional() }),
        response: { 200: UserListResponseSchema, 403: ErrorEnvelopeSchema },
      },
    },
    async (req) => {
      const filter = req.query.q
        ? or(ilike(users.email, `%${req.query.q}%`), ilike(users.firstName, `%${req.query.q}%`))
        : undefined;
      const rows = await app.db
        .select()
        .from(users)
        .where(filter)
        .orderBy(desc(users.createdAt))
        .limit(200);
      return { items: rows.map(toProfile) };
    },
  );

  app.patch(
    "/admin/users/:id",
    {
      preHandler: [app.requireRole("manager", "admin")],
      schema: {
        tags: ["admin"],
        params: z.object({ id: z.string().uuid() }),
        body: AdminUpdateUserPayloadSchema,
        response: {
          200: UserProfileSchema,
          400: ErrorEnvelopeSchema,
          403: ErrorEnvelopeSchema,
          404: ErrorEnvelopeSchema,
        },
      },
    },
    async (req) => {
      if (req.params.id === req.user!.sub) {
        throw badRequest("cannot_modify_self", "Нельзя менять собственную роль или активность");
      }
      // роли назначает только admin; manager может лишь включать/выключать пользователей
      if (req.body.role !== undefined && req.user!.role !== "admin") {
        throw forbidden("admin_only", "Менять роли может только администратор");
      }

      const patch: Partial<typeof users.$inferInsert> = {};
      if (req.body.role !== undefined) patch.role = req.body.role;
      if (req.body.is_active !== undefined) patch.isActive = req.body.is_active;
      if (Object.keys(patch).length === 0) {
        throw badRequest("empty_patch", "Укажите role или is_active");
      }

      const updated = await app.db.update(users).set(patch).where(eq(users.id, req.params.id)).returning();
      const user = updated[0];
      if (!user) throw notFound("user_not_found", "Пользователь не найден");
      return toProfile(user);
    },
  );
}
