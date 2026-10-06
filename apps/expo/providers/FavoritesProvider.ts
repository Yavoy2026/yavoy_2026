import { useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { useSyncedFavorites } from "@/providers/useSyncedFavorites";

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const { ids, toggle, has, isLoading } = useSyncedFavorites("tours", "yavoy_favorites");

  return useMemo(
    () => ({
      favoriteIds: ids,
      toggleFavorite: toggle,
      isFavorite: has,
      isLoading,
    }),
    [ids, toggle, has, isLoading],
  );
});
