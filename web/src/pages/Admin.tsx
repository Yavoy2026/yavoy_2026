import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, Check, X, Video, Building2, MessageSquare, Users, FileText,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { tours } from "@/data/tours";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "tours" | "reels" | "partners" | "reviews" | "users" | "docs";

const pendingTours = [
  { id: "mt1", title: "Ночной джаз-квартал", partner: "ООО Джаз-Тур", city: "Санкт-Петербург", price: 2800, image: tours[2].image },
  { id: "mt2", title: "Винный weekend", partner: "ИП Виноградов", city: "Сочи", price: 6200, image: tours[8].image },
];

const pendingPartners = [
  { id: "pp1", name: "ООО «Гастро Москва»", inn: "7712345678", entity: "ООО", email: "info@gastro.ru" },
  { id: "pp2", name: "ИП Соколова А.В.", inn: "771234567890", entity: "ИП", email: "sokolova@mail.ru" },
];

const pendingReplies = [
  { id: "pr1", partner: "ООО «Гастро Москва»", review: "Невероятно вкусно!", reply: "Спасибо, ждём вас снова на наших турах!" },
];

const users = [
  { id: "u1", name: "Александр Иванов", email: "alex@yavoy.ru", role: "user", city: "Москва", tours: 5 },
  { id: "u2", name: "Мария Кузнецова", email: "maria@yavoy.ru", role: "user", city: "Санкт-Петербург", tours: 2 },
  { id: "u3", name: "Дмитрий Орлов", email: "dmitry@yavoy.ru", role: "manager", city: "Казань", tours: 0 },
];

export default function Admin() {
  const navigate = useNavigate();
  const { moderationReels } = useApp();
  const [tab, setTab] = useState<Tab>("tours");
  const [tourQueue, setTourQueue] = useState(pendingTours);
  const [partnerQueue, setPartnerQueue] = useState(pendingPartners);
  const [replyQueue, setReplyQueue] = useState(pendingReplies);
  const [docText, setDocText] = useState("Условия использования сервиса YAVOY…");

  const tabs: { k: Tab; l: string; icon: React.ComponentType<{ size: number; className?: string }>; n?: number }[] = [
    { k: "tours", l: "Туры", icon: Check, n: tourQueue.length },
    { k: "reels", l: "Reels", icon: Video, n: moderationReels.length },
    { k: "partners", l: "Партнёры", icon: Building2, n: partnerQueue.length },
    { k: "reviews", l: "Ответы", icon: MessageSquare, n: replyQueue.length },
    { k: "users", l: "Пользователи", icon: Users },
    { k: "docs", l: "Документы", icon: FileText },
  ];

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={18} /> Назад
      </button>

      <div className="mb-6 flex items-center gap-3 rounded-3xl bg-navy p-6 text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20"><ShieldCheck size={26} className="text-gold" /></div>
        <div>
          <h1 className="text-xl font-extrabold">Панель администратора</h1>
          <p className="text-sm text-white/60">Модерация контента и управление платформой</p>
        </div>
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors", tab === t.k ? "bg-teal text-white" : "bg-secondary text-muted-foreground")}>
            <t.icon size={15} /> {t.l}
            {t.n ? <span className={cn("rounded-full px-1.5 text-[10px]", tab === t.k ? "bg-white/25" : "bg-coral text-white")}>{t.n}</span> : null}
          </button>
        ))}
      </div>

      {tab === "tours" && (
        <Queue empty="Нет туров на модерации" items={tourQueue}>
          {(t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
              <img src={t.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.partner} · {t.city} · {t.price.toLocaleString("ru-RU")}₽</div>
              </div>
              <Actions
                onApprove={() => { setTourQueue((q) => q.filter((x) => x.id !== t.id)); toast.success("Тур опубликован в общей ленте"); }}
                onReject={() => { setTourQueue((q) => q.filter((x) => x.id !== t.id)); toast("Тур отклонён"); }}
              />
            </div>
          )}
        </Queue>
      )}

      {tab === "reels" && (
        <Queue empty="Нет reels на модерации" items={moderationReels}>
          {(r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
              <img src={r.coverImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.city} · {r.author}</div>
              </div>
              <Actions
                onApprove={() => toast.success("Reels опубликован в ленте")}
                onReject={() => toast("Reels отклонён")}
              />
            </div>
          )}
        </Queue>
      )}

      {tab === "partners" && (
        <Queue empty="Нет партнёров на подтверждении" items={partnerQueue}>
          {(p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10"><Building2 size={22} className="text-teal" /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.entity} · ИНН {p.inn} · {p.email}</div>
              </div>
              <Actions
                onApprove={() => { setPartnerQueue((q) => q.filter((x) => x.id !== p.id)); toast.success("Профиль партнёра подтверждён"); }}
                onReject={() => { setPartnerQueue((q) => q.filter((x) => x.id !== p.id)); toast("Профиль отклонён"); }}
              />
            </div>
          )}
        </Queue>
      )}

      {tab === "reviews" && (
        <Queue empty="Нет ответов на модерации" items={replyQueue}>
          {(r) => (
            <div key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
              <div className="mb-1 text-sm font-semibold">{r.partner}</div>
              <div className="mb-2 rounded-lg bg-secondary p-2 text-xs text-muted-foreground">Отзыв: {r.review}</div>
              <div className="mb-3 rounded-lg bg-teal/10 p-2 text-sm">Ответ партнёра: {r.reply}</div>
              <Actions
                onApprove={() => { setReplyQueue((q) => q.filter((x) => x.id !== r.id)); toast.success("Ответ опубликован"); }}
                onReject={() => { setReplyQueue((q) => q.filter((x) => x.id !== r.id)); toast("Ответ отклонён"); }}
              />
            </div>
          )}
        </Queue>
      )}

      {tab === "users" && (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 font-bold text-teal">{u.name.split(" ").map((n) => n[0]).join("")}</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email} · {u.city} · {u.tours} поездок</div>
              </div>
              <span className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold", u.role === "manager" ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground")}>
                {u.role === "manager" ? "Менеджер" : "Пользователь"}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "docs" && (
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <h3 className="mb-1 font-bold">Текст соглашений и оферты</h3>
          <p className="mb-3 text-sm text-muted-foreground">Редактируйте тексты для экрана регистрации партнёров</p>
          <textarea
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            rows={10}
            className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-teal"
          />
          <div className="mt-3 flex gap-2">
            <button onClick={() => toast.success("Сохранено")} className="rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold">Сохранить</button>
            <button onClick={() => toast.success("Сохранено и отправлено уведомление партнёрам")} className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white">Сохранить и уведомить</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Queue<T>({ items, empty, children }: { items: T[]; empty: string; children: (item: T) => React.ReactNode }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-16 text-center ring-1 ring-border/60">
        <Check size={36} className="mb-3 text-mint" />
        <p className="text-sm text-muted-foreground">{empty}</p>
      </div>
    );
  }
  return <div className="space-y-3">{items.map(children)}</div>;
}

function Actions({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={onApprove} className="flex h-9 w-9 items-center justify-center rounded-full bg-mint/15 text-mint transition-colors hover:bg-mint/25"><Check size={18} /></button>
      <button onClick={onReject} className="flex h-9 w-9 items-center justify-center rounded-full bg-coral/15 text-coral transition-colors hover:bg-coral/25"><X size={18} /></button>
    </div>
  );
}
