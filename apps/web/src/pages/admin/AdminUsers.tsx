import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
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
    <AdminLayout section="users">
      <h1 className="mb-4 text-xl font-extrabold">{t("backoffice.tabUsers")}</h1>

      <div className="space-y-3">
        <div className="rounded-2xl bg-card p-3 ring-1 ring-border/60">
          <p className="text-sm text-muted-foreground">
            <Shield size={14} className="mr-1 inline text-gold" />
            {t("backoffice.usersHint")} {t("backoffice.partnerRoleHint")}
          </p>
        </div>

        {users.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal" /></div>
        ) : (
          (users.data ?? []).map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 font-bold text-teal">
                {(u.first_name?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">
                  {u.first_name || u.email.split("@")[0]}{u.last_name ? ` ${u.last_name}` : ""}
                  {!u.is_active && (
                    <span className="ml-2 rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-semibold text-coral">
                      {t("backoffice.deactivated")}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={u.role}
                  onChange={(e) => {
                    const next = e.target.value as UserProfile["role"];
                    void run(u.id, () => updateUserRole(u.id, next), "backoffice.roleChanged", "backoffice.roleChangeFailed");
                  }}
                  // себя не разжалуешь: иначе админ способен отобрать доступ у самого себя
                  disabled={busy[u.id] || u.id === user?.id}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold outline-none focus:border-teal disabled:opacity-50"
                >
                  <option value="user">{t("enums.role.user")}</option>
                  <option value="partner">{t("enums.role.partner")}</option>
                  <option value="manager">{t("enums.role.manager")}</option>
                  <option value="admin">{t("enums.role.admin")}</option>
                </select>
                {busy[u.id] && <Loader2 size={14} className="animate-spin text-teal" />}
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => void run(`act-${u.id}`, () => activateUserById(u.id), "backoffice.userActivated", "backoffice.activateFailed")}
                  disabled={u.id === user?.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-mint/10 text-mint transition-colors hover:bg-mint/20 disabled:opacity-40"
                  title={t("backoffice.activate")}
                >
                  {busy[`act-${u.id}`] ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                </button>
                <button
                  onClick={() => void run(`deact-${u.id}`, () => deactivateUserById(u.id), "backoffice.userDeactivated", "backoffice.deactivateFailed")}
                  disabled={u.id === user?.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-coral/10 text-coral transition-colors hover:bg-coral/20 disabled:opacity-40"
                  title={t("backoffice.deactivate")}
                >
                  {busy[`deact-${u.id}`] ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
