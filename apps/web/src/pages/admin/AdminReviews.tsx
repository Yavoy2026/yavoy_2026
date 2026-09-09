import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Actions, Queue } from "@/components/admin/Queue";
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
    <AdminLayout section="reviews">
      <h1 className="mb-4 text-xl font-extrabold">{t("backoffice.tabReviews")}</h1>

      <Queue empty={t("backoffice.noReviews")} items={reviews.data ?? []}>
        {(r) => (
          <div key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
            <div className="mb-1 flex items-center gap-2">
              <img src={r.tourImage} alt="" className="h-9 w-9 rounded-lg object-cover" />
              <div className="flex-1 text-sm font-semibold">{r.tourTitle}</div>
              <span className="text-xs text-gold">{"★".repeat(r.rating)}</span>
            </div>
            <div className="mb-3 rounded-lg bg-secondary p-2 text-sm">{r.text}</div>
            <Actions
              onApprove={() => action.mutate({ id: r.id, approve: true })}
              onReject={() => action.mutate({ id: r.id, approve: false })}
            />
          </div>
        )}
      </Queue>
    </AdminLayout>
  );
}
