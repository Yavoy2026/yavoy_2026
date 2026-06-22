import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, Share2, MapPin, Clock, Users, Globe, Check, X,
  Zap, ShieldCheck, ChevronLeft, ChevronRight, Calendar, BadgeCheck,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { StarRating } from "@/components/StarRating";
import { useApp } from "@/context/AppContext";
import { tours } from "@/data/tours";
import { cityNameMap } from "@/data/cities";
import { toast } from "sonner";

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useApp();
  const [imgIndex, setImgIndex] = useState(0);
  const [booking, setBooking] = useState(false);
  const [tickets, setTickets] = useState(1);

  const tour = useMemo(() => tours.find((t) => t.id === id), [id]);
  const index = useMemo(() => tours.findIndex((t) => t.id === id), [id]);

  if (!tour) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold">Экскурсия не найдена</h1>
          <button onClick={() => navigate("/")} className="mt-4 rounded-xl bg-teal px-5 py-2.5 font-semibold text-white">На главную</button>
        </div>
      </Layout>
    );
  }

  const fav = isFavorite(tour.id);
  const gallery = tour.gallery.length ? tour.gallery : [tour.image];

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: tour.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Ссылка скопирована"); }
    } catch { /* cancelled */ }
  };

  const goPrev = () => { if (index > 0) navigate(`/tour/${tours[index - 1].id}`); };
  const goNext = () => { if (index < tours.length - 1) navigate(`/tour/${tours[index + 1].id}`); };

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> Назад
        </button>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} disabled={index <= 0} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary disabled:opacity-40">
            <ChevronLeft size={18} />
          </button>
          <button onClick={goNext} disabled={index >= tours.length - 1} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary disabled:opacity-40">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: gallery + info */}
        <div>
          <div className="relative mb-3 h-72 overflow-hidden rounded-3xl md:h-96">
            <img src={gallery[imgIndex]} alt={tour.title} className="h-full w-full object-cover" />
            <div className="absolute right-4 top-4 flex gap-2">
              <button onClick={() => toggleFavorite(tour.id)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 backdrop-blur dark:bg-navy/80">
                <Heart size={20} className={fav ? "text-coral" : "text-navy/70 dark:text-white"} fill={fav ? "#FF6B6B" : "transparent"} />
              </button>
              <button onClick={share} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 backdrop-blur dark:bg-navy/80">
                <Share2 size={18} className="text-navy/70 dark:text-white" />
              </button>
            </div>
            {tour.isBestseller && (
              <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">Хит продаж</span>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="mb-6 flex gap-2">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setImgIndex(i)} className={`h-16 w-20 overflow-hidden rounded-xl ring-2 transition-all ${i === imgIndex ? "ring-teal" : "ring-transparent opacity-70"}`}>
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin size={15} className="text-teal" /> {cityNameMap[tour.city]}</span>
            <span className="flex items-center gap-1.5"><Clock size={15} /> {tour.durationText}</span>
            <span className="flex items-center gap-1.5"><Users size={15} /> {tour.groupSize}</span>
            <span className="flex items-center gap-1.5"><Globe size={15} /> {tour.languages.join(", ")}</span>
          </div>

          <h1 className="mb-4 text-3xl font-extrabold leading-tight">{tour.title}</h1>
          <p className="mb-6 leading-relaxed text-muted-foreground">{tour.description}</p>

          {/* Organizer */}
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
            <img src={tour.organizer.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-bold">
                {tour.organizer.name}
                {tour.organizer.verified && <BadgeCheck size={16} className="text-teal" />}
              </div>
              <StarRating rating={tour.organizer.rating} size={13} showValue reviewCount={tour.organizer.reviewCount} />
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div className="font-bold text-foreground">{tour.organizer.toursCount}</div>
              экскурсий
            </div>
          </div>

          {/* Highlights */}
          <Section title="Что вас ждёт">
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {tour.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal/10"><Check size={12} className="text-teal" /></span>
                  {h}
                </li>
              ))}
            </ul>
          </Section>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Section title="Включено">
              <ul className="space-y-2">
                {tour.includes.map((x) => (
                  <li key={x} className="flex items-center gap-2 text-sm"><Check size={15} className="text-teal" /> {x}</li>
                ))}
              </ul>
            </Section>
            <Section title="Не включено">
              <ul className="space-y-2">
                {tour.excludes.map((x) => (
                  <li key={x} className="flex items-center gap-2 text-sm text-muted-foreground"><X size={15} className="text-coral" /> {x}</li>
                ))}
              </ul>
            </Section>
          </div>

          {tour.whatToBring && (
            <Section title="Что взять с собой">
              <div className="flex flex-wrap gap-2">
                {tour.whatToBring.map((w) => (
                  <span key={w} className="rounded-full bg-secondary px-3 py-1.5 text-sm">{w}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Reviews */}
          <Section title={`Отзывы (${tour.reviews.length})`}>
            <div className="space-y-3">
              {tour.reviews.map((r) => (
                <div key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
                  <div className="mb-2 flex items-center gap-3">
                    <img src={r.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{r.author}</div>
                      <div className="text-xs text-muted-foreground">{r.date}</div>
                    </div>
                    <StarRating rating={r.rating} size={13} />
                  </div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right: sticky booking */}
        <div>
          <div className="sticky top-24 rounded-3xl bg-card p-6 shadow-lg ring-1 ring-border/60">
            <div className="mb-4 flex items-end gap-2">
              <span className="text-3xl font-extrabold text-teal">{tour.price.toLocaleString("ru-RU")}{tour.currency}</span>
              {tour.originalPrice && <span className="mb-1 text-sm text-muted-foreground line-through">{tour.originalPrice.toLocaleString("ru-RU")}{tour.currency}</span>}
              <span className="mb-1 text-xs text-muted-foreground">/ чел.</span>
            </div>

            <div className="mb-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><Calendar size={15} className="text-teal" /> Ближайшая дата: <span className="font-semibold">{tour.nextAvailableDate}</span></div>
              {tour.isInstantConfirmation && <div className="flex items-center gap-2 text-teal"><Zap size={15} fill="#0FA3B1" /> Мгновенное подтверждение</div>}
              {tour.isFreeCancellation && <div className="flex items-center gap-2 text-mint"><ShieldCheck size={15} /> Бесплатная отмена</div>}
            </div>

            {!booking ? (
              <button onClick={() => setBooking(true)} className="w-full rounded-2xl bg-teal py-3.5 font-bold text-white transition-transform hover:scale-[1.02]">
                Забронировать
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-secondary p-3">
                  <span className="text-sm font-semibold">Билеты</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setTickets((t) => Math.max(1, t - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-card font-bold">−</button>
                    <span className="w-6 text-center font-bold">{tickets}</span>
                    <button onClick={() => setTickets((t) => t + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-card font-bold">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Итого</span>
                  <span className="text-xl font-extrabold text-teal">{(tour.price * tickets).toLocaleString("ru-RU")}{tour.currency}</span>
                </div>
                <button
                  onClick={() => { setBooking(false); toast.success("Бронирование подтверждено! Ваучер в личном кабинете."); }}
                  className="w-full rounded-2xl bg-gold py-3.5 font-bold text-navy transition-transform hover:scale-[1.02]"
                >
                  Оплатить {(tour.price * tickets).toLocaleString("ru-RU")}{tour.currency}
                </button>
              </div>
            )}

            <p className="mt-3 text-center text-xs text-muted-foreground">{tour.bookingsToday} человек забронировали сегодня</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
