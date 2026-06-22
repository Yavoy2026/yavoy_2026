import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Clock, Zap, Flame } from "lucide-react";
import { StarRating } from "./StarRating";
import { useApp } from "@/context/AppContext";
import { cityNameMap } from "@/data/cities";
import { cn } from "@/lib/utils";
import type { Tour } from "@/types";

interface TourCardProps {
  tour: Tour;
  compact?: boolean;
}

export function TourCard({ tour, compact = false }: TourCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useApp();
  const fav = isFavorite(tour.id);

  return (
    <button
      onClick={() => navigate(`/tour/${tour.id}`)}
      className="group block w-full overflow-hidden rounded-2xl bg-card text-left shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/5"
    >
      <div className="relative">
        <div className={cn("w-full overflow-hidden", compact ? "h-40" : "h-52")}>
          <img
            src={tour.image}
            alt={tour.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {tour.isBestseller && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-navy shadow">
              Хит продаж
            </span>
          )}
          {tour.isLikelyToSellOut && (
            <span className="flex items-center gap-1 rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold text-white shadow">
              <Flame size={11} /> Раскупают
            </span>
          )}
        </div>

        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(tour.id); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggleFavorite(tour.id); } }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur transition-transform hover:scale-110 dark:bg-navy/80"
        >
          <Heart size={18} className={fav ? "text-coral" : "text-navy/60 dark:text-white/70"} fill={fav ? "#FF6B6B" : "transparent"} />
        </span>

        {tour.originalPrice && (
          <span className="absolute bottom-3 right-3 rounded-lg bg-coral px-2 py-1 text-[11px] font-bold text-white shadow">
            -{Math.round((1 - tour.price / tour.originalPrice) * 100)}%
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={12} className="text-teal" />
          <span>{cityNameMap[tour.city] ?? tour.city}</span>
          <span>·</span>
          <Clock size={12} />
          <span>{tour.durationText}</span>
        </div>

        <h3 className="mb-1.5 line-clamp-2 text-base font-bold leading-snug text-foreground">
          {tour.title}
        </h3>

        <div className="mb-3 flex items-center gap-2">
          <StarRating rating={tour.organizer.rating} size={13} showValue reviewCount={tour.organizer.reviewCount} />
          {tour.isInstantConfirmation && (
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-teal">
              <Zap size={11} fill="#0FA3B1" /> Мгновенно
            </span>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs text-muted-foreground">от </span>
            <span className="text-lg font-extrabold text-teal">{tour.price.toLocaleString("ru-RU")}{tour.currency}</span>
            {tour.originalPrice && (
              <span className="ml-1.5 text-xs text-muted-foreground line-through">
                {tour.originalPrice.toLocaleString("ru-RU")}{tour.currency}
              </span>
            )}
          </div>
          <span className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition-colors group-hover:bg-teal group-hover:text-white">
            Подробнее
          </span>
        </div>
      </div>
    </button>
  );
}
