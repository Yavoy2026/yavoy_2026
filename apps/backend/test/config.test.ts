import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createTestApp, type TestApp } from "./helpers.ts";

let t: TestApp;
beforeAll(async () => {
  t = await createTestApp();
});
afterAll(() => t.teardown());

describe("GET /v1/config", () => {
  it("отдаёт язык по умолчанию и список языков без авторизации", async () => {
    const res = await t.app.inject({ method: "GET", url: "/v1/config" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { default_locale: string; supported_locales: string[] };
    // дефолт env — en; тесты не задают DEFAULT_LOCALE
    expect(body.default_locale).toBe("en");
    expect(body.supported_locales).toEqual(["ru", "en", "uz"]);
    // дефолт обязан быть выбираемым в переключателе
    expect(body.supported_locales).toContain(body.default_locale);
  });
});

describe("письма", () => {
  it("уходят на языке MAIL_LOCALE (в тестах — ru)", async () => {
    const res = await t.app.inject({
      method: "POST",
      url: "/v1/auth/otp/request",
      payload: { email: "mail-locale@example.com" },
    });
    expect(res.statusCode).toBe(200);
    const mail = t.outbox.at(-1);
    expect(mail?.subject).toBe("Код входа в YaVoy");
    expect(mail?.text).toContain("Ваш код для входа:");
  });
});
