import { useCallback, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { TravelReel } from "@/types/tour";
import { initialReels } from "@/mocks/reels";

const REEL_REWARD_POINTS = 300;

function parseShortNumber(input: string): number {
  if (!input) return 0;
  const trimmed = input.trim().toUpperCase().replace(",", ".");
  const numericMatch = trimmed.match(/([\d.]+)/);
  if (!numericMatch) return 0;
  const value = parseFloat(numericMatch[1] ?? "0");
  if (trimmed.includes("M")) return Math.round(value * 1_000_000);
  if (trimmed.includes("K")) return Math.round(value * 1_000);
  return Math.round(value);
}

function formatShortNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(value);
}

function hydrate(reel: TravelReel): TravelReel {
  const viewsCount = reel.viewsCount ?? parseShortNumber(reel.views);
  const likesCount = reel.likesCount ?? parseShortNumber(reel.likes);
  return {
    ...reel,
    viewsCount,
    likesCount,
    likedByMe: reel.likedByMe ?? false,
    views: reel.views ?? formatShortNumber(viewsCount),
    likes: reel.likes ?? formatShortNumber(likesCount),
  };
}

export const [ReelsProvider, useReels] = createContextHook(() => {
  const [reels, setReels] = useState<TravelReel[]>(() => initialReels.map(hydrate));

  const submitReel = useCallback((params: { title: string; tourTitle: string; city: string; videoUri?: string; coverImage?: string }) => {
    const newReel: TravelReel = hydrate({
      id: `user-reel-${Date.now()}`,
      title: params.title.trim() || "Мой reels из поездки",
      city: params.city.trim() || "Россия",
      tourTitle: params.tourTitle.trim() || "Экскурсия YAVOY",
      coverImage: params.coverImage || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=900&fit=crop",
      videoUri: params.videoUri,
      author: "Иван Петров",
      duration: "на модерации",
      views: "0",
      likes: "0",
      viewsCount: 0,
      likesCount: 0,
      likedByMe: false,
      story: "Видео пользователя ожидает проверки администратором. После модерации оно может появиться в ленте reels на главном экране.",
      status: "moderation",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setReels((prev) => [newReel, ...prev]);
    console.log("[ReelsProvider] User reel submitted for moderation", newReel.id);
    return { reel: newReel, reward: REEL_REWARD_POINTS };
  }, []);

  const toggleLike = useCallback((reelId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id !== reelId) return r;
        const liked = !r.likedByMe;
        const likesCount = Math.max(0, r.likesCount + (liked ? 1 : -1));
        return { ...r, likedByMe: liked, likesCount, likes: formatShortNumber(likesCount) };
      })
    );
  }, []);

  const incrementView = useCallback((reelId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id !== reelId) return r;
        const viewsCount = r.viewsCount + 1;
        return { ...r, viewsCount, views: formatShortNumber(viewsCount) };
      })
    );
  }, []);

  const approveReel = useCallback((reelId: string) => {
    setReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, status: "published" as const } : r)));
    console.log("[ReelsProvider] Reel approved", reelId);
  }, []);

  const rejectReel = useCallback((reelId: string) => {
    setReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, status: "rejected" as const } : r)));
    console.log("[ReelsProvider] Reel rejected", reelId);
  }, []);

  const publishedReels = useMemo(() => reels.filter((reel) => reel.status === "published"), [reels]);
  const moderationReels = useMemo(() => reels.filter((reel) => reel.status === "moderation"), [reels]);

  return useMemo(
    () => ({ reels, publishedReels, moderationReels, submitReel, toggleLike, incrementView, approveReel, rejectReel, rewardPoints: REEL_REWARD_POINTS }),
    [reels, publishedReels, moderationReels, submitReel, toggleLike, incrementView, approveReel, rejectReel]
  );
});
