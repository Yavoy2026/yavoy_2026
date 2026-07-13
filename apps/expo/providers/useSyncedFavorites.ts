import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { addFavorite, fetchFavorites, type FavoriteKind } from "@/services/social";
import { removeFavorite } from "@/services/social";

/**
 * Общая логика избранного (туры/города):
 * гость — AsyncStorage; авторизованный — сервер (GET /me/favorites, общий кэш ["favorites"]);
 * при входе локальные id один раз мигрируют на сервер.
 */
export function useSyncedFavorites(kind: FavoriteKind, storageKey: string) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [localIds, setLocalIds] = useState<string[]>([]);
  const mergedRef = useRef<boolean>(false);

  useEffect(() => {
    void AsyncStorage.getItem(storageKey).then((stored) => {
      if (stored) setLocalIds(JSON.parse(stored) as string[]);
    });
  }, [storageKey]);

  const serverQuery = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const serverIds = serverQuery.data?.[kind];

  // Миграция гостевого избранного при входе (один раз за сессию)
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
      void AsyncStorage.removeItem(storageKey);
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
        void AsyncStorage.setItem(storageKey, JSON.stringify(updated));
        return;
      }

      // оптимистичное обновление общего кэша; при ошибке — рефетч
      queryClient.setQueryData<{ tours: string[]; cities: string[] }>(["favorites"], (prev) => {
        const base = prev ?? { tours: [], cities: [] };
        const current = base[kind];
        return {
          ...base,
          [kind]: adding ? [...current, id] : current.filter((x) => x !== id),
        };
      });
      void (adding ? addFavorite(kind, id) : removeFavorite(kind, id)).catch(() => {
        void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      });
    },
    [ids, isAuthenticated, localIds, kind, storageKey, queryClient],
  );

  return {
    ids,
    toggle,
    has: useCallback((id: string) => ids.includes(id), [ids]),
    isLoading: isAuthenticated && serverQuery.isLoading,
  };
}
