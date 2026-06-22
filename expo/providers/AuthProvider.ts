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

  const login = useCallback(
    async (email: string, password: string): Promise<api.UserProfile> => {
      await api.signin(email, password);
      const profile = await api.whoami();
      setUser(profile);
      return profile;
    },
    [],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
    ): Promise<api.UserProfile> => {
      await api.signup({ email, password, first_name: firstName });
      const profile = await api.whoami();
      setUser(profile);
      return profile;
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

  const changeMyPassword = useCallback(
    async (payload: api.ChangePasswordPayload) => {
      if (!user) throw new Error("Not authenticated");
      const updated = await api.changePassword(user.id, payload);
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
    login: typeof login;
    register: typeof register;
    logout: typeof logout;
    refreshUser: typeof refreshUser;
    updateMyProfile: typeof updateMyProfile;
    changeMyPassword: typeof changeMyPassword;
    uploadMyPhoto: typeof uploadMyPhoto;
  }>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null && user.is_active,
      role: user?.role ?? null,
      login,
      register,
      logout,
      refreshUser,
      updateMyProfile,
      changeMyPassword,
      uploadMyPhoto,
    }),
    [user, isLoading, login, register, logout, refreshUser, updateMyProfile, changeMyPassword, uploadMyPhoto],
  );

  return value;
});
