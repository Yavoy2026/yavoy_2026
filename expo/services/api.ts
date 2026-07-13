import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * Базовый URL API YaVoy (apps/backend).
 * Для устройства в локальной сети задайте EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000/v1
 */
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:3000/v1" : "http://localhost:3000/v1");

const TOKENS_KEY = "yavoy_auth_tokens_v2";

export interface Tokens {
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  refresh_expires_at: string;
}

export type UserRole = "user" | "manager" | "admin";

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

export interface SignupPayload {
  email: string;
  password: string;
  first_name: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string | null;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export interface AuthResponse {
  tokens: Tokens;
  user: UserProfile;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ApiError";
  }
}

async function throwApiError(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => null)) as {
    error?: { code?: string; message?: string };
  } | null;
  throw new ApiError(res.status, body?.error?.code ?? "unknown", body?.error?.message ?? fallback);
}

// ─── Token storage ───────────────────────────────────────────

let cachedTokens: Tokens | null = null;
let refreshPromise: Promise<Tokens> | null = null;

async function saveTokens(tokens: Tokens): Promise<void> {
  cachedTokens = tokens;
  await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

async function loadTokens(): Promise<Tokens | null> {
  if (cachedTokens) return cachedTokens;
  try {
    const raw = await AsyncStorage.getItem(TOKENS_KEY);
    if (raw) {
      cachedTokens = JSON.parse(raw) as Tokens;
      return cachedTokens;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

async function clearTokens(): Promise<void> {
  cachedTokens = null;
  await AsyncStorage.removeItem(TOKENS_KEY);
}

// ─── HTTP core ───────────────────────────────────────────────

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string>) },
  });
}

/** Авторизованный запрос с прозрачным refresh при 401 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const tokens = await loadTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (tokens?.access_token) headers["Authorization"] = `Bearer ${tokens.access_token}`;

  let response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401 && tokens?.refresh_token) {
    try {
      const newTokens = await refreshTokens(tokens.refresh_token);
      headers["Authorization"] = `Bearer ${newTokens.access_token}`;
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      await clearTokens();
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
      await saveTokens(tokens);
      return tokens;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Auth endpoints ──────────────────────────────────────────

export async function signin(email: string, password: string): Promise<UserProfile> {
  const res = await apiFetch("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) await throwApiError(res, "Ошибка входа");
  const body = (await res.json()) as AuthResponse;
  await saveTokens(body.tokens);
  return body.user;
}

export async function signup(payload: SignupPayload): Promise<UserProfile> {
  const res = await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, "Ошибка регистрации");
  const body = (await res.json()) as AuthResponse;
  await saveTokens(body.tokens);
  return body.user;
}

export async function whoami(): Promise<UserProfile> {
  const res = await authFetch("/auth/whoami");
  if (!res.ok) await throwApiError(res, "Не авторизован");
  return res.json() as Promise<UserProfile>;
}

export async function logout(): Promise<void> {
  const tokens = await loadTokens();
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
  await clearTokens();
}

// ─── User endpoints ──────────────────────────────────────────

export async function updateProfile(
  _userId: string,
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const res = await authFetch("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, "Ошибка обновления профиля");
  return res.json() as Promise<UserProfile>;
}

export async function changePassword(
  _userId: string,
  payload: ChangePasswordPayload,
): Promise<UserProfile> {
  const res = await authFetch("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, "Ошибка смены пароля");
  return res.json() as Promise<UserProfile>;
}

/** Загрузка фото профиля появится вместе с S3-хранилищем (backlog) */
export async function uploadPhoto(
  _userId: string,
  _file: { uri: string; name: string; type: string },
): Promise<UserProfile> {
  throw new ApiError(501, "not_implemented", "Загрузка фото профиля появится в следующей версии");
}

// ─── Helpers ─────────────────────────────────────────────────

export async function getStoredTokens(): Promise<Tokens | null> {
  return loadTokens();
}

export async function isAuthenticated(): Promise<boolean> {
  const tokens = await loadTokens();
  return tokens !== null && tokens.access_token.length > 0;
}
