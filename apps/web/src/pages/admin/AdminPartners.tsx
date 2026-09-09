import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Building2, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Queue } from "@/components/admin/Queue";
import { useAuth } from "@/context/AuthContext";
import { translateError } from "@/i18n/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { createPartner, fetchPartners, updatePartner } from "@/services/admin";
import { listUsers } from "@/services/api";

export default function AdminPartners() {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { t } = useI18n();

  const isAdmin = role === "admin";
  const partners = useQuery({ queryKey: ["admin-partners"], queryFn: fetchPartners });
  // список нужен только админу — для формы назначения партнёра
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => listUsers(), enabled: isAdmin });

  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignOrg, setAssignOrg] = useState("");
  const [assignInn, setAssignInn] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    // organizer на витрине синхронизируется из профиля партнёра
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
  const candidates = (users.data ?? []).filter((u) => u.role === "user" && u.is_active);

  return (
    <AdminLayout section="partners">
      <h1 className="mb-4 text-xl font-extrabold">{t("backoffice.tabPartners")}</h1>

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

        {partners.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal" /></div>
        ) : (
          <Queue empty={t("backoffice.noPartners")} items={partners.data ?? []}>
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
    </AdminLayout>
  );
}
