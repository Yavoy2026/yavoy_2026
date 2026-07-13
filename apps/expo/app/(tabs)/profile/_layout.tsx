import { Stack } from "expo-router";
import React from "react";
import { useTheme } from "@/providers/ThemeProvider";

export default function ProfileStackLayout() {
  const { colors } = useTheme();
  console.log("[ProfileStackLayout] Rendering profile stack");
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" as const, fontSize: 17 },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Личный кабинет", headerShadowVisible: false }} />
    </Stack>
  );
}

