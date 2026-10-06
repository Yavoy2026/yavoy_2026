import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "./client.ts";

const { db, sql } = createDb();
await migrate(db, { migrationsFolder: new URL("./migrations", import.meta.url).pathname });
await sql.end();
console.log("Migrations applied");
