/**
 * ВРЕМЕННЫЙ мок покупок и транзакций — уходит в M3 (бронирования через API).
 * Самодостаточен: не ссылается на каталог.
 */
import type { PurchasedTour, Tour, Transaction } from "@/types/tour";

function demoTour(partial: Pick<Tour, "id" | "title" | "image" | "price" | "city" | "durationText">): Tour {
  return {
    ...partial,
    description: "",
    gallery: [],
    currency: "₽",
    duration: "one_day",
    transport: "auto",
    interest: "city",
    organizer: { id: "demo", name: "YaVoy", rating: 5, reviewCount: 0, avatar: "", verified: true, toursCount: 0 },
    highlights: [],
    includes: [],
    excludes: [],
    schedule: "",
    groupSize: "",
    languages: ["Русский"],
    popularity: 0,
    isInstantConfirmation: false,
    isFreeCancellation: false,
    isBestseller: false,
    isLikelyToSellOut: false,
    reviews: [],
    nextAvailableDate: "2099-12-31",
    bookingsToday: 0,
  };
}

export const purchasedTours: PurchasedTour[] = [
  {
    id: "pt1",
    tour: demoTour({
      id: "demo-msk",
      title: "Обзорная экскурсия по Москве",
      image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&h=600&fit=crop",
      price: 2500,
      city: "moscow",
      durationText: "4 часа",
    }),
    purchaseDate: "2026-03-15",
    tourDate: "2026-04-20",
    ticketCount: 2,
    confirmationCode: "YV-2026-0415",
    status: "upcoming",
  },
  {
    id: "pt3",
    tour: demoTour({
      id: "demo-spb",
      title: "Белые ночи Петербурга",
      image: "https://images.unsplash.com/photo-1556610961-2fecc5927173?w=800&h=600&fit=crop",
      price: 3200,
      city: "spb",
      durationText: "3 часа",
    }),
    purchaseDate: "2026-01-10",
    tourDate: "2026-02-15",
    ticketCount: 2,
    confirmationCode: "YV-2026-0215",
    status: "completed",
  },
];

export const transactions: Transaction[] = [
  {
    id: "tr1",
    tourTitle: "Обзорная экскурсия по Москве",
    tourImage: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=200&h=150&fit=crop",
    amount: 5000,
    currency: "₽",
    date: "2026-03-15",
    status: "completed",
  },
  {
    id: "tr3",
    tourTitle: "Белые ночи Петербурга",
    tourImage: "https://images.unsplash.com/photo-1556610961-2fecc5927173?w=200&h=150&fit=crop",
    amount: 3200,
    currency: "₽",
    date: "2026-02-10",
    status: "refunded",
  },
];
