import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useCurrency } from "@/providers/CurrencyProvider";

interface CurrencyToggleProps {
  compact?: boolean;
}

/** Переключатель отображения цен: сумы ⇄ доллары США. */
export default React.memo(function CurrencyToggle({ compact = false }: CurrencyToggleProps) {
  const { colors } = useTheme();
  const { currency, setCurrency } = useCurrency();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }, compact && styles.wrapCompact]}>
      <TouchableOpacity
        style={[styles.segment, currency === "UZS" && { backgroundColor: colors.teal }]}
        onPress={() => setCurrency("UZS")}
        activeOpacity={0.7}
        testID="currency-uzs"
      >
        <Text style={[styles.segmentText, { color: currency === "UZS" ? "#FFFFFF" : colors.textSecondary }, compact && styles.segmentTextCompact]}>{"сум"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segment, currency === "USD" && { backgroundColor: colors.teal }]}
        onPress={() => setCurrency("USD")}
        activeOpacity={0.7}
        testID="currency-usd"
      >
        <Text style={[styles.segmentText, { color: currency === "USD" ? "#FFFFFF" : colors.textSecondary }, compact && styles.segmentTextCompact]}>{"$"}</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 2,
  },
  wrapCompact: {
    borderRadius: 10,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  segmentTextCompact: {
    fontSize: 12,
  },
});
