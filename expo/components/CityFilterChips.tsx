import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { City } from "@/types/tour";

interface CityFilterChipsProps {
  cities: City[];
  selectedCity: string | null;
  onSelectCity: (cityId: string | null) => void;
}

/** Горизонтальный список быстрых фильтров по городам Узбекистана. */
export default React.memo(function CityFilterChips({
  cities,
  selectedCity,
  onSelectCity,
}: CityFilterChipsProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(
    (cityId: string | null) => {
      onSelectCity(selectedCity === cityId ? null : cityId);
    },
    [selectedCity, onSelectCity]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            { backgroundColor: selectedCity === null ? colors.teal : colors.surface, borderColor: selectedCity === null ? colors.teal : colors.border },
          ]}
          onPress={() => handlePress(null)}
          activeOpacity={0.7}
          testID="city-chip-all"
        >
          <Text style={[styles.chipText, { color: selectedCity === null ? "#FFFFFF" : colors.textSecondary }]}>{"Все"}</Text>
        </TouchableOpacity>
        {cities.map((city) => {
          const isActive = selectedCity === city.id;
          return (
            <TouchableOpacity
              key={city.id}
              style={[
                styles.chip,
                { backgroundColor: isActive ? colors.teal : colors.surface, borderColor: isActive ? colors.teal : colors.border },
              ]}
              onPress={() => handlePress(city.id)}
              activeOpacity={0.7}
              testID={`city-chip-${city.id}`}
            >
              <Text style={styles.chipEmoji}>{city.emoji}</Text>
              <Text style={[styles.chipText, { color: isActive ? "#FFFFFF" : colors.textSecondary }]}>{city.name}</Text>
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
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
});
