import { buildApp } from "./app.ts";
import { createDb } from "./db/client.ts";
import { env } from "./env.ts";

const { db } = createDb();
const app = await buildApp(db);

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
