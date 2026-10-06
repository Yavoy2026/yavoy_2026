import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Btn, Empty, inputClass, Panel, Table, Td, Th } from "@/components/admin/ui";
import { useAuth } from "@/context/AuthContext";
import { translateError } from "@/i18n/errors";
import { useI18n } from "@/i18n/I18nProvider";
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
    <AdminLayout
      section="partners"
      title={t("backoffice.tabPartners")}
      action={
        isAdmin ? (
          <Btn variant="primary" onClick={() => setShowAssign((v) => !v)}>
            <Plus size={14} /> {t("backoffice.assignPartner")}
          </Btn>
        ) : undefined
      }
    >
      {showAssign && (
        <Panel title={t("backoffice.assignPartner")}>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <label className="block text-xs font-semibold text-muted-foreground">{t("backoffice.assignUserLabel")}
              <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className={`${inputClass} mt-1 w-full`}>
                <option value="">{t("backoffice.selectPlaceholder")}</option>
                {candidates.map((u) => (
                  <option key={u.id} value={u.id}>{u.email}{u.first_name ? ` (${u.first_name})` : ""}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">{t("backoffice.orgName")}
              <input value={assignOrg} onChange={(e) => setAssignOrg(e.target.value)} className={`${inputClass} mt-1 w-full`} />
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">{t("backoffice.orgInnManual")}
              <input value={assignInn} onChange={(e) => setAssignInn(e.target.value)} className={`${inputClass} mt-1 w-full`} />
            </label>
          </div>
          <div className="border-t border-border px-4 py-2.5">
            <Btn variant="primary" onClick={() => assign.mutate()} disabled={!assignUserId || !assignOrg.trim() || assign.isPending}>
              {assign.isPending && <Loader2 size={13} className="animate-spin" />} {t("backoffice.assign")}
            </Btn>
          </div>
        </Panel>
      )}

      <Panel>
        {partners.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : (partners.data ?? []).length === 0 ? (
          <Empty text={t("backoffice.noPartners")} />
        ) : (
          <Table
            head={
              <tr>
                <Th>{t("backoffice.colOrg")}</Th>
                <Th>{t("backoffice.colContacts")}</Th>
                <Th>{t("backoffice.orgInn")}</Th>
                <Th className="w-0" />
              </tr>
            }
          >
            {(partners.data ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <Td>
                  <div className="flex items-center gap-1.5 font-medium">
                    {p.org_name}
                    {p.verified && <BadgeCheck size={14} className="text-mint" />}
                  </div>
                </Td>
                <Td className="text-muted-foreground">
                  <div>{p.user_name || p.user_email}</div>
                  <div className="text-xs">{p.user_email}{p.phone ? ` · ${p.phone}` : ""}</div>
                </Td>
                <Td className="font-mono text-xs text-muted-foreground">{p.inn || "—"}</Td>
                <Td>
                  <Btn
                    variant={p.verified ? "default" : "success"}
                    onClick={() => toggleVerified.mutate({ id: p.id, verified: !p.verified })}
                    disabled={toggleVerified.isPending}
                  >
                    {t(p.verified ? "backoffice.unverify" : "backoffice.confirm")}
                  </Btn>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </AdminLayout>
  );
}
