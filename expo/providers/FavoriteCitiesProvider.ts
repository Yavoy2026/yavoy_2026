import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";

const FAV_CITIES_KEY = "yavoy_favorite_cities";

export const [FavoriteCitiesProvider, useFavoriteCities] = createContextHook(() => {
  const [favoriteCityIds, setFavoriteCityIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["favorite_cities"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FAV_CITIES_KEY);
      console.log("[FavoriteCitiesProvider] Loaded:", stored);
      return stored ? (JSON.parse(stored) as string[]) : [];
    },
  });

  useEffect(() => {
    if (query.data) {
      setFavoriteCityIds(query.data);
    }
  }, [query.data]);

  const syncMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await AsyncStorage.setItem(FAV_CITIES_KEY, JSON.stringify(ids));
      return ids;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorite_cities"] });
    },
  });

  const toggleFavoriteCity = useCallback(
    (cityId: string) => {
      const updated = favoriteCityIds.includes(cityId)
        ? favoriteCityIds.filter((id) => id !== cityId)
        : [...favoriteCityIds, cityId];
      console.log("[FavoriteCitiesProvider] Toggle city:", cityId, "->", updated);
      setFavoriteCityIds(updated);
      syncMutation.mutate(updated);
    },
    [favoriteCityIds, syncMutation]
  );

  const isCityFavorite = useCallback(
    (cityId: string) => favoriteCityIds.includes(cityId),
    [favoriteCityIds]
  );

  return useMemo(
    () => ({
      favoriteCityIds,
      toggleFavoriteCity,
      isCityFavorite,
      isLoading: query.isLoading,
    }),
    [favoriteCityIds, toggleFavoriteCity, isCityFavorite, query.isLoading]
  );
});
