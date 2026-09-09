import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, Share2, MapPin, Clock, Users, Globe, Check, X,
  Zap, ShieldCheck, ChevronLeft, ChevronRight, Calendar, BadgeCheck,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { StarRating } from "@/components/StarRating";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCatalog } from "@/services/catalog";
import { createBooking } from "@/services/bookings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tourLanguageList } from "@yavoy/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { SLOT, withSlot } from "@/i18n/slot";
import { Link } from "react-router-dom";
import { translateError } from "@/i18n/errors";

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useApp();
  const { isAuthenticated } = useAuth();
  const { tours, cityNameMap, isLoading } = useCatalog();
  const queryClient = useQueryClient();
  const [imgIndex, setImgIndex] = useState(0);
  const [booking, setBooking] = useState(false);
  const [tickets, setTickets] = useState(1);
  const [dateId, setDateId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  // акцепт оферты обязателен перед оплатой — требование банка, п.7 (YAV-21)
  const [offerAccepted, setOfferAccepted] = useState(false);
  const { t, formatNumber } = useI18n();

  const tour = useMemo(() => tours.find((t) => t.id === id), [tours, id]);
  const index = useMemo(() => tours.findIndex((t) => t.id === id), [tours, id]);

  const bookMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: ({ booking: b, paymentUrl }) => {
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      setBooking(false);

      // с подключённым эквайрингом бронь ждёт оплату — уводим на страницу банка
      if (paymentUrl) {
        toast.success(t("booking.redirecting"));
        window.location.assign(paymentUrl);
        return;
      }
      toast.success(`${t("booking.sentTitle")} ${t("booking.sentText", { code: b.confirmationCode })}`, { duration: 8000 });
    },
    onError: (e: unknown) => toast.error(translateError(e, t, "booking.failed")),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center py-20">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t("tour.loading")}</p>
        </div>
      </Layout>
    );
  }

  if (!tour) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold">{t("tour.notFound")}</h1>
          <button onClick={() => navigate("/")} className="mt-4 rounded-xl bg-teal px-5 py-2.5 font-semibold text-white">{t("common.home")}</button>
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
      else { await navigator.clipboard.writeText(url); toast.success(t("tour.linkCopied")); }
    } catch { /* cancelled */ }
  };

  const goPrev = () => { if (index > 0) navigate(`/tour/${tours[index - 1].id}`); };
  const goNext = () => { if (index < tours.length - 1) navigate(`/tour/${tours[index + 1].id}`); };

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> {t("common.back")}
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
              <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">{t("tourCard.bestseller")}</span>
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
            <span className="flex items-center gap-1.5"><Globe size={15} /> {tourLanguageList(tour.languages, t as (k: string) => string)}</span>
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
              {t("units.excursionsBare", { count: tour.organizer.toursCount })}
            </div>
          </div>

          {/* Highlights */}
          <Section title={t("tour.whatYouGet")}>
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
            <Section title={t("tour.includes")}>
              <ul className="space-y-2">
                {tour.includes.map((x) => (
                  <li key={x} className="flex items-center gap-2 text-sm"><Check size={15} className="text-teal" /> {x}</li>
                ))}
              </ul>
            </Section>
            <Section title={t("tour.excludes")}>
              <ul className="space-y-2">
                {tour.excludes.map((x) => (
                  <li key={x} className="flex items-center gap-2 text-sm text-muted-foreground"><X size={15} className="text-coral" /> {x}</li>
                ))}
              </ul>
            </Section>
          </div>

          {tour.whatToBring && (
            <Section title={t("tour.whatToBring")}>
              <div className="flex flex-wrap gap-2">
                {tour.whatToBring.map((w) => (
                  <span key={w} className="rounded-full bg-secondary px-3 py-1.5 text-sm">{w}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Reviews */}
          <Section title={`${t("tour.reviews")} (${tour.reviews.length})`}>
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
              <span className="text-3xl font-extrabold text-teal">{formatNumber(tour.price)}{tour.currency}</span>
              {tour.originalPrice && <span className="mb-1 text-sm text-muted-foreground line-through">{formatNumber(tour.originalPrice)}{tour.currency}</span>}
              <span className="mb-1 text-xs text-muted-foreground">{t("common.perPersonShort")}</span>
            </div>

            <div className="mb-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><Calendar size={15} className="text-teal" /> {t("tour.nearestDate")}: <span className="font-semibold">{tour.nextAvailableDate}</span></div>
              {tour.isInstantConfirmation && <div className="flex items-center gap-2 text-teal"><Zap size={15} fill="#0FA3B1" /> {t("tour.instantConfirmation")}</div>}
              {tour.isFreeCancellation && <div className="flex items-center gap-2 text-mint"><ShieldCheck size={15} /> {t("tour.freeCancellation")}</div>}
            </div>

            {!booking ? (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast(t("booking.authRequiredText"));
                    navigate("/auth");
                    return;
                  }
                  setBooking(true);
                  setDateId(tour.dates?.[0]?.id ?? null);
                }}
                className="w-full rounded-2xl bg-teal py-3.5 font-bold text-white transition-transform hover:scale-[1.02]"
              >
                {t("tour.book")}
              </button>
            ) : (
              <div className="space-y-3">
                {(tour.dates ?? []).length === 0 ? (
                  <p className="text-sm text-coral">{t("booking.noDates")}</p>
                ) : (
                  <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {(tour.dates ?? []).map((d) => (
                      <button
                        key={d.id}
                        onClick={() => { setDateId(d.id); setTickets(1); }}
                        className={`shrink-0 rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-colors ${dateId === d.id ? "border-teal bg-teal text-white" : "border-border bg-secondary"}`}
                      >
                        <div>{d.date}</div>
                        <div className={dateId === d.id ? "text-white/80" : "text-muted-foreground"}>{t("units.seats", { count: d.seatsLeft })}</div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between rounded-2xl bg-secondary p-3">
                  <span className="text-sm font-semibold">{t("booking.tickets")}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setTickets((t) => Math.max(1, t - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-card font-bold">−</button>
                    <span className="w-6 text-center font-bold">{tickets}</span>
                    <button onClick={() => setTickets((t) => Math.min(10, t + 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-card font-bold">+</button>
                  </div>
                </div>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("booking.firstName")} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("booking.lastName")} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t("booking.contact")} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
                <label className="flex cursor-pointer items-start gap-2 text-xs leading-snug text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={offerAccepted}
                    onChange={(e) => setOfferAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-teal"
                  />
                  <span>
                    {withSlot(
                      `${t("legal.acceptPrefix")}${SLOT}`,
                      <Link to="/offer" target="_blank" className="font-semibold text-teal hover:underline">
                        {t("legal.offer")}
                      </Link>,
                    )}
                  </span>
                </label>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("common.total")}</span>
                  <span className="text-xl font-extrabold text-teal">{formatNumber(tour.price * tickets)}{tour.currency}</span>
                </div>
                <button
                  disabled={
                    bookMutation.isPending ||
                    !offerAccepted ||
                    !dateId ||
                    !firstName.trim() ||
                    !lastName.trim() ||
                    contact.trim().length < 3
                  }
                  onClick={() => {
                    if (!dateId) return;
                    bookMutation.mutate({
                      tour_date_id: dateId,
                      tickets_count: tickets,
                      first_name: firstName.trim(),
                      last_name: lastName.trim(),
                      contact: contact.trim(),
                    });
                  }}
                  className="w-full rounded-2xl bg-gold py-3.5 font-bold text-navy transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {bookMutation.isPending ? t("common.sending") : t("booking.submit")}
                </button>
                <button onClick={() => setBooking(false)} className="w-full py-1 text-center text-xs text-muted-foreground">{t("common.cancel")}</button>
              </div>
            )}

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
