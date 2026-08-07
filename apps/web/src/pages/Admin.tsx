import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, Check, X, Video, Building2, MessageSquare, Users, FileText,
  UserCheck, UserX, Shield, Loader2, Map, Pencil, Plus,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCatalog } from "@/services/catalog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listUsers, type UserProfile } from "@/services/api";
import {
  approveReview, cancelBookingAdmin, completeBooking, confirmBooking,
  fetchAdminBookings, fetchAdminTours, fetchPendingReviews, rejectReview, setTourStatus,
  type AdminTour,
} from "@/services/admin";
import { TourEditor } from "@/components/backoffice/TourEditor";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "bookings" | "reviews" | "users" | "tours" | "reels" | "partners" | "docs";

const pendingPartners = [
  { id: "pp1", name: "ООО «Гастро Москва»", inn: "7712345678", entity: "ООО", email: "info@gastro.ru" },
  { id: "pp2", name: "ИП Соколова А.В.", inn: "771234567890", entity: "ИП", email: "sokolova@mail.ru" },
];

const pendingReplies = [
  { id: "pr1", partner: "ООО «Гастро Москва»", review: "Невероятно вкусно!", reply: "Спасибо, ждём вас снова на наших турах!" },
];

export default function Admin() {
  const navigate = useNavigate();
  const { user, updateUserRole, activateUserById, deactivateUserById } = useAuth();
  const { moderationReels } = useApp();
  const [tab, setTab] = useState<Tab>("bookings");
  const queryClient = useQueryClient();
  const isStaff = user?.role === "admin" || user?.role === "manager";

  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: () => listUsers(), enabled: isStaff && tab === "users" });
  const bookingsQuery = useQuery({ queryKey: ["admin-bookings"], queryFn: () => fetchAdminBookings("requested"), enabled: isStaff && tab === "bookings" });
  const confirmedQuery = useQuery({ queryKey: ["admin-bookings-confirmed"], queryFn: () => fetchAdminBookings("confirmed"), enabled: isStaff && tab === "bookings" });
  const reviewsQuery = useQuery({ queryKey: ["admin-reviews"], queryFn: fetchPendingReviews, enabled: isStaff && tab === "reviews" });
  const toursQuery = useQuery({ queryKey: ["admin-tours"], queryFn: () => fetchAdminTours(), enabled: isStaff && tab === "tours" });
  const { cities } = useCatalog();
  const [tourEditor, setTourEditor] = useState<{ open: boolean; tour: AdminTour | null }>({ open: false, tour: null });

  const tourStatusAction = useMutation({
    mutationFn: (vars: { id: string; status: "draft" | "published" }) => setTourStatus(vars.id, vars.status),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(vars.status === "published" ? "Тур опубликован — виден в каталоге" : "Тур снят с публикации");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });

  const invalidateBookings = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-bookings-confirmed"] });
  };
  const bookingAction = useMutation({
    mutationFn: (vars: { id: string; action: "confirm" | "complete" | "cancel" }) =>
      vars.action === "confirm" ? confirmBooking(vars.id) : vars.action === "complete" ? completeBooking(vars.id) : cancelBookingAdmin(vars.id),
    onSuccess: (_, vars) => {
      invalidateBookings();
      toast.success(vars.action === "confirm" ? "Бронь подтверждена, клиенту отправлено письмо" : vars.action === "complete" ? "Поездка завершена" : "Бронь отменена");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });
  const reviewAction = useMutation({
    mutationFn: (vars: { id: string; approve: boolean }) => (vars.approve ? approveReview(vars.id) : rejectReview(vars.id)),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(vars.approve ? "Отзыв опубликован, рейтинг тура пересчитан" : "Отзыв отклонён");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });
  const [partnerQueue, setPartnerQueue] = useState(pendingPartners);
  const [replyQueue, setReplyQueue] = useState(pendingReplies);
  const [docText, setDocText] = useState("Условия использования сервиса YAVOY…");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const isAdmin = isStaff;

  const tabs: { k: Tab; l: string; icon: React.ComponentType<{ size: number; className?: string }>; n?: number }[] = [
    { k: "bookings", l: "Брони", icon: Check, n: bookingsQuery.data?.length },
    { k: "reviews", l: "Отзывы", icon: MessageSquare, n: reviewsQuery.data?.length },
    { k: "users", l: "Пользователи", icon: Users },
    { k: "tours", l: "Туры", icon: Map, n: toursQuery.data?.length },
    { k: "reels", l: "Reels (демо)", icon: Video, n: moderationReels.length },
    { k: "partners", l: "Партнёры (демо)", icon: Building2, n: partnerQueue.length },
    { k: "docs", l: "Документы (демо)", icon: FileText },
  ];

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={18} /> Назад
      </button>

      {!isAdmin ? (
        <div className="rounded-3xl bg-card py-16 text-center ring-1 ring-border/60">
          <ShieldCheck size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-extrabold">Доступ запрещён</h2>
          <p className="text-sm text-muted-foreground">Только администраторы и модераторы могут просматривать эту страницу.</p>
        </div>
      ) : (
      <>

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
        <div className="space-y-3">
          <button
            onClick={() => setTourEditor({ open: true, tour: null })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teal/40 py-3 font-semibold text-teal hover:bg-teal/5"
          >
            <Plus size={18} /> Создать тур
          </button>
          {toursQuery.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal" /></div>
          ) : (
            <Queue empty="Туров пока нет — создайте первый" items={toursQuery.data ?? []}>
              {(t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                  <img src={t.image_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{t.title}</span>
                      <span className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        t.status === "published" ? "bg-mint/15 text-mint" : "bg-gold/15 text-gold",
                      )}>
                        {t.status === "published" ? "Опубликован" : "Черновик"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.city_name} · {Math.round(t.price_kopeks / 100).toLocaleString("ru-RU")}₽ · {t.organizer.name}
                    </div>
                  </div>
                  <button
                    onClick={() => setTourEditor({ open: true, tour: t })}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
                    title="Редактировать"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => tourStatusAction.mutate({ id: t.id, status: t.status === "published" ? "draft" : "published" })}
                    disabled={tourStatusAction.isPending}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-bold",
                      t.status === "published" ? "bg-secondary text-muted-foreground" : "bg-teal text-white",
                    )}
                  >
                    {t.status === "published" ? "Снять" : "Опубликовать"}
                  </button>
                </div>
              )}
            </Queue>
          )}
          {tourEditor.open && (
            <TourEditor
              tour={tourEditor.tour}
              cities={cities}
              onClose={() => setTourEditor({ open: false, tour: null })}
            />
          )}
        </div>
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

      {tab === "bookings" && (
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 font-bold">Новые заявки</h3>
            <Queue empty="Нет заявок, ожидающих подтверждения" items={bookingsQuery.data ?? []}>
              {(b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                  <img src={b.tourImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{b.tourTitle}</div>
                    <div className="text-xs text-muted-foreground">{b.tourDate} · {b.tickets} чел. · {b.amount.toLocaleString("ru-RU")}₽ · {b.code}</div>
                    <div className="text-xs text-muted-foreground">{b.guest} · {b.contact}</div>
                  </div>
                  <Actions
                    onApprove={() => bookingAction.mutate({ id: b.id, action: "confirm" })}
                    onReject={() => bookingAction.mutate({ id: b.id, action: "cancel" })}
                  />
                </div>
              )}
            </Queue>
          </div>
          <div>
            <h3 className="mb-2 font-bold">Подтверждённые (завершить после поездки)</h3>
            <Queue empty="Нет подтверждённых броней" items={confirmedQuery.data ?? []}>
              {(b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                  <img src={b.tourImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{b.tourTitle}</div>
                    <div className="text-xs text-muted-foreground">{b.tourDate} · {b.guest} · {b.code}</div>
                  </div>
                  <button onClick={() => bookingAction.mutate({ id: b.id, action: "complete" })} className="rounded-xl bg-teal px-3 py-2 text-xs font-bold text-white">Завершить</button>
                </div>
              )}
            </Queue>
          </div>
        </div>
      )}

      {tab === "reviews" && (
        <Queue empty="Нет отзывов на модерации" items={reviewsQuery.data ?? []}>
          {(r) => (
            <div key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
              <div className="mb-1 flex items-center gap-2">
                <img src={r.tourImage} alt="" className="h-9 w-9 rounded-lg object-cover" />
                <div className="flex-1 text-sm font-semibold">{r.tourTitle}</div>
                <span className="text-xs text-gold">{"★".repeat(r.rating)}</span>
              </div>
              <div className="mb-3 rounded-lg bg-secondary p-2 text-sm">{r.text}</div>
              <Actions
                onApprove={() => reviewAction.mutate({ id: r.id, approve: true })}
                onReject={() => reviewAction.mutate({ id: r.id, approve: false })}
              />
            </div>
          )}
        </Queue>
      )}

      {tab === "users" && (
        <div className="space-y-3">
          <div className="mb-3 rounded-2xl bg-background p-3 ring-1 ring-border/60">
            <p className="text-sm text-muted-foreground">
              <Shield size={14} className="mr-1 inline text-gold" />
              Реальные пользователи платформы. Роли меняет только админ; менять себя нельзя.
            </p>
          </div>
          {(usersQuery.data ?? []).map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 font-bold text-teal">{(u.first_name?.[0] ?? "?").toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{u.first_name}{u.last_name ? ` ${u.last_name}` : ""}{!u.is_active && <span className="ml-2 rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-semibold text-coral">Деактивирован</span>}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={u.role}
                  onChange={async (e) => {
                    const newRole = e.target.value as UserProfile["role"];
                    try {
                      setActionLoading((p) => ({ ...p, [u.id]: true }));
                      await updateUserRole(u.id, newRole);
                      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                      toast.success(`Роль изменена на «${newRole === "admin" ? "Админ" : newRole === "manager" ? "Менеджер" : "Пользователь"}»`);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Ошибка при изменении роли");
                    } finally {
                      setActionLoading((p) => ({ ...p, [u.id]: false }));
                    }
                  }}
                  disabled={actionLoading[u.id] || u.id === user?.id}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold outline-none focus:border-teal disabled:opacity-50"
                >
                  <option value="user">Пользователь</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Админ</option>
                </select>
                {actionLoading[u.id] && <Loader2 size={14} className="animate-spin text-teal" />}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={async () => {
                    try {
                      setActionLoading((p) => ({ ...p, [`act-${u.id}`]: true }));
                      await activateUserById(u.id);
                      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                      toast.success("Пользователь активирован");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Ошибка активации");
                    } finally {
                      setActionLoading((p) => ({ ...p, [`act-${u.id}`]: false }));
                    }
                  }}
                  disabled={u.id === user?.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-mint/10 text-mint transition-colors hover:bg-mint/20 disabled:opacity-40"
                  title="Активировать"
                >
                  {actionLoading[`act-${u.id}`] ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                </button>
                <button
                  onClick={async () => {
                    try {
                      setActionLoading((p) => ({ ...p, [`deact-${u.id}`]: true }));
                      await deactivateUserById(u.id);
                      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                      toast.success("Пользователь деактивирован");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Ошибка деактивации");
                    } finally {
                      setActionLoading((p) => ({ ...p, [`deact-${u.id}`]: false }));
                    }
                  }}
                  disabled={u.id === user?.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-coral/10 text-coral transition-colors hover:bg-coral/20 disabled:opacity-40"
                  title="Деактивировать"
                >
                  {actionLoading[`deact-${u.id}`] ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                </button>
              </div>
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
      </>
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
