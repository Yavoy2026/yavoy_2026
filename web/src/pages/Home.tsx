import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Play, ChevronRight, ShieldCheck, Headphones, Wallet, BadgeCheck, ArrowDownNarrowWide } from "lucide-react";
import { Layout } from "@/components/Layout";
import { TourCard } from "@/components/TourCard";
import { useApp } from "@/context/AppContext";
import { tours } from "@/data/tours";
import { cities, cityNameMap } from "@/data/cities";
import { cn } from "@/lib/utils";
import type { DurationType, TransportType, SortType, SeasonType } from "@/types";

const durationOptions: { key: DurationType; label: string }[] = [
  { key: "one_day", label: "Однодневные" },
  { key: "multi_day", label: "Многодневные" },
];
const transportOptions: { key: TransportType; label: string }[] = [
  { key: "auto", label: "Авто" },
  { key: "water", label: "Водные" },
  { key: "sea", label: "Морские" },
  { key: "bike", label: "Вело" },
  { key: "air", label: "Авиа" },
];
const interestOptions: { key: string; label: string }[] = [
  { key: "city", label: "Городские" },
  { key: "educational", label: "Познавательные" },
  { key: "nature", label: "Природные" },
  { key: "wine", label: "Винные" },
  { key: "photo", label: "Фототуры" },
  { key: "glamping", label: "Глэмпинг" },
  { key: "gastro", label: "Гастро" },
];
const seasonOptions: { key: SeasonType; label: string }[] = [
  { key: "winter", label: "Зима" },
  { key: "spring", label: "Весна" },
  { key: "summer", label: "Лето" },
  { key: "autumn", label: "Осень" },
];
const sortOptions: { key: SortType; label: string }[] = [
  { key: "popularity", label: "Популярные" },
  { key: "newest", label: "Новинки" },
  { key: "price_asc", label: "Дешевле" },
  { key: "price_desc", label: "Дороже" },
];

const advantages = [
  { icon: ShieldCheck, title: "Проверенные гиды", text: "Рейтинговая система и модерация каждого организатора" },
  { icon: BadgeCheck, title: "Мгновенное бронирование", text: "Подтверждение брони за секунды" },
  { icon: Wallet, title: "Безопасная оплата", text: "Защищённые платежи и возвраты" },
  { icon: Headphones, title: "Поддержка 24/7", text: "Всегда на связи до и во время поездки" },
];

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all",
        active
          ? "border-teal bg-teal text-white shadow-sm shadow-teal/30"
          : "border-border bg-card text-muted-foreground hover:border-teal/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { publishedReels, favoriteCities, toggleFavoriteCity } = useApp();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [duration, setDuration] = useState<DurationType | null>(null);
  const [transport, setTransport] = useState<TransportType | null>(null);
  const [interest, setInterest] = useState<string | null>(null);
  const [season, setSeason] = useState<SeasonType | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortType>("popularity");

  const filtered = useMemo(() => {
    let result = [...tours];
    if (selectedCity) result = result.filter((t) => t.city === selectedCity);
    if (duration) result = result.filter((t) => t.duration === duration);
    if (transport) result = result.filter((t) => t.transport === transport);
    if (interest) result = result.filter((t) => t.interest === interest || t.category === interest);
    if (season) result = result.filter((t) => t.season === season || t.season === "all_year");
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.organizer.name.toLowerCase().includes(q) ||
          (cityNameMap[t.city] ?? "").toLowerCase().includes(q),
      );
    }
    switch (sort) {
      case "popularity": result.sort((a, b) => b.popularity - a.popularity); break;
      case "newest": result.sort((a, b) => a.nextAvailableDate.localeCompare(b.nextAvailableDate)); break;
      case "price_asc": result.sort((a, b) => a.price - b.price); break;
      case "price_desc": result.sort((a, b) => b.price - a.price); break;
    }
    return result;
  }, [selectedCity, duration, transport, interest, season, search, sort]);

  const popular = useMemo(() => [...tours].filter((t) => t.popularity >= 85).sort((a, b) => b.popularity - a.popularity), []);
  const hasFilters = selectedCity || duration || transport || interest || season || search.trim();

  const resetAll = () => {
    setSelectedCity(null); setDuration(null); setTransport(null); setInterest(null); setSeason(null); setSearch("");
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-navy p-8 text-white shadow-xl md:p-12">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-light">
            500+ экскурсий · 50+ городов России
          </span>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight md:text-5xl">
            Откройте Россию <br className="hidden md:block" />через <span className="text-teal-light">впечатления</span>
          </h1>
          <p className="mb-6 max-w-lg text-sm text-white/70 md:text-base">
            Находите и бронируйте уникальные экскурсии с проверенными гидами. От обзорных прогулок до многодневных приключений.
          </p>
          <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lg">
            <Search size={20} className="ml-2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по городу, гиду или экскурсии…"
              className="flex-1 bg-transparent py-2 text-sm text-navy outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-navy">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* City selector */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Куда поедем?</h2>
          {selectedCity && (
            <button onClick={() => setSelectedCity(null)} className="text-sm font-semibold text-teal">Все города</button>
          )}
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {cities.map((city) => {
            const active = selectedCity === city.id;
            return (
              <button
                key={city.id}
                onClick={() => setSelectedCity(active ? null : city.id)}
                className={cn(
                  "group relative h-32 w-44 shrink-0 overflow-hidden rounded-2xl text-left ring-2 transition-all",
                  active ? "ring-teal" : "ring-transparent hover:ring-teal/40",
                )}
              >
                <img src={city.image} alt={city.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-lg">{city.emoji}</div>
                  <div className="font-bold text-white">{city.name}</div>
                  <div className="text-[11px] text-white/70">{city.tourCount} туров</div>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); toggleFavoriteCity(city.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggleFavoriteCity(city.id); } }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur"
                >
                  <span className={cn("text-sm", favoriteCities.includes(city.id) ? "text-coral" : "text-white")}>♥</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Reels strip */}
      {!hasFilters && publishedReels.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">Reels из туров</h2>
            <button onClick={() => navigate("/reels")} className="flex items-center text-sm font-semibold text-teal">
              Все <ChevronRight size={16} />
            </button>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {publishedReels.map((reel) => (
              <button
                key={reel.id}
                onClick={() => navigate("/reels")}
                className="group relative h-56 w-36 shrink-0 overflow-hidden rounded-2xl"
              >
                <img src={reel.coverImage} alt={reel.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <Play size={14} className="text-white" fill="white" />
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="line-clamp-2 text-xs font-bold text-white">{reel.title}</div>
                  <div className="mt-0.5 text-[10px] text-white/70">{reel.city} · {reel.likes} ❤</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Popular carousel */}
      {!hasFilters && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">Популярные сейчас</h2>
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {popular.map((tour) => (
              <div key={tour.id} className="w-72 shrink-0">
                <TourCard tour={tour} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="mb-6 space-y-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {durationOptions.map((o) => (
            <Chip key={o.key} active={duration === o.key} label={o.label} onClick={() => setDuration(duration === o.key ? null : o.key)} />
          ))}
          {transportOptions.map((o) => (
            <Chip key={o.key} active={transport === o.key} label={o.label} onClick={() => setTransport(transport === o.key ? null : o.key)} />
          ))}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {interestOptions.map((o) => (
            <Chip key={o.key} active={interest === o.key} label={o.label} onClick={() => setInterest(interest === o.key ? null : o.key)} />
          ))}
          {seasonOptions.map((o) => (
            <Chip key={o.key} active={season === o.key} label={o.label} onClick={() => setSeason(season === o.key ? null : o.key)} />
          ))}
        </div>
      </section>

      {/* Sort + count */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">
            {selectedCity ? cityNameMap[selectedCity] : "Все направления"}
          </h2>
          <p className="text-sm text-muted-foreground">{filtered.length} {pluralTours(filtered.length)}</p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowDownNarrowWide size={16} className="text-muted-foreground" />
          <div className="flex gap-1.5">
            {sortOptions.map((o) => (
              <button
                key={o.key}
                onClick={() => setSort(o.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  sort === o.key ? "bg-teal text-white" : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          {hasFilters && (
            <button onClick={resetAll} className="ml-1 text-sm font-semibold text-teal">Сбросить</button>
          )}
        </div>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-20 text-center">
          <div className="mb-3 text-5xl">🧭</div>
          <h3 className="text-lg font-bold">Экскурсии не найдены</h3>
          <p className="mt-1 text-sm text-muted-foreground">Попробуйте изменить фильтры или выбрать другой город</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}

      {/* Advantages */}
      <section className="mt-12 rounded-3xl bg-card p-6 ring-1 ring-border/60 md:p-8">
        <h2 className="mb-6 text-center text-2xl font-extrabold">Почему YaVoy</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((a) => (
            <div key={a.title} className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10">
                <a.icon size={26} className="text-teal" />
              </div>
              <h3 className="mb-1 font-bold">{a.title}</h3>
              <p className="text-sm text-muted-foreground">{a.text}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}

function pluralTours(count: number): string {
  const t = count % 100;
  const o = count % 10;
  if (t >= 11 && t <= 19) return "экскурсий";
  if (o === 1) return "экскурсия";
  if (o >= 2 && o <= 4) return "экскурсии";
  return "экскурсий";
}
