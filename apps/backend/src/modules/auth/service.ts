import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { and, eq, isNull } from "drizzle-orm";
import type { AuthResponse, SigninPayload, SignupPayload, Tokens, UserProfile } from "@yavoy/contracts";
import type { Db } from "../../db/client.ts";
import { refreshSessions, users } from "../../db/schema.ts";
import { conflict, unauthorized } from "../../errors.ts";
import {
  ACCESS_TTL_SEC,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TTL_SEC,
  signAccessToken,
} from "../../auth/tokens.ts";

type UserRow = typeof users.$inferSelect;

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

async function issueTokens(db: Db, user: UserRow, meta: { userAgent?: string; ip?: string }): Promise<Tokens> {
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

export async function signup(
  db: Db,
  payload: SignupPayload,
  meta: { userAgent?: string; ip?: string },
): Promise<AuthResponse> {
  const email = payload.email.toLowerCase().trim();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) throw conflict("email_taken", "Пользователь с таким email уже существует");

  const passwordHash = await argonHash(payload.password);
  const inserted = await db
    .insert(users)
    .values({ email, passwordHash, firstName: payload.first_name.trim() })
    .returning();
  const user = inserted[0]!;

  return { tokens: await issueTokens(db, user, meta), user: toProfile(user) };
}

export async function signin(
  db: Db,
  payload: SigninPayload,
  meta: { userAgent?: string; ip?: string },
): Promise<AuthResponse> {
  const email = payload.email.toLowerCase().trim();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  // argon2-проверка выполняется и для несуществующего пользователя — выравнивание времени ответа
  const valid = await argonVerify(
    user?.passwordHash ?? "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    payload.password,
  ).catch(() => false);

  if (!user || !valid) throw unauthorized("invalid_credentials", "Неверный email или пароль");
  if (!user.isActive) throw unauthorized("user_deactivated", "Аккаунт деактивирован");

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  return { tokens: await issueTokens(db, user, meta), user: toProfile(user) };
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
