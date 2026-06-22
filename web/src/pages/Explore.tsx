import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, TrendingUp, Heart, ChevronRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { StarRating } from "@/components/StarRating";
import { useApp } from "@/context/AppContext";
import { cities, cityNameMap } from "@/data/cities";
import { tours } from "@/data/tours";
import { cn } from "@/lib/utils";

export default function Explore() {
  const navigate = useNavigate();
  const { favoriteCities, toggleFavoriteCity } = useApp();
  const [transport, setTransport] = useState<string | null>(null);

  const topRated = useMemo(
    () => [...tours].sort((a, b) => b.organizer.rating - a.organizer.rating).slice(0, 6),
    [],
  );

  const transportCats = [
    { key: "auto", label: "Авто", emoji: "🚗" },
    { key: "water", label: "Водные", emoji: "🛶" },
    { key: "sea", label: "Морские", emoji: "⛵" },
    { key: "bike", label: "Вело", emoji: "🚲" },
    { key: "air", label: "Авиа", emoji: "✈️" },
  ];

  const filtered = useMemo(
    () => (transport ? tours.filter((t) => t.transport === transport) : []),
    [transport],
  );

  return (
    <Layout>
      <h1 className="mb-1 text-3xl font-extrabold">Направления</h1>
      <p className="mb-8 text-muted-foreground">Выбирайте город и формат — мы покажем лучшие маршруты</p>

      {/* Cities grid */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-teal" />
          <h2 className="text-xl font-bold">Популярные города</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {cities.map((city) => (
            <button
              key={city.id}
              onClick={() => navigate(`/?city=${city.id}`)}
              className="group relative h-44 overflow-hidden rounded-2xl text-left shadow-sm"
            >
              <img src={city.image} alt={city.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); toggleFavoriteCity(city.id); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggleFavoriteCity(city.id); } }}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur"
              >
                <Heart size={16} className={favoriteCities.includes(city.id) ? "text-coral" : "text-white"} fill={favoriteCities.includes(city.id) ? "#FF6B6B" : "transparent"} />
              </span>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-xl">{city.emoji}</div>
                <div className="text-base font-bold text-white">{city.name}</div>
                <div className="line-clamp-1 text-[11px] text-white/70">{city.description}</div>
                <div className="mt-1.5 inline-block rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">{city.tourCount} туров</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Transport categories */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold">По транспорту</h2>
        <div className="flex flex-wrap gap-3">
          {transportCats.map((c) => (
            <button
              key={c.key}
              onClick={() => setTransport(transport === c.key ? null : c.key)}
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-5 py-3 font-semibold transition-all",
                transport === c.key ? "border-teal bg-teal text-white" : "border-border bg-card hover:border-teal/40",
              )}
            >
              <span className="text-xl">{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
        {filtered.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((tour) => (
              <button
                key={tour.id}
                onClick={() => navigate(`/tour/${tour.id}`)}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-border/60 transition-colors hover:ring-teal/40"
              >
                <img src={tour.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{tour.title}</div>
                  <div className="text-xs text-muted-foreground">{cityNameMap[tour.city]} · {tour.durationText}</div>
                  <div className="text-sm font-bold text-teal">от {tour.price.toLocaleString("ru-RU")}{tour.currency}</div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Top rated */}
      <section className="rounded-3xl bg-card p-6 ring-1 ring-border/60">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-gold" />
          <h2 className="text-xl font-bold">Лучшие по рейтингу</h2>
        </div>
        <div className="divide-y divide-border">
          {topRated.map((tour, i) => (
            <button
              key={tour.id}
              onClick={() => navigate(`/tour/${tour.id}`)}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal/10 text-sm font-extrabold text-teal">{i + 1}</div>
              <img src={tour.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{tour.title}</div>
                <StarRating rating={tour.organizer.rating} size={12} showValue reviewCount={tour.organizer.reviewCount} />
              </div>
              <div className="text-sm font-bold text-teal">от {tour.price.toLocaleString("ru-RU")}{tour.currency}</div>
            </button>
          ))}
        </div>
      </section>
    </Layout>
  );
}
