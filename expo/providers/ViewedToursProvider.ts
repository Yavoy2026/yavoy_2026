import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";

const VIEWED_KEY = "yavoy_viewed_tours";

export const [ViewedToursProvider, useViewedTours] = createContextHook(() => {
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const viewedQuery = useQuery({
    queryKey: ["viewedTours"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(VIEWED_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    },
  });

  useEffect(() => {
    if (viewedQuery.data) {
      setViewedIds(viewedQuery.data);
    }
  }, [viewedQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await AsyncStorage.setItem(VIEWED_KEY, JSON.stringify(ids));
      return ids;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["viewedTours"] });
    },
  });

  const markViewed = useCallback(
    (tourId: string) => {
      if (!viewedIds.includes(tourId)) {
        const updated = [...viewedIds, tourId];
        setViewedIds(updated);
        syncMutation.mutate(updated);
        console.log("[ViewedTours] Marked as viewed:", tourId);
      }
    },
    [viewedIds, syncMutation]
  );

  const isViewed = useCallback(
    (tourId: string) => viewedIds.includes(tourId),
    [viewedIds]
  );

  return useMemo(
    () => ({
      viewedIds,
      markViewed,
      isViewed,
    }),
    [viewedIds, markViewed, isViewed]
  );
});
