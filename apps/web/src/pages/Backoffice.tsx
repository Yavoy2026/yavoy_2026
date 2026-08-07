import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, Check, X, Building2, MessageSquare, Users,
  UserCheck, UserX, Shield, Loader2, Map, Pencil, Plus, BadgeCheck,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useCatalog } from "@/services/catalog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listUsers, type UserProfile } from "@/services/api";
import {
  approveReview, cancelBookingAdmin, completeBooking, confirmBooking, createPartner,
  fetchAdminBookings, fetchAdminTours, fetchPartners, fetchPendingReviews, rejectReview,
  setTourStatus, updatePartner, type AdminTour, type PartnerProfile,
} from "@/services/admin";
import { TourEditor } from "@/components/backoffice/TourEditor";
import { PartnerProfileTab } from "@/components/backoffice/PartnerProfileTab";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "bookings" | "reviews" | "users" | "tours" | "partners" | "org";

export default function Backoffice() {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading, updateUserRole, activateUserById, deactivateUserById } = useAuth();
  const queryClient = useQueryClient();

  const isPartner = role === "partner";
  const isStaff = role === "admin" || role === "manager";
  const isAdmin = role === "admin";
  const hasAccess = isPartner || isStaff;

  const [tab, setTab] = useState<Tab>(isPartner ? "tours" : "bookings");
  useEffect(() => {
    if (isPartner && !["tours", "org"].includes(tab)) setTab("tours");
  }, [isPartner, tab]);

  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: () => listUsers(), enabled: isStaff && (tab === "users" || tab === "partners") });
  const bookingsQuery = useQuery({ queryKey: ["admin-bookings"], queryFn: () => fetchAdminBookings("requested"), enabled: isStaff && tab === "bookings" });
  const confirmedQuery = useQuery({ queryKey: ["admin-bookings-confirmed"], queryFn: () => fetchAdminBookings("confirmed"), enabled: isStaff && tab === "bookings" });
  const reviewsQuery = useQuery({ queryKey: ["admin-reviews"], queryFn: fetchPendingReviews, enabled: isStaff && tab === "reviews" });
  const toursQuery = useQuery({ queryKey: ["admin-tours"], queryFn: () => fetchAdminTours(), enabled: hasAccess && tab === "tours" });
  const partnersQuery = useQuery({ queryKey: ["admin-partners"], queryFn: fetchPartners, enabled: isStaff && tab === "partners" });
  const { cities } = useCatalog();
  const [tourEditor, setTourEditor] = useState<{ open: boolean; tour: AdminTour | null }>({ open: false, tour: null });
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

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
  const tourStatusAction = useMutation({
    mutationFn: (vars: { id: string; status: "draft" | "published" }) => setTourStatus(vars.id, vars.status),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(vars.status === "published" ? "Тур опубликован — виден в каталоге" : "Тур снят с публикации");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });

  const tabs: { k: Tab; l: string; icon: React.ComponentType<{ size: number; className?: string }>; n?: number }[] = isPartner
    ? [
        { k: "tours", l: "Мои туры", icon: Map, n: toursQuery.data?.length },
        { k: "org", l: "Профиль организации", icon: Building2 },
      ]
    : [
        { k: "bookings", l: "Брони", icon: Check, n: bookingsQuery.data?.length },
        { k: "reviews", l: "Отзывы", icon: MessageSquare, n: reviewsQuery.data?.length },
        { k: "users", l: "Пользователи", icon: Users },
        { k: "tours", l: "Туры", icon: Map, n: toursQuery.data?.length },
        { k: "partners", l: "Партнёры", icon: Building2, n: partnersQuery.data?.length },
      ];

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={18} /> Назад
      </button>

      {authLoading ? (
        // сессия ещё проверяется (whoami) — не показывать «доступ запрещён» раньше времени
        <div className="flex justify-center rounded-3xl bg-card py-16 ring-1 ring-border/60">
          <Loader2 size={28} className="animate-spin text-teal" />
        </div>
      ) : !hasAccess ? (
        <div className="rounded-3xl bg-card py-16 text-center ring-1 ring-border/60">
          <ShieldCheck size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-extrabold">Доступ запрещён</h2>
          <p className="text-sm text-muted-foreground">Бэкофис доступен партнёрам, менеджерам и администраторам.</p>
        </div>
      ) : (
      <>

      <div className="mb-6 flex items-center gap-3 rounded-3xl bg-navy p-6 text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20"><ShieldCheck size={26} className="text-gold" /></div>
        <div>
          <h1 className="text-xl font-extrabold">{isPartner ? "Кабинет партнёра" : "Бэкофис YaVoy"}</h1>
          <p className="text-sm text-white/60">{isPartner ? "Ваши туры и профиль организации" : "Модерация контента и управление платформой"}</p>
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
          {isPartner && (
            <div className="rounded-2xl bg-background p-3 text-sm text-muted-foreground ring-1 ring-border/60">
              Новые туры и правки сохраняются черновиком — на витрину их выводит менеджер после проверки.
            </div>
          )}
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
                        {t.status === "published" ? "Опубликован" : isPartner ? "Черновик — публикует менеджер" : "Черновик"}
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
                  {isStaff && (
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
                  )}
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

      {tab === "org" && isPartner && <PartnerProfileTab />}

      {tab === "partners" && isStaff && (
        <PartnersTab
          partners={partnersQuery.data ?? []}
          isLoading={partnersQuery.isLoading}
          isAdmin={isAdmin}
          users={usersQuery.data ?? []}
        />
      )}

      {tab === "bookings" && isStaff && (
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

      {tab === "reviews" && isStaff && (
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

      {tab === "users" && isStaff && (
        <div className="space-y-3">
          <div className="mb-3 rounded-2xl bg-background p-3 ring-1 ring-border/60">
            <p className="text-sm text-muted-foreground">
              <Shield size={14} className="mr-1 inline text-gold" />
              Реальные пользователи платформы. Роли меняет только админ; менять себя нельзя.
              Роль «Партнёр» назначается на вкладке «Партнёры» (вместе с профилем организации).
            </p>
          </div>
          {(usersQuery.data ?? []).map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 font-bold text-teal">{(u.first_name?.[0] ?? "?").toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{u.first_name || u.email.split("@")[0]}{u.last_name ? ` ${u.last_name}` : ""}{!u.is_active && <span className="ml-2 rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-semibold text-coral">Деактивирован</span>}</div>
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
                      toast.success("Роль изменена");
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
                  <option value="partner">Партнёр</option>
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
      </>
      )}
    </Layout>
  );
}

function PartnersTab({
  partners,
  isLoading,
  isAdmin,
  users,
}: {
  partners: PartnerProfile[];
  isLoading: boolean;
  isAdmin: boolean;
  users: UserProfile[];
}) {
  const queryClient = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignOrg, setAssignOrg] = useState("");
  const [assignInn, setAssignInn] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    void queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };
  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : "Ошибка");

  const assign = useMutation({
    mutationFn: () => createPartner({ user_id: assignUserId, org_name: assignOrg, inn: assignInn }),
    onSuccess: () => {
      invalidate();
      setShowAssign(false);
      setAssignUserId(""); setAssignOrg(""); setAssignInn("");
      toast.success("Партнёр назначен — при следующем входе увидит кабинет партнёра");
    },
    onError,
  });
  const toggleVerified = useMutation({
    mutationFn: (vars: { id: string; verified: boolean }) => updatePartner(vars.id, { verified: vars.verified }),
    onSuccess: (_, vars) => {
      invalidate();
      toast.success(vars.verified ? "Партнёр отмечен проверенным (галочка в карточках туров)" : "Отметка проверки снята");
    },
    onError,
  });

  // партнёрами становятся обычные активные пользователи
  const candidates = users.filter((u) => u.role === "user" && u.is_active);

  return (
    <div className="space-y-3">
      {isAdmin && (
        <button
          onClick={() => setShowAssign((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teal/40 py-3 font-semibold text-teal hover:bg-teal/5"
        >
          <Plus size={18} /> Назначить партнёра
        </button>
      )}
      {showAssign && (
        <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
          <label className="block text-xs font-semibold text-muted-foreground">Пользователь (сначала он должен зарегистрироваться сам)
            <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="input-base mt-1">
              <option value="">— выбрать —</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>{u.email}{u.first_name ? ` (${u.first_name})` : ""}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-muted-foreground">Название организации
              <input value={assignOrg} onChange={(e) => setAssignOrg(e.target.value)} className="input-base mt-1" />
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">ИНН (проверяется вручную)
              <input value={assignInn} onChange={(e) => setAssignInn(e.target.value)} className="input-base mt-1" />
            </label>
          </div>
          <button
            onClick={() => assign.mutate()}
            disabled={!assignUserId || !assignOrg.trim() || assign.isPending}
            className="flex items-center gap-2 rounded-2xl bg-teal px-5 py-2.5 font-bold text-white disabled:opacity-60"
          >
            {assign.isPending && <Loader2 size={16} className="animate-spin" />} Назначить
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal" /></div>
      ) : (
        <Queue empty="Партнёров пока нет" items={partners}>
          {(p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10"><Building2 size={20} className="text-teal" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  {p.org_name}
                  {p.verified && <BadgeCheck size={15} className="text-mint" />}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.user_name || p.user_email} · {p.user_email}{p.inn ? ` · ИНН ${p.inn}` : ""}{p.phone ? ` · ${p.phone}` : ""}
                </div>
              </div>
              <button
                onClick={() => toggleVerified.mutate({ id: p.id, verified: !p.verified })}
                disabled={toggleVerified.isPending}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-bold",
                  p.verified ? "bg-secondary text-muted-foreground" : "bg-mint/15 text-mint",
                )}
              >
                {p.verified ? "Снять проверку" : "Подтвердить"}
              </button>
            </div>
          )}
        </Queue>
      )}
    </div>
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
