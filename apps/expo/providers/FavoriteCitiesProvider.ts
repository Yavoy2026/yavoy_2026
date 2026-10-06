import { useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { useSyncedFavorites } from "@/providers/useSyncedFavorites";

export const [FavoriteCitiesProvider, useFavoriteCities] = createContextHook(() => {
  const { ids, toggle, has, isLoading } = useSyncedFavorites("cities", "yavoy_favorite_cities");

  return useMemo(
    () => ({
      favoriteCityIds: ids,
      toggleFavoriteCity: toggle,
      isCityFavorite: has,
      isLoading,
    }),
    [ids, toggle, has, isLoading],
  );
});
