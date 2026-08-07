/**
 * Клиент API YaVoy (apps/backend).
 * Прод-URL задаётся через VITE_API_URL при сборке.
 */
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/v1";

const TOKENS_KEY = "yavoy_auth_tokens_v2";

export interface Tokens {
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  refresh_expires_at: string;
}

export type UserRole = "user" | "partner" | "manager" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  first_name: string;
  last_name?: string | null;
  photo_url?: string | null;
  created_at: string;
  last_login_at?: string | null;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string | null;
}

export interface AuthResponse {
  tokens: Tokens;
  user: UserProfile;
}

export interface OtpVerifyResult {
  user: UserProfile;
  is_new_user: boolean;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
  }
}

async function throwApiError(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => null)) as {
    error?: { code?: string; message?: string; details?: Record<string, unknown> };
  } | null;
  throw new ApiError(
    res.status,
    body?.error?.code ?? "unknown",
    body?.error?.message ?? fallback,
    body?.error?.details,
  );
}

// ─── Token storage (localStorage) ────────────────────────────

let refreshPromise: Promise<Tokens> | null = null;

function saveTokens(tokens: Tokens): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

function loadTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

function clearTokens(): void {
  localStorage.removeItem(TOKENS_KEY);
}

// ─── HTTP core ───────────────────────────────────────────────

function baseHeaders(options: RequestInit): Record<string, string> {
  return {
    // Content-Type только при наличии тела: fastify отклоняет пустой JSON-body
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, { ...options, headers: baseHeaders(options) });
}

/** Авторизованный запрос с прозрачным refresh при 401 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const tokens = loadTokens();
  const headers: Record<string, string> = baseHeaders(options);
  if (tokens?.access_token) headers["Authorization"] = `Bearer ${tokens.access_token}`;

  let response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401 && tokens?.refresh_token) {
    try {
      const newTokens = await refreshTokens(tokens.refresh_token);
      headers["Authorization"] = `Bearer ${newTokens.access_token}`;
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      clearTokens();
    }
  }

  return response;
}

async function refreshTokens(refreshToken: string): Promise<Tokens> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await apiFetch("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) throw new Error("Token refresh failed");
      const tokens = (await res.json()) as Tokens;
      saveTokens(tokens);
      return tokens;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Auth endpoints ──────────────────────────────────────────

/** Шаг 1 passwordless-входа: отправить 6-значный код на email */
export async function requestOtp(email: string): Promise<void> {
  const res = await apiFetch("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) await throwApiError(res, "Не удалось отправить код");
}

/** Шаг 2: обменять код на токены; is_new_user — спросить имя */
export async function verifyOtp(email: string, code: string): Promise<OtpVerifyResult> {
  const res = await apiFetch("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) await throwApiError(res, "Неверный код");
  const body = (await res.json()) as AuthResponse & { is_new_user: boolean };
  saveTokens(body.tokens);
  return { user: body.user, is_new_user: body.is_new_user };
}

export async function whoami(): Promise<UserProfile> {
  const res = await authFetch("/auth/whoami");
  if (!res.ok) await throwApiError(res, "Не авторизован");
  return res.json() as Promise<UserProfile>;
}

export async function logout(): Promise<void> {
  const tokens = loadTokens();
  if (tokens?.refresh_token) {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      });
    } catch {
      // сеть недоступна — локально всё равно выходим
    }
  }
  clearTokens();
}

// ─── User endpoints ──────────────────────────────────────────

export async function updateProfile(
  _userId: string,
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const res = await authFetch("/users/me", { method: "PATCH", body: JSON.stringify(payload) });
  if (!res.ok) await throwApiError(res, "Ошибка обновления профиля");
  return res.json() as Promise<UserProfile>;
}

/** Загрузка фото профиля появится вместе с S3-хранилищем (backlog) */
export async function uploadPhoto(_userId: string, _file: File): Promise<UserProfile> {
  throw new ApiError(501, "not_implemented", "Загрузка фото профиля появится в следующей версии");
}

// ─── Admin endpoints ─────────────────────────────────────────

export async function listUsers(q?: string): Promise<UserProfile[]> {
  const res = await authFetch(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  if (!res.ok) await throwApiError(res, "Не удалось загрузить пользователей");
  const body = (await res.json()) as { items: UserProfile[] };
  return body.items;
}

async function patchUser(
  userId: string,
  payload: { role?: UserRole; is_active?: boolean },
): Promise<UserProfile> {
  const res = await authFetch(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, "Не удалось обновить пользователя");
  return res.json() as Promise<UserProfile>;
}

export async function updateRole(userId: string, role: UserRole): Promise<UserProfile> {
  return patchUser(userId, { role });
}

export async function activateUser(userId: string): Promise<UserProfile> {
  return patchUser(userId, { is_active: true });
}

export async function deactivateUser(userId: string): Promise<void> {
  await patchUser(userId, { is_active: false });
}

// ─── Helpers ─────────────────────────────────────────────────

export async function getStoredTokens(): Promise<Tokens | null> {
  return loadTokens();
}
