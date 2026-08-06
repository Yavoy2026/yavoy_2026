import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import * as api from "@/services/api";
import type { UserProfile, UpdateProfilePayload, OtpVerifyResult } from "@/services/api";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserProfile["role"] | null;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<OtpVerifyResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
  updateMyProfile: (payload: UpdateProfilePayload) => Promise<UserProfile>;
  uploadMyPhoto: (file: File) => Promise<UserProfile>;
  updateUserRole: (userId: string, role: UserProfile["role"]) => Promise<UserProfile>;
  activateUserById: (userId: string) => Promise<UserProfile>;
  deactivateUserById: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const tokens = await api.getStoredTokens();
      if (!tokens?.access_token) {
        setUser(null);
        return;
      }
      const profile = await api.whoami();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  /** Шаг 1: отправить код на email (может кинуть ApiError otp_cooldown c details.retry_after_sec) */
  const requestOtp = useCallback(async (email: string): Promise<void> => {
    await api.requestOtp(email);
  }, []);

  /** Шаг 2: обменять код на сессию; is_new_user — спросить имя */
  const verifyOtp = useCallback(async (email: string, code: string): Promise<OtpVerifyResult> => {
    const result = await api.verifyOtp(email, code);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.whoami();
      setUser(profile);
      return profile;
    } catch {
      return null;
    }
  }, []);

  const updateMyProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!user) throw new Error("Not authenticated");
      const updated = await api.updateProfile(user.id, payload);
      setUser(updated);
      return updated;
    },
    [user],
  );

  const uploadMyPhoto = useCallback(
    async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      const updated = await api.uploadPhoto(user.id, file);
      setUser(updated);
      return updated;
    },
    [user],
  );

  const updateUserRole = useCallback(
    async (userId: string, role: UserProfile["role"]) => {
      const updated = await api.updateRole(userId, role);
      if (user?.id === userId) setUser(updated);
      return updated;
    },
    [user],
  );

  const activateUserById = useCallback(
    async (userId: string) => {
      const updated = await api.activateUser(userId);
      if (user?.id === userId) setUser(updated);
      return updated;
    },
    [user],
  );

  const deactivateUserById = useCallback(
    async (userId: string) => {
      await api.deactivateUser(userId);
      if (user?.id === userId) setUser(null);
    },
    [user],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null && user.is_active,
      role: user?.role ?? null,
      requestOtp,
      verifyOtp,
      logout,
      refreshUser,
      updateMyProfile,
      uploadMyPhoto,
      updateUserRole,
      activateUserById,
      deactivateUserById,
    }),
    [user, isLoading, requestOtp, verifyOtp, logout, refreshUser, updateMyProfile, uploadMyPhoto, updateUserRole, activateUserById, deactivateUserById],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
