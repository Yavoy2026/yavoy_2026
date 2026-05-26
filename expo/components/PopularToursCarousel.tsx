import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Star, Flame, Clock } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { Tour } from "@/types/tour";

const CARD_WIDTH = Dimensions.get("window").width * 0.65;
const CARD_HEIGHT = 185;

interface PopularToursCarouselProps {
  tours: Tour[];
  onPress: (tourId: string) => void;
}

const PopularTourItem = React.memo(function PopularTourItem({
  tour,
  onPress,
}: {
  tour: Tour;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Image source={{ uri: tour.image }} style={styles.cardImage} contentFit="cover" transition={200} />
        <View style={styles.cardGradient} />
        <View style={styles.topBadges}>
          {tour.isBestseller ? (
            <View style={styles.bestsellerBadge}>
              <Flame size={11} color="#FFFFFF" />
              <Text style={styles.bestsellerText}>{"Хит"}</Text>
            </View>
          ) : null}
          {tour.isLikelyToSellOut ? (
            <View style={styles.sellOutBadge}>
              <Text style={styles.sellOutText}>{"Раскупают"}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{tour.title}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.ratingRow}>
              <Star size={13} color={colors.gold} fill={colors.gold} />
              <Text style={styles.ratingText}>{String(tour.organizer.rating)}</Text>
              <Text style={styles.reviewsText}>{`(${tour.organizer.reviewCount})`}</Text>
            </View>
            <View style={styles.durationRow}>
              <Clock size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.durationText}>{tour.durationText}</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            {tour.originalPrice ? (
              <Text style={styles.originalPrice}>{`${tour.originalPrice.toLocaleString()}\u20BD`}</Text>
            ) : null}
            <Text style={[styles.price, { color: colors.tealLight }]}>{`от ${tour.price.toLocaleString()}\u20BD`}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default React.memo(function PopularToursCarousel({ tours, onPress }: PopularToursCarouselProps) {
  const { colors } = useTheme();
  console.log("[PopularToursCarousel] Rendering with", tours.length, "tours");
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Flame size={18} color={colors.coral} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>{"Популярные экскурсии"}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 12}
      >
        {tours.map((tour) => (
          <PopularTourItem key={tour.id} tour={tour} onPress={() => onPress(tour.id)} />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  cardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  topBadges: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    gap: 6,
  },
  bestsellerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestsellerText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  sellOutBadge: {
    backgroundColor: "#F39C12",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sellOutText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600" as const,
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    lineHeight: 20,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  reviewsText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalPrice: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "line-through" as const,
  },
  price: {
    fontSize: 16,
    fontWeight: "800" as const,
  },
});
