import type { City } from "@/types";

export const cities: City[] = [
  {
    id: "moscow",
    name: "Москва",
    image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=600&h=400&fit=crop",
    tourCount: 156,
    description: "Столица России с богатой историей",
    emoji: "🏛",
  },
  {
    id: "spb",
    name: "Санкт-Петербург",
    image: "https://images.unsplash.com/photo-1556610961-2fecc5927173?w=600&h=400&fit=crop",
    tourCount: 203,
    description: "Культурная столица и город белых ночей",
    emoji: "🌉",
  },
  {
    id: "sochi",
    name: "Сочи",
    image: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=600&h=400&fit=crop",
    tourCount: 89,
    description: "Курортная столица юга России",
    emoji: "🏖",
  },
  {
    id: "kazan",
    name: "Казань",
    image: "https://images.unsplash.com/photo-1623846750638-2765f498d67f?w=600&h=400&fit=crop",
    tourCount: 67,
    description: "Город на стыке двух культур",
    emoji: "🕌",
  },
  {
    id: "kaliningrad",
    name: "Калининград",
    image: "https://images.unsplash.com/photo-1600421777050-1fdf399a1284?w=600&h=400&fit=crop",
    tourCount: 42,
    description: "Самый европейский город России",
    emoji: "⚓",
  },
  {
    id: "baikal",
    name: "Байкал",
    image: "https://images.unsplash.com/photo-1551845041-63e8e76836ea?w=600&h=400&fit=crop",
    tourCount: 31,
    description: "Жемчужина Сибири",
    emoji: "🏔",
  },
  {
    id: "vladivostok",
    name: "Владивосток",
    image: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=600&h=400&fit=crop",
    tourCount: 28,
    description: "Ворота в Тихий океан",
    emoji: "🌊",
  },
  {
    id: "yekaterinburg",
    name: "Екатеринбург",
    image: "https://images.unsplash.com/photo-1571504211935-1c936b327411?w=600&h=400&fit=crop",
    tourCount: 35,
    description: "Столица Урала",
    emoji: "⛰",
  },
];

export const cityNameMap: Record<string, string> = {};
cities.forEach((c) => {
  cityNameMap[c.id] = c.name;
});
