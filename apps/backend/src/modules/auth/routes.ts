import {
  ErrorEnvelopeSchema,
  OtpRequestPayloadSchema,
  OtpVerifyPayloadSchema,
  OtpVerifyResponseSchema,
  RefreshPayloadSchema,
  TokensSchema,
  UserProfileSchema,
} from "@yavoy/contracts";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { unauthorized } from "../../errors.ts";
import { getUserById, logout, refresh, requestOtp, toProfile, verifyOtp } from "./service.ts";

const AUTH_RATE_LIMIT = { rateLimit: { max: 5, timeWindow: "1 minute" } };

function meta(req: FastifyRequest) {
  return { userAgent: req.headers["user-agent"], ip: req.ip };
}

export async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/otp/request",
    {
      config: AUTH_RATE_LIMIT,
      schema: {
        tags: ["auth"],
        body: OtpRequestPayloadSchema,
        response: { 200: z.object({ ok: z.literal(true) }), 429: ErrorEnvelopeSchema },
      },
    },
    async (req) => {
      await requestOtp(app.db, app.mailer, req.body.email);
      return { ok: true as const };
    },
  );

  app.post(
    "/otp/verify",
    {
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
      schema: {
        tags: ["auth"],
        body: OtpVerifyPayloadSchema,
        response: { 200: OtpVerifyResponseSchema, 401: ErrorEnvelopeSchema },
      },
    },
    async (req) => verifyOtp(app.db, req.body, meta(req)),
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
