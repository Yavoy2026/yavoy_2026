import { createHash, randomInt } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import type { OtpVerifyPayload, OtpVerifyResponse, Tokens, UserProfile } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { emailOtps, refreshSessions, users } from "../../db/schema.ts";
import { tooManyRequests, unauthorized } from "../../errors.ts";
import type { Mailer } from "../../mail/mailer.ts";
import { otpMail } from "../../mail/mailer.ts";
import {
  ACCESS_TTL_SEC,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TTL_SEC,
  signAccessToken,
} from "../../auth/tokens.ts";

type UserRow = typeof users.$inferSelect;
// Совместим и с Db, и с транзакцией внутри db.transaction
type DbLike = Pick<Db, "select" | "insert" | "update" | "delete">;

export const OTP_TTL_SEC = 600;
export const OTP_RESEND_COOLDOWN_SEC = 60;
export const OTP_MAX_ATTEMPTS = 5;

export function toProfile(u: UserRow): UserProfile {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    is_active: u.isActive,
    first_name: u.firstName,
    last_name: u.lastName,
    photo_url: null, // S3 — backlog
    created_at: u.createdAt.toISOString(),
    last_login_at: u.lastLoginAt?.toISOString() ?? null,
  };
}

async function issueTokens(db: DbLike, user: UserRow, meta: { userAgent?: string; ip?: string }): Promise<Tokens> {
  const now = Date.now();
  const { token, hash } = generateRefreshToken();
  const refreshExpires = new Date(now + REFRESH_TTL_SEC * 1000);

  await db.insert(refreshSessions).values({
    userId: user.id,
    tokenHash: hash,
    expiresAt: refreshExpires,
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  return {
    access_token: await signAccessToken({ sub: user.id, role: user.role }),
    refresh_token: token,
    access_expires_at: new Date(now + ACCESS_TTL_SEC * 1000).toISOString(),
    refresh_expires_at: refreshExpires.toISOString(),
  };
}

const normalizeEmail = (raw: string) => raw.toLowerCase().trim();

// Хэшируем вместе с email: код из чужого письма бесполезен даже при утечке таблицы
const hashOtpCode = (email: string, code: string) =>
  createHash("sha256").update(`${email}:${code}`).digest("hex");

export async function requestOtp(db: Db, mailer: Mailer, rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  const now = new Date();

  const existing = await db.select().from(emailOtps).where(eq(emailOtps.email, email)).limit(1);
  const lastSentAt = existing[0]?.lastSentAt;
  if (lastSentAt) {
    const elapsedSec = Math.floor((now.getTime() - lastSentAt.getTime()) / 1000);
    if (elapsedSec < OTP_RESEND_COOLDOWN_SEC) {
      throw tooManyRequests("otp_cooldown", "Код уже отправлен, подождите минуту", {
        retry_after_sec: OTP_RESEND_COOLDOWN_SEC - elapsedSec,
      });
    }
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  // Один активный код на email: upsert перезаписывает прежний вместе с попытками
  await db
    .insert(emailOtps)
    .values({
      email,
      codeHash: hashOtpCode(email, code),
      expiresAt: new Date(now.getTime() + OTP_TTL_SEC * 1000),
      attemptsLeft: OTP_MAX_ATTEMPTS,
      lastSentAt: now,
    })
    .onConflictDoUpdate({
      target: emailOtps.email,
      set: {
        codeHash: hashOtpCode(email, code),
        expiresAt: new Date(now.getTime() + OTP_TTL_SEC * 1000),
        attemptsLeft: OTP_MAX_ATTEMPTS,
        lastSentAt: now,
      },
    });

  await mailer.send(otpMail({ to: email, code }));
}

export async function verifyOtp(
  db: Db,
  payload: OtpVerifyPayload,
  meta: { userAgent?: string; ip?: string },
): Promise<OtpVerifyResponse> {
  const email = normalizeEmail(payload.email);
  const codeHash = hashOtpCode(email, payload.code);

  // Шаг 1: атомарно списать попытку. Условный UPDATE (как reserveSeats) держит лимит под гонками.
  const rows = await db
    .update(emailOtps)
    .set({ attemptsLeft: sql`${emailOtps.attemptsLeft} - 1` })
    .where(and(eq(emailOtps.email, email), gt(emailOtps.attemptsLeft, 0), gt(emailOtps.expiresAt, new Date())))
    .returning();
  const otp = rows[0];
  // Не различаем «нет кода» / «истёк» / «попытки кончились» — не даём oracle перебору
  if (!otp) throw unauthorized("otp_invalid_or_expired", "Код недействителен, запросите новый");
  if (otp.codeHash !== codeHash) throw unauthorized("otp_wrong_code", "Неверный код");

  return db.transaction(async (tx) => {
    // DELETE по (email, hash): в гонке двух verify код достаётся ровно одному
    const deleted = await tx
      .delete(emailOtps)
      .where(and(eq(emailOtps.email, email), eq(emailOtps.codeHash, codeHash)))
      .returning({ email: emailOtps.email });
    if (deleted.length === 0) throw unauthorized("otp_invalid_or_expired", "Код недействителен, запросите новый");

    let user = (await tx.select().from(users).where(eq(users.email, email)).limit(1))[0];
    const isNew = !user;
    if (!user) {
      // Имя добирается клиентом после первого входа (PATCH /users/me)
      const inserted = await tx.insert(users).values({ email, firstName: "" }).onConflictDoNothing().returning();
      user = inserted[0] ?? (await tx.select().from(users).where(eq(users.email, email)).limit(1))[0]!;
    }
    if (!user.isActive) throw unauthorized("user_deactivated", "Аккаунт деактивирован");

    await tx.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    return { tokens: await issueTokens(tx, user, meta), user: toProfile(user), is_new_user: isNew };
  });
}

export async function refresh(
  db: Db,
  refreshToken: string,
  meta: { userAgent?: string; ip?: string },
): Promise<Tokens> {
  const tokenHash = hashRefreshToken(refreshToken);
  const rows = await db.select().from(refreshSessions).where(eq(refreshSessions.tokenHash, tokenHash)).limit(1);
  const session = rows[0];

  if (!session) throw unauthorized("invalid_refresh_token", "Недействительный refresh-токен");

  // Повторное использование ротированного токена = признак кражи: гасим все сессии пользователя
  if (session.revokedAt) {
    await db
      .update(refreshSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshSessions.userId, session.userId), isNull(refreshSessions.revokedAt)));
    throw unauthorized("refresh_token_reused", "Сессия отозвана из соображений безопасности");
  }
  if (session.expiresAt < new Date()) throw unauthorized("refresh_token_expired", "Сессия истекла");

  const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const user = userRows[0];
  if (!user || !user.isActive) throw unauthorized("user_deactivated", "Аккаунт деактивирован");

  const tokens = await issueTokens(db, user, meta);
  await db
    .update(refreshSessions)
    .set({ revokedAt: new Date(), replacedBy: null })
    .where(eq(refreshSessions.id, session.id));

  return tokens;
}

export async function logout(db: Db, refreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken);
  await db
    .update(refreshSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshSessions.tokenHash, tokenHash), isNull(refreshSessions.revokedAt)));
}

export async function getUserById(db: Db, id: string): Promise<UserRow | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}
