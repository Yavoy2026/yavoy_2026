import { Linking, Share } from "react-native";
import { Tour } from "@/types/tour";

const TOUR_LINK_BASE = "https://yavoy.ru/tour";

/**
 * Собирает предзаполненное сообщение для «Поделиться туром»
 * (используется для Telegram и системного шеринга).
 */
export function buildTourShareMessage(
  tour: Tour,
  cityName: string,
  priceText: string
): string {
  const lines: string[] = [
    `🌍 ${tour.title}`,
    `📍 ${cityName}, Узбекистан`,
    `💰 ${priceText} за человека`,
    `⏱ ${tour.durationText}`,
    "",
    tour.description,
    "",
    tour.highlights.length > 0 ? `✨ ${tour.highlights.slice(0, 3).join(" · ")}` : "",
    `👤 Организатор: ${tour.organizer.name} (${tour.organizer.rating}⭐)`,
    "",
    "Забронировать в YAVAY Travel Group:",
    `${TOUR_LINK_BASE}/${tour.id}`,
  ];
  return lines.filter((line) => line !== undefined).join("\n");
}

/**
 * Открывает Telegram с предзаполненным сообщением; если Telegram недоступен —
 * возвращается к системному диалогу «Поделиться».
 */
export async function shareTourViaTelegram(tour: Tour, message: string): Promise<void> {
  const link = `${TOUR_LINK_BASE}/${tour.id}`;
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`;
  try {
    const canOpen = await Linking.canOpenURL(tgUrl);
    if (canOpen) {
      await Linking.openURL(tgUrl);
      return;
    }
    throw new Error("telegram unavailable");
  } catch {
    try {
      await Share.share({ message: `${message}` });
    } catch (e) {
      console.log("Share error:", e);
    }
  }
}
