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
import { Sparkles, Star, Clock } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { categoryLabels } from "@/mocks/categoryTours";
import { CategoryType } from "@/types/tour";

const CARD_WIDTH = Dimensions.get("window").width * 0.65;
const CARD_HEIGHT = 200;

const categories: CategoryType[] = [
  "agro", "photo", "ethno", "parents", "glamping",
  "animals", "mystic", "wild_animals", "wine", "gastro",
];

const categoryImages: Record<string, string> = {
  agro: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop",
  photo: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&h=600&fit=crop",
  ethno: "https://images.unsplash.com/photo-1623846750638-2765f498d67f?w=800&h=600&fit=crop",
  parents: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&h=600&fit=crop",
  glamping: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop",
  animals: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop",
  mystic: "https://images.unsplash.com/photo-1548834925-e48f8a27ae20?w=800&h=600&fit=crop",
  wild_animals: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop",
  wine: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&h=600&fit=crop",
  gastro: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
};

const categoryTourCount: Record<string, number> = {
  agro: 2, photo: 2, ethno: 2, parents: 2, glamping: 2,
  animals: 2, mystic: 2, wild_animals: 2, wine: 2, gastro: 2,
};

const categoryAccentColors: Record<string, string> = {
  agro: "#66BB6A",
  photo: "#FF7043",
  ethno: "#CE93D8",
  parents: "#42A5F5",
  glamping: "#26A69A",
  animals: "#FFAB40",
  mystic: "#7C4DFF",
  wild_animals: "#4CAF50",
  wine: "#EF5350",
  gastro: "#FFB300",
};

interface InterestingSectionProps {
  onCategoryPress: (category: CategoryType) => void;
}

const CategoryCard = React.memo(function CategoryCard({
  category,
  onPress,
}: {
  category: CategoryType;
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

  const accent = categoryAccentColors[category] || colors.teal;

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Image
          source={{ uri: categoryImages[category] }}
          style={styles.cardImage}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.cardGradient} />
        <View style={[styles.accentStrip, { backgroundColor: accent }]} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {categoryLabels[category] || category}
          </Text>
          <View style={styles.cardMeta}>
            <View style={[styles.tourCountBadge, { backgroundColor: accent }]}>
              <Text style={styles.tourCountText}>
                {`${categoryTourCount[category] || 0} туров`}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default React.memo(function InterestingSection({ onCategoryPress }: InterestingSectionProps) {
  const { colors } = useTheme();
  console.log("[InterestingSection] Rendering");
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={20} color={colors.gold} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>{"Самое интересное"}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 12}
      >
        {categories.map((cat) => (
          <CategoryCard key={cat} category={cat} onPress={() => onCategoryPress(cat)} />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800" as const,
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
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  accentStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
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
  },
  tourCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tourCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700" as const,
  },
});
