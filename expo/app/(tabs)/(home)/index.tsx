import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Animated, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { MapPin, Navigation, X, ArrowDownNarrowWide, TrendingUp, Clock, DollarSign } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useLocation } from "@/providers/LocationProvider";
import { tours } from "@/mocks/tours";
import { categoryTours } from "@/mocks/categoryTours";
import { cities } from "@/mocks/cities";
import { DurationType, TransportType, InterestType, SortType, CategoryType, SeasonType } from "@/types/tour";
import CitySelector from "@/components/CitySelector";
import FilterDropdown from "@/components/FilterDropdown";
import SearchBar from "@/components/SearchBar";
import PopularToursCarousel from "@/components/PopularToursCarousel";
import TourCard from "@/components/TourCard";
import AdvantagesBlock from "@/components/AdvantagesBlock";
import DateSelector from "@/components/DateSelector";
import InterestingSection from "@/components/InterestingSection";
import CertificateBanner from "@/components/CertificateBanner";
import CertificateModal from "@/components/CertificateModal";
import ReelsSection from "@/components/ReelsSection";
import { useScrollToTop } from "@/providers/ScrollToTopProvider";
import { useReels } from "@/providers/ReelsProvider";

const allTours = [...tours, ...categoryTours];

const durationOptions: { key: DurationType; label: string; icon: string }[] = [
  { key: "one_day", label: "Однодневные", icon: "sun" },
  { key: "multi_day", label: "Многодневные", icon: "moon" },
];

const seasonOptions: { key: SeasonType; label: string; icon: string }[] = [
  { key: "winter", label: "Зима", icon: "moon" },
  { key: "spring", label: "Весна", icon: "tree" },
  { key: "summer", label: "Лето", icon: "sun" },
  { key: "autumn", label: "Осень", icon: "tree" },
  { key: "all_year", label: "Круглый год", icon: "sun" },
];
const transportOptions: { key: TransportType; label: string; icon: string }[] = [
  { key: "auto", label: "Авто", icon: "car" },
  { key: "water", label: "Водные", icon: "waves" },
  { key: "sea", label: "Морские", icon: "ship" },
  { key: "bike", label: "Вело", icon: "bike" },
  { key: "air", label: "Авиа", icon: "plane" },
];
const interestOptions: { key: string; label: string; icon: string }[] = [
  { key: "city", label: "Городские", icon: "building" },
  { key: "educational", label: "Познавательные", icon: "book" },
  { key: "nature", label: "Природные", icon: "tree" },
  { key: "pilgrimage", label: "Паломничество", icon: "church" },
  { key: "agro", label: "Агротуры", icon: "tree" },
  { key: "photo", label: "Фототуры", icon: "sun" },
  { key: "ethno", label: "Этнотуры", icon: "church" },
  { key: "parents", label: "Для родителей", icon: "book" },
  { key: "glamping", label: "Глэмпинг", icon: "tree" },
  { key: "animals", label: "С животными", icon: "tree" },
  { key: "mystic", label: "Мистические", icon: "moon" },
  { key: "wild_animals", label: "К диким животным", icon: "tree" },
  { key: "wine", label: "Винный тур", icon: "sun" },
  { key: "gastro", label: "Гастротур", icon: "sun" },
];

const sortOptions: { key: SortType; label: string }[] = [
  { key: "popularity", label: "Популярные" },
  { key: "newest", label: "Новинки" },
  { key: "price_asc", label: "Дешевле" },
  { key: "price_desc", label: "Дороже" },
];

const cityNameMap: Record<string, string> = {};
cities.forEach((c) => { cityNameMap[c.id] = c.name; });

const popularTours = allTours.filter((t) => t.popularity >= 85).sort((a, b) => b.popularity - a.popularity);

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { scrollToken } = useScrollToTop();
  const { publishedReels } = useReels();

  useEffect(() => {
    if (scrollToken > 0 && flatListRef.current) {
      console.log("[HomeScreen] Scrolling to top");
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [scrollToken]);
  const { cityId: routeCityId } = useLocalSearchParams<{ cityId?: string }>();
  const { detectedCityId, locationAsked, isDetecting, detectLocation, dismissLocationPrompt } = useLocation();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [geoApplied, setGeoApplied] = useState<boolean>(false);

  useEffect(() => {
    if (routeCityId) {
      console.log("[HomeScreen] Setting city from route param:", routeCityId);
      setSelectedCity(routeCityId);
    }
  }, [routeCityId]);

  useEffect(() => {
    if (detectedCityId && !routeCityId && !geoApplied && !selectedCity) {
      console.log("[HomeScreen] Auto-selecting detected city:", detectedCityId);
      setSelectedCity(detectedCityId);
      setGeoApplied(true);
    }
  }, [detectedCityId, routeCityId, geoApplied, selectedCity]);

  const [selectedDuration, setSelectedDuration] = useState<DurationType | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<TransportType | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<SortType>("popularity");
  const [selectedSeason, setSelectedSeason] = useState<SeasonType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [certModalVisible, setCertModalVisible] = useState<boolean>(false);

  console.log("[HomeScreen] Rendering with filters:", { selectedCity, selectedDuration, selectedTransport, selectedInterest, searchQuery, selectedDate, selectedSort });

  const filteredTours = useMemo(() => {
    let result = allTours;
    if (selectedCity) result = result.filter((t) => t.city === selectedCity);
    if (selectedDuration) result = result.filter((t) => t.duration === selectedDuration);
    if (selectedTransport) result = result.filter((t) => t.transport === selectedTransport);
    if (selectedInterest) result = result.filter((t) => t.interest === selectedInterest || t.category === selectedInterest);
    if (selectedSeason) result = result.filter((t) => t.season === selectedSeason || t.season === "all_year");
    if (selectedCategory) result = result.filter((t) => t.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.organizer.name.toLowerCase().includes(q) ||
          (cityNameMap[t.city] || "").toLowerCase().includes(q)
      );
    }
    if (selectedDate) {
      result = result.filter((t) => t.nextAvailableDate >= selectedDate);
    }

    switch (selectedSort) {
      case "popularity":
        result = [...result].sort((a, b) => b.popularity - a.popularity);
        break;
      case "newest":
        result = [...result].sort((a, b) => a.nextAvailableDate.localeCompare(b.nextAvailableDate));
        break;
      case "price_asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [selectedCity, selectedDuration, selectedTransport, selectedInterest, selectedSeason, selectedCategory, searchQuery, selectedDate, selectedSort]);

  const hasActiveFilters = selectedCity || selectedDuration || selectedTransport || selectedInterest || selectedSeason || selectedCategory || searchQuery.trim() || selectedDate;

  const handleCategoryPress = useCallback((category: CategoryType) => {
    setSelectedCategory(category);
    console.log("[HomeScreen] Category selected:", category);
  }, []);

  const handleCertificatePress = useCallback(() => {
    setCertModalVisible(true);
  }, []);

  const handleTourPress = useCallback((tourId: string) => {
    const tourIds = filteredTours.map((t) => t.id);
    router.push({ pathname: "/tour-detail", params: { tourId, tourIds: tourIds.join(",") } });
  }, [filteredTours, router]);

  const handlePopularTourPress = useCallback((tourId: string) => {
    const tourIds = popularTours.map((t) => t.id);
    router.push({ pathname: "/tour-detail", params: { tourId, tourIds: tourIds.join(",") } });
  }, [router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleDetectLocation = useCallback(() => {
    void detectLocation();
  }, [detectLocation]);

  const handleDismissGeo = useCallback(() => {
    void dismissLocationPrompt();
  }, [dismissLocationPrompt]);

  const headerTitle = selectedCity ? (cityNameMap[selectedCity] || selectedCity) : "Все направления";
  const tourCountText = getTourCountText(filteredTours.length);

  const renderHeader = useCallback(() => (
    <View>
      <View style={{ paddingTop: insets.top }} />

      {!locationAsked && (
        <View style={[styles.geoBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + "30" }]}>
          <View style={styles.geoBannerContent}>
            <View style={[styles.geoIconWrap, { backgroundColor: colors.teal + "20" }]}>
              <Navigation size={18} color={colors.teal} />
            </View>
            <View style={styles.geoBannerText}>
              <Text style={[styles.geoBannerTitle, { color: colors.text }]}>{"Определить ваш город?"}</Text>
              <Text style={[styles.geoBannerSubtitle, { color: colors.textSecondary }]}>{"Покажем туры рядом с вами"}</Text>
            </View>
            <TouchableOpacity onPress={handleDismissGeo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.geoBannerActions}>
            <TouchableOpacity
              style={[styles.geoButton, { backgroundColor: colors.teal }]}
              onPress={handleDetectLocation}
              disabled={isDetecting}
              activeOpacity={0.7}
            >
              {isDetecting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MapPin size={14} color="#FFFFFF" />
                  <Text style={styles.geoButtonText}>{"Определить"}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.geoButtonSecondary, { borderColor: colors.border }]}
              onPress={handleDismissGeo}
              activeOpacity={0.7}
            >
              <Text style={[styles.geoButtonSecondaryText, { color: colors.textSecondary }]}>{"Не сейчас"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
          <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Куда поедем?"}</Text>
      </View>
      <CitySelector cities={cities} selectedCity={selectedCity} onSelectCity={setSelectedCity} />

      {!hasActiveFilters && (
        <ReelsSection reels={publishedReels} />
      )}

      {!hasActiveFilters && (
        <PopularToursCarousel tours={popularTours} onPress={handlePopularTourPress} />
      )}

      {!hasActiveFilters && (
        <InterestingSection onCategoryPress={handleCategoryPress} />
      )}

      <View style={styles.filtersSection}>
        <View style={styles.filtersRow}>
          <FilterDropdown label="Дни" options={durationOptions} selected={selectedDuration} onSelect={setSelectedDuration} />
          <FilterDropdown label="Транспорт" options={transportOptions} selected={selectedTransport} onSelect={setSelectedTransport} />
          <FilterDropdown label="Интересы" options={interestOptions} selected={selectedInterest} onSelect={setSelectedInterest as (key: string | null) => void} />
          <FilterDropdown label="Сезон" options={seasonOptions} selected={selectedSeason} onSelect={setSelectedSeason} />
        </View>
      </View>

      <View style={styles.sortSection}>
        <View style={styles.sortRow}>
          <ArrowDownNarrowWide size={14} color={colors.textMuted} />
          <Text style={[styles.sortLabel, { color: colors.textMuted }]}>{"Сортировка:"}</Text>
        </View>
        <View style={styles.sortChips}>
          {sortOptions.map((opt) => {
            const isActive = selectedSort === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.sortChip,
                  { backgroundColor: isActive ? colors.teal : colors.surface, borderColor: isActive ? colors.teal : colors.border },
                ]}
                onPress={() => setSelectedSort(opt.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortChipText, { color: isActive ? "#FFFFFF" : colors.textSecondary }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.feedHeader}>
        <View>
          <Text style={[styles.feedTitle, { color: colors.text }]}>{headerTitle}</Text>
          <Text style={[styles.feedCount, { color: colors.textMuted }]}>{`${filteredTours.length} ${tourCountText}`}</Text>
        </View>
        {hasActiveFilters ? (
          <Text
            style={[styles.resetFilters, { color: colors.teal }]}
            onPress={() => {
              setSelectedCity(null);
              setSelectedDuration(null);
              setSelectedTransport(null);
              setSelectedInterest(null);
              setSelectedSeason(null);
              setSelectedCategory(null);
              setSearchQuery("");
              setSelectedDate(null);
            }}
          >
            {"Сбросить"}
          </Text>
        ) : null}
      </View>
    </View>
  ), [selectedCity, selectedDuration, selectedTransport, selectedInterest, selectedSeason, selectedCategory, searchQuery, selectedDate, selectedSort, headerTitle, filteredTours.length, tourCountText, hasActiveFilters, publishedReels, handlePopularTourPress, handleCategoryPress, handleCertificatePress, colors, isDark, locationAsked, isDetecting, handleDetectLocation, handleDismissGeo]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{"🧭"}</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{"Экскурсии не найдены"}</Text>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>{"Попробуйте изменить фильтры или выбрать другой город"}</Text>
    </View>
  ), [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={filteredTours}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <>
            {(index === 2 || index === 6 || index === 11) && !hasActiveFilters ? (
              <CertificateBanner onPress={handleCertificatePress} />
            ) : null}
            <TourCard tour={item} onPress={() => handleTourPress(item.id)} />
          </>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={() => <AdvantagesBlock />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} colors={[colors.teal]} />}
        testID="tour-feed"
      />
      <CertificateModal visible={certModalVisible} onClose={() => setCertModalVisible(false)} />
    </View>
  );
}

function getTourCountText(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return "экскурсий";
  if (lastOne === 1) return "экскурсия";
  if (lastOne >= 2 && lastOne <= 4) return "экскурсии";
  return "экскурсий";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 20 },
  logoSection: {
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "900" as const,
    color: "#FFFFFF",
    letterSpacing: 8,
  },
  geoBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  geoBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  geoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  geoBannerText: {
    flex: 1,
  },
  geoBannerTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    marginBottom: 2,
  },
  geoBannerSubtitle: {
    fontSize: 13,
  },
  geoBannerActions: {
    flexDirection: "row",
    gap: 10,
  },
  geoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  geoButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  geoButtonSecondary: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
  },
  geoButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  filtersSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  filtersRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  sortSection: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  sortRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 8,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  sortChips: {
    flexDirection: "row" as const,
    gap: 8,
    flexWrap: "wrap" as const,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 14,
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
  },
  feedCount: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginTop: 2,
  },
  resetFilters: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, marginBottom: 6 },
  emptyText: { fontSize: 14, textAlign: "center" as const, lineHeight: 20 },
});

