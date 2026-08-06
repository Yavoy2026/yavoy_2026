import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InjectOptions } from "fastify";
import { emailOtps } from "../src/db/schema.ts";
import { createTestApp, loginViaOtp, otpCodeFor, type TestApp } from "./helpers.ts";

let t: TestApp;

beforeAll(async () => {
  t = await createTestApp();
});

afterAll(() => t.teardown());

const EMAIL = "test@example.com";

async function call(opts: InjectOptions) {
  return t.app.inject(opts);
}

function post(url: string, payload: Record<string, unknown>) {
  return call({ method: "POST", url, payload });
}

/** Сброс строки OTP — обходит кулдаун между тестами */
async function resetOtp(email: string) {
  await t.app.db.delete(emailOtps).where(eq(emailOtps.email, email));
}

describe("auth-флоу (passwordless OTP)", () => {
  it("request → verify: первый вход создаёт пользователя (is_new_user, пустое имя)", async () => {
    const req = await post("/v1/auth/otp/request", { email: EMAIL });
    expect(req.statusCode).toBe(200);

    const code = otpCodeFor(t.outbox, EMAIL);
    const verify = await post("/v1/auth/otp/verify", { email: EMAIL, code });
    expect(verify.statusCode).toBe(200);
    const body = verify.json();
    expect(body.is_new_user).toBe(true);
    expect(body.user.email).toBe(EMAIL);
    expect(body.user.role).toBe("user");
    expect(body.user.first_name).toBe("");
    expect(body.tokens.access_token).toBeTruthy();
    expect(body.tokens.refresh_token).toBeTruthy();
  });

  it("повторный вход тем же email → is_new_user: false, пользователь тот же", async () => {
    const first = await loginViaOtp(t, EMAIL);
    expect(first.is_new_user).toBe(false);

    const second = await loginViaOtp(t, EMAIL);
    expect(second.user.id).toBe(first.user.id);
  });

  it("email нормализуется: вход с ДРУГИМ регистром — тот же аккаунт", async () => {
    const result = await loginViaOtp(t, "TEST@Example.COM");
    expect(result.is_new_user).toBe(false);
    expect(result.user.email).toBe(EMAIL);
  });

  it("неверный код → 401, верный после этого работает (попытки не исчерпаны)", async () => {
    await resetOtp(EMAIL);
    await post("/v1/auth/otp/request", { email: EMAIL });

    const wrong = await post("/v1/auth/otp/verify", { email: EMAIL, code: "000000" });
    expect(wrong.statusCode).toBe(401);
    expect(wrong.json().error.code).toBe("otp_wrong_code");

    const ok = await post("/v1/auth/otp/verify", { email: EMAIL, code: otpCodeFor(t.outbox, EMAIL) });
    expect(ok.statusCode).toBe(200);
  });

  it("код одноразовый: повторный verify тем же кодом → 401", async () => {
    await resetOtp(EMAIL);
    await post("/v1/auth/otp/request", { email: EMAIL });
    const code = otpCodeFor(t.outbox, EMAIL);

    expect((await post("/v1/auth/otp/verify", { email: EMAIL, code })).statusCode).toBe(200);
    const again = await post("/v1/auth/otp/verify", { email: EMAIL, code });
    expect(again.statusCode).toBe(401);
  });

  it("5 неверных попыток исчерпывают код — правильный после них тоже 401", async () => {
    await resetOtp(EMAIL);
    await post("/v1/auth/otp/request", { email: EMAIL });
    const code = otpCodeFor(t.outbox, EMAIL);
    const wrongCode = code === "111111" ? "222222" : "111111";

    for (let i = 0; i < 5; i++) {
      const res = await post("/v1/auth/otp/verify", { email: EMAIL, code: wrongCode });
      expect(res.statusCode).toBe(401);
    }
    const exhausted = await post("/v1/auth/otp/verify", { email: EMAIL, code });
    expect(exhausted.statusCode).toBe(401);
    expect(exhausted.json().error.code).toBe("otp_invalid_or_expired");
  });

  it("истёкший код → 401", async () => {
    await resetOtp(EMAIL);
    await post("/v1/auth/otp/request", { email: EMAIL });
    await t.app.db.update(emailOtps).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(emailOtps.email, EMAIL));

    const res = await post("/v1/auth/otp/verify", { email: EMAIL, code: otpCodeFor(t.outbox, EMAIL) });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("otp_invalid_or_expired");
  });

  it("повторный request в течение минуты → 429 с retry_after_sec", async () => {
    await resetOtp(EMAIL);
    expect((await post("/v1/auth/otp/request", { email: EMAIL })).statusCode).toBe(200);

    const res = await post("/v1/auth/otp/request", { email: EMAIL });
    expect(res.statusCode).toBe(429);
    const err = res.json().error;
    expect(err.code).toBe("otp_cooldown");
    expect(err.details.retry_after_sec).toBeGreaterThan(0);
  });

  it("новый request инвалидирует прежний код", async () => {
    await resetOtp(EMAIL);
    await post("/v1/auth/otp/request", { email: EMAIL });
    const oldCode = otpCodeFor(t.outbox, EMAIL);

    // кулдаун прошёл — пользователь запросил код ещё раз
    await t.app.db.update(emailOtps).set({ lastSentAt: new Date(Date.now() - 61_000) }).where(eq(emailOtps.email, EMAIL));
    await post("/v1/auth/otp/request", { email: EMAIL });
    const newCode = otpCodeFor(t.outbox, EMAIL);

    if (oldCode !== newCode) {
      const res = await post("/v1/auth/otp/verify", { email: EMAIL, code: oldCode });
      expect(res.statusCode).toBe(401);
    }
    expect((await post("/v1/auth/otp/verify", { email: EMAIL, code: newCode })).statusCode).toBe(200);
  });

  it("whoami по access-токену; без токена → 401", async () => {
    const { tokens } = await loginViaOtp(t, EMAIL);
    const whoami = await call({
      method: "GET",
      url: "/v1/auth/whoami",
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    expect(whoami.statusCode).toBe(200);
    expect(whoami.json().email).toBe(EMAIL);

    expect((await call({ method: "GET", url: "/v1/auth/whoami" })).statusCode).toBe(401);
  });

  it("refresh ротирует токен; старый становится недействительным и гасит все сессии", async () => {
    const { tokens } = await loginViaOtp(t, EMAIL);

    const refreshed = await post("/v1/auth/refresh", { refresh_token: tokens.refresh_token });
    expect(refreshed.statusCode).toBe(200);
    const newTokens = refreshed.json();
    expect(newTokens.refresh_token).not.toBe(tokens.refresh_token);

    // повторное использование старого = детекция кражи
    const reuse = await post("/v1/auth/refresh", { refresh_token: tokens.refresh_token });
    expect(reuse.statusCode).toBe(401);
    expect(reuse.json().error.code).toBe("refresh_token_reused");

    // новая цепочка тоже отозвана
    const after = await post("/v1/auth/refresh", { refresh_token: newTokens.refresh_token });
    expect(after.statusCode).toBe(401);
  });

  it("logout отзывает refresh-токен", async () => {
    const { tokens } = await loginViaOtp(t, EMAIL);

    const logout = await post("/v1/auth/logout", { refresh_token: tokens.refresh_token });
    expect(logout.statusCode).toBe(200);

    const res = await post("/v1/auth/refresh", { refresh_token: tokens.refresh_token });
    expect(res.statusCode).toBe(401);
  });

  it("PATCH /users/me добирает имя после первого входа", async () => {
    const result = await loginViaOtp(t, "named@test.ru");
    expect(result.is_new_user).toBe(true);

    const res = await call({
      method: "PATCH",
      url: "/v1/users/me",
      headers: { authorization: `Bearer ${result.tokens.access_token}` },
      payload: { first_name: "Евгений", last_name: "Черныш" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().first_name).toBe("Евгений");
    expect(res.json().last_name).toBe("Черныш");
  });

  it("деактивированный пользователь не может войти по коду", async () => {
    const { user } = await loginViaOtp(t, "banned@test.ru");
    const { users } = await import("../src/db/schema.ts");
    await t.app.db.update(users).set({ isActive: false }).where(eq(users.id, user.id));

    await resetOtp("banned@test.ru");
    await post("/v1/auth/otp/request", { email: "banned@test.ru" });
    const res = await post("/v1/auth/otp/verify", {
      email: "banned@test.ru",
      code: otpCodeFor(t.outbox, "banned@test.ru"),
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("user_deactivated");
  });
});
