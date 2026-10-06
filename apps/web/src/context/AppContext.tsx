import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { addFavorite, fetchFavorites, removeFavorite, type FavoriteKind } from "@/services/social";
import { initialReels } from "@/data/reels";
import { FEATURES } from "@/features";
import type { TravelReel } from "@/types";
import { useI18n } from "@/i18n/I18nProvider";

type ThemeMode = "light" | "dark" | "system";

interface AppContextValue {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  favoriteCities: string[];
  toggleFavoriteCity: (id: string) => void;
  points: number;
  addPoints: (n: number) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  reels: TravelReel[];
  publishedReels: TravelReel[];
  moderationReels: TravelReel[];
  submitReel: (input: { title: string; tourTitle: string; city: string }) => number;
  toggleReelLike: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const FAV_KEY = "yavoy_favorites";
const FAV_CITY_KEY = "yavoy_favorite_cities";
const POINTS_KEY = "yavoy_points";
const THEME_KEY = "yavoy_theme";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Избранное: гость — localStorage, авторизованный — сервер
 * (общий кэш ["favorites"], при входе локальное мигрирует на сервер).
 */
function useSyncedFavorites(kind: FavoriteKind, storageKey: string) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [localIds, setLocalIds] = useState<string[]>(() => load<string[]>(storageKey, []));
  const mergedRef = useRef(false);

  const serverQuery = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
  const serverIds = serverQuery.data?.[kind];

  useEffect(() => {
    if (!isAuthenticated) {
      mergedRef.current = false;
      return;
    }
    if (mergedRef.current || !serverIds) return;
    mergedRef.current = true;
    const missing = localIds.filter((id) => !serverIds.includes(id));
    if (missing.length === 0) return;
    void Promise.allSettled(missing.map((id) => addFavorite(kind, id))).then(() => {
      localStorage.removeItem(storageKey);
      setLocalIds([]);
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    });
  }, [isAuthenticated, serverIds, localIds, kind, storageKey, queryClient]);

  const ids = useMemo(
    () => (isAuthenticated ? serverIds ?? [] : localIds),
    [isAuthenticated, serverIds, localIds],
  );

  const toggle = useCallback(
    (id: string) => {
      const adding = !ids.includes(id);
      if (!isAuthenticated) {
        const updated = adding ? [...localIds, id] : localIds.filter((x) => x !== id);
        setLocalIds(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return;
      }
      queryClient.setQueryData<{ tours: string[]; cities: string[] }>(["favorites"], (prev) => {
        const base = prev ?? { tours: [], cities: [] };
        return { ...base, [kind]: adding ? [...base[kind], id] : base[kind].filter((x) => x !== id) };
      });
      void (adding ? addFavorite(kind, id) : removeFavorite(kind, id)).catch(() => {
        void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      });
    },
    [ids, isAuthenticated, localIds, kind, storageKey, queryClient],
  );

  return { ids, toggle };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { ids: favorites, toggle: toggleFavoriteSynced } = useSyncedFavorites("tours", FAV_KEY);
  const { ids: favoriteCities, toggle: toggleFavoriteCity } = useSyncedFavorites("cities", FAV_CITY_KEY);
  const [points, setPoints] = useState<number>(() => load<number>(POINTS_KEY, 3450));
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => load<ThemeMode>(THEME_KEY, "dark"));
  const [systemDark, setSystemDark] = useState<boolean>(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [reels, setReels] = useState<TravelReel[]>(initialReels);
  const { t } = useI18n();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isDark = themeMode === "dark" || (themeMode === "system" && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => { localStorage.setItem(POINTS_KEY, JSON.stringify(points)); }, [points]);
  useEffect(() => { localStorage.setItem(THEME_KEY, JSON.stringify(themeMode)); }, [themeMode]);

  const toggleFavorite = toggleFavoriteSynced;

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);


  const addPoints = useCallback((n: number) => setPoints((p) => p + n), []);

  const setThemeMode = useCallback((mode: ThemeMode) => setThemeModeState(mode), []);

  const submitReel = useCallback((input: { title: string; tourTitle: string; city: string }): number => {
    const reward = 500;
    const newReel: TravelReel = {
      id: `reel-${Date.now()}`,
      title: input.title || t("profile.reelUntitled"),
      city: input.city || "—",
      tourTitle: input.tourTitle || "—",
      coverImage: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=900&fit=crop",
      author: t("profile.reelAuthorSelf"),
      duration: "0:20",
      views: "0",
      likes: "0",
      viewsCount: 0,
      likesCount: 0,
      likedByMe: false,
      story: t("profile.reelPendingStory"),
      status: "moderation",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setReels((prev) => [newReel, ...prev]);
    // не начисляем в выключенный счётчик: пока нет бэкенда лояльности,
    // тихое начисление в localStorage только создаёт видимость награды (YAV-33)
    if (FEATURES.loyaltyPoints) setPoints((p) => p + reward);
    return reward;
  }, [t]);

  const toggleReelLike = useCallback((id: string) => {
    setReels((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, likedByMe: !r.likedByMe, likesCount: r.likedByMe ? r.likesCount - 1 : r.likesCount + 1 }
          : r,
      ),
    );
  }, []);

  const publishedReels = useMemo(() => reels.filter((r) => r.status === "published"), [reels]);
  const moderationReels = useMemo(() => reels.filter((r) => r.status === "moderation"), [reels]);

  const value = useMemo<AppContextValue>(
    () => ({
      favorites, toggleFavorite, isFavorite,
      favoriteCities, toggleFavoriteCity,
      points, addPoints,
      themeMode, setThemeMode, isDark,
      reels, publishedReels, moderationReels, submitReel, toggleReelLike,
    }),
    [favorites, toggleFavorite, isFavorite, favoriteCities, toggleFavoriteCity, points, addPoints, themeMode, setThemeMode, isDark, reels, publishedReels, moderationReels, submitReel, toggleReelLike],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
