import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";

const LOYALTY_KEY = "yavoy_loyalty_points";

export const [LoyaltyProvider, useLoyalty] = createContextHook(() => {
  const [points, setPoints] = useState<number>(0);
  const queryClient = useQueryClient();

  const loyaltyQuery = useQuery({
    queryKey: ["loyalty_points"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(LOYALTY_KEY);
      console.log("[LoyaltyProvider] Loaded points:", stored);
      return stored ? parseInt(stored, 10) : 0;
    },
  });

  useEffect(() => {
    if (loyaltyQuery.data !== undefined) {
      setPoints(loyaltyQuery.data);
    }
  }, [loyaltyQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (newPoints: number) => {
      await AsyncStorage.setItem(LOYALTY_KEY, String(newPoints));
      return newPoints;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["loyalty_points"] });
    },
  });

  const addPointsFromPurchase = useCallback(
    (amount: number) => {
      const earned = Math.floor(amount / 1000) * 50;
      if (earned > 0) {
        const updated = points + earned;
        setPoints(updated);
        syncMutation.mutate(updated);
        console.log("[LoyaltyProvider] Earned", earned, "points from purchase of", amount);
      }
      return earned;
    },
    [points, syncMutation]
  );

  const addPromoPoints = useCallback(
    (amount: number) => {
      const updated = points + amount;
      setPoints(updated);
      syncMutation.mutate(updated);
      console.log("[LoyaltyProvider] Added promo points:", amount);
    },
    [points, syncMutation]
  );

  return useMemo(
    () => ({
      points,
      addPointsFromPurchase,
      addPromoPoints,
      isLoading: loyaltyQuery.isLoading,
    }),
    [points, addPointsFromPurchase, addPromoPoints, loyaltyQuery.isLoading]
  );
});
