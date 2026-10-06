import { Stack } from "expo-router";
import React from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { useT } from "@/providers/I18nProvider";

export default function ExploreStackLayout() {
  const { colors } = useTheme();
  const t = useT();
  console.log("[ExploreStackLayout] Rendering explore stack");
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" as const, fontSize: 17 },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: t("nav.explore"), headerShadowVisible: false }} />
    </Stack>
  );
}

