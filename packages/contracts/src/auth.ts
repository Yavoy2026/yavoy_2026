import { z } from "zod";

export const UserRoleSchema = z.enum(["user", "manager", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const TokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  access_expires_at: z.string(),
  refresh_expires_at: z.string(),
});
export type Tokens = z.infer<typeof TokensSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  is_active: z.boolean(),
  first_name: z.string(),
  last_name: z.string().nullable(),
  photo_url: z.string().nullable(),
  created_at: z.string(),
  last_login_at: z.string().nullable(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// Passwordless-вход: request шлёт 6-значный код на email, verify обменивает его на токены.
// Регистрация и вход — один флоу; is_new_user говорит клиенту спросить имя.
export const OtpRequestPayloadSchema = z.object({
  email: z.string().email().max(320),
});
export type OtpRequestPayload = z.infer<typeof OtpRequestPayloadSchema>;

export const OtpVerifyPayloadSchema = z.object({
  email: z.string().email().max(320),
  code: z.string().regex(/^\d{6}$/),
});
export type OtpVerifyPayload = z.infer<typeof OtpVerifyPayloadSchema>;

export const RefreshPayloadSchema = z.object({
  refresh_token: z.string().min(1),
});
export type RefreshPayload = z.infer<typeof RefreshPayloadSchema>;

export const AuthResponseSchema = z.object({
  tokens: TokensSchema,
  user: UserProfileSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const OtpVerifyResponseSchema = AuthResponseSchema.extend({
  is_new_user: z.boolean(),
});
export type OtpVerifyResponse = z.infer<typeof OtpVerifyResponseSchema>;

export const UpdateProfilePayloadSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().max(100).nullable().optional(),
});
export type UpdateProfilePayload = z.infer<typeof UpdateProfilePayloadSchema>;

// ─── Админ: управление пользователями ────────────────────────

export const AdminUpdateUserPayloadSchema = z.object({
  role: UserRoleSchema.optional(),
  is_active: z.boolean().optional(),
});
export type AdminUpdateUserPayload = z.infer<typeof AdminUpdateUserPayloadSchema>;

export const UserListResponseSchema = z.object({ items: z.array(UserProfileSchema) });
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
