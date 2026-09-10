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
import { SupportProvider } from "@/providers/SupportProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { I18nProvider, useI18n, useT } from "@/providers/I18nProvider";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ThemedStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusBarStyle} />;
}

function RootLayoutNav() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Stack
      screenOptions={{
        headerBackTitle: t("common.back"),
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
      <Stack.Screen name="legal" options={{ presentation: "card", animation: "slide_from_right" }} />
      <Stack.Screen name="partner" options={{ presentation: "card", animation: "slide_from_right" }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

/**
 * Сплэш держим до ответа GET /v1/config: язык приходит с сервера, и без этого
 * первый кадр мигал бы фолбэком (YAV-25).
 */
function SplashGate({ children }: { children: React.ReactNode }) {
  const { ready } = useI18n();
  useEffect(() => {
    if (!ready) return;
    console.log("[RootLayout] i18n ready, hiding splash screen");
    void SplashScreen.hideAsync();
  }, [ready]);
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <I18nProvider>
        <SplashGate>
        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
              <FavoriteCitiesProvider>
                <LocationProvider>
                  <ViewedToursProvider>
                    <BookingsProvider>
                      <LoyaltyProvider>
                        <CertificatesProvider>
                          <PromoCodesProvider>
                            <ReelsProvider>
                              <SupportProvider>
                                <ScrollToTopProvider>
                                  <ThemedStatusBar />
                                  <RootLayoutNav />
                                </ScrollToTopProvider>
                              </SupportProvider>
                            </ReelsProvider>
                          </PromoCodesProvider>
                        </CertificatesProvider>
                      </LoyaltyProvider>
                    </BookingsProvider>
                  </ViewedToursProvider>
                </LocationProvider>
              </FavoriteCitiesProvider>
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
        </SplashGate>
        </I18nProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
