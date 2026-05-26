import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Heart } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useFavoriteCities } from "@/providers/FavoriteCitiesProvider";
import { City } from "@/types/tour";

interface CitySelectorProps {
  cities: City[];
  selectedCity: string | null;
  onSelectCity: (cityId: string | null) => void;
}

export default React.memo(function CitySelector({
  cities,
  selectedCity,
  onSelectCity,
}: CitySelectorProps) {
  const { colors } = useTheme();
  const { isCityFavorite, toggleFavoriteCity } = useFavoriteCities();

  const handlePress = useCallback(
    (cityId: string) => {
      onSelectCity(selectedCity === cityId ? null : cityId);
    },
    [selectedCity, onSelectCity]
  );

  const handleFavoritePress = useCallback(
    (cityId: string) => {
      toggleFavoriteCity(cityId);
    },
    [toggleFavoriteCity]
  );

  const sortedCities = useMemo(() => {
    const favs = cities.filter((c) => isCityFavorite(c.id));
    const rest = cities.filter((c) => !isCityFavorite(c.id));
    return [...favs, ...rest];
  }, [cities, isCityFavorite]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {sortedCities.map((city) => {
          const isActive = selectedCity === city.id;
          const isFav = isCityFavorite(city.id);
          return (
            <TouchableOpacity
              key={city.id}
              style={[styles.cityCard, isActive && styles.cityCardActive]}
              onPress={() => handlePress(city.id)}
              activeOpacity={0.8}
              testID={`city-${city.id}`}
            >
              <Image
                source={{ uri: city.image }}
                style={styles.cityImage}
                contentFit="cover"
                transition={200}
              />
              <View style={[styles.cityOverlay, isActive && styles.cityOverlayActive]} />
              {isActive ? <View style={[styles.activeBorder, { borderColor: colors.teal }]} /> : null}

              <Pressable
                style={styles.favButton}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleFavoritePress(city.id);
                }}
                hitSlop={6}
                testID={`city-fav-${city.id}`}
              >
                <Heart
                  size={16}
                  color="#fff"
                  fill={isFav ? "#E8B931" : "transparent"}
                  strokeWidth={2}
                />
              </Pressable>

              <View style={styles.cityInfo}>
                <Text style={styles.cityEmoji}>{city.emoji}</Text>
                <Text style={styles.cityName}>{city.name}</Text>
                <Text style={styles.cityCount}>{`${city.tourCount} туров`}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  cityCard: {
    width: 110,
    height: 130,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  cityCardActive: {},
  cityImage: {
    width: "100%",
    height: "100%",
  },
  cityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cityOverlayActive: {
    backgroundColor: "rgba(15, 163, 177, 0.45)",
  },
  activeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
    borderRadius: 16,
  },
  favButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  cityInfo: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  cityEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  cityName: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cityCount: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500" as const,
    marginTop: 1,
  },
});
