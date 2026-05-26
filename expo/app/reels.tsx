import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ViewToken,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { X, Heart, Eye, Play, Pause } from "lucide-react-native";
import { useVideoPlayer, VideoView, VideoPlayer } from "expo-video";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { TravelReel } from "@/types/tour";
import { useReels } from "@/providers/ReelsProvider";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface ReelItemProps {
  reel: TravelReel;
  active: boolean;
  onToggleLike: () => void;
}

function ReelItem({ reel, active, onToggleLike }: ReelItemProps) {
  const [paused, setPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  const player: VideoPlayer = useVideoPlayer(reel.videoUri ?? "", (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener("statusChange", (payload: { status: string }) => {
      if (!mountedRef.current) return;
      const s = payload?.status;
      if (s === "readyToPlay") {
        setLoading(false);
        setHasError(false);
        setIsReady(true);
      } else if (s === "loading") {
        setLoading(true);
        setIsReady(false);
      } else if (s === "error") {
        setLoading(false);
        setHasError(true);
        setIsReady(false);
        console.log("[Reels] video error", reel.videoUri);
      }
    });
    return () => {
      try {
        sub?.remove?.();
      } catch (e) {
        console.log("[Reels] remove listener error", e);
      }
    };
  }, [player, reel.videoUri]);

  useEffect(() => {
    if (!reel.videoUri || !isReady) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      try {
        if (active && !paused) {
          player.play();
        } else {
          player.pause();
        }
      } catch (e) {
        console.log("[Reels] play/pause error", e);
      }
    }, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
      try {
        player.pause();
      } catch (e) {
        console.log("[Reels] cleanup pause error", e);
      }
    };
  }, [active, paused, isReady, player, reel.videoUri]);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  const handleLikeTap = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onToggleLike();
  }, [onToggleLike]);

  return (
    <View style={styles.page}>
      <Image source={{ uri: reel.coverImage }} style={styles.coverFallback} contentFit="cover" />
      {reel.videoUri && !hasError ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
          allowsFullscreen={false}
        />
      ) : null}

      <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={togglePause}>
        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.85)"]}
          locations={[0, 0.18, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        {paused ? (
          <View style={styles.pauseIcon} pointerEvents="none">
            <Play size={48} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        ) : null}
        {loading && reel.videoUri && !hasError ? (
          <View style={styles.loadingWrap} pointerEvents="none">
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={styles.topInfo} pointerEvents="none">
        <View style={styles.cityChip}>
          <Text style={styles.cityChipText}>{reel.city}</Text>
        </View>
      </View>

      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLikeTap} activeOpacity={0.8} testID={`reel-like-${reel.id}`}>
          <Heart size={30} color={reel.likedByMe ? "#FF4D6D" : "#FFFFFF"} fill={reel.likedByMe ? "#FF4D6D" : "transparent"} />
          <Text style={styles.actionCount}>{reel.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={togglePause} activeOpacity={0.8}>
          {paused ? <Play size={28} color="#FFFFFF" fill="#FFFFFF" /> : <Pause size={28} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomInfo} pointerEvents="box-none">
        <Text style={styles.author}>{reel.author}</Text>
        <Text style={styles.reelTitle} numberOfLines={2}>{reel.title}</Text>
        <Text style={styles.tourTitle} numberOfLines={2}>{reel.tourTitle}</Text>
        <Text style={styles.story} numberOfLines={3}>{reel.story}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Eye size={11} color="#FFFFFF" />
            <Text style={styles.statText}>{`${reel.views} просмотров`}</Text>
          </View>
          <View style={styles.statDot} />
          <View style={styles.stat}>
            <Heart size={11} color="#FFFFFF" />
            <Text style={styles.statText}>{`${reel.likes} лайков`}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ReelsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ index?: string }>();
  const initialIndex = useMemo(() => {
    const n = parseInt(params.index ?? "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [params.index]);

  const { publishedReels, toggleLike, incrementView } = useReels();
  const reels = publishedReels;

  const listRef = useRef<FlatList<TravelReel>>(null);
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
  const viewedRef = useRef<Set<string>>(new Set());
  const reelsRef = useRef<TravelReel[]>(reels);
  useEffect(() => {
    reelsRef.current = reels;
  }, [reels]);

  useEffect(() => {
    const current = reelsRef.current[activeIndex];
    if (current && !viewedRef.current.has(current.id)) {
      viewedRef.current.add(current.id);
      incrementView(current.id);
    }
  }, [activeIndex, incrementView]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && typeof viewableItems[0].index === "number") {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const handleClose = useCallback(() => {
    try {
      router.back();
    } catch {
      router.replace("/");
    }
  }, [router]);

  if (reels.length === 0) {
    return (
      <View style={[styles.root, styles.emptyWrap]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.emptyText}>Reels пока нет</Text>
        <TouchableOpacity onPress={handleClose} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>Закрыть</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      {Platform.OS === "android" ? <RNStatusBar barStyle="light-content" backgroundColor="#000000" /> : null}
      <FlatList
        ref={listRef}
        data={reels}
        keyExtractor={(r) => r.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={Math.min(initialIndex, reels.length - 1)}
        getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <ReelItem reel={item} active={index === activeIndex} onToggleLike={() => toggleLike(item.id)} />
        )}
        testID="reels-fullscreen-pager"
      />
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={handleClose}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        testID="reels-close"
      >
        <X size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.progressRow} pointerEvents="none">
        {reels.map((_, i) => (
          <View key={`p-${i}`} style={[styles.progressDot, i === activeIndex ? styles.progressDotActive : null]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  page: { width: SCREEN_W, height: SCREEN_H, backgroundColor: "#000000" },
  coverFallback: { ...StyleSheet.absoluteFillObject, opacity: 0.85 },
  loadingWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  pauseIcon: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  topInfo: { position: "absolute", top: 56, left: 16, right: 60 },
  cityChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  cityChipText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" as const, letterSpacing: 0.4 },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  sideActions: { position: "absolute", right: 12, bottom: 160, alignItems: "center", gap: 18 },
  actionBtn: { alignItems: "center", gap: 4 },
  actionCount: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" as const, textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 4 },
  bottomInfo: { position: "absolute", left: 16, right: 80, bottom: 48 },
  author: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700" as const, marginBottom: 4 },
  reelTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" as const, lineHeight: 24, marginBottom: 4 },
  tourTitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "700" as const, marginBottom: 6 },
  story: { color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 17 },
  stats: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" as const },
  statDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.5)" },
  progressRow: { position: "absolute", top: 32, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 4 },
  progressDot: { width: 18, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" },
  progressDotActive: { backgroundColor: "#FFFFFF" },
  emptyWrap: { alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const, marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  emptyBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" as const },
});
