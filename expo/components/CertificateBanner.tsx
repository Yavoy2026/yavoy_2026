import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Gift } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";

interface CertificateBannerProps {
  onPress: () => void;
}

export default React.memo(function CertificateBanner({ onPress }: CertificateBannerProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: colors.gold }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID="certificate-banner"
      >
        <View style={styles.iconWrap}>
          <Gift size={22} color="#1B2838" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{"Подарите путешествие!"}</Text>
          <Text style={styles.subtitle}>{"Купить подарочный сертификат YAVOY"}</Text>
        </View>
        <Text style={styles.arrow}>{"→"}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#1B2838",
  },
  subtitle: {
    fontSize: 12,
    color: "#1B2838",
    opacity: 0.7,
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1B2838",
  },
});
