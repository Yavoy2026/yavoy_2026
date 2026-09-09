import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.ts";
import * as schema from "../src/db/schema.ts";
import type { MailMessage } from "../src/mail/mailer.ts";
import type { PaymentProvider } from "../src/modules/payments/provider.ts";

const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL ?? "postgres://yavoy:yavoy@localhost:5434/yavoy";

export interface TestApp {
  app: FastifyInstance;
  /** Все «отправленные» письма — auth идёт по кодам из них */
  outbox: MailMessage[];
  teardown: () => Promise<void>;
}

/** Каждый тест-файл получает свежую БД — изоляция без очисток между тестами */
export async function createTestApp(opts: { payments?: PaymentProvider | null } = {}): Promise<TestApp> {
  const dbName = `yavoy_test_${Math.random().toString(36).slice(2, 10)}`;
  const admin = postgres(ADMIN_URL, { max: 1 });
  await admin.unsafe(`CREATE DATABASE ${dbName}`);

  const url = ADMIN_URL.replace(/\/[^/]+$/, `/${dbName}`);
  const sql = postgres(url, { max: 5, onnotice: () => {} });
  const db = drizzle(sql, { schema });
  await migrate(db, { migrationsFolder: new URL("../src/db/migrations", import.meta.url).pathname });

  const outbox: MailMessage[] = [];
  const app = await buildApp(db, {
    mailer: {
      async send(msg) {
        outbox.push(msg);
      },
    },
    payments: opts.payments ?? null,
  });

  return {
    app,
    outbox,
    teardown: async () => {
      await app.close();
      await sql.end();
      await admin.unsafe(`DROP DATABASE ${dbName} WITH (FORCE)`);
      await admin.end();
    },
  };
}

/** Последний 6-значный код из писем на адрес */
export function otpCodeFor(outbox: MailMessage[], email: string): string {
  const mail = [...outbox].reverse().find((m) => m.to === email.toLowerCase().trim());
  const code = mail?.text.match(/\b(\d{6})\b/)?.[1];
  if (!code) throw new Error(`Нет OTP-письма для ${email}`);
  return code;
}

export interface OtpLoginResult {
  tokens: { access_token: string; refresh_token: string };
  user: { id: string; email: string; role: string; first_name: string };
  is_new_user: boolean;
}

/** Полный вход по OTP; кулдаун сбрасывается, чтобы тесты могли логиниться сколько угодно */
export async function loginViaOtp(t: Pick<TestApp, "app" | "outbox">, email: string): Promise<OtpLoginResult> {
  await t.app.db.delete(schema.emailOtps).where(eq(schema.emailOtps.email, email.toLowerCase().trim()));
  const req = await t.app.inject({ method: "POST", url: "/v1/auth/otp/request", payload: { email } });
  if (req.statusCode !== 200) throw new Error(`otp/request ${req.statusCode}: ${req.body}`);

  const verify = await t.app.inject({
    method: "POST",
    url: "/v1/auth/otp/verify",
    payload: { email, code: otpCodeFor(t.outbox, email) },
  });
  if (verify.statusCode !== 200) throw new Error(`otp/verify ${verify.statusCode}: ${verify.body}`);
  return verify.json() as OtpLoginResult;
}

/** Пользователь с ролью: OTP-вход, повышение роли в БД, перелогин (роль зашита в JWT) */
export async function signupWithRole(
  t: Pick<TestApp, "app" | "outbox">,
  email: string,
  role: "user" | "partner" | "manager" | "admin",
  firstName?: string,
): Promise<{ id: string; token: string; refreshToken: string }> {
  let result = await loginViaOtp(t, email);
  // имя добирается как в реальном флоу — через PATCH /users/me
  await t.app.inject({
    method: "PATCH",
    url: "/v1/users/me",
    headers: { authorization: `Bearer ${result.tokens.access_token}` },
    payload: { first_name: firstName ?? email.split("@")[0]! },
  });
  if (role !== "user") {
    await t.app.db
      .update(schema.users)
      .set({ role })
      .where(eq(schema.users.id, result.user.id));
    result = await loginViaOtp(t, email); // свежий токен с новой ролью
  }
  return { id: result.user.id, token: result.tokens.access_token, refreshToken: result.tokens.refresh_token };
}

export async function seedCatalogFixture(app: FastifyInstance) {
  const db = app.db;
  await db.insert(schema.cities).values([
    { id: "moscow", name: "Москва", imageUrl: "https://img/msk.jpg", position: 0 },
    { id: "spb", name: "Санкт-Петербург", imageUrl: "https://img/spb.jpg", position: 1 },
  ]);

  const organizer = {
    id: "org1",
    name: "МосТур",
    rating: 4.8,
    review_count: 100,
    avatar: null,
    verified: true,
    tours_count: 5,
  };

  const base = {
    description: "Описание",
    imageUrl: "https://img/tour.jpg",
    durationType: "one_day" as const,
    transport: "auto" as const,
    interest: "city" as const,
    organizer,
  };

  await db.insert(schema.tours).values([
    { ...base, cityId: "moscow", title: "Обзорная по Москве", priceKopeks: 250_000, popularity: 95 },
    { ...base, cityId: "moscow", title: "Речная прогулка", priceKopeks: 180_000, popularity: 80, transport: "water" },
    { ...base, cityId: "spb", title: "Ночной Петербург", priceKopeks: 320_000, popularity: 90 },
    {
      ...base,
      cityId: "spb",
      title: "Черновик — не должен отдаваться",
      priceKopeks: 100_000,
      popularity: 99,
      status: "draft",
    },
  ]);
}
