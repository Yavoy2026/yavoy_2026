import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { PromoCode } from "@/types/tour";

const PROMOS_KEY = "yavoy_promo_codes";

function generatePromoCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "YAVOY-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const [PromoCodesProvider, usePromoCodes] = createContextHook(() => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const queryClient = useQueryClient();

  const promosQuery = useQuery({
    queryKey: ["promo_codes"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PROMOS_KEY);
      console.log("[PromoCodesProvider] Loaded promos:", stored ? JSON.parse(stored).length : 0);
      return stored ? (JSON.parse(stored) as PromoCode[]) : [];
    },
  });

  useEffect(() => {
    if (promosQuery.data) {
      setPromoCodes(promosQuery.data);
    }
  }, [promosQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (items: PromoCode[]) => {
      await AsyncStorage.setItem(PROMOS_KEY, JSON.stringify(items));
      return items;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["promo_codes"] });
    },
  });

  const generateNewPromo = useCallback(() => {
    const promo: PromoCode = {
      id: `promo-${Date.now()}`,
      code: generatePromoCode(),
      createdAt: new Date().toISOString().split("T")[0],
      activatedBy: [],
      earnedPoints: 0,
    };
    const updated = [promo, ...promoCodes];
    setPromoCodes(updated);
    syncMutation.mutate(updated);
    console.log("[PromoCodesProvider] Generated promo:", promo.code);
    return promo;
  }, [promoCodes, syncMutation]);

  const totalEarnedPoints = useMemo(
    () => promoCodes.reduce((sum, p) => sum + p.earnedPoints, 0),
    [promoCodes]
  );

  return useMemo(
    () => ({
      promoCodes,
      generateNewPromo,
      totalEarnedPoints,
      isLoading: promosQuery.isLoading,
    }),
    [promoCodes, generateNewPromo, totalEarnedPoints, promosQuery.isLoading]
  );
});
