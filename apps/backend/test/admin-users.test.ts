import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { FastifyInstance, InjectOptions } from "fastify";
import * as schema from "../src/db/schema.ts";
import { createTestApp } from "./helpers.ts";

let app: FastifyInstance;
let teardown: () => Promise<void>;
let adminToken: string;
let adminId: string;
let managerToken: string;
let userId: string;

async function call(opts: InjectOptions) {
  const res = await app.inject(opts);
  return res;
}

const authed = (token: string) => ({ authorization: `Bearer ${token}` });

async function signupWithRole(email: string, role: "user" | "manager" | "admin") {
  const res = await call({
    method: "POST",
    url: "/v1/auth/signup",
    payload: { email, password: "password-123", first_name: email.split("@")[0]! },
  });
  const id = res.json().user.id as string;
  if (role !== "user") {
    await app.db.update(schema.users).set({ role }).where(eq(schema.users.id, id));
    const relogin = await call({
      method: "POST",
      url: "/v1/auth/signin",
      payload: { email, password: "password-123" },
    });
    return { id, token: relogin.json().tokens.access_token as string };
  }
  return { id, token: res.json().tokens.access_token as string };
}

beforeAll(async () => {
  ({ app, teardown } = await createTestApp());
  const admin = await signupWithRole("root@test.ru", "admin");
  adminToken = admin.token;
  adminId = admin.id;
  managerToken = (await signupWithRole("mgr@test.ru", "manager")).token;
  userId = (await signupWithRole("mortal@test.ru", "user")).id;
});

afterAll(() => teardown());

describe("админ: пользователи", () => {
  it("список пользователей с поиском", async () => {
    const res = await call({ method: "GET", url: "/v1/admin/users?q=mortal", headers: authed(adminToken) });
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toHaveLength(1);
    expect(res.json().items[0].email).toBe("mortal@test.ru");
  });

  it("обычному пользователю список запрещён", async () => {
    const mortal = await call({
      method: "POST",
      url: "/v1/auth/signin",
      payload: { email: "mortal@test.ru", password: "password-123" },
    });
    const res = await call({
      method: "GET",
      url: "/v1/admin/users",
      headers: authed(mortal.json().tokens.access_token),
    });
    expect(res.statusCode).toBe(403);
  });

  it("админ меняет роль, менеджер — не может", async () => {
    const byManager = await call({
      method: "PATCH",
      url: `/v1/admin/users/${userId}`,
      headers: authed(managerToken),
      payload: { role: "manager" },
    });
    expect(byManager.statusCode).toBe(403);

    const byAdmin = await call({
      method: "PATCH",
      url: `/v1/admin/users/${userId}`,
      headers: authed(adminToken),
      payload: { role: "manager" },
    });
    expect(byAdmin.statusCode).toBe(200);
    expect(byAdmin.json().role).toBe("manager");
  });

  it("менеджер может деактивировать пользователя", async () => {
    const res = await call({
      method: "PATCH",
      url: `/v1/admin/users/${userId}`,
      headers: authed(managerToken),
      payload: { is_active: false },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().is_active).toBe(false);
  });

  it("себя менять нельзя", async () => {
    const res = await call({
      method: "PATCH",
      url: `/v1/admin/users/${adminId}`,
      headers: authed(adminToken),
      payload: { is_active: false },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("cannot_modify_self");
  });
});
