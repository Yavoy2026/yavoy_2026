import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "https://yavay.ru/backend/api/v1";

const TOKENS_KEY = "yavoy_auth_tokens";

export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_refresh: string;
}

export interface UserProfile {
  id: string;
  email: string;
  is_active: boolean;
  role: "admin" | "user" | "moderator";
  first_name: string;
  last_name?: string | null;
  photo?: string | null;
  photo_min?: string | null;
  created_at: string;
  last_login?: string | null;
}

export interface SignupPayload {
  email: string;
  password: string;
  first_name: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

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

/**
 * Performs an authenticated API request. Automatically refreshes tokens on 401.
 */
async function authFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const tokens = await loadTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  let response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && tokens?.refresh_token) {
    try {
      const newTokens = await refreshTokens(tokens.refresh_token);
      headers["Authorization"] = `Bearer ${newTokens.access_token}`;
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
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
      const res = await fetch(
        `${API_BASE}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`,
      );
      if (!res.ok) {
        throw new Error("Token refresh failed");
      }
      const tokens = (await res.json()) as Tokens;
      await saveTokens(tokens);
      return tokens;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Public endpoints ────────────────────────────────────────

export async function ping(): Promise<{ status: string; environment: string }> {
  const res = await fetch(`${API_BASE}/ping`);
  if (!res.ok) throw new Error("Backend unreachable");
  return res.json() as Promise<{ status: string; environment: string }>;
}

// ─── Auth endpoints ──────────────────────────────────────────

export async function signin(
  email: string,
  password: string,
): Promise<Tokens> {
  const res = await fetch(`${API_BASE}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.detail ?? "Ошибка входа");
  }

  const tokens = (await res.json()) as Tokens;
  await saveTokens(tokens);
  return tokens;
}

export async function signup(payload: SignupPayload): Promise<Tokens> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.detail ?? "Ошибка регистрации");
  }

  const tokens = (await res.json()) as Tokens;
  await saveTokens(tokens);
  return tokens;
}

export async function whoami(): Promise<UserProfile> {
  const res = await authFetch("/auth/whoami");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.detail ?? "Не авторизован");
  }
  return res.json() as Promise<UserProfile>;
}

export async function logout(): Promise<void> {
  const tokens = await loadTokens();
  if (tokens?.refresh_token) {
    try {
      await fetch(
        `${API_BASE}/auth/logout?refresh_token=${encodeURIComponent(tokens.refresh_token)}`,
      );
    } catch {
      // ignore network errors during logout
    }
  }
  await clearTokens();
}

// ─── User endpoints ──────────────────────────────────────────

export async function updateProfile(
  userId: string,
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const res = await authFetch(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.detail ?? "Ошибка обновления профиля");
  }
  return res.json() as Promise<UserProfile>;
}

export async function changePassword(
  userId: string,
  payload: ChangePasswordPayload,
): Promise<UserProfile> {
  const res = await authFetch(`/users/${userId}/change-password`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.detail ?? "Ошибка смены пароля");
  }
  return res.json() as Promise<UserProfile>;
}

export async function updateRole(
  userId: string,
  role: "admin" | "user" | "moderator",
): Promise<UserProfile> {
  const res = await authFetch(`/users/${userId}/update-role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      err.detail ?? "Ошибка изменения роли",
    );
  }
  return res.json() as Promise<UserProfile>;
}

export async function activateUser(userId: string): Promise<UserProfile> {
  const res = await authFetch(`/users/${userId}/activate`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      err.detail ?? "Ошибка активации пользователя",
    );
  }
  return res.json() as Promise<UserProfile>;
}

export async function deactivateUser(userId: string): Promise<void> {
  const res = await authFetch(`/users/${userId}/deactivate`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      err.detail ?? "Ошибка деактивации пользователя",
    );
  }
}

export async function uploadPhoto(
  userId: string,
  file: { uri: string; name: string; type: string },
): Promise<UserProfile> {
  const tokens = await loadTokens();
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const res = await fetch(`${API_BASE}/users/${userId}/photo`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${tokens?.access_token ?? ""}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.detail ?? "Ошибка загрузки фото");
  }
  return res.json() as Promise<UserProfile>;
}

export function getPhotoUrl(filename: string): string {
  return `${API_BASE}/users/photo/${filename}`;
}

// ─── Helpers ─────────────────────────────────────────────────

export async function getStoredTokens(): Promise<Tokens | null> {
  return loadTokens();
}

export async function isAuthenticated(): Promise<boolean> {
  const tokens = await loadTokens();
  return tokens !== null && tokens.access_token.length > 0;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.name = "ApiError";
  }
}
