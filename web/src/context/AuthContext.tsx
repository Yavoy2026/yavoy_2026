import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import * as api from "@/services/api";
import type { UserProfile, UpdateProfilePayload, ChangePasswordPayload } from "@/services/api";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserProfile["role"] | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (email: string, password: string, firstName: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
  updateMyProfile: (payload: UpdateProfilePayload) => Promise<UserProfile>;
  changeMyPassword: (payload: ChangePasswordPayload) => Promise<UserProfile>;
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

  const login = useCallback(
    async (email: string, password: string): Promise<UserProfile> => {
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
    ): Promise<UserProfile> => {
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
    async (payload: UpdateProfilePayload) => {
      if (!user) throw new Error("Not authenticated");
      const updated = await api.updateProfile(user.id, payload);
      setUser(updated);
      return updated;
    },
    [user],
  );

  const changeMyPassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      if (!user) throw new Error("Not authenticated");
      const updated = await api.changePassword(user.id, payload);
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
      login,
      register,
      logout,
      refreshUser,
      updateMyProfile,
      changeMyPassword,
      uploadMyPhoto,
      updateUserRole,
      activateUserById,
      deactivateUserById,
    }),
    [user, isLoading, login, register, logout, refreshUser, updateMyProfile, changeMyPassword, uploadMyPhoto, updateUserRole, activateUserById, deactivateUserById],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
