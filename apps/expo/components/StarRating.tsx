import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Star } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";

interface StarRatingProps {
  rating: number;
  reviewCount: number;
  size?: number;
  showCount?: boolean;
}

export default React.memo(function StarRating({
  rating,
  reviewCount,
  size = 14,
  showCount = true,
}: StarRatingProps) {
  const { colors } = useTheme();
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={size}
            color={colors.gold}
            fill={i < fullStars || (i === fullStars && hasHalf) ? colors.gold : "transparent"}
          />
        ))}
      </View>
      <Text style={[styles.ratingText, { fontSize: size - 1, color: colors.text }]}>{rating.toFixed(1)}</Text>
      {showCount && <Text style={[styles.reviewCount, { fontSize: size - 2, color: colors.textMuted }]}>({reviewCount})</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  stars: {
    flexDirection: "row",
    gap: 1,
  },
  ratingText: {
    fontWeight: "600" as const,
    marginLeft: 2,
  },
  reviewCount: {},
});
