import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, Receipt, ChevronRight, ChevronDown, Plane, Gift, Share2, Video,
  CheckCircle, Clock, XCircle, Building2, ShieldCheck, Sun, Moon, Smartphone,
  Coins, Upload, Award, MessageSquare, Star, LogOut, Edit3, Camera,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCatalog } from "@/services/catalog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMyBookings } from "@/services/bookings";
import { createReview, fetchMyReviews } from "@/services/social";
import type { BookedTour } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";
import { translateError } from "@/i18n/errors";
import type { TKey } from "@/i18n/keys";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Section = "favorites" | "transactions" | "reviews" | "reels" | "promos" | null;


export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, updateMyProfile } = useAuth();
  const { favorites, points, themeMode, setThemeMode, moderationReels, submitReel } = useApp();
  const [open, setOpen] = useState<Section>(null);
  const [reelTitle, setReelTitle] = useState("");
  const [reelTour, setReelTour] = useState("");
  const [reelCity, setReelCity] = useState("");

  const { tours, cityNameMap } = useCatalog();
  const { t, formatNumber } = useI18n();
  const queryClient = useQueryClient();
  const bookingsQuery = useQuery({ queryKey: ["my-bookings"], queryFn: fetchMyBookings, enabled: isAuthenticated });
  const bookings = bookingsQuery.data ?? [];
  const reviewsQuery = useQuery({ queryKey: ["my-reviews"], queryFn: fetchMyReviews, enabled: isAuthenticated });
  const userReviews = reviewsQuery.data ?? [];
  const reviewedBookingIds = new Set(userReviews.map((r) => r.bookingId));

  const [reviewBooking, setReviewBooking] = useState<BookedTour | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const reviewMutation = useMutation({
    mutationFn: (vars: { bookingId: string; rating: number; text: string }) =>
      createReview(vars.bookingId, vars.rating, vars.text),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      setReviewBooking(null);
      setReviewText("");
      setReviewRating(5);
      toast.success(t("profile.reviewSentShort"));
    },
    onError: (e: unknown) => toast.error(translateError(e, t, "profile.reviewFailed")),
  });

  const favTours = tours.filter((t) => favorites.includes(t.id));
  const totalSpent = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const toggle = (s: Section) => setOpen((p) => (p === s ? null : s));

  const handleSubmitReel = () => {
    const reward = submitReel({ title: reelTitle, tourTitle: reelTour, city: reelCity });
    setReelTitle(""); setReelTour(""); setReelCity("");
    toast.success(t("profile.reelSentWeb", { points: reward }));
  };

  return (
    <Layout>
      {/* Header card */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" /></div>
        ) : isAuthenticated && user ? (
          <>
            <div className="flex items-center gap-4">
              {user.photo_url ? (
                <img src={user.photo_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-teal" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/20 text-2xl font-extrabold text-teal-light ring-2 ring-teal">
                  {user.first_name?.[0] ?? "?"}
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold">{user.first_name}{user.last_name ? ` ${user.last_name}` : ""}</h1>
                <p className="text-sm text-white/60">{user.email}</p>
                <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold", user.role === "admin" ? "bg-gold/20 text-gold" : user.role === "manager" ? "bg-mint/20 text-mint" : user.role === "partner" ? "bg-teal/20 text-teal-light" : "bg-white/10 text-white/70")}>
                  {t(`enums.role.${user.role}` as TKey)}
                </span>
              </div>
            </div>
            <button onClick={async () => { await logout(); navigate("/"); }} className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/20">
              <LogOut size={15} /> {t("common.logout")}
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="mb-3 text-white/70">{t("profile.signInPrompt")}</p>
            <button onClick={() => navigate("/auth")} className="rounded-xl bg-teal px-6 py-2.5 font-bold text-white">{t("common.loginOrRegister")}</button>
          </div>
        )}
        <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-navy-light p-4">
          <Stat value={String(bookings.length)} label={t("profile.statTrips")} color="text-teal-light" />
          <Stat value={String(points)} label={t("profile.statPoints")} color="text-gold" />
          <Stat value={String(favorites.length)} label={t("profile.statFavorites")} color="text-teal-light" />
        </div>
      </div>

      {/* Вход в бэкофис — по ролям */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {user?.role === "user" || !user ? (
          <button onClick={() => navigate("/partner")} className="flex items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border/60 transition-colors hover:ring-teal/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10"><Building2 size={22} className="text-teal" /></div>
            <div className="flex-1"><div className="font-bold">{t("profile.partners")}</div><div className="text-xs text-muted-foreground">{t("profile.partnersDesc")}</div></div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        ) : null}
        {user?.role === "partner" && (
          <button onClick={() => navigate("/backoffice")} className="flex items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border/60 transition-colors hover:ring-teal/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10"><Building2 size={22} className="text-teal" /></div>
            <div className="flex-1"><div className="font-bold">{t("profile.partnerCabinet")}</div><div className="text-xs text-muted-foreground">{t("profile.partnerCabinetDesc")}</div></div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        )}
        {(user?.role === "admin" || user?.role === "manager") && (
          <button onClick={() => navigate("/backoffice")} className="flex items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border/60 transition-colors hover:ring-teal/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15"><ShieldCheck size={22} className="text-gold" /></div>
            <div className="flex-1"><div className="font-bold">{t("profile.backoffice")}</div><div className="text-xs text-muted-foreground">{t("profile.backofficeDesc")}</div></div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-card ring-1 ring-border/60">
        <Row icon={Plane} iconBg="bg-teal/10" iconColor="text-teal" title={t("profile.myTrips")} count={t("units.trips", { count: bookings.length })} open={open === "transactions"} onClick={() => toggle("transactions")}>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{isAuthenticated ? t("profile.noTripsHint") : t("profile.noTripsGuest")}</p>
          ) : (
            <>
              {bookings.map((bk) => {
                const cfg = bookingStatusCfg(bk.apiStatus ?? "requested");
                return (
                  <div key={bk.id} className="flex items-center gap-3 rounded-2xl bg-background p-3">
                    <img src={bk.tourImage} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{bk.tourTitle}</div>
                      <div className="text-xs text-muted-foreground">{bk.tourDate} · {bk.tourStartTime} · {t("units.people", { count: bk.ticketCount })} · {bk.confirmationCode}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatNumber(bk.totalPrice)}{bk.currency}</div>
                      <div className={cn("flex items-center justify-end gap-1 text-xs", cfg.color)}><cfg.icon size={12} /> {t(cfg.label)}</div>
                      {bk.apiStatus === "completed" && !reviewedBookingIds.has(bk.id) && (
                        <button onClick={() => setReviewBooking(bk)} className="mt-1 text-xs font-semibold text-gold hover:underline">{t("booking.leaveReview")}</button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="rounded-2xl bg-teal/10 p-3 text-center text-sm font-semibold text-teal">{t("profile.tripsTotal", { amount: `${formatNumber(totalSpent)}₽` })}</div>
            </>
          )}
        </Row>

        <Row icon={Heart} iconBg="bg-coral/10" iconColor="text-coral" title={t("profile.favoriteTours")} count={t("units.excursions", { count: favTours.length })} open={open === "favorites"} onClick={() => toggle("favorites")}>
          {favTours.length === 0 ? <p className="text-sm text-muted-foreground">{t("profile.noFavoriteTours")}</p> : favTours.map((tour) => (
            <button key={tour.id} onClick={() => navigate(`/tour/${tour.id}`)} className="flex w-full items-center gap-3 rounded-2xl bg-background p-3 text-left">
              <img src={tour.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{tour.title}</div>
                <div className="text-xs text-muted-foreground">{cityNameMap[tour.city]}</div>
              </div>
              <div className="text-sm font-bold text-teal">{formatNumber(tour.price)}{tour.currency}</div>
            </button>
          ))}
        </Row>

        <Row icon={MessageSquare} iconBg="bg-gold/15" iconColor="text-gold" title={t("profile.myReviews")} count={t("units.reviews", { count: userReviews.length })} open={open === "reviews"} onClick={() => toggle("reviews")}>
          {userReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("profile.noReviews")}</p>
          ) : userReviews.map((r) => (
            <div key={r.id} className="rounded-2xl bg-background p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <img src={r.tourImage} alt="" className="h-9 w-9 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{r.tourTitle}</div>
                  <div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} className={i < r.rating ? "text-gold" : "text-muted-foreground/30"} fill={i < r.rating ? "#E8B931" : "transparent"} />)}</div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", r.status === "published" ? "bg-mint/15 text-mint" : r.status === "pending" ? "bg-gold/15 text-gold" : "bg-coral/15 text-coral")}>
                  {t(`enums.tourStatus.${r.status === "published" ? "published" : r.status === "pending" ? "pending" : "rejected"}` as TKey)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </Row>

        <Row icon={Share2} iconBg="bg-mint/15" iconColor="text-mint" title={t("profile.myPromoCodes")} count={t("profile.promoSubtitle")} open={open === "promos"} onClick={() => toggle("promos")}>
          <div className="flex items-center gap-2 rounded-2xl bg-teal/10 p-3 text-sm text-teal"><Award size={16} /> {t("profile.promoInvite")}</div>
          <div className="flex items-center justify-between rounded-2xl bg-background p-3">
            <span className="rounded-lg bg-navy px-3 py-1.5 font-mono text-sm font-bold text-white">YAVOY-2026</span>
            <span className="text-xs text-muted-foreground">{t("units.activations", { count: 3 })}</span>
          </div>
        </Row>

        <Row icon={Video} iconBg="bg-coral/15" iconColor="text-coral" title={t("profile.myReels")} count={t("profile.reelsCount", { count: moderationReels.length, points: 500 })} open={open === "reels"} onClick={() => toggle("reels")} last>
          <div className="flex items-center gap-2 rounded-2xl bg-teal/10 p-3 text-sm text-teal"><Coins size={16} /> {t("profile.reelsReward", { points: 500 })}</div>
          <button onClick={() => toast(t("profile.videoWebOnly"))} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-background p-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral/15"><Upload size={18} className="text-coral" /></div>
            <div><div className="font-semibold">{t("profile.pickVideo")}</div><div className="text-xs text-muted-foreground">{t("profile.pickVideoHint")}</div></div>
          </button>
          <input value={reelTitle} onChange={(e) => setReelTitle(e.target.value)} placeholder={t("profile.reelTitlePlaceholder")} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
          <input value={reelTour} onChange={(e) => setReelTour(e.target.value)} placeholder={t("profile.reelTourPlaceholder")} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
          <input value={reelCity} onChange={(e) => setReelCity(e.target.value)} placeholder={t("profile.reelCityPlaceholder")} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
          <button onClick={handleSubmitReel} className="w-full rounded-xl bg-coral py-3 font-bold text-white">{t("profile.submitForModeration")}</button>
          {moderationReels.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-background p-3">
              <img src={r.coverImage} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="flex-1"><div className="font-semibold">{r.title}</div><div className="text-xs text-orange-500">{t("profile.reelsOnModeration")}</div></div>
            </div>
          ))}
        </Row>
      </div>

      {/* Theme + transactions summary */}
      <div className="rounded-3xl bg-card p-5 ring-1 ring-border/60">
        <h3 className="mb-3 font-bold">{t("profile.theme")}</h3>
        <div className="flex gap-2">
          {([{ k: "system", i: Smartphone }, { k: "light", i: Sun }, { k: "dark", i: Moon }] as const).map((opt) => (
            <button key={opt.k} onClick={() => setThemeMode(opt.k)} className={cn("flex flex-1 flex-col items-center gap-1.5 rounded-2xl border py-3 text-sm font-semibold transition-colors", themeMode === opt.k ? "border-teal bg-teal/10 text-teal" : "border-border text-muted-foreground")}>
              <opt.i size={20} /> {t(`enums.theme.${opt.k}` as TKey)}
            </button>
          ))}
        </div>

        <h3 className="mb-3 mt-5 font-bold">{t("profile.language")}</h3>
        <LanguageSwitcher />
      </div>
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReviewBooking(null)}>
          <div className="w-full max-w-md rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold">{t("profile.reviewTitle")}</h3>
            <p className="mb-3 text-sm text-muted-foreground">{reviewBooking.tourTitle}</p>
            <div className="mb-3 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewRating(star)}>
                  <Star size={28} className="text-gold" fill={star <= reviewRating ? "#E8B931" : "transparent"} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder={t("profile.reviewPlaceholder")}
              className="mb-3 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-teal"
            />
            <button
              disabled={reviewMutation.isPending || reviewText.trim().length < 3}
              onClick={() => reviewMutation.mutate({ bookingId: reviewBooking.id, rating: reviewRating, text: reviewText.trim() })}
              className="w-full rounded-xl bg-teal py-3 font-bold text-white disabled:opacity-50"
            >
              {reviewMutation.isPending ? t("common.sending") : t("profile.reviewSubmit")}
            </button>
            <button onClick={() => setReviewBooking(null)} className="mt-2 w-full py-2 text-sm text-muted-foreground">{t("common.cancel")}</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

function bookingStatusCfg(status: string): { label: TKey; color: string; icon: typeof CheckCircle } {
  if (status === "confirmed") return { label: "enums.bookingStatus.confirmed", color: "text-mint", icon: CheckCircle };
  if (status === "completed") return { label: "enums.bookingStatus.completed", color: "text-teal", icon: CheckCircle };
  if (status === "cancelled") return { label: "enums.bookingStatus.cancelled", color: "text-coral", icon: XCircle };
  return { label: "enums.bookingStatus.requested", color: "text-orange-500", icon: Clock };
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={cn("text-xl font-extrabold", color)}>{value}</div>
      <div className="text-[11px] text-white/50">{label}</div>
    </div>
  );
}

function Row({
  icon: Icon, iconBg, iconColor, title, count, open, onClick, children, last,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  iconBg: string; iconColor: string; title: string; count: string;
  open: boolean; onClick: () => void; children: React.ReactNode; last?: boolean;
}) {
  return (
    <div className={last ? "" : "border-b border-border"}>
      <button onClick={onClick} className="flex w-full items-center gap-3 p-4 text-left">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconBg)}><Icon size={20} className={iconColor} /></div>
        <div className="flex-1">
          <div className="font-bold">{title}</div>
          <div className="text-xs text-muted-foreground">{count}</div>
        </div>
        {open ? <ChevronDown size={20} className="text-muted-foreground" /> : <ChevronRight size={20} className="text-muted-foreground" />}
      </button>
      {open && <div className="space-y-2.5 bg-secondary/40 p-4">{children}</div>}
    </div>
  );
}
