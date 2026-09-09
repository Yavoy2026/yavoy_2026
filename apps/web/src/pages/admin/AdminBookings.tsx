import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Actions, Queue } from "@/components/admin/Queue";
import { translateError } from "@/i18n/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { cancelBookingAdmin, completeBooking, confirmBooking, fetchAdminBookings } from "@/services/admin";

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const { t, formatMoney } = useI18n();

  const requested = useQuery({ queryKey: ["admin-bookings"], queryFn: () => fetchAdminBookings("requested") });
  const confirmed = useQuery({ queryKey: ["admin-bookings-confirmed"], queryFn: () => fetchAdminBookings("confirmed") });

  const action = useMutation({
    mutationFn: (vars: { id: string; action: "confirm" | "complete" | "cancel" }) =>
      vars.action === "confirm" ? confirmBooking(vars.id) : vars.action === "complete" ? completeBooking(vars.id) : cancelBookingAdmin(vars.id),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-bookings-confirmed"] });
      toast.success(t(vars.action === "confirm" ? "backoffice.bookingConfirmed" : vars.action === "complete" ? "backoffice.bookingCompleted" : "backoffice.bookingCancelled"));
    },
    onError: (e: unknown) => toast.error(translateError(e, t)),
  });

  return (
    <AdminLayout section="bookings">
      <h1 className="mb-4 text-xl font-extrabold">{t("backoffice.tabBookings")}</h1>

      <div className="space-y-6">
        <section>
          <h2 className="mb-2 font-bold">{t("backoffice.newRequests")}</h2>
          <Queue empty={t("backoffice.noRequests")} items={requested.data ?? []}>
            {(b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                <img src={b.tourImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{b.tourTitle}</div>
                  <div className="text-xs text-muted-foreground">{b.tourDate} · {t("units.people", { count: b.tickets })} · {formatMoney(b.amount)} · {b.code}</div>
                  <div className="text-xs text-muted-foreground">{b.guest} · {b.contact}</div>
                </div>
                <Actions
                  onApprove={() => action.mutate({ id: b.id, action: "confirm" })}
                  onReject={() => action.mutate({ id: b.id, action: "cancel" })}
                />
              </div>
            )}
          </Queue>
        </section>

        <section>
          <h2 className="mb-2 font-bold">{t("backoffice.confirmedBookings")}</h2>
          <Queue empty={t("backoffice.noConfirmed")} items={confirmed.data ?? []}>
            {(b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                <img src={b.tourImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{b.tourTitle}</div>
                  <div className="text-xs text-muted-foreground">{b.tourDate} · {b.guest} · {b.code}</div>
                </div>
                <button onClick={() => action.mutate({ id: b.id, action: "complete" })} className="rounded-xl bg-teal px-3 py-2 text-xs font-bold text-white">
                  {t("backoffice.complete")}
                </button>
              </div>
            )}
          </Queue>
        </section>
      </div>
    </AdminLayout>
  );
}
