import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { City, Tour, TourDateOption, TourReview } from "@/types/tour";
import { apiFetch, ApiError } from "@/services/api";

/**
 * Каталог целиком с GET /v1/catalog (bootstrap-эндпоинт).
 * Пока каталог мал, фильтрация остаётся на клиенте — экраны работают
 * с привычным типом Tour через адаптер ниже.
 */

interface ApiOrganizer {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  avatar: string | null;
  verified: boolean;
  tours_count: number;
}

interface ApiCity {
  id: string;
  name: string;
  description: string;
  emoji: string;
  image_url: string;
  lat: number | null;
  lng: number | null;
  tours_count: number;
}

interface ApiTour {
  id: string;
  title: string;
  description: string;
  image_url: string;
  gallery: string[];
  price_kopeks: number;
  original_price_kopeks: number | null;
  duration_type: Tour["duration"];
  duration_text: string;
  transport: Tour["transport"];
  interest: Tour["interest"];
  category: Tour["category"] | null;
  season: Tour["season"] | null;
  city_id: string;
  organizer: ApiOrganizer;
  highlights: string[];
  includes: string[];
  excludes: string[];
  what_to_bring: string[];
  languages: string[];
  schedule: string | null;
  group_size: string | null;
  meeting_point: string | null;
  meeting_lat: number | null;
  meeting_lng: number | null;
  start_time: string | null;
  booking_conditions: string | null;
  prepayment: string | null;
  cancellation_policy: string | null;
  group_joining_conditions: string | null;
  is_instant_confirmation: boolean;
  is_free_cancellation: boolean;
  is_bestseller: boolean;
  is_likely_to_sell_out: boolean;
  popularity: number;
  next_available_date: string | null;
  rating: number | null;
  reviews_count: number;
  reviews: {
    id: string;
    rating: number;
    text: string;
    author_name: string;
    created_at: string;
  }[];
  dates: {
    id: string;
    starts_on: string;
    seats_left: number;
    price_kopeks: number;
  }[];
}

/** Тур без будущих дат: фильтр по дате не должен его прятать */
const NO_DATE_FALLBACK = "2099-12-31";

function adaptTour(t: ApiTour): Tour {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    image: t.image_url,
    gallery: t.gallery,
    price: Math.round(t.price_kopeks / 100),
    originalPrice: t.original_price_kopeks != null ? Math.round(t.original_price_kopeks / 100) : undefined,
    currency: "₽",
    duration: t.duration_type,
    durationText: t.duration_text,
    transport: t.transport,
    interest: t.interest,
    category: t.category ?? undefined,
    season: t.season ?? undefined,
    city: t.city_id,
    organizer: {
      id: t.organizer.id,
      name: t.organizer.name,
      rating: t.organizer.rating,
      reviewCount: t.organizer.review_count,
      avatar: t.organizer.avatar ?? "",
      verified: t.organizer.verified,
      toursCount: t.organizer.tours_count,
    },
    highlights: t.highlights,
    includes: t.includes,
    excludes: t.excludes,
    schedule: t.schedule ?? "",
    groupSize: t.group_size ?? "",
    languages: t.languages,
    popularity: t.popularity,
    isInstantConfirmation: t.is_instant_confirmation,
    isFreeCancellation: t.is_free_cancellation,
    isBestseller: t.is_bestseller,
    isLikelyToSellOut: t.is_likely_to_sell_out,
    reviews: t.reviews.map(
      (r): TourReview => ({
        id: r.id,
        author: r.author_name,
        avatar: `https://ui-avatars.com/api/?background=0FA3B1&color=fff&name=${encodeURIComponent(r.author_name)}`,
        rating: r.rating,
        text: r.text,
        date: r.created_at.slice(0, 10),
      }),
    ),
    meetingPoint: t.meeting_point ?? undefined,
    meetingPointCoords:
      t.meeting_lat != null && t.meeting_lng != null
        ? { lat: t.meeting_lat, lng: t.meeting_lng }
        : undefined,
    nextAvailableDate: t.next_available_date ?? NO_DATE_FALLBACK,
    bookingsToday: 0,
    startTime: t.start_time ?? undefined,
    whatToBring: t.what_to_bring,
    bookingConditions: t.booking_conditions ?? undefined,
    prepayment: t.prepayment ?? undefined,
    cancellationPolicy: t.cancellation_policy ?? undefined,
    groupJoiningConditions: t.group_joining_conditions ?? undefined,
    dates: t.dates.map(
      (d): TourDateOption => ({
        id: d.id,
        date: d.starts_on,
        seatsLeft: d.seats_left,
        price: Math.round(d.price_kopeks / 100),
      }),
    ),
  };
}

function adaptCity(c: ApiCity): City {
  return {
    id: c.id,
    name: c.name,
    image: c.image_url,
    tourCount: c.tours_count,
    description: c.description,
    emoji: c.emoji,
    lat: c.lat ?? undefined,
    lng: c.lng ?? undefined,
  };
}

async function fetchCatalog(): Promise<{ cities: City[]; tours: Tour[] }> {
  const res = await apiFetch("/catalog");
  if (!res.ok) throw new ApiError(res.status, "catalogUnavailable", `catalog ${res.status}`);
  const body = (await res.json()) as { cities: ApiCity[]; tours: ApiTour[] };
  return { cities: body.cities.map(adaptCity), tours: body.tours.map(adaptTour) };
}

export function useCatalog() {
  const query = useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    staleTime: 5 * 60 * 1000,
  });

  const tours = useMemo(() => query.data?.tours ?? [], [query.data]);
  const cities = useMemo(() => query.data?.cities ?? [], [query.data]);

  const cityNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    cities.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [cities]);

  const popularTours = useMemo(
    () => tours.filter((t) => t.popularity >= 85).sort((a, b) => b.popularity - a.popularity),
    [tours],
  );

  return {
    tours,
    cities,
    cityNameMap,
    popularTours,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
