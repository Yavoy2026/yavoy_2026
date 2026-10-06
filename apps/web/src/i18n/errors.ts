import { ApiError } from "@/services/api";

import type { TKey } from "./keys";

type Translate = (key: TKey, params?: Record<string, string | number>) => string;

/**
 * Ошибки переводятся по стабильному коду, а не по тексту: сначала пробуем
 * `errors.<code>` (коды AppError бэкенда, BACKEND_SPEC §2), затем `api.<code>` —
 * туда сервисы кладут свой фолбэк, когда сервер кода не прислал.
 * message с сервера остаётся дев-фолбэком и в UI попадает только последним.
 */
export function translateError(error: unknown, t: Translate, fallbackKey: TKey = "errors.unknown"): string {
  const code = error instanceof ApiError ? error.code : (error as { code?: unknown } | null)?.code;
  if (typeof code === "string") {
    for (const key of [`errors.${code}`, `api.${code}`] as TKey[]) {
      const translated = t(key);
      if (translated !== key) return translated;
    }
  }
  const fallback = t(fallbackKey);
  if (fallback !== fallbackKey) return fallback;
  return error instanceof Error && error.message ? error.message : t("errors.unknown");
}
