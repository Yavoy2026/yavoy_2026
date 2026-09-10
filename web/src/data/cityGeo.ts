/**
 * Геоданные городов Узбекистана для интерактивной карты маршрута:
 * центр города и точки интереса.
 */
export interface CityPoint {
  name: string;
  lat: number;
  lng: number;
  emoji: string;
}

export interface CityGeo {
  center: { lat: number; lng: number };
  points: CityPoint[];
}

export const cityGeo: Record<string, CityGeo> = {
  tashkent: {
    center: { lat: 41.3111, lng: 69.2797 },
    points: [
      { name: "Комплекс Хазрати Имам", lat: 41.3224, lng: 69.2208, emoji: "🕌" },
      { name: "Базар Чорсу", lat: 41.3243, lng: 69.2277, emoji: "🛍" },
      { name: "Площадь Мустакиллик", lat: 41.3111, lng: 69.2879, emoji: "🏛" },
      { name: "Ташкент Сити", lat: 41.2995, lng: 69.2689, emoji: "🏙" },
      { name: "ТВ-башня Ташкента", lat: 41.3275, lng: 69.2894, emoji: "📡" },
    ],
  },
  samarkand: {
    center: { lat: 39.6547, lng: 66.9758 },
    points: [
      { name: "Площадь Регистан", lat: 39.6547, lng: 66.9758, emoji: "🕌" },
      { name: "Мавзолей Гур-Эмир", lat: 39.665, lng: 66.9716, emoji: "👑" },
      { name: "Некрополь Шахи-Зинда", lat: 39.6628, lng: 66.9829, emoji: "🕊" },
      { name: "Мечеть Биби-Ханум", lat: 39.6525, lng: 66.9797, emoji: "🕌" },
      { name: "Сиабский базар", lat: 39.654, lng: 66.9817, emoji: "🛍" },
      { name: "Обсерватория Улугбека", lat: 39.6744, lng: 67.0098, emoji: "🔭" },
    ],
  },
  bukhara: {
    center: { lat: 39.7747, lng: 64.4286 },
    points: [
      { name: "Ансамбль Ляби-Хауз", lat: 39.7897, lng: 64.4156, emoji: "⛲️" },
      { name: "Минарет Калян", lat: 39.778, lng: 64.4149, emoji: "🗼" },
      { name: "Крепость Арк", lat: 39.7875, lng: 64.4196, emoji: "🏰" },
      { name: "Мавзолей Исмаила Самани", lat: 39.7837, lng: 64.4026, emoji: "🕌" },
      { name: "Чор-Минор", lat: 39.7922, lng: 64.4144, emoji: "🕌" },
      { name: "Торговые купола", lat: 39.789, lng: 64.4166, emoji: "🛍" },
    ],
  },
  khiva: {
    center: { lat: 41.3775, lng: 60.3635 },
    points: [
      { name: "Куня-Арк", lat: 41.377, lng: 60.362, emoji: "🏰" },
      { name: "Минарет Кальта-Минор", lat: 41.3772, lng: 60.3614, emoji: "🗼" },
      { name: "Джума-мечеть", lat: 41.3785, lng: 60.3635, emoji: "🕌" },
      { name: "Минарет Ислам-Ходжи", lat: 41.379, lng: 60.3642, emoji: "🗼" },
      { name: "Дворец Таш-Хаули", lat: 41.3786, lng: 60.3647, emoji: "🏛" },
    ],
  },
  chimgan: {
    center: { lat: 41.5489, lng: 70.0333 },
    points: [
      { name: "Канатная дорога Чимган", lat: 41.552, lng: 70.029, emoji: "🚡" },
      { name: "Вершина Большой Чимган", lat: 41.557, lng: 70.045, emoji: "🏔" },
      { name: "Водохранилище Чарвак", lat: 41.59, lng: 70.02, emoji: "🌊" },
      { name: "Ущелье Бельдерсай", lat: 41.588, lng: 70.066, emoji: "🎿" },
      { name: "Ущелье Гулькам", lat: 41.566, lng: 70.062, emoji: "🥾" },
    ],
  },
  aidarkul: {
    center: { lat: 40.8031, lng: 67.2958 },
    points: [
      { name: "Юртовый лагерь Айазма", lat: 40.835, lng: 67.289, emoji: "⛺️" },
      { name: "Озеро Айдаркуль", lat: 40.9, lng: 67.45, emoji: "🌊" },
      { name: "Пески Кызылкум", lat: 40.76, lng: 67.15, emoji: "🏜" },
      { name: "Озеро Тузкан", lat: 40.65, lng: 67.4, emoji: "🦩" },
    ],
  },
  termez: {
    center: { lat: 37.2242, lng: 67.2783 },
    points: [
      { name: "Монастырь Фаяз-Тепе", lat: 37.19, lng: 67.24, emoji: "🛕" },
      { name: "Кара-Тепе", lat: 37.185, lng: 67.235, emoji: "🛕" },
      { name: "Ступа Зурмала", lat: 37.193, lng: 67.25, emoji: "🗿" },
      { name: "Крепость Кампыр-Тепе", lat: 37.13, lng: 67.16, emoji: "🏰" },
      { name: "Мавзолей Хакима ат-Термези", lat: 37.217, lng: 67.274, emoji: "🕌" },
    ],
  },
  fergana: {
    center: { lat: 40.3864, lng: 71.7864 },
    points: [
      { name: "Шёлковая фабрика Маргилана", lat: 40.459, lng: 71.723, emoji: "🧵" },
      { name: "Керамика Риштана", lat: 40.53, lng: 71.05, emoji: "🏺" },
      { name: "Дворец Худояр-хана, Коканд", lat: 40.515, lng: 70.95, emoji: "🏛" },
      { name: "Парк Алтынкуль, Фергана", lat: 40.384, lng: 71.79, emoji: "🌳" },
    ],
  },
  nukus: {
    center: { lat: 42.4531, lng: 59.6103 },
    points: [
      { name: "Музей Савицкого", lat: 42.458, lng: 59.606, emoji: "🖼" },
      { name: "Миздахкан", lat: 42.3, lng: 58.95, emoji: "🕌" },
      { name: "Плато Чилпик", lat: 42.1, lng: 59.3, emoji: "🏜" },
      { name: "Каньоны Устюрта", lat: 43.1, lng: 58.7, emoji: "🧭" },
    ],
  },
  aral: {
    center: { lat: 43.7667, lng: 59.0333 },
    points: [
      { name: "Корабельное кладбище Муйнака", lat: 43.768, lng: 59.037, emoji: "🚢" },
      { name: "Музей Арала", lat: 43.766, lng: 59.041, emoji: "🏛" },
      { name: "Дно высохшего моря", lat: 44.0, lng: 59.5, emoji: "🏜" },
      { name: "Плато Устюрт", lat: 43.5, lng: 58.2, emoji: "🧭" },
    ],
  },
};

export function getCityGeo(cityId: string): CityGeo | undefined {
  return cityGeo[cityId];
}
