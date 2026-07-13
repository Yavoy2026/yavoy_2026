import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "@yavoy/contracts";
import { verifyAccessToken, type AccessClaims } from "../auth/tokens.ts";
import { forbidden, unauthorized } from "../errors.ts";

declare module "fastify" {
  interface FastifyRequest {
    user: AccessClaims | null;
  }
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: UserRole[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app) => {
  app.decorateRequest("user", null);

  app.decorate("authenticate", async (req: FastifyRequest) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw unauthorized("missing_token", "Требуется авторизация");
    }
    try {
      req.user = await verifyAccessToken(header.slice("Bearer ".length));
    } catch {
      throw unauthorized("invalid_token", "Недействительный или истёкший токен");
    }
  });

  app.decorate("requireRole", (...roles: UserRole[]) => {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      await app.authenticate(req, reply);
      if (!req.user || !roles.includes(req.user.role)) {
        throw forbidden("insufficient_role", "Недостаточно прав");
      }
    };
  });
});
