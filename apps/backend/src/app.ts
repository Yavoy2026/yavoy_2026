import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";
import type { Db } from "./db/client.ts";
import { env } from "./env.ts";
import { AppError } from "./errors.ts";
import { createMailer, type Mailer } from "./mail/mailer.ts";
import { authPlugin } from "./plugins/auth.ts";
import { authRoutes } from "./modules/auth/routes.ts";
import { bookingsRoutes } from "./modules/bookings/routes.ts";
import { catalogRoutes } from "./modules/catalog/routes.ts";
import { favoritesRoutes } from "./modules/favorites/routes.ts";
import { reviewsRoutes } from "./modules/reviews/routes.ts";
import { healthRoutes } from "./modules/health/routes.ts";
import { usersRoutes } from "./modules/users/routes.ts";

export async function buildApp(db: Db) {
  const app = Fastify({
    logger:
      env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty" } }
        : env.NODE_ENV === "production",
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorate("db", db);
  app.decorate("mailer", createMailer(app.log));

  await app.register(cors, { origin: true });
  // global: false — лимиты только на роутах с config.rateLimit (auth).
  // В тестах плагин не регистрируется: route-config без плагина инертен
  if (env.NODE_ENV !== "test") {
    await app.register(rateLimit, { global: false });
  }

  app.setErrorHandler((err: unknown, req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.status).send({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }
    if (err instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "validation_error",
          message: "Некорректные параметры запроса",
          details: { issues: err.issues },
        },
      });
    }
    // ошибки fastify-валидации (schema) и rate-limit уже содержат statusCode
    const fe = err as { statusCode?: number; code?: string; message?: string };
    if (typeof fe.statusCode === "number" && fe.statusCode < 500) {
      return reply.status(fe.statusCode).send({
        error: { code: fe.code ?? "bad_request", message: fe.message ?? "Некорректный запрос" },
      });
    }
    req.log.error(err);
    return reply.status(500).send({
      error: { code: "internal_error", message: "Внутренняя ошибка сервера" },
    });
  });

  await app.register(swagger, {
    openapi: {
      info: { title: "YaVoy API", version: "1.0.0" },
      servers: [{ url: "/" }],
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  await app.register(authPlugin);

  await app.register(
    async (v1) => {
      await v1.register(healthRoutes);
      await v1.register(catalogRoutes);
      await v1.register(bookingsRoutes);
      await v1.register(favoritesRoutes);
      await v1.register(reviewsRoutes);
      await v1.register(authRoutes, { prefix: "/auth" });
      await v1.register(usersRoutes, { prefix: "/users" });
    },
    { prefix: "/v1" },
  );

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
    mailer: Mailer;
  }
}
