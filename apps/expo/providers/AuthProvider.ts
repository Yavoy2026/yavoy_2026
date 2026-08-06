import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import * as api from "@/services/api";
import type { UserProfile } from "@/services/api";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserProfile["role"] | null;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
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

  /** Шаг 2: обменять код на сессию; is_new_user — экран «Как вас зовут?» */
  const verifyOtp = useCallback(
    async (email: string, code: string): Promise<api.OtpVerifyResult> => {
      const result = await api.verifyOtp(email, code);
      setUser(result.user);
      return result;
    },
    [],
  );

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
    async (payload: api.UpdateProfilePayload) => {
      if (!user) throw new Error("Not authenticated");
      const updated = await api.updateProfile(user.id, payload);
      setUser(updated);
      return updated;
    },
    [user],
  );

  const uploadMyPhoto = useCallback(
    async (file: { uri: string; name: string; type: string }) => {
      if (!user) throw new Error("Not authenticated");
      const updated = await api.uploadPhoto(user.id, file);
      setUser(updated);
      return updated;
    },
    [user],
  );

  const value = useMemo<AuthState & {
    requestOtp: typeof requestOtp;
    verifyOtp: typeof verifyOtp;
    logout: typeof logout;
    refreshUser: typeof refreshUser;
    updateMyProfile: typeof updateMyProfile;
    uploadMyPhoto: typeof uploadMyPhoto;
  }>(
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
    }),
    [user, isLoading, requestOtp, verifyOtp, logout, refreshUser, updateMyProfile, uploadMyPhoto],
  );

  return value;
});
