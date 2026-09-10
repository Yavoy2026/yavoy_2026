import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";

export type Currency = "UZS" | "USD";

/** Курс пересчёта сум → доллар США для отображения цен. */
export const USD_RATE = 12900;

const CURRENCY_KEY = "yavay_currency";

export function formatPriceWith(amountUzs: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${Math.round(amountUzs / USD_RATE).toLocaleString("ru-RU")}`;
  }
  return `${amountUzs.toLocaleString("ru-RU")} сум`;
}

export const [CurrencyProvider, useCurrency] = createContextHook(() => {
  const [currency, setCurrency] = useState<Currency>("UZS");

  const currencyQuery = useQuery({
    queryKey: ["currency"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CURRENCY_KEY);
      return (stored as Currency) || "UZS";
    },
  });

  useEffect(() => {
    if (currencyQuery.data) {
      setCurrency(currencyQuery.data);
    }
  }, [currencyQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (next: Currency) => {
      await AsyncStorage.setItem(CURRENCY_KEY, next);
      return next;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["currency"] });
    },
  });

  const queryClient = useQueryClient();

  const update = useCallback(
    (next: Currency) => {
      setCurrency(next);
      syncMutation.mutate(next);
    },
    [syncMutation]
  );

  const toggleCurrency = useCallback(() => {
    update(currency === "UZS" ? "USD" : "UZS");
  }, [currency, update]);

  const formatPrice = useCallback(
    (amountUzs: number) => formatPriceWith(amountUzs, currency),
    [currency]
  );

  return useMemo(
    () => ({
      currency,
      setCurrency: update,
      toggleCurrency,
      formatPrice,
    }),
    [currency, update, toggleCurrency, formatPrice]
  );
});
