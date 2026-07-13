import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createTestApp } from "./helpers.ts";

let app: FastifyInstance;
let teardown: () => Promise<void>;

beforeAll(async () => {
  ({ app, teardown } = await createTestApp());
});

afterAll(() => teardown());

const CREDS = { email: "test@example.com", password: "secret-password-1", first_name: "Евгений" };

import type { InjectOptions } from "fastify";

async function call(opts: InjectOptions) {
  const res = await app.inject(opts);
  return res;
}

function post(url: string, payload: Record<string, unknown>) {
  return call({ method: "POST", url, payload });
}

describe("auth-флоу", () => {
  it("signup выдаёт токены и профиль", async () => {
    const res = await post("/v1/auth/signup", CREDS);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.email).toBe(CREDS.email);
    expect(body.user.role).toBe("user");
    expect(body.tokens.access_token).toBeTruthy();
    expect(body.tokens.refresh_token).toBeTruthy();
  });

  it("повторный signup с тем же email → 409", async () => {
    const res = await post("/v1/auth/signup", CREDS);
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("email_taken");
  });

  it("signin с неверным паролем → 401 без утечки причины", async () => {
    const res = await post("/v1/auth/signin", { email: CREDS.email, password: "wrong-password" });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("invalid_credentials");
  });

  it("signin → whoami по access-токену", async () => {
    const signin = await post("/v1/auth/signin", { email: CREDS.email, password: CREDS.password });
    expect(signin.statusCode).toBe(200);
    const { tokens } = signin.json();

    const whoami = await call({
      method: "GET",
      url: "/v1/auth/whoami",
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    expect(whoami.statusCode).toBe(200);
    expect(whoami.json().email).toBe(CREDS.email);
  });

  it("whoami без токена → 401", async () => {
    const res = await call({ method: "GET", url: "/v1/auth/whoami" });
    expect(res.statusCode).toBe(401);
  });

  it("refresh ротирует токен; старый становится недействительным и гасит все сессии", async () => {
    const signin = await post("/v1/auth/signin", { email: CREDS.email, password: CREDS.password });
    const { tokens } = signin.json();

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
    const signin = await post("/v1/auth/signin", { email: CREDS.email, password: CREDS.password });
    const { tokens } = signin.json();

    const logout = await post("/v1/auth/logout", { refresh_token: tokens.refresh_token });
    expect(logout.statusCode).toBe(200);

    const res = await post("/v1/auth/refresh", { refresh_token: tokens.refresh_token });
    expect(res.statusCode).toBe(401);
  });

  it("PATCH /users/me обновляет профиль", async () => {
    const signin = await post("/v1/auth/signin", { email: CREDS.email, password: CREDS.password });
    const { tokens } = signin.json();

    const res = await call({
      method: "PATCH",
      url: "/v1/users/me",
      headers: { authorization: `Bearer ${tokens.access_token}` },
      payload: { last_name: "Черныш" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().last_name).toBe("Черныш");
  });

  it("смена пароля: старый перестаёт работать", async () => {
    const signin = await post("/v1/auth/signin", { email: CREDS.email, password: CREDS.password });
    const { tokens } = signin.json();

    const change = await call({
      method: "PATCH",
      url: "/v1/users/me/password",
      headers: { authorization: `Bearer ${tokens.access_token}` },
      payload: { old_password: CREDS.password, new_password: "new-password-123" },
    });
    expect(change.statusCode).toBe(200);

    const oldSignin = await post("/v1/auth/signin", { email: CREDS.email, password: CREDS.password });
    expect(oldSignin.statusCode).toBe(401);

    const newSignin = await post("/v1/auth/signin", { email: CREDS.email, password: "new-password-123" });
    expect(newSignin.statusCode).toBe(200);
  });
});
