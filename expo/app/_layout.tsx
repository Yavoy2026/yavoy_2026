import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { FavoritesProvider } from "@/providers/FavoritesProvider";
import { FavoriteCitiesProvider } from "@/providers/FavoriteCitiesProvider";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { LocationProvider } from "@/providers/LocationProvider";
import { ViewedToursProvider } from "@/providers/ViewedToursProvider";
import { ScrollToTopProvider } from "@/providers/ScrollToTopProvider";
import { BookingsProvider } from "@/providers/BookingsProvider";
import { LoyaltyProvider } from "@/providers/LoyaltyProvider";
import { CertificatesProvider } from "@/providers/CertificatesProvider";
import { PromoCodesProvider } from "@/providers/PromoCodesProvider";
import { ReelsProvider } from "@/providers/ReelsProvider";
import { AdminProvider } from "@/providers/AdminProvider";
import { SupportProvider } from "@/providers/SupportProvider";
import { PartnersProvider } from "@/providers/PartnersProvider";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ThemedStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusBarStyle} />;
}

function RootLayoutNav() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Назад",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="tour-detail"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen name="admin" options={{ presentation: "card", animation: "slide_from_right" }} />
      <Stack.Screen
        name="reels"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
          contentStyle: { backgroundColor: "#000000" },
        }}
      />
      <Stack.Screen name="support" options={{ presentation: "card", animation: "slide_from_right" }} />
      <Stack.Screen name="partner" options={{ presentation: "card", animation: "slide_from_right" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    console.log("[RootLayout] App mounted, hiding splash screen");
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <FavoritesProvider>
            <FavoriteCitiesProvider>
              <LocationProvider>
                <ViewedToursProvider>
                  <BookingsProvider>
                    <LoyaltyProvider>
                      <CertificatesProvider>
                        <PromoCodesProvider>
                          <ReelsProvider>
                            <AdminProvider>
                              <SupportProvider>
                                <PartnersProvider>
                                <ScrollToTopProvider>
                                  <ThemedStatusBar />
                                  <RootLayoutNav />
                                </ScrollToTopProvider>
                                </PartnersProvider>
                              </SupportProvider>
                            </AdminProvider>
                          </ReelsProvider>
                        </PromoCodesProvider>
                      </CertificatesProvider>
                    </LoyaltyProvider>
                  </BookingsProvider>
                </ViewedToursProvider>
              </LocationProvider>
            </FavoriteCitiesProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
