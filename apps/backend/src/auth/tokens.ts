import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import type { UserRole } from "@yavoy/contracts";
import { getJwtKeys } from "./keys.ts";

export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_SEC = 30 * 24 * 60 * 60;

export interface AccessClaims {
  sub: string;
  role: UserRole;
}

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  const { privateKey } = await getJwtKeys();
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "RS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(privateKey);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { publicKey } = await getJwtKeys();
  const { payload } = await jwtVerify(token, publicKey);
  return { sub: payload.sub as string, role: payload.role as UserRole };
}

export function generateRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(48).toString("base64url");
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
