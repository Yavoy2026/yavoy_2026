import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";

const FAVORITES_KEY = "yavoy_favorites";

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    },
  });

  useEffect(() => {
    if (favoritesQuery.data) {
      setFavoriteIds(favoritesQuery.data);
    }
  }, [favoritesQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
      return ids;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const toggleFavorite = useCallback(
    (tourId: string) => {
      const updated = favoriteIds.includes(tourId)
        ? favoriteIds.filter((id) => id !== tourId)
        : [...favoriteIds, tourId];
      setFavoriteIds(updated);
      syncMutation.mutate(updated);
    },
    [favoriteIds, syncMutation]
  );

  const isFavorite = useCallback(
    (tourId: string) => favoriteIds.includes(tourId),
    [favoriteIds]
  );

  return useMemo(
    () => ({
      favoriteIds,
      toggleFavorite,
      isFavorite,
      isLoading: favoritesQuery.isLoading,
    }),
    [favoriteIds, toggleFavorite, isFavorite, favoritesQuery.isLoading]
  );
});
