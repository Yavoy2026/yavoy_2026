import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Btn, Empty, Panel, Thumb } from "@/components/admin/ui";
import { translateError } from "@/i18n/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { approveReview, fetchPendingReviews, rejectReview } from "@/services/admin";

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const reviews = useQuery({ queryKey: ["admin-reviews"], queryFn: fetchPendingReviews });

  const action = useMutation({
    mutationFn: (vars: { id: string; approve: boolean }) => (vars.approve ? approveReview(vars.id) : rejectReview(vars.id)),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      // рейтинг и счётчик отзывов тура пересчитываются на модерации — витрину сбрасываем
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(t(vars.approve ? "backoffice.reviewApproved" : "backoffice.reviewRejected"));
    },
    onError: (e: unknown) => toast.error(translateError(e, t)),
  });

  return (
    <AdminLayout section="reviews" title={t("backoffice.tabReviews")}>
      {/* Отзыв — это текст произвольной длины, поэтому список, а не таблица */}
      <Panel>
        {(reviews.data ?? []).length === 0 ? (
          <Empty text={t("backoffice.noReviews")} />
        ) : (
          <ul className="divide-y divide-border">
            {(reviews.data ?? []).map((r) => (
              <li key={r.id} className="flex gap-3 p-4">
                <Thumb src={r.tourImage} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.tourTitle}</span>
                    <span className="text-xs text-gold">{"★".repeat(r.rating)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Btn variant="success" onClick={() => action.mutate({ id: r.id, approve: true })}>
                    <Check size={14} />
                  </Btn>
                  <Btn variant="danger" onClick={() => action.mutate({ id: r.id, approve: false })}>
                    <X size={14} />
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminLayout>
  );
}
