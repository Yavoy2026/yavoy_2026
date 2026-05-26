import { useState, useEffect, useCallback, useMemo } from "react";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { cities } from "@/mocks/cities";

const LOCATION_ASKED_KEY = "yavoy_location_asked";
const DETECTED_CITY_KEY = "yavoy_detected_city";

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestCity(lat: number, lng: number): string | null {
  let minDist = Infinity;
  let nearest: string | null = null;
  for (const city of cities) {
    if (city.lat == null || city.lng == null) continue;
    const dist = getDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = city.id;
    }
  }
  if (minDist > 300) return null;
  return nearest;
}

function requestWebGeolocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log("[Location] Web geolocation not available");
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("[Location] Web position:", pos.coords.latitude, pos.coords.longitude);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        console.log("[Location] Web geolocation error:", err.message);
        resolve(null);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}

async function requestNativeGeolocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const Location = await import("expo-location");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("[Location] Permission denied");
      return null;
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    console.log("[Location] Native position:", position.coords.latitude, position.coords.longitude);
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch (e) {
    console.log("[Location] Native geolocation error:", e);
    return null;
  }
}

export const [LocationProvider, useLocation] = createContextHook(() => {
  const [detectedCityId, setDetectedCityId] = useState<string | null>(null);
  const [locationAsked, setLocationAsked] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  const askedQuery = useQuery({
    queryKey: ["location_asked"],
    queryFn: async () => {
      const asked = await AsyncStorage.getItem(LOCATION_ASKED_KEY);
      const savedCity = await AsyncStorage.getItem(DETECTED_CITY_KEY);
      console.log("[LocationProvider] Loaded asked:", asked, "city:", savedCity);
      return { asked: asked === "true", savedCity };
    },
  });

  useEffect(() => {
    if (askedQuery.data) {
      setLocationAsked(askedQuery.data.asked);
      if (askedQuery.data.savedCity) {
        setDetectedCityId(askedQuery.data.savedCity);
      }
    }
  }, [askedQuery.data]);

  const detectLocation = useCallback(async () => {
    console.log("[LocationProvider] Starting location detection");
    setIsDetecting(true);
    try {
      let coords: { lat: number; lng: number } | null = null;
      if (Platform.OS === "web") {
        coords = await requestWebGeolocation();
      } else {
        coords = await requestNativeGeolocation();
      }

      if (coords) {
        const cityId = findNearestCity(coords.lat, coords.lng);
        console.log("[LocationProvider] Nearest city:", cityId);
        if (cityId) {
          setDetectedCityId(cityId);
          await AsyncStorage.setItem(DETECTED_CITY_KEY, cityId);
        }
      }
      await AsyncStorage.setItem(LOCATION_ASKED_KEY, "true");
      setLocationAsked(true);
    } catch (e) {
      console.log("[LocationProvider] Detection error:", e);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const dismissLocationPrompt = useCallback(async () => {
    await AsyncStorage.setItem(LOCATION_ASKED_KEY, "true");
    setLocationAsked(true);
  }, []);

  const clearDetectedCity = useCallback(() => {
    setDetectedCityId(null);
    void AsyncStorage.removeItem(DETECTED_CITY_KEY);
  }, []);

  return useMemo(
    () => ({
      detectedCityId,
      locationAsked,
      isDetecting,
      detectLocation,
      dismissLocationPrompt,
      clearDetectedCity,
      isLoading: askedQuery.isLoading,
    }),
    [detectedCityId, locationAsked, isDetecting, detectLocation, dismissLocationPrompt, clearDetectedCity, askedQuery.isLoading]
  );
});
