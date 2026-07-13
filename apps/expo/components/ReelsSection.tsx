import React, { useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Play, Eye } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/providers/ThemeProvider";
import { TravelReel } from "@/types/tour";

interface ReelsSectionProps {
  reels: TravelReel[];
}

export default function ReelsSection({ reels }: ReelsSectionProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = useCallback(
    (index: number) => {
      router.push({ pathname: "/reels", params: { index: String(index) } });
    },
    [router]
  );

  if (reels.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Reels из туров</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Короткие истории реальных экскурсий</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: colors.coral + "22" }]}>
          <Play size={12} color={colors.coral} fill={colors.coral} />
          <Text style={[styles.liveBadgeText, { color: colors.coral }]}>LIVE</Text>
        </View>
      </View>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handlePress(index)}
            activeOpacity={0.85}
            testID={`reel-card-${index}`}
          >
            <Image source={{ uri: item.coverImage }} style={styles.cover} contentFit="cover" />
            <LinearGradient colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.42)", "rgba(0,0,0,0.88)"]} style={styles.gradient} />
            <View style={styles.playWrap}>
              <View style={styles.playCircle}>
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <Text style={styles.duration}>{item.duration}</Text>
            </View>
            <View style={styles.metaTop}>
              <Text style={styles.city}>{item.city}</Text>
            </View>
            <View style={styles.bottom}>
              <Text style={styles.reelTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.tourTitle} numberOfLines={1}>{item.tourTitle}</Text>
              <View style={styles.stats}>
                <View style={styles.stat}><Eye size={12} color="#FFFFFF" /><Text style={styles.statText}>{item.views}</Text></View>
                <View style={styles.stat}><Heart size={12} color="#FFFFFF" /><Text style={styles.statText}>{item.likes}</Text></View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8, marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 19, fontWeight: "800" as const },
  subtitle: { fontSize: 12, marginTop: 2, fontWeight: "500" as const },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  liveBadgeText: { fontSize: 11, fontWeight: "800" as const, letterSpacing: 0.6 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { width: 142, height: 228, borderRadius: 22, overflow: "hidden", backgroundColor: "#111827" },
  cover: { ...StyleSheet.absoluteFillObject },
  gradient: { ...StyleSheet.absoluteFillObject },
  playWrap: { position: "absolute", top: 10, right: 10, alignItems: "center", gap: 5 },
  playCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.38)" },
  duration: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" as const, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 5 },
  metaTop: { position: "absolute", left: 10, top: 12 },
  city: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" as const, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.36)", overflow: "hidden" },
  bottom: { position: "absolute", left: 12, right: 12, bottom: 12 },
  reelTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" as const, lineHeight: 18 },
  tourTitle: { color: "rgba(255,255,255,0.78)", fontSize: 11, marginTop: 4, fontWeight: "600" as const },
  stats: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 9 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" as const },
});
