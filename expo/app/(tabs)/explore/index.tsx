import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MapPin, TrendingUp, Star, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { cities } from "@/mocks/cities";
import { tours } from "@/mocks/tours";
import { cityNameMap } from "@/mocks/cities";
import CategoryGrid from "@/components/CategoryGrid";

export default function ExploreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  console.log("[ExploreScreen] Rendering with filters:", { selectedTransport, selectedInterest, selectedDuration });

  const filteredTours = useMemo(() => {
    let result = tours;
    if (selectedTransport) result = result.filter((t) => t.transport === selectedTransport);
    if (selectedInterest) result = result.filter((t) => t.interest === selectedInterest);
    if (selectedDuration) result = result.filter((t) => t.duration === selectedDuration);
    return result;
  }, [selectedTransport, selectedInterest, selectedDuration]);

  const topRatedTours = useMemo(() =>
    [...tours].sort((a, b) => b.organizer.rating - a.organizer.rating).slice(0, 5),
  []);

  const handleCityPress = useCallback((cityId: string) => {
    console.log("[ExploreScreen] City pressed:", cityId);
    router.push("/");
  }, [router]);

  const handleTourPress = useCallback((tourId: string) => {
    console.log("[ExploreScreen] Tour pressed:", tourId);
    router.push({ pathname: "/tour-detail", params: { tourId, tourIds: tourId } });
  }, [router]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.citiesSection}>
        <View style={styles.sectionHeader}>
          <MapPin size={18} color={colors.teal} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Популярные города"}</Text>
        </View>
        <View style={styles.citiesGrid}>
          {cities.map((city) => (
            <TouchableOpacity
              key={city.id}
              style={styles.cityCard}
              onPress={() => handleCityPress(city.id)}
              activeOpacity={0.8}
              testID={`explore-city-${city.id}`}
            >
              <Image source={{ uri: city.image }} style={styles.cityImage} contentFit="cover" transition={200} />
              <View style={styles.cityOverlay} />
              <View style={styles.cityInfo}>
                <Text style={styles.cityEmoji}>{city.emoji}</Text>
                <Text style={styles.cityName}>{city.name}</Text>
                <Text style={styles.cityDesc} numberOfLines={1}>{city.description}</Text>
                <View style={styles.cityTourCount}>
                  <Text style={styles.cityTourCountText}>{`${city.tourCount} туров`}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <CategoryGrid
        type="duration"
        selected={selectedDuration}
        onSelect={setSelectedDuration}
        title="По длительности"
      />

      <CategoryGrid
        type="transport"
        selected={selectedTransport}
        onSelect={setSelectedTransport}
        title="По транспорту"
      />

      <CategoryGrid
        type="interest"
        selected={selectedInterest}
        onSelect={setSelectedInterest}
        title="По интересам"
      />

      {(selectedTransport || selectedInterest || selectedDuration) ? (
        <View style={[styles.filteredSection, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <View style={styles.filteredHeader}>
            <Text style={[styles.filteredTitle, { color: colors.text }]}>{"Подходящие экскурсии"}</Text>
            <Text style={[styles.filteredCount, { color: colors.teal, backgroundColor: colors.tealSoft }]}>{String(filteredTours.length)}</Text>
          </View>
          {filteredTours.slice(0, 5).map((tour) => (
            <TouchableOpacity
              key={tour.id}
              style={[styles.tourRow, { borderBottomColor: colors.border }]}
              onPress={() => handleTourPress(tour.id)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: tour.image }} style={styles.tourRowImage} contentFit="cover" />
              <View style={styles.tourRowInfo}>
                <Text style={[styles.tourRowTitle, { color: colors.text }]} numberOfLines={1}>{tour.title}</Text>
                <View style={styles.tourRowMeta}>
                  <MapPin size={11} color={colors.textMuted} />
                  <Text style={[styles.tourRowCity, { color: colors.textMuted }]}>{cityNameMap[tour.city] || tour.city}</Text>
                  <Text style={[styles.tourRowDuration, { color: colors.textMuted }]}>{`\u00B7 ${tour.durationText}`}</Text>
                </View>
                <Text style={[styles.tourRowPrice, { color: colors.teal }]}>{`от ${tour.price.toLocaleString()}${tour.currency}`}</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={[styles.topRatedSection, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={18} color={colors.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Лучшие по рейтингу"}</Text>
        </View>
        {topRatedTours.map((tour, index) => (
          <TouchableOpacity
            key={tour.id}
            style={[styles.ratedCard, { borderBottomColor: colors.border }]}
            onPress={() => handleTourPress(tour.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.ratedRank, { backgroundColor: colors.tealSoft }]}>
              <Text style={[styles.ratedRankText, { color: colors.teal }]}>{String(index + 1)}</Text>
            </View>
            <Image source={{ uri: tour.image }} style={styles.ratedImage} contentFit="cover" />
            <View style={styles.ratedInfo}>
              <Text style={[styles.ratedTitle, { color: colors.text }]} numberOfLines={1}>{tour.title}</Text>
              <View style={styles.ratedMeta}>
                <Star size={12} color={colors.gold} fill={colors.gold} />
                <Text style={[styles.ratedRating, { color: colors.text }]}>{String(tour.organizer.rating)}</Text>
                <Text style={[styles.ratedReviews, { color: colors.textMuted }]}>{`(${tour.organizer.reviewCount} отзывов)`}</Text>
              </View>
              <Text style={[styles.ratedPrice, { color: colors.teal }]}>{`от ${tour.price.toLocaleString()}${tour.currency}`}</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 30 },
  citiesSection: { marginBottom: 20, paddingTop: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  citiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  cityCard: {
    width: "48%",
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  cityImage: { width: "100%", height: "100%" },
  cityOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  cityInfo: { position: "absolute", bottom: 10, left: 10, right: 10 },
  cityEmoji: { fontSize: 20, marginBottom: 2 },
  cityName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cityDesc: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 },
  cityTourCount: {
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cityTourCountText: { fontSize: 10, color: "#FFFFFF", fontWeight: "600" as const },
  filteredSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filteredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  filteredTitle: { fontSize: 16, fontWeight: "700" as const },
  filteredCount: {
    fontSize: 13,
    fontWeight: "600" as const,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  tourRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tourRowImage: { width: 50, height: 50, borderRadius: 10 },
  tourRowInfo: { flex: 1 },
  tourRowTitle: { fontSize: 14, fontWeight: "600" as const },
  tourRowMeta: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  tourRowCity: { fontSize: 11 },
  tourRowDuration: { fontSize: 11 },
  tourRowPrice: { fontSize: 13, fontWeight: "700" as const, marginTop: 2 },
  topRatedSection: {
    marginBottom: 20,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  ratedCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ratedRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ratedRankText: { fontSize: 12, fontWeight: "800" as const },
  ratedImage: { width: 48, height: 48, borderRadius: 10 },
  ratedInfo: { flex: 1 },
  ratedTitle: { fontSize: 14, fontWeight: "600" as const },
  ratedMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  ratedRating: { fontSize: 13, fontWeight: "600" as const },
  ratedReviews: { fontSize: 11 },
  ratedPrice: { fontSize: 13, fontWeight: "700" as const, marginTop: 2 },
});

