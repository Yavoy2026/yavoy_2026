import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InjectOptions } from "fastify";
import { createTestApp, loginViaOtp, signupWithRole, type TestApp } from "./helpers.ts";

let t: TestApp;
let adminToken: string;
let adminId: string;
let managerToken: string;
let userId: string;

async function call(opts: InjectOptions) {
  return t.app.inject(opts);
}

const authed = (token: string) => ({ authorization: `Bearer ${token}` });

beforeAll(async () => {
  t = await createTestApp();
  const admin = await signupWithRole(t, "root@test.ru", "admin");
  adminToken = admin.token;
  adminId = admin.id;
  managerToken = (await signupWithRole(t, "mgr@test.ru", "manager")).token;
  userId = (await signupWithRole(t, "mortal@test.ru", "user")).id;
});

afterAll(() => t.teardown());

describe("админ: пользователи", () => {
  it("список пользователей с поиском", async () => {
    const res = await call({ method: "GET", url: "/v1/admin/users?q=mortal", headers: authed(adminToken) });
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toHaveLength(1);
    expect(res.json().items[0].email).toBe("mortal@test.ru");
  });

  it("обычному пользователю список запрещён", async () => {
    const mortal = await loginViaOtp(t, "mortal@test.ru");
    const res = await call({
      method: "GET",
      url: "/v1/admin/users",
      headers: authed(mortal.tokens.access_token),
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
