import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Btn, Empty, inputClass, Panel, Table, Td, Th } from "@/components/admin/ui";
import { translateError } from "@/i18n/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { approveApplication, fetchApplications, rejectApplication } from "@/services/admin";

/**
 * Заявки на партнёрство (YAV-29). Одобрение выдаёт роль и создаёт профиль
 * данными из заявки — вводить их повторно не нужно.
 */
export default function AdminApplications() {
  const queryClient = useQueryClient();
  const { t, formatDate } = useI18n();

  const queue = useQuery({ queryKey: ["admin-applications"], queryFn: () => fetchApplications("pending") });
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };
  const onError = (e: unknown) => toast.error(translateError(e, t));

  const approve = useMutation({
    mutationFn: (id: string) => approveApplication(id),
    onSuccess: () => { invalidate(); toast.success(t("backoffice.applicationApproved")); },
    onError,
  });

  const reject = useMutation({
    mutationFn: (id: string) => rejectApplication(id, comment),
    onSuccess: () => {
      invalidate();
      setRejecting(null);
      setComment("");
      toast.success(t("backoffice.applicationRejected"));
    },
    onError,
  });

  return (
    <AdminLayout section="applications" title={t("backoffice.tabApplications")}>
      <Panel>
        {queue.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : (queue.data ?? []).length === 0 ? (
          <Empty text={t("backoffice.noApplications")} />
        ) : (
          <Table
            head={
              <tr>
                <Th>{t("backoffice.colOrg")}</Th>
                <Th>{t("backoffice.orgInn")}</Th>
                <Th>{t("backoffice.colContacts")}</Th>
                <Th>{t("backoffice.colOffer")}</Th>
                <Th>{t("backoffice.colDate")}</Th>
                <Th className="w-0" />
              </tr>
            }
          >
            {(queue.data ?? []).map((a) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <Td>
                  <div className="font-medium">{a.org_name}</div>
                  {a.description && <div className="text-xs text-muted-foreground">{a.description}</div>}
                </Td>
                <Td className="font-mono text-xs">{a.inn}</Td>
                <Td className="text-muted-foreground">
                  <div>{a.user_name || a.user_email}</div>
                  <div className="text-xs">{a.user_email}{a.phone ? ` · ${a.phone}` : ""}</div>
                </Td>
                {/* редакция принятой оферты — то, чем акцепт доказуем */}
                <Td className="whitespace-nowrap text-xs text-muted-foreground">
                  № {a.offer_version} · {formatDate(a.offer_accepted_at)}
                </Td>
                <Td className="whitespace-nowrap text-muted-foreground">{formatDate(a.created_at)}</Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Btn variant="success" onClick={() => approve.mutate(a.id)} disabled={approve.isPending}>
                      <Check size={14} /> {t("backoffice.confirm")}
                    </Btn>
                    <Btn variant="danger" onClick={() => { setRejecting(a.id); setComment(""); }}>
                      <X size={14} />
                    </Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      {rejecting && (
        <Panel title={t("backoffice.rejectReason")}>
          <div className="space-y-2 p-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className={`${inputClass} w-full`}
              placeholder={t("backoffice.rejectReasonHint")}
            />
            <div className="flex gap-2">
              <Btn variant="danger" onClick={() => reject.mutate(rejecting)} disabled={!comment.trim() || reject.isPending}>
                {reject.isPending && <Loader2 size={13} className="animate-spin" />} {t("backoffice.rejectSend")}
              </Btn>
              <Btn onClick={() => setRejecting(null)}>{t("common.cancel")}</Btn>
            </div>
          </div>
        </Panel>
      )}
    </AdminLayout>
  );
}
