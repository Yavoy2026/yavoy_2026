import type { City } from "@/types";

export const cities: City[] = [
  {
    id: "tashkent",
    name: "Ташкент",
    image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/56ef7bc9-f150-4cb1-a768-760fe959e361.png",
    tourCount: 214,
    description: "Столица Узбекистана, базары и современная архитектура",
    emoji: "🏙",
  },
  {
    id: "samarkand",
    name: "Самарканд",
    image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/fa103fd8-ada9-451b-bb39-2b204266a6c2.png",
    tourCount: 187,
    description: "Жемчужина Шёлкового пути, город Регистана",
    emoji: "🕌",
  },
  {
    id: "bukhara",
    name: "Бухара",
    image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/54b1dfd6-74d7-44fe-a843-c975eb172a39.png",
    tourCount: 132,
    description: "Город-музей со 140 памятниками",
    emoji: "🏰",
  },
  {
    id: "khiva",
    name: "Хива",
    image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/816c2d7e-df74-4de5-b168-5fdccb6cf52e.png",
    tourCount: 78,
    description: "Древняя Ичан-Кала под открытым небом",
    emoji: "🏛",
  },
  {
    id: "chimgan",
    name: "Чимган и Чарвак",
    image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/6b088c82-6a8d-4abe-9391-323243e21515.png",
    tourCount: 54,
    description: "Горы и бирюзовое водохранилище под Ташкентом",
    emoji: "🏔",
  },
  {
    id: "aidarkul",
    name: "Айдаркуль",
    image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/d0cbdc13-1f5c-4f4a-9959-2f8bf71e4097.png",
    tourCount: 32,
    description: "Юртовые лагеря у озера в пустыне",
    emoji: "🐪",
  },
  {
    id: "termez",
    name: "Термез",
    image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/b5630c21-4874-406e-aaf5-b27fcd09d7ef.png",
    tourCount: 26,
    description: "Буддийское наследие древнего юга",
    emoji: "🛕",
  },
  {
    id: "fergana",
    name: "Ферганская долина",
    image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/82afa6f4-42eb-426c-8105-c681c03601b4.png",
    tourCount: 41,
    description: "Шёлк Маргилана и керамика Риштана",
    emoji: "🎨",
  },
  {
    id: "nukus",
    name: "Нукус",
    image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/aaf403ed-f848-4342-bc07-d8ecb064bb51.png",
    tourCount: 19,
    description: "Музей Савицкого и каньоны Устюрта",
    emoji: "🏺",
  },
  {
    id: "aral",
    name: "Муйнак и Арал",
    image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/1fe83fa0-d4fc-4666-9a46-6a140a54bcca.png",
    tourCount: 17,
    description: "Корабельное кладбище и высохшее море",
    emoji: "🚢",
  },
];

export const cityNameMap: Record<string, string> = {};
cities.forEach((c) => {
  cityNameMap[c.id] = c.name;
});
