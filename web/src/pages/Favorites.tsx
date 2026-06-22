import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { Layout } from "@/components/Layout";
import { TourCard } from "@/components/TourCard";
import { useApp } from "@/context/AppContext";
import { tours } from "@/data/tours";
import { cities } from "@/data/cities";
import { cn } from "@/lib/utils";

type Tab = "tours" | "cities";

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, favoriteCities, toggleFavoriteCity } = useApp();
  const [tab, setTab] = useState<Tab>("tours");

  const favTours = useMemo(() => tours.filter((t) => favorites.includes(t.id)), [favorites]);
  const favCities = useMemo(() => cities.filter((c) => favoriteCities.includes(c.id)), [favoriteCities]);

  return (
    <Layout>
      <h1 className="mb-5 text-3xl font-extrabold">Избранное</h1>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("tours")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            tab === "tours" ? "bg-teal text-white" : "bg-secondary text-muted-foreground",
          )}
        >
          <Heart size={15} /> Экскурсии {favTours.length > 0 && `(${favTours.length})`}
        </button>
        <button
          onClick={() => setTab("cities")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            tab === "cities" ? "bg-teal text-white" : "bg-secondary text-muted-foreground",
          )}
        >
          <MapPin size={15} /> Города {favCities.length > 0 && `(${favCities.length})`}
        </button>
      </div>

      {tab === "tours" ? (
        favTours.length === 0 ? (
          <Empty title="Нет избранных экскурсий" text="Нажмите на сердечко на карточке, чтобы добавить её сюда" />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favTours.map((t) => <TourCard key={t.id} tour={t} />)}
          </div>
        )
      ) : favCities.length === 0 ? (
        <Empty title="Нет избранных городов" text="Отметьте города как избранные, чтобы они появились здесь" />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {favCities.map((city) => (
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
                <Heart size={16} className="text-coral" fill="#FF6B6B" />
              </span>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-xl">{city.emoji}</div>
                <div className="text-base font-bold text-white">{city.name}</div>
                <div className="mt-1 inline-block rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">{city.tourCount} туров</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <Heart size={36} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
