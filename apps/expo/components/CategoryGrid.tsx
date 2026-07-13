import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Car,
  Waves,
  Ship,
  Bike,
  Plane,
  Sun,
  Moon,
  Building2,
  BookOpen,
  TreePine,
  Church,
} from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";

interface CategoryItem {
  key: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  bgColorDark: string;
}

const transportCategories: CategoryItem[] = [
  { key: "auto", label: "Авто", icon: "car", color: "#3B82F6", bgColor: "#EFF6FF", bgColorDark: "rgba(59,130,246,0.15)" },
  { key: "water", label: "Водные", icon: "waves", color: "#06B6D4", bgColor: "#ECFEFF", bgColorDark: "rgba(6,182,212,0.15)" },
  { key: "sea", label: "Морские", icon: "ship", color: "#0EA5E9", bgColor: "#F0F9FF", bgColorDark: "rgba(14,165,233,0.15)" },
  { key: "bike", label: "Вело", icon: "bike", color: "#22C55E", bgColor: "#F0FDF4", bgColorDark: "rgba(34,197,94,0.15)" },
  { key: "air", label: "Авиа", icon: "plane", color: "#8B5CF6", bgColor: "#F5F3FF", bgColorDark: "rgba(139,92,246,0.15)" },
];

const interestCategories: CategoryItem[] = [
  { key: "city", label: "Городские", icon: "building", color: "#F59E0B", bgColor: "#FFFBEB", bgColorDark: "rgba(245,158,11,0.15)" },
  { key: "educational", label: "Познавательные", icon: "book", color: "#EC4899", bgColor: "#FDF2F8", bgColorDark: "rgba(236,72,153,0.15)" },
  { key: "nature", label: "Природные", icon: "tree", color: "#10B981", bgColor: "#ECFDF5", bgColorDark: "rgba(16,185,129,0.15)" },
  { key: "pilgrimage", label: "Паломничество", icon: "church", color: "#6366F1", bgColor: "#EEF2FF", bgColorDark: "rgba(99,102,241,0.15)" },
];

const durationCategories: CategoryItem[] = [
  { key: "one_day", label: "Однодневные", icon: "sun", color: "#F97316", bgColor: "#FFF7ED", bgColorDark: "rgba(249,115,22,0.15)" },
  { key: "multi_day", label: "Многодневные", icon: "moon", color: "#6366F1", bgColor: "#EEF2FF", bgColorDark: "rgba(99,102,241,0.15)" },
];

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  car: Car,
  waves: Waves,
  ship: Ship,
  bike: Bike,
  plane: Plane,
  sun: Sun,
  moon: Moon,
  building: Building2,
  book: BookOpen,
  tree: TreePine,
  church: Church,
};

interface CategoryGridProps {
  type: "transport" | "interest" | "duration";
  selected: string | null;
  onSelect: (key: string | null) => void;
  title: string;
}

export default React.memo(function CategoryGrid({ type, selected, onSelect, title }: CategoryGridProps) {
  const { colors, isDark } = useTheme();
  const categories = type === "transport"
    ? transportCategories
    : type === "interest"
    ? interestCategories
    : durationCategories;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <View style={styles.grid}>
        {categories.map((cat) => {
          const IconComp = iconMap[cat.icon];
          const isActive = selected === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.item,
                { backgroundColor: isActive ? cat.color : (isDark ? cat.bgColorDark : cat.bgColor) },
              ]}
              onPress={() => onSelect(isActive ? null : cat.key)}
              activeOpacity={0.7}
              testID={`category-${cat.key}`}
            >
              {IconComp ? (
                <IconComp size={20} color={isActive ? "#FFFFFF" : cat.color} />
              ) : null}
              <Text
                style={[
                  styles.itemLabel,
                  { color: isActive ? "#FFFFFF" : cat.color },
                ]}
                numberOfLines={1}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
});
