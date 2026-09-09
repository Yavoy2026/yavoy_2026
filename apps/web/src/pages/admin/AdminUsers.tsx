import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge, Btn, inputClass, Panel, Table, Td, Th } from "@/components/admin/ui";
import { useAuth } from "@/context/AuthContext";
import { translateError } from "@/i18n/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { listUsers, type UserProfile } from "@/services/api";

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { user, updateUserRole, activateUserById, deactivateUserById } = useAuth();
  const { t } = useI18n();

  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => listUsers() });
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  /** Действия над пользователем идут мимо useMutation: их три и они дёргают AuthContext */
  const run = async (key: string, fn: () => Promise<unknown>, okKey: Parameters<typeof t>[0], failKey?: Parameters<typeof t>[0]) => {
    try {
      setBusy((p) => ({ ...p, [key]: true }));
      await fn();
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t(okKey));
    } catch (err) {
      toast.error(translateError(err, t, failKey));
    } finally {
      setBusy((p) => ({ ...p, [key]: false }));
    }
  };

  return (
    <AdminLayout section="users" title={t("backoffice.tabUsers")}>
      <p className="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {t("backoffice.usersHint")} {t("backoffice.partnerRoleHint")}
      </p>

      <Panel>
        {users.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <Table
            head={
              <tr>
                <Th>{t("backoffice.colUser")}</Th>
                <Th>{t("backoffice.colStatus")}</Th>
                <Th>{t("backoffice.colRole")}</Th>
                <Th className="w-0" />
              </tr>
            }
          >
            {(users.data ?? []).map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <Td>
                  <div className="font-medium">
                    {u.first_name || u.email.split("@")[0]}{u.last_name ? ` ${u.last_name}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </Td>
                <Td>
                  {u.is_active ? <Badge tone="ok">{t("backoffice.statusActive")}</Badge> : <Badge tone="bad">{t("backoffice.deactivated")}</Badge>}
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={u.role}
                      onChange={(e) => {
                        const next = e.target.value as UserProfile["role"];
                        void run(u.id, () => updateUserRole(u.id, next), "backoffice.roleChanged", "backoffice.roleChangeFailed");
                      }}
                      // себя не разжалуешь: иначе админ способен отобрать доступ у самого себя
                      disabled={busy[u.id] || u.id === user?.id}
                      className={`${inputClass} py-1 text-xs font-semibold`}
                    >
                      <option value="user">{t("enums.role.user")}</option>
                      <option value="partner">{t("enums.role.partner")}</option>
                      <option value="manager">{t("enums.role.manager")}</option>
                      <option value="admin">{t("enums.role.admin")}</option>
                    </select>
                    {busy[u.id] && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
                  </div>
                </Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Btn
                      variant="success"
                      onClick={() => void run(`act-${u.id}`, () => activateUserById(u.id), "backoffice.userActivated", "backoffice.activateFailed")}
                      disabled={u.id === user?.id}
                      title={t("backoffice.activate")}
                    >
                      {busy[`act-${u.id}`] ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => void run(`deact-${u.id}`, () => deactivateUserById(u.id), "backoffice.userDeactivated", "backoffice.deactivateFailed")}
                      disabled={u.id === user?.id}
                      title={t("backoffice.deactivate")}
                    >
                      {busy[`deact-${u.id}`] ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
                    </Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </AdminLayout>
  );
}
