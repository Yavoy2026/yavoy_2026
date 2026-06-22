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
import { tours, transactions } from "@/data/tours";
import { cityNameMap } from "@/data/cities";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getPhotoUrl } from "@/services/api";

type Section = "favorites" | "transactions" | "reviews" | "reels" | "promos" | null;

const userReviews = [
  { id: "ur1", tourTitle: "Обзорная экскурсия по Москве", tourImage: tours[0].image, rating: 5, text: "Потрясающая экскурсия! Гид был очень увлечённым.", date: "2026-03-20" },
  { id: "ur2", tourTitle: "Белые ночи Петербурга", tourImage: tours[2].image, rating: 5, text: "Волшебная атмосфера белых ночей!", date: "2026-02-18" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, updateMyProfile } = useAuth();
  const { favorites, points, themeMode, setThemeMode, moderationReels, submitReel } = useApp();
  const [open, setOpen] = useState<Section>(null);
  const [reelTitle, setReelTitle] = useState("");
  const [reelTour, setReelTour] = useState("");
  const [reelCity, setReelCity] = useState("");

  const favTours = tours.filter((t) => favorites.includes(t.id));
  const totalSpent = transactions.filter((t) => t.status === "completed").reduce((s, t) => s + t.amount, 0);

  const toggle = (s: Section) => setOpen((p) => (p === s ? null : s));

  const handleSubmitReel = () => {
    const reward = submitReel({ title: reelTitle, tourTitle: reelTour, city: reelCity });
    setReelTitle(""); setReelTour(""); setReelCity("");
    toast.success(`Reels отправлен на модерацию. Начислено ${reward} баллов.`);
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
              {user.photo ? (
                <img src={getPhotoUrl(user.photo)} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-teal" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/20 text-2xl font-extrabold text-teal-light ring-2 ring-teal">
                  {user.first_name?.[0] ?? "?"}
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold">{user.first_name}{user.last_name ? ` ${user.last_name}` : ""}</h1>
                <p className="text-sm text-white/60">{user.email}</p>
                <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold", user.role === "admin" ? "bg-gold/20 text-gold" : user.role === "moderator" ? "bg-mint/20 text-mint" : "bg-white/10 text-white/70")}>
                  {user.role === "admin" ? "Админ" : user.role === "moderator" ? "Модератор" : "Пользователь"}
                </span>
              </div>
            </div>
            <button onClick={async () => { await logout(); navigate("/"); }} className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/20">
              <LogOut size={15} /> Выйти
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="mb-3 text-white/70">Войдите, чтобы увидеть свой профиль</p>
            <button onClick={() => navigate("/auth")} className="rounded-xl bg-teal px-6 py-2.5 font-bold text-white">Войти / Регистрация</button>
          </div>
        )}
        <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-navy-light p-4">
          <Stat value={String(transactions.length)} label="Поездки" color="text-teal-light" />
          <Stat value={String(points)} label="Баллы" color="text-gold" />
          <Stat value={String(favorites.length)} label="Избранное" color="text-teal-light" />
        </div>
      </div>

      {/* B2B / Admin entry */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button onClick={() => navigate("/partner")} className="flex items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border/60 transition-colors hover:ring-teal/40">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10"><Building2 size={22} className="text-teal" /></div>
          <div className="flex-1"><div className="font-bold">Партнёрам</div><div className="text-xs text-muted-foreground">Кабинет организатора экскурсий</div></div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
        <button onClick={() => navigate("/admin")} className="flex items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border/60 transition-colors hover:ring-teal/40">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15"><ShieldCheck size={22} className="text-gold" /></div>
          <div className="flex-1"><div className="font-bold">Админ-панель</div><div className="text-xs text-muted-foreground">Модерация и управление</div></div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Sections */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-card ring-1 ring-border/60">
        <Row icon={Plane} iconBg="bg-teal/10" iconColor="text-teal" title="Мои поездки" count={`${transactions.length} поездок`} open={open === "transactions"} onClick={() => toggle("transactions")}>
          {transactions.map((tr) => {
            const cfg = statusCfg(tr.status);
            return (
              <div key={tr.id} className="flex items-center gap-3 rounded-2xl bg-background p-3">
                <img src={tr.tourImage} alt="" className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{tr.tourTitle}</div>
                  <div className="text-xs text-muted-foreground">{tr.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{tr.status === "refunded" ? "+" : "−"}{tr.amount.toLocaleString("ru-RU")}{tr.currency}</div>
                  <div className={cn("flex items-center justify-end gap-1 text-xs", cfg.color)}><cfg.icon size={12} /> {cfg.label}</div>
                </div>
              </div>
            );
          })}
          <div className="rounded-2xl bg-teal/10 p-3 text-center text-sm font-semibold text-teal">Всего потрачено: {totalSpent.toLocaleString("ru-RU")}₽</div>
        </Row>

        <Row icon={Heart} iconBg="bg-coral/10" iconColor="text-coral" title="Избранные туры" count={`${favTours.length} экскурсий`} open={open === "favorites"} onClick={() => toggle("favorites")}>
          {favTours.length === 0 ? <p className="text-sm text-muted-foreground">Нет избранных экскурсий</p> : favTours.map((t) => (
            <button key={t.id} onClick={() => navigate(`/tour/${t.id}`)} className="flex w-full items-center gap-3 rounded-2xl bg-background p-3 text-left">
              <img src={t.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{t.title}</div>
                <div className="text-xs text-muted-foreground">{cityNameMap[t.city]}</div>
              </div>
              <div className="text-sm font-bold text-teal">{t.price.toLocaleString("ru-RU")}{t.currency}</div>
            </button>
          ))}
        </Row>

        <Row icon={MessageSquare} iconBg="bg-gold/15" iconColor="text-gold" title="Мои отзывы" count={`${userReviews.length} отзывов`} open={open === "reviews"} onClick={() => toggle("reviews")}>
          {userReviews.map((r) => (
            <div key={r.id} className="rounded-2xl bg-background p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <img src={r.tourImage} alt="" className="h-9 w-9 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{r.tourTitle}</div>
                  <div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} className={i < r.rating ? "text-gold" : "text-muted-foreground/30"} fill={i < r.rating ? "#E8B931" : "transparent"} />)}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </Row>

        <Row icon={Share2} iconBg="bg-mint/15" iconColor="text-mint" title="Промокоды" count="2000 баллов за друга" open={open === "promos"} onClick={() => toggle("promos")}>
          <div className="flex items-center gap-2 rounded-2xl bg-teal/10 p-3 text-sm text-teal"><Award size={16} /> Пригласите друга — получите 2000 баллов за каждый активированный промокод!</div>
          <div className="flex items-center justify-between rounded-2xl bg-background p-3">
            <span className="rounded-lg bg-navy px-3 py-1.5 font-mono text-sm font-bold text-white">YAVOY-2026</span>
            <span className="text-xs text-muted-foreground">Активаций: 3</span>
          </div>
        </Row>

        <Row icon={Video} iconBg="bg-coral/15" iconColor="text-coral" title="Мои Reels" count={`${moderationReels.length} на модерации · +500 баллов`} open={open === "reels"} onClick={() => toggle("reels")} last>
          <div className="flex items-center gap-2 rounded-2xl bg-teal/10 p-3 text-sm text-teal"><Coins size={16} /> За добавление reels начисляется 500 баллов. Видео появится в ленте после модерации.</div>
          <button onClick={() => toast("Выбор видео доступен в мобильном приложении")} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-background p-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral/15"><Upload size={18} className="text-coral" /></div>
            <div><div className="font-semibold">Добавить видео</div><div className="text-xs text-muted-foreground">Выберите короткий ролик</div></div>
          </button>
          <input value={reelTitle} onChange={(e) => setReelTitle(e.target.value)} placeholder="Название reels" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
          <input value={reelTour} onChange={(e) => setReelTour(e.target.value)} placeholder="Название экскурсии" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
          <input value={reelCity} onChange={(e) => setReelCity(e.target.value)} placeholder="Город" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
          <button onClick={handleSubmitReel} className="w-full rounded-xl bg-coral py-3 font-bold text-white">Отправить на модерацию</button>
          {moderationReels.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-background p-3">
              <img src={r.coverImage} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="flex-1"><div className="font-semibold">{r.title}</div><div className="text-xs text-orange-500">На модерации администратора</div></div>
            </div>
          ))}
        </Row>
      </div>

      {/* Theme + transactions summary */}
      <div className="rounded-3xl bg-card p-5 ring-1 ring-border/60">
        <h3 className="mb-3 font-bold">Тема оформления</h3>
        <div className="flex gap-2">
          {([{ k: "system", l: "Системная", i: Smartphone }, { k: "light", l: "Светлая", i: Sun }, { k: "dark", l: "Тёмная", i: Moon }] as const).map((t) => (
            <button key={t.k} onClick={() => setThemeMode(t.k)} className={cn("flex flex-1 flex-col items-center gap-1.5 rounded-2xl border py-3 text-sm font-semibold transition-colors", themeMode === t.k ? "border-teal bg-teal/10 text-teal" : "border-border text-muted-foreground")}>
              <t.i size={20} /> {t.l}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={cn("text-xl font-extrabold", color)}>{value}</div>
      <div className="text-[11px] text-white/50">{label}</div>
    </div>
  );
}

function statusCfg(status: string) {
  if (status === "completed") return { label: "Оплачено", color: "text-mint", icon: CheckCircle };
  if (status === "pending") return { label: "В обработке", color: "text-orange-500", icon: Clock };
  return { label: "Возврат", color: "text-coral", icon: XCircle };
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
