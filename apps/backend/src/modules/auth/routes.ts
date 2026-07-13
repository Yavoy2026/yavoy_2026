import {
  AuthResponseSchema,
  ErrorEnvelopeSchema,
  RefreshPayloadSchema,
  SigninPayloadSchema,
  SignupPayloadSchema,
  TokensSchema,
  UserProfileSchema,
} from "@yavoy/contracts";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { unauthorized } from "../../errors.ts";
import { getUserById, logout, refresh, signin, signup, toProfile } from "./service.ts";

const AUTH_RATE_LIMIT = { rateLimit: { max: 5, timeWindow: "1 minute" } };

function meta(req: FastifyRequest) {
  return { userAgent: req.headers["user-agent"], ip: req.ip };
}

export async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/signup",
    {
      config: AUTH_RATE_LIMIT,
      schema: {
        tags: ["auth"],
        body: SignupPayloadSchema,
        response: { 200: AuthResponseSchema, 409: ErrorEnvelopeSchema },
      },
    },
    async (req) => signup(app.db, req.body, meta(req)),
  );

  app.post(
    "/signin",
    {
      config: AUTH_RATE_LIMIT,
      schema: {
        tags: ["auth"],
        body: SigninPayloadSchema,
        response: { 200: AuthResponseSchema, 401: ErrorEnvelopeSchema },
      },
    },
    async (req) => signin(app.db, req.body, meta(req)),
  );

  app.post(
    "/refresh",
    {
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
      schema: {
        tags: ["auth"],
        body: RefreshPayloadSchema,
        response: { 200: TokensSchema, 401: ErrorEnvelopeSchema },
      },
    },
    async (req) => refresh(app.db, req.body.refresh_token, meta(req)),
  );

  app.post(
    "/logout",
    {
      schema: {
        tags: ["auth"],
        body: RefreshPayloadSchema,
        response: { 200: z.object({ ok: z.literal(true) }) },
      },
    },
    async (req) => {
      await logout(app.db, req.body.refresh_token);
      return { ok: true as const };
    },
  );

  app.get(
    "/whoami",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["auth"],
        response: { 200: UserProfileSchema, 401: ErrorEnvelopeSchema },
      },
    },
    async (req) => {
      const user = await getUserById(app.db, req.user!.sub);
      if (!user || !user.isActive) throw unauthorized("user_not_found", "Пользователь не найден");
      return toProfile(user);
    },
  );
}
