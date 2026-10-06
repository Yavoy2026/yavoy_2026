import { Stack } from "expo-router";
import React from "react";
import { useTheme } from "@/providers/ThemeProvider";

export default function HomeStackLayout() {
  const { colors } = useTheme();
  console.log("[HomeStackLayout] Rendering home stack");
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}

