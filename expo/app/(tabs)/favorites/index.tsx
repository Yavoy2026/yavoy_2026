import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Heart, MapPin, ChevronRight } from "lucide-react-native";
import { Image } from "expo-image";
import { useTheme } from "@/providers/ThemeProvider";
import { tours } from "@/mocks/tours";
import { cities } from "@/mocks/cities";
import { useFavorites } from "@/providers/FavoritesProvider";
import { useFavoriteCities } from "@/providers/FavoriteCitiesProvider";
import TourCard from "@/components/TourCard";
import { City } from "@/types/tour";

type TabType = "tours" | "cities";

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { favoriteIds } = useFavorites();
  const { favoriteCityIds, toggleFavoriteCity } = useFavoriteCities();
  const [activeTab, setActiveTab] = useState<TabType>("tours");

  const favoriteTours = useMemo(
    () => tours.filter((t) => favoriteIds.includes(t.id)),
    [favoriteIds]
  );

  const favoriteCities = useMemo(
    () => cities.filter((c) => favoriteCityIds.includes(c.id)),
    [favoriteCityIds]
  );

  console.log("[FavoritesScreen] Tours:", favoriteIds.length, "Cities:", favoriteCityIds.length);

  const handleTourPress = useCallback((tourId: string) => {
    const tourIds = favoriteTours.map((t) => t.id);
    router.push({ pathname: "/tour-detail", params: { tourId, tourIds: tourIds.join(",") } });
  }, [favoriteTours, router]);

  const totalCount = favoriteTours.length + favoriteCities.length;

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <Heart size={40} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {activeTab === "tours" ? "Нет избранных экскурсий" : "Нет избранных городов"}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        {activeTab === "tours"
          ? "Нажмите на сердечко на карточке экскурсии, чтобы добавить её в избранное"
          : "Отметьте города как избранные, чтобы они появились здесь"}
      </Text>
    </View>
  ), [colors, activeTab]);

  const handleCityPress = useCallback((cityId: string) => {
    console.log("[FavoritesScreen] Navigate to home with city:", cityId);
    router.push({ pathname: "/", params: { cityId } });
  }, [router]);

  const renderCityCard = useCallback(({ item }: { item: City }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleCityPress(item.id)}
      style={[styles.cityCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}
    >
      <Image source={{ uri: item.image }} style={styles.cityImage} contentFit="cover" transition={200} />
      <View style={styles.cityContent}>
        <View style={styles.cityInfo}>
          <Text style={styles.cityEmoji}>{item.emoji}</Text>
          <View style={styles.cityTextBlock}>
            <Text style={[styles.cityName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.cityDescription, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text>
          </View>
        </View>
        <View style={styles.cityActions}>
          <View style={[styles.tourCountBadge, { backgroundColor: colors.tealSoft }]}>
            <MapPin size={11} color={colors.teal} />
            <Text style={[styles.tourCountText, { color: colors.teal }]}>{`${item.tourCount} туров`}</Text>
          </View>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); toggleFavoriteCity(item.id); }}
            style={[styles.cityHeartBtn, { backgroundColor: colors.surfaceSecondary }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart size={16} color={colors.coral} fill={colors.coral} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [colors, toggleFavoriteCity, handleCityPress]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "tours" && { backgroundColor: colors.teal },
            activeTab !== "tours" && { backgroundColor: colors.surfaceSecondary },
          ]}
          onPress={() => setActiveTab("tours")}
          testID="tab-tours"
        >
          <Heart size={14} color={activeTab === "tours" ? "#FFFFFF" : colors.textMuted} />
          <Text style={[
            styles.tabText,
            { color: activeTab === "tours" ? "#FFFFFF" : colors.textMuted },
          ]}>
            {`Экскурсии${favoriteTours.length > 0 ? ` (${favoriteTours.length})` : ""}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "cities" && { backgroundColor: colors.teal },
            activeTab !== "cities" && { backgroundColor: colors.surfaceSecondary },
          ]}
          onPress={() => setActiveTab("cities")}
          testID="tab-cities"
        >
          <MapPin size={14} color={activeTab === "cities" ? "#FFFFFF" : colors.textMuted} />
          <Text style={[
            styles.tabText,
            { color: activeTab === "cities" ? "#FFFFFF" : colors.textMuted },
          ]}>
            {`Города${favoriteCities.length > 0 ? ` (${favoriteCities.length})` : ""}`}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "tours" ? (
        <FlatList
          data={favoriteTours}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TourCard tour={item} onPress={() => handleTourPress(item.id)} compact />}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          testID="favorites-tours-list"
        />
      ) : (
        <FlatList
          data={favoriteCities}
          keyExtractor={(item) => item.id}
          renderItem={renderCityCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          testID="favorites-cities-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  listContent: { paddingTop: 8, paddingBottom: 20, flexGrow: 1 },
  cityCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  cityImage: {
    width: "100%",
    height: 140,
  },
  cityContent: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  cityEmoji: {
    fontSize: 28,
  },
  cityTextBlock: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  cityDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  cityActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tourCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tourCountText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  cityHeartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center" as const,
    lineHeight: 20,
  },
});

