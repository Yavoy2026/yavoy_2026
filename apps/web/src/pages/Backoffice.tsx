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
import { useI18n } from "@/i18n/I18nProvider";
import { translateError } from "@/i18n/errors";
import type { TKey } from "@/i18n/keys";

type Tab = "bookings" | "reviews" | "users" | "tours" | "partners" | "org";

export default function Backoffice() {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading, updateUserRole, activateUserById, deactivateUserById } = useAuth();
  const queryClient = useQueryClient();
  const { t, formatNumber } = useI18n();

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
      toast.success(t(vars.action === "confirm" ? "backoffice.bookingConfirmed" : vars.action === "complete" ? "backoffice.bookingCompleted" : "backoffice.bookingCancelled"));
    },
    onError: (e: unknown) => toast.error(translateError(e, t)),
  });
  const reviewAction = useMutation({
    mutationFn: (vars: { id: string; approve: boolean }) => (vars.approve ? approveReview(vars.id) : rejectReview(vars.id)),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(t(vars.approve ? "backoffice.reviewApproved" : "backoffice.reviewRejected"));
    },
    onError: (e: unknown) => toast.error(translateError(e, t)),
  });
  const tourStatusAction = useMutation({
    mutationFn: (vars: { id: string; status: "draft" | "published" }) => setTourStatus(vars.id, vars.status),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(t(vars.status === "published" ? "backoffice.tourPublished" : "backoffice.tourUnpublished"));
    },
    onError: (e: unknown) => toast.error(translateError(e, t)),
  });

  const tabs: { k: Tab; l: TKey; icon: React.ComponentType<{ size: number; className?: string }>; n?: number }[] = isPartner
    ? [
        { k: "tours", l: "backoffice.tabMyTours", icon: Map, n: toursQuery.data?.length },
        { k: "org", l: "backoffice.tabOrg", icon: Building2 },
      ]
    : [
        { k: "bookings", l: "backoffice.tabBookings", icon: Check, n: bookingsQuery.data?.length },
        { k: "reviews", l: "backoffice.tabReviews", icon: MessageSquare, n: reviewsQuery.data?.length },
        { k: "users", l: "backoffice.tabUsers", icon: Users },
        { k: "tours", l: "backoffice.tabTours", icon: Map, n: toursQuery.data?.length },
        { k: "partners", l: "backoffice.tabPartners", icon: Building2, n: partnersQuery.data?.length },
      ];

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={18} /> {t("common.back")}
      </button>

      {authLoading ? (
        // сессия ещё проверяется (whoami) — не показывать «доступ запрещён» раньше времени
        <div className="flex justify-center rounded-3xl bg-card py-16 ring-1 ring-border/60">
          <Loader2 size={28} className="animate-spin text-teal" />
        </div>
      ) : !hasAccess ? (
        <div className="rounded-3xl bg-card py-16 text-center ring-1 ring-border/60">
          <ShieldCheck size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-extrabold">{t("backoffice.deniedTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("backoffice.deniedText")}</p>
        </div>
      ) : (
      <>

      <div className="mb-6 flex items-center gap-3 rounded-3xl bg-navy p-6 text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20"><ShieldCheck size={26} className="text-gold" /></div>
        <div>
          <h1 className="text-xl font-extrabold">{t(isPartner ? "backoffice.titlePartner" : "backoffice.title")}</h1>
          <p className="text-sm text-white/60">{t(isPartner ? "backoffice.subtitlePartner" : "backoffice.subtitle")}</p>
        </div>
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <button key={item.k} onClick={() => setTab(item.k)} className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors", tab === item.k ? "bg-teal text-white" : "bg-secondary text-muted-foreground")}>
            <item.icon size={15} /> {t(item.l)}
            {item.n ? <span className={cn("rounded-full px-1.5 text-[10px]", tab === item.k ? "bg-white/25" : "bg-coral text-white")}>{item.n}</span> : null}
          </button>
        ))}
      </div>

      {tab === "tours" && (
        <div className="space-y-3">
          {isPartner && (
            <div className="rounded-2xl bg-background p-3 text-sm text-muted-foreground ring-1 ring-border/60">
              {t("backoffice.draftHint")}
            </div>
          )}
          <button
            onClick={() => setTourEditor({ open: true, tour: null })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teal/40 py-3 font-semibold text-teal hover:bg-teal/5"
          >
            <Plus size={18} /> {t("backoffice.createTour")}
          </button>
          {toursQuery.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal" /></div>
          ) : (
            <Queue empty={t("backoffice.noTours")} items={toursQuery.data ?? []}>
              {(tour) => (
                <div key={tour.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                  <img src={tour.image_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{tour.title}</span>
                      <span className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        tour.status === "published" ? "bg-mint/15 text-mint" : "bg-gold/15 text-gold",
                      )}>
                        {tour.status === "published"
                          ? t("enums.tourStatus.published")
                          : isPartner
                            ? t("backoffice.draftByManager")
                            : t("enums.tourStatus.draft")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tour.city_name} · {formatNumber(Math.round(tour.price_kopeks / 100))}₽ · {tour.organizer.name}
                    </div>
                  </div>
                  <button
                    onClick={() => setTourEditor({ open: true, tour })}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
                    title={t("common.edit")}
                  >
                    <Pencil size={15} />
                  </button>
                  {isStaff && (
                    <button
                      onClick={() => tourStatusAction.mutate({ id: tour.id, status: tour.status === "published" ? "draft" : "published" })}
                      disabled={tourStatusAction.isPending}
                      className={cn(
                        "rounded-xl px-3 py-2 text-xs font-bold",
                        tour.status === "published" ? "bg-secondary text-muted-foreground" : "bg-teal text-white",
                      )}
                    >
                      {t(tour.status === "published" ? "backoffice.unpublish" : "backoffice.publish")}
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
            <h3 className="mb-2 font-bold">{t("backoffice.newRequests")}</h3>
            <Queue empty={t("backoffice.noRequests")} items={bookingsQuery.data ?? []}>
              {(b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                  <img src={b.tourImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{b.tourTitle}</div>
                    <div className="text-xs text-muted-foreground">{b.tourDate} · {t("units.people", { count: b.tickets })} · {formatNumber(b.amount)}₽ · {b.code}</div>
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
            <h3 className="mb-2 font-bold">{t("backoffice.confirmedBookings")}</h3>
            <Queue empty={t("backoffice.noConfirmed")} items={confirmedQuery.data ?? []}>
              {(b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                  <img src={b.tourImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{b.tourTitle}</div>
                    <div className="text-xs text-muted-foreground">{b.tourDate} · {b.guest} · {b.code}</div>
                  </div>
                  <button onClick={() => bookingAction.mutate({ id: b.id, action: "complete" })} className="rounded-xl bg-teal px-3 py-2 text-xs font-bold text-white">{t("backoffice.complete")}</button>
                </div>
              )}
            </Queue>
          </div>
        </div>
      )}

      {tab === "reviews" && isStaff && (
        <Queue empty={t("backoffice.noReviews")} items={reviewsQuery.data ?? []}>
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
              {t("backoffice.usersHint")} {t("backoffice.partnerRoleHint")}
            </p>
          </div>
          {(usersQuery.data ?? []).map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 font-bold text-teal">{(u.first_name?.[0] ?? "?").toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{u.first_name || u.email.split("@")[0]}{u.last_name ? ` ${u.last_name}` : ""}{!u.is_active && <span className="ml-2 rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-semibold text-coral">{t("backoffice.deactivated")}</span>}</div>
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
                      toast.success(t("backoffice.roleChanged"));
                    } catch (err) {
                      toast.error(translateError(err, t, "backoffice.roleChangeFailed"));
                    } finally {
                      setActionLoading((p) => ({ ...p, [u.id]: false }));
                    }
                  }}
                  disabled={actionLoading[u.id] || u.id === user?.id}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold outline-none focus:border-teal disabled:opacity-50"
                >
                  <option value="user">{t("enums.role.user")}</option>
                  <option value="partner">{t("enums.role.partner")}</option>
                  <option value="manager">{t("enums.role.manager")}</option>
                  <option value="admin">{t("enums.role.admin")}</option>
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
                      toast.success(t("backoffice.userActivated"));
                    } catch (err) {
                      toast.error(translateError(err, t, "backoffice.activateFailed"));
                    } finally {
                      setActionLoading((p) => ({ ...p, [`act-${u.id}`]: false }));
                    }
                  }}
                  disabled={u.id === user?.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-mint/10 text-mint transition-colors hover:bg-mint/20 disabled:opacity-40"
                  title={t("backoffice.activate")}
                >
                  {actionLoading[`act-${u.id}`] ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                </button>
                <button
                  onClick={async () => {
                    try {
                      setActionLoading((p) => ({ ...p, [`deact-${u.id}`]: true }));
                      await deactivateUserById(u.id);
                      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                      toast.success(t("backoffice.userDeactivated"));
                    } catch (err) {
                      toast.error(translateError(err, t, "backoffice.deactivateFailed"));
                    } finally {
                      setActionLoading((p) => ({ ...p, [`deact-${u.id}`]: false }));
                    }
                  }}
                  disabled={u.id === user?.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-coral/10 text-coral transition-colors hover:bg-coral/20 disabled:opacity-40"
                  title={t("backoffice.deactivate")}
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
  const { t } = useI18n();
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignOrg, setAssignOrg] = useState("");
  const [assignInn, setAssignInn] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    void queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };
  const onError = (e: unknown) => toast.error(translateError(e, t));

  const assign = useMutation({
    mutationFn: () => createPartner({ user_id: assignUserId, org_name: assignOrg, inn: assignInn }),
    onSuccess: () => {
      invalidate();
      setShowAssign(false);
      setAssignUserId(""); setAssignOrg(""); setAssignInn("");
      toast.success(t("backoffice.partnerAssigned"));
    },
    onError,
  });
  const toggleVerified = useMutation({
    mutationFn: (vars: { id: string; verified: boolean }) => updatePartner(vars.id, { verified: vars.verified }),
    onSuccess: (_, vars) => {
      invalidate();
      toast.success(t(vars.verified ? "backoffice.partnerVerified" : "backoffice.partnerUnverified"));
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
          <Plus size={18} /> {t("backoffice.assignPartner")}
        </button>
      )}
      {showAssign && (
        <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
          <label className="block text-xs font-semibold text-muted-foreground">{t("backoffice.assignUserLabel")}
            <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="input-base mt-1">
              <option value="">{t("backoffice.selectPlaceholder")}</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>{u.email}{u.first_name ? ` (${u.first_name})` : ""}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-muted-foreground">{t("backoffice.orgName")}
              <input value={assignOrg} onChange={(e) => setAssignOrg(e.target.value)} className="input-base mt-1" />
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">{t("backoffice.orgInnManual")}
              <input value={assignInn} onChange={(e) => setAssignInn(e.target.value)} className="input-base mt-1" />
            </label>
          </div>
          <button
            onClick={() => assign.mutate()}
            disabled={!assignUserId || !assignOrg.trim() || assign.isPending}
            className="flex items-center gap-2 rounded-2xl bg-teal px-5 py-2.5 font-bold text-white disabled:opacity-60"
          >
            {assign.isPending && <Loader2 size={16} className="animate-spin" />} {t("backoffice.assign")}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal" /></div>
      ) : (
        <Queue empty={t("backoffice.noPartners")} items={partners}>
          {(p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10"><Building2 size={20} className="text-teal" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  {p.org_name}
                  {p.verified && <BadgeCheck size={15} className="text-mint" />}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.user_name || p.user_email} · {p.user_email}{p.inn ? ` · ${t("backoffice.orgInn")} ${p.inn}` : ""}{p.phone ? ` · ${p.phone}` : ""}
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
                {t(p.verified ? "backoffice.unverify" : "backoffice.confirm")}
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
