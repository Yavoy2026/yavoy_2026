import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, CheckCircle2, Plus, Users, Receipt, Star,
  ShieldCheck, Loader2, MessageSquare, TrendingUp, LogOut,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { tours } from "@/data/tours";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PartnerTourSubmission, PartnerGuest, PartnerTransaction } from "@/types";

type Stage = "register" | "contacts" | "pending" | "cabinet";
type Tab = "tours" | "guests" | "transactions" | "reviews";

const initialSubmissions: PartnerTourSubmission[] = [
  { id: "ps1", title: "Гастротур по рынкам Москвы", city: "Москва", price: 3500, image: tours[5].image, status: "published", submittedAt: "2026-05-10" },
  { id: "ps2", title: "Ночной джаз-квартал", city: "Санкт-Петербург", price: 2800, image: tours[2].image, status: "pending", submittedAt: "2026-06-01" },
  { id: "ps3", title: "Винный weekend", city: "Сочи", price: 6200, image: tours[8].image, status: "rejected", submittedAt: "2026-05-28" },
];

const guests: PartnerGuest[] = [
  { id: "g1", firstName: "Ольга", lastName: "Петрова", phone: "+7 921 555-12-34", tourTitle: "Гастротур по рынкам Москвы", tourDate: "2026-06-20", ticketCount: 2 },
  { id: "g2", firstName: "Иван", lastName: "Сидоров", phone: "+7 916 222-88-90", tourTitle: "Гастротур по рынкам Москвы", tourDate: "2026-06-22", ticketCount: 4 },
  { id: "g3", firstName: "Мария", lastName: "Кузнецова", phone: "+7 905 333-44-55", tourTitle: "Ночной джаз-квартал", tourDate: "2026-06-25", ticketCount: 1 },
];

const partnerTransactions: PartnerTransaction[] = [
  { id: "pt1", tourTitle: "Гастротур по рынкам Москвы", amount: 7000, currency: "₽", date: "2026-06-12", guestName: "Ольга Петрова", status: "completed" },
  { id: "pt2", tourTitle: "Гастротур по рынкам Москвы", amount: 14000, currency: "₽", date: "2026-06-14", guestName: "Иван Сидоров", status: "completed" },
  { id: "pt3", tourTitle: "Ночной джаз-квартал", amount: 2800, currency: "₽", date: "2026-06-15", guestName: "Мария Кузнецова", status: "pending" },
];

const reviews = [
  { id: "rv1", author: "Ольга П.", tourTitle: "Гастротур по рынкам Москвы", rating: 5, text: "Невероятно вкусно и познавательно!", reply: "Спасибо, ждём вас снова!" },
  { id: "rv2", author: "Иван С.", tourTitle: "Гастротур по рынкам Москвы", rating: 4, text: "Отлично, но хотелось больше времени.", reply: undefined },
];

export default function Partner() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [stage, setStage] = useState<Stage>("register");
  const [tab, setTab] = useState<Tab>("tours");
  const [inn, setInn] = useState("");
  const [checking, setChecking] = useState(false);
  const [agree, setAgree] = useState({ terms: false, privacy: false, offer: false });
  const [contacts, setContacts] = useState({ email: "", phone: "", telegram: "" });
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [period, setPeriod] = useState<"week" | "month" | "halfYear" | "year">("month");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTour, setNewTour] = useState({ title: "", city: "", price: "" });
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const allAgreed = agree.terms && agree.privacy && agree.offer;
  const innValid = /^\d{10}$|^\d{12}$/.test(inn);

  const checkFns = () => {
    if (!innValid) { toast.error("Введите корректный ИНН (10 или 12 цифр)"); return; }
    if (!allAgreed) { toast.error("Примите все соглашения"); return; }
    setChecking(true);
    setTimeout(() => { setChecking(false); setStage("contacts"); toast.success("Данные подтверждены через ФНС"); }, 1400);
  };

  const submitContacts = () => {
    if (!contacts.email.trim() || !contacts.phone.trim() || !contacts.telegram.trim()) {
      toast.error("Заполните все контактные поля"); return;
    }
    setStage("pending");
    toast.success("Профиль отправлен администратору на подтверждение");
  };

  const addTour = () => {
    if (!newTour.title.trim() || !newTour.city.trim() || !newTour.price.trim()) { toast.error("Заполните поля экскурсии"); return; }
    const sub: PartnerTourSubmission = {
      id: `ps-${Date.now()}`, title: newTour.title, city: newTour.city, price: Number(newTour.price) || 0,
      image: tours[0].image, status: "pending", submittedAt: new Date().toISOString().slice(0, 10),
    };
    setSubmissions((p) => [sub, ...p]);
    setNewTour({ title: "", city: "", price: "" });
    setShowAddForm(false);
    toast.success("Экскурсия отправлена администратору на модерацию");
  };

  const revenue = useMemo(() => partnerTransactions.filter((t) => t.status === "completed").reduce((s, t) => s + t.amount, 0), []);
  const avgRating = useMemo(() => reviews.reduce((s, r) => s + r.rating, 0) / reviews.length, []);

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={18} /> Назад
      </button>

      {authLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-teal" /></div>
      ) : !isAuthenticated ? (
        <div className="mx-auto max-w-xl rounded-3xl bg-card py-16 text-center ring-1 ring-border/60">
          <Building2 size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-extrabold">Требуется авторизация</h2>
          <p className="mb-4 text-sm text-muted-foreground">Войдите в аккаунт, чтобы получить доступ к партнёрскому кабинету.</p>
          <button onClick={() => navigate("/auth")} className="rounded-2xl bg-teal px-6 py-3 font-bold text-white">Войти / Регистрация</button>
        </div>
      ) : (
        <>
          {isAuthenticated && user && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 font-bold text-teal">{user.first_name?.[0] ?? "?"}</div>
              <div className="flex-1">
                <div className="font-semibold">{user.first_name}{user.last_name ? ` ${user.last_name}` : ""}</div>
                <div className="text-xs text-muted-foreground">{user.email} · {user.role === "admin" ? "Админ" : user.role === "moderator" ? "Модератор" : "Пользователь"}</div>
              </div>
              <button onClick={async () => { await logout(); navigate("/"); }} className="rounded-lg bg-coral/10 p-2 text-coral transition-colors hover:bg-coral/20"><LogOut size={16} /></button>
            </div>
          )}

      {stage === "register" && (
        <div className="mx-auto max-w-xl">
          <div className="mb-6 overflow-hidden rounded-3xl bg-navy p-8 text-white">
            <Building2 size={36} className="mb-3 text-teal-light" />
            <h1 className="mb-2 text-2xl font-extrabold">Станьте партнёром YaVoy</h1>
            <p className="text-sm text-white/70">Добавляйте свои экскурсии, управляйте бронированиями и зарабатывайте с крупнейшим агрегатором туров России.</p>
          </div>

          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/60">
            <h2 className="mb-1 font-bold">Регистрация партнёра</h2>
            <p className="mb-4 text-sm text-muted-foreground">Введите ИНН или ОГРН для проверки через Федеральную налоговую службу</p>
            <input
              value={inn}
              onChange={(e) => setInn(e.target.value.replace(/\D/g, ""))}
              placeholder="ИНН (10 или 12 цифр)"
              inputMode="numeric"
              className="mb-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-teal"
            />
            <div className="mb-4 space-y-2">
              {([
                { k: "terms", l: "Принимаю пользовательское соглашение" },
                { k: "privacy", l: "Согласен на обработку персональных данных (152-ФЗ)" },
                { k: "offer", l: "Соглашаюсь с договором-офертой" },
              ] as const).map((c) => (
                <label key={c.k} className="flex cursor-pointer items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={agree[c.k]}
                    onChange={(e) => setAgree((p) => ({ ...p, [c.k]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 accent-teal"
                  />
                  <span className="text-muted-foreground">{c.l}</span>
                </label>
              ))}
            </div>
            <button
              onClick={checkFns}
              disabled={checking || !innValid || !allAgreed}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-3.5 font-bold text-white transition-transform enabled:hover:scale-[1.02] disabled:opacity-50"
            >
              {checking ? <><Loader2 size={18} className="animate-spin" /> Проверка через ФНС…</> : "Проверить и продолжить"}
            </button>
          </div>
        </div>
      )}

      {stage === "contacts" && (
        <div className="mx-auto max-w-xl">
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-mint/10 p-4 text-sm font-semibold text-mint">
            <CheckCircle2 size={18} /> ООО «Ваша компания» подтверждена через ФНС
          </div>
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/60">
            <h2 className="mb-1 font-bold">Контактные данные</h2>
            <p className="mb-4 text-sm text-muted-foreground">Заполните обязательные контакты для связи</p>
            <div className="space-y-3">
              <input value={contacts.email} onChange={(e) => setContacts((p) => ({ ...p, email: e.target.value }))} placeholder="Email" type="email" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-teal" />
              <input value={contacts.phone} onChange={(e) => setContacts((p) => ({ ...p, phone: e.target.value }))} placeholder="Телефон (+7…)" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-teal" />
              <input value={contacts.telegram} onChange={(e) => setContacts((p) => ({ ...p, telegram: e.target.value }))} placeholder="Telegram @никнейм" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-teal" />
            </div>
            <button onClick={submitContacts} className="mt-4 w-full rounded-2xl bg-teal py-3.5 font-bold text-white">Отправить на подтверждение</button>
          </div>
        </div>
      )}

      {stage === "pending" && (
        <div className="mx-auto max-w-xl rounded-3xl bg-card p-8 text-center ring-1 ring-border/60">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/15"><ShieldCheck size={32} className="text-gold" /></div>
          <h2 className="mb-2 text-xl font-extrabold">Профиль на подтверждении</h2>
          <p className="mb-6 text-sm text-muted-foreground">Администратор проверяет ваши данные. Обычно это занимает до 24 часов. Вы получите уведомление на email.</p>
          <button onClick={() => { setStage("cabinet"); toast.success("Демо: профиль подтверждён администратором"); }} className="rounded-2xl bg-teal px-6 py-3 font-bold text-white">
            Перейти в кабинет (демо)
          </button>
        </div>
      )}

        </>
      )}

      {stage === "cabinet" && (
        <div>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={TrendingUp} label="Доход" value={`${revenue.toLocaleString("ru-RU")}₽`} />
            <StatCard icon={Receipt} label="Транзакций" value={String(partnerTransactions.length)} />
            <StatCard icon={Users} label="Гостей" value={String(guests.reduce((s, g) => s + g.ticketCount, 0))} />
            <StatCard icon={Star} label="Рейтинг" value={avgRating.toFixed(1)} accent />
          </div>

          {/* Tabs */}
          <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
            {([["tours", "Туры"], ["guests", "Клиенты"], ["transactions", "Транзакции"], ["reviews", "Отзывы"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={cn("shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors", tab === k ? "bg-teal text-white" : "bg-secondary text-muted-foreground")}>{l}</button>
            ))}
          </div>

          {tab === "tours" && (
            <div className="space-y-3">
              <button onClick={() => setShowAddForm((s) => !s)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-teal/50 bg-teal/5 py-3 font-semibold text-teal">
                <Plus size={18} /> Добавить экскурсию
              </button>
              {showAddForm && (
                <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
                  <input value={newTour.title} onChange={(e) => setNewTour((p) => ({ ...p, title: e.target.value }))} placeholder="Название экскурсии" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
                  <input value={newTour.city} onChange={(e) => setNewTour((p) => ({ ...p, city: e.target.value }))} placeholder="Город" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
                  <input value={newTour.price} onChange={(e) => setNewTour((p) => ({ ...p, price: e.target.value.replace(/\D/g, "") }))} placeholder="Цена, ₽" inputMode="numeric" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal" />
                  <p className="text-xs text-muted-foreground">Добавьте фото/видео в мобильном приложении. После отправки экскурсия уходит администратору на модерацию.</p>
                  <button onClick={addTour} className="w-full rounded-xl bg-teal py-2.5 font-bold text-white">Отправить на модерацию</button>
                </div>
              )}
              {submissions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                  <img src={s.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.city} · {s.price.toLocaleString("ru-RU")}₽ · {s.submittedAt}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}

          {tab === "guests" && (
            <div className="space-y-3">
              {guests.map((g) => (
                <div key={g.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 font-bold text-teal">{g.firstName[0]}{g.lastName[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{g.firstName} {g.lastName}</div>
                    <div className="text-xs text-muted-foreground">{g.phone}</div>
                    <div className="text-xs text-muted-foreground">{g.tourTitle} · {g.tourDate}</div>
                  </div>
                  <div className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold">{g.ticketCount} 👤</div>
                </div>
              ))}
            </div>
          )}

          {tab === "transactions" && (
            <div>
              <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
                {([["week", "Неделя"], ["month", "Месяц"], ["halfYear", "Полгода"], ["year", "Год"]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setPeriod(k)} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold", period === k ? "bg-teal text-white" : "bg-secondary text-muted-foreground")}>{l}</button>
                ))}
              </div>
              <div className="mb-4 rounded-2xl bg-teal/10 p-4 text-center">
                <div className="text-xs text-muted-foreground">Доход за период</div>
                <div className="text-2xl font-extrabold text-teal">{revenue.toLocaleString("ru-RU")}₽</div>
              </div>
              <div className="space-y-2.5">
                {partnerTransactions.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{t.tourTitle}</div>
                      <div className="text-xs text-muted-foreground">{t.guestName} · {t.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal">+{t.amount.toLocaleString("ru-RU")}{t.currency}</div>
                      <StatusBadge status={t.status === "completed" ? "published" : "pending"} small />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-card p-4 text-center ring-1 ring-border/60">
                <div className="text-3xl font-extrabold text-gold">{avgRating.toFixed(1)}</div>
                <div className="flex justify-center">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} className={i < Math.round(avgRating) ? "text-gold" : "text-muted-foreground/30"} fill={i < Math.round(avgRating) ? "#E8B931" : "transparent"} />)}</div>
                <div className="text-xs text-muted-foreground">Рейтинг партнёра · {reviews.length} отзывов</div>
              </div>
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold">{r.author}</span>
                    <div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={13} className={i < r.rating ? "text-gold" : "text-muted-foreground/30"} fill={i < r.rating ? "#E8B931" : "transparent"} />)}</div>
                  </div>
                  <div className="mb-1 text-xs text-muted-foreground">{r.tourTitle}</div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                  {r.reply ? (
                    <div className="mt-2 rounded-xl bg-teal/10 p-2.5 text-sm">
                      <div className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-teal"><MessageSquare size={12} /> Ваш ответ</div>
                      {r.reply}
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={replyDraft[r.id] ?? ""}
                        onChange={(e) => setReplyDraft((p) => ({ ...p, [r.id]: e.target.value }))}
                        placeholder="Ответить на отзыв…"
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-teal"
                      />
                      <button onClick={() => { setReplyDraft((p) => ({ ...p, [r.id]: "" })); toast.success("Ответ отправлен на модерацию"); }} className="rounded-xl bg-teal px-4 text-sm font-semibold text-white">Отправить</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ size: number; className?: string }>; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
      <Icon size={20} className={accent ? "text-gold" : "text-teal"} />
      <div className="mt-2 text-xl font-extrabold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusBadge({ status, small }: { status: "pending" | "published" | "rejected"; small?: boolean }) {
  const cfg = {
    published: { l: "Опубликован", c: "bg-mint/15 text-mint" },
    pending: { l: "На модерации", c: "bg-orange-500/15 text-orange-500" },
    rejected: { l: "Отклонён", c: "bg-coral/15 text-coral" },
  }[status];
  return <span className={cn("inline-block rounded-lg px-2.5 py-1 font-semibold", cfg.c, small ? "text-[10px]" : "text-xs")}>{cfg.l}</span>;
}
