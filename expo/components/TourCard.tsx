import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Share,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Heart, Share2, Clock, MapPin, Flame, Zap, ShieldCheck, RotateCcw, Eye } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import StarRating from "@/components/StarRating";
import { Tour } from "@/types/tour";
import { useFavorites } from "@/providers/FavoritesProvider";
import { useViewedTours } from "@/providers/ViewedToursProvider";
import { cityNameMap } from "@/mocks/cities";

const transportLabels: Record<string, string> = {
  auto: "Авто",
  water: "Водная",
  sea: "Морская",
  bike: "Вело",
  air: "Авиа",
};

interface TourCardProps {
  tour: Tour;
  onPress: () => void;
  compact?: boolean;
}

export default React.memo(function TourCard({ tour, onPress, compact = false }: TourCardProps) {
  const { colors } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isViewed } = useViewedTours();
  const viewed = isViewed(tour.id);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const liked = isFavorite(tour.id);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handleFavorite = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    toggleFavorite(tour.id);
  }, [heartScale, toggleFavorite, tour.id]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${tour.title} — от ${tour.price.toLocaleString()}${tour.currency}\n\nОрганизатор: ${tour.organizer.name} (${tour.organizer.rating}⭐)\n\nYaVoy Travel Group`,
      });
    } catch (e) {
      console.log("Share error:", e);
    }
  }, [tour]);

  const hasDiscount = tour.originalPrice && tour.originalPrice > tour.price;
  const discountPercent = hasDiscount
    ? Math.round(((tour.originalPrice! - tour.price) / tour.originalPrice!) * 100)
    : 0;

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={`tour-card-${tour.id}`}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: tour.image }} style={styles.image} contentFit="cover" transition={200} />

          <View style={styles.topLeftBadges}>
            {tour.isBestseller ? (
              <View style={styles.bestsellerBadge}>
                <Flame size={11} color="#FFFFFF" />
                <Text style={styles.bestsellerText}>{"Хит продаж"}</Text>
              </View>
            ) : null}
            {hasDiscount ? (
              <View style={[styles.discountBadge, { backgroundColor: colors.green }]}>
                <Text style={styles.discountText}>{`-${discountPercent}%`}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.topRightBadges}>
            <View style={[styles.transportBadge, { backgroundColor: colors.teal }]}>
              <Text style={styles.transportText}>{transportLabels[tour.transport] || tour.transport}</Text>
            </View>
            <View style={styles.durationBadge}>
              <Clock size={11} color="#FFFFFF" />
              <Text style={styles.durationText}>{tour.durationText}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleFavorite}
              style={styles.actionBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID={`favorite-btn-${tour.id}`}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart size={20} color={liked ? colors.coral : "#FFFFFF"} fill={liked ? colors.coral : "transparent"} />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.actionBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID={`share-btn-${tour.id}`}
            >
              <Share2 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {tour.bookingsToday > 5 ? (
            <View style={styles.bookingsBadge}>
              <Text style={styles.bookingsText}>{`🔥 ${tour.bookingsToday} бронирований сегодня`}</Text>
            </View>
          ) : null}
          {viewed ? (
            <View style={[styles.viewedBadge, { backgroundColor: colors.overlay }]}>
              <Eye size={10} color="#FFFFFF" />
              <Text style={styles.viewedText}>{"Просмотрено"}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{tour.title}</Text>

          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.teal} />
            <Text style={[styles.locationText, { color: colors.teal }]}>{cityNameMap[tour.city] || tour.city}</Text>
          </View>

          {!compact ? (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>{tour.description}</Text>
          ) : null}

          <View style={styles.featureBadges}>
            {tour.isInstantConfirmation ? (
              <View style={[styles.featureBadge, { backgroundColor: colors.tealSoft }]}>
                <Zap size={11} color={colors.teal} />
                <Text style={[styles.featureBadgeText, { color: colors.teal }]}>{"Мгновенно"}</Text>
              </View>
            ) : null}
            {tour.isFreeCancellation ? (
              <View style={[styles.featureBadge, { backgroundColor: colors.greenLight }]}>
                <RotateCcw size={11} color={colors.green} />
                <Text style={[styles.featureBadgeText, { color: colors.green }]}>{"Бесплатная отмена"}</Text>
              </View>
            ) : null}
            {tour.organizer.verified ? (
              <View style={[styles.featureBadge, { backgroundColor: colors.tealSoft }]}>
                <ShieldCheck size={11} color={colors.teal} />
                <Text style={[styles.featureBadgeText, { color: colors.teal }]}>{"Проверен"}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <View style={styles.organizerSection}>
              <Image source={{ uri: tour.organizer.avatar }} style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]} contentFit="cover" />
              <View style={styles.organizerInfo}>
                <Text style={[styles.organizerName, { color: colors.textSecondary }]} numberOfLines={1}>{tour.organizer.name}</Text>
                <StarRating rating={tour.organizer.rating} reviewCount={tour.organizer.reviewCount} size={11} />
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: colors.textMuted }]}>от</Text>
              {hasDiscount ? (
                <Text style={[styles.originalPrice, { color: colors.textMuted }]}>{`${tour.originalPrice!.toLocaleString()}₽`}</Text>
              ) : null}
              <Text style={[styles.price, { color: colors.teal }]}>{`${tour.price.toLocaleString()}${tour.currency}`}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 195,
  },
  topLeftBadges: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    gap: 6,
  },
  bestsellerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  bestsellerText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  topRightBadges: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 5,
  },
  transportBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  transportText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600" as const,
  },
  durationBadge: {
    backgroundColor: "rgba(27, 40, 56, 0.7)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "500" as const,
  },
  actionButtons: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    backgroundColor: "rgba(27, 40, 56, 0.7)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bookingsBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,107,107,0.9)",
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  bookingsText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  viewedBadge: {
    position: "absolute" as const,
    top: 12,
    left: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewedText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "500" as const,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "700" as const,
    lineHeight: 21,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  featureBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featureBadgeText: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  organizerSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 12,
    fontWeight: "600" as const,
    marginBottom: 1,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 10,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through" as const,
  },
  price: {
    fontSize: 18,
    fontWeight: "800" as const,
  },
});
