/**
 * ВРЕМЕННЫЙ мок транзакций — уходит в M4 (платежи через API).
 */
import type { Transaction } from "@/types/tour";

export const transactions: Transaction[] = [
  {
    id: "tr1",
    tourTitle: "Обзорная экскурсия по Москве",
    tourImage: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=200&h=150&fit=crop",
    amount: 5000,
    date: "2026-03-15",
    status: "completed",
  },
  {
    id: "tr3",
    tourTitle: "Белые ночи Петербурга",
    tourImage: "https://images.unsplash.com/photo-1556610961-2fecc5927173?w=200&h=150&fit=crop",
    amount: 3200,
    date: "2026-02-10",
    status: "refunded",
  },
];
