import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge, Btn, Empty, inputClass, Panel, Table, Td, Th } from "@/components/admin/ui";
import { translateError } from "@/i18n/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { approveRevision, fetchRevisions, rejectRevision } from "@/services/admin";

/**
 * Очередь модерации правок (YAV-29). Пока правка здесь, опубликованный тур
 * продолжает работать на витрине со старым содержимым.
 */
export default function AdminModeration() {
  const queryClient = useQueryClient();
  const { t, formatDate } = useI18n();

  const queue = useQuery({ queryKey: ["admin-revisions"], queryFn: () => fetchRevisions("pending") });
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-revisions"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
    void queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };
  const onError = (e: unknown) => toast.error(translateError(e, t));

  const approve = useMutation({
    mutationFn: (id: string) => approveRevision(id),
    onSuccess: () => { invalidate(); toast.success(t("backoffice.revisionApproved")); },
    onError,
  });

  const reject = useMutation({
    mutationFn: (id: string) => rejectRevision(id, comment),
    onSuccess: () => {
      invalidate();
      setRejecting(null);
      setComment("");
      toast.success(t("backoffice.revisionRejected"));
    },
    onError,
  });

  return (
    <AdminLayout section="moderation" title={t("backoffice.tabModeration")}>
      <Panel>
        {queue.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : (queue.data ?? []).length === 0 ? (
          <Empty text={t("backoffice.noModeration")} />
        ) : (
          <Table
            head={
              <tr>
                <Th>{t("backoffice.colTour")}</Th>
                <Th>{t("backoffice.colStatus")}</Th>
                <Th>{t("backoffice.colOrganizer")}</Th>
                <Th>{t("backoffice.colDate")}</Th>
                <Th className="w-0" />
              </tr>
            }
          >
            {(queue.data ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <Td className="font-medium">{r.tour_title}</Td>
                <Td>
                  {/* правка опубликованного тура или первая публикация — разные вещи */}
                  <Badge tone={r.tour_status === "published" ? "ok" : "warn"}>
                    {t(r.tour_status === "published" ? "backoffice.revisionEdit" : "backoffice.revisionNew")}
                  </Badge>
                </Td>
                <Td className="text-muted-foreground">{r.organizer_name}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{formatDate(r.created_at)}</Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Btn variant="success" onClick={() => approve.mutate(r.id)} disabled={approve.isPending}>
                      <Check size={14} /> {t("backoffice.publish")}
                    </Btn>
                    <Btn variant="danger" onClick={() => { setRejecting(r.id); setComment(""); }}>
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
            {/* причина обязательна: без неё партнёр не знает, что исправлять */}
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
