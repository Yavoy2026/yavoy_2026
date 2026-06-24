import { useState, useEffect, useMemo, useCallback } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { lightColors, darkColors, ThemeColors } from "@/constants/colors";

export type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "yavoy_theme_mode";

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const queryClient = useQueryClient();

  const themeQuery = useQuery({
    queryKey: ["theme_mode"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      console.log("[ThemeProvider] Loaded theme mode:", stored);
      return (stored as ThemeMode) || "dark";
    },
  });

  useEffect(() => {
    if (themeQuery.data) {
      setThemeMode(themeQuery.data);
    }
  }, [themeQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (mode: ThemeMode) => {
      await AsyncStorage.setItem(THEME_KEY, mode);
      return mode;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["theme_mode"] });
    },
  });

  const setTheme = useCallback(
    (mode: ThemeMode) => {
      console.log("[ThemeProvider] Setting theme to:", mode);
      setThemeMode(mode);
      syncMutation.mutate(mode);
    },
    [syncMutation]
  );

  const isDark = useMemo(() => {
    if (themeMode === "system") {
      return systemScheme === "dark";
    }
    return themeMode === "dark";
  }, [themeMode, systemScheme]);

  const colors: ThemeColors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  return useMemo(
    () => ({
      themeMode,
      setTheme,
      isDark,
      colors,
      isLoading: themeQuery.isLoading,
    }),
    [themeMode, setTheme, isDark, colors, themeQuery.isLoading]
  );
});
