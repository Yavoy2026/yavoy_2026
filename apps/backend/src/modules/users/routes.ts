import {
  ErrorEnvelopeSchema,
  UpdateProfilePayloadSchema,
  UserProfileSchema,
} from "@yavoy/contracts";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { users } from "../../db/schema.ts";
import { unauthorized } from "../../errors.ts";
import { getUserById, toProfile } from "../auth/service.ts";

export async function usersRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.patch(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["users"],
        body: UpdateProfilePayloadSchema,
        response: { 200: UserProfileSchema, 401: ErrorEnvelopeSchema },
      },
    },
    async (req) => {
      const patch: Partial<{ firstName: string; lastName: string | null }> = {};
      if (req.body.first_name !== undefined) patch.firstName = req.body.first_name.trim();
      if (req.body.last_name !== undefined) patch.lastName = req.body.last_name?.trim() ?? null;

      if (Object.keys(patch).length === 0) {
        const user = await getUserById(app.db, req.user!.sub);
        if (!user) throw unauthorized("user_not_found", "Пользователь не найден");
        return toProfile(user);
      }

      const updated = await app.db.update(users).set(patch).where(eq(users.id, req.user!.sub)).returning();
      const user = updated[0];
      if (!user) throw unauthorized("user_not_found", "Пользователь не найден");
      return toProfile(user);
    },
  );
}
