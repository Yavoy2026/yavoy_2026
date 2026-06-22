import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { initialReels } from "@/data/reels";
import type { TravelReel } from "@/types";

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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => load<string[]>(FAV_KEY, ["1", "3"]));
  const [favoriteCities, setFavoriteCities] = useState<string[]>(() => load<string[]>(FAV_CITY_KEY, ["spb"]));
  const [points, setPoints] = useState<number>(() => load<number>(POINTS_KEY, 3450));
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => load<ThemeMode>(THEME_KEY, "light"));
  const [systemDark, setSystemDark] = useState<boolean>(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [reels, setReels] = useState<TravelReel[]>(initialReels);

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

  useEffect(() => { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem(FAV_CITY_KEY, JSON.stringify(favoriteCities)); }, [favoriteCities]);
  useEffect(() => { localStorage.setItem(POINTS_KEY, JSON.stringify(points)); }, [points]);
  useEffect(() => { localStorage.setItem(THEME_KEY, JSON.stringify(themeMode)); }, [themeMode]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavoriteCity = useCallback((id: string) => {
    setFavoriteCities((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const addPoints = useCallback((n: number) => setPoints((p) => p + n), []);

  const setThemeMode = useCallback((mode: ThemeMode) => setThemeModeState(mode), []);

  const submitReel = useCallback((input: { title: string; tourTitle: string; city: string }): number => {
    const reward = 500;
    const newReel: TravelReel = {
      id: `reel-${Date.now()}`,
      title: input.title || "Без названия",
      city: input.city || "—",
      tourTitle: input.tourTitle || "—",
      coverImage: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=900&fit=crop",
      author: "Вы",
      duration: "0:20",
      views: "0",
      likes: "0",
      viewsCount: 0,
      likesCount: 0,
      likedByMe: false,
      story: "Ваше видео отправлено на модерацию.",
      status: "moderation",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setReels((prev) => [newReel, ...prev]);
    setPoints((p) => p + reward);
    return reward;
  }, []);

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
