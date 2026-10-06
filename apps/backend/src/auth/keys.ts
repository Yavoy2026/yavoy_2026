import type { webcrypto } from "node:crypto";
import { exportPKCS8, exportSPKI, generateKeyPair, importPKCS8, importSPKI } from "jose";
import { env } from "../env.ts";

export interface JwtKeys {
  privateKey: webcrypto.CryptoKey;
  publicKey: webcrypto.CryptoKey;
}

let keysPromise: Promise<JwtKeys> | null = null;

/**
 * В production ключи обязаны прийти из env (проверяется в env.ts).
 * В dev/test при отсутствии — эфемерная пара на время процесса.
 */
export function getJwtKeys(): Promise<JwtKeys> {
  keysPromise ??= (async () => {
    if (env.JWT_PRIVATE_KEY_PEM && env.JWT_PUBLIC_KEY_PEM) {
      return {
        privateKey: await importPKCS8(env.JWT_PRIVATE_KEY_PEM, "RS256"),
        publicKey: await importSPKI(env.JWT_PUBLIC_KEY_PEM, "RS256"),
      };
    }
    const pair = await generateKeyPair("RS256");
    return { privateKey: pair.privateKey, publicKey: pair.publicKey };
  })();
  return keysPromise;
}

/** Для scripts/gen-keys.ts */
export async function exportKeyPair(): Promise<{ privatePem: string; publicPem: string }> {
  const pair = await generateKeyPair("RS256", { extractable: true });
  return {
    privatePem: await exportPKCS8(pair.privateKey),
    publicPem: await exportSPKI(pair.publicKey),
  };
}
