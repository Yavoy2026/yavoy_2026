import { Tabs } from "expo-router";
import { Compass, Heart, User, Map } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useScrollToTop } from "@/providers/ScrollToTopProvider";

export default function TabLayout() {
  const { colors } = useTheme();
  const { trigger } = useScrollToTop();
  console.log("[TabLayout] Rendering tabs");
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          ...(Platform.OS === "web" ? { height: 60 } : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        listeners={{
          tabPress: () => {
            trigger();
          },
        }}
        options={{
          title: "Экскурсии",
          tabBarIcon: ({ color, size }) => (
            <Compass size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Направления",
          tabBarIcon: ({ color, size }) => (
            <Map size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Избранное",
          tabBarIcon: ({ color, size }) => (
            <Heart size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color, size }) => (
            <User size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

