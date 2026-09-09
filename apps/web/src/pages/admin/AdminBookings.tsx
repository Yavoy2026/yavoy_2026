import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Btn, Empty, Panel, Table, Td, Th, Thumb } from "@/components/admin/ui";
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
    <AdminLayout section="bookings" title={t("backoffice.tabBookings")}>
      <div className="space-y-5">
        <Panel title={t("backoffice.newRequests")}>
          {(requested.data ?? []).length === 0 ? (
            <Empty text={t("backoffice.noRequests")} />
          ) : (
            <Table
              head={
                <tr>
                  <Th>{t("backoffice.colTour")}</Th>
                  <Th>{t("backoffice.colDate")}</Th>
                  <Th>{t("backoffice.colGuest")}</Th>
                  <Th>{t("backoffice.colAmount")}</Th>
                  <Th>{t("backoffice.colCode")}</Th>
                  <Th className="w-0" />
                </tr>
              }
            >
              {(requested.data ?? []).map((b) => (
                <tr key={b.id} className="hover:bg-muted/30">
                  <Td>
                    <div className="flex items-center gap-2">
                      <Thumb src={b.tourImage} />
                      <span className="font-medium">{b.tourTitle}</span>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">
                    {b.tourDate} · {t("units.people", { count: b.tickets })}
                  </Td>
                  <Td className="text-muted-foreground">
                    <div>{b.guest}</div>
                    <div className="text-xs">{b.contact}</div>
                  </Td>
                  <Td className="whitespace-nowrap font-medium">{formatMoney(b.amount)}</Td>
                  <Td className="font-mono text-xs text-muted-foreground">{b.code}</Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Btn variant="success" onClick={() => action.mutate({ id: b.id, action: "confirm" })}>
                        <Check size={14} /> {t("backoffice.confirm")}
                      </Btn>
                      <Btn variant="danger" onClick={() => action.mutate({ id: b.id, action: "cancel" })}>
                        <X size={14} />
                      </Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>

        <Panel title={t("backoffice.confirmedBookings")}>
          {(confirmed.data ?? []).length === 0 ? (
            <Empty text={t("backoffice.noConfirmed")} />
          ) : (
            <Table
              head={
                <tr>
                  <Th>{t("backoffice.colTour")}</Th>
                  <Th>{t("backoffice.colDate")}</Th>
                  <Th>{t("backoffice.colGuest")}</Th>
                  <Th>{t("backoffice.colCode")}</Th>
                  <Th className="w-0" />
                </tr>
              }
            >
              {(confirmed.data ?? []).map((b) => (
                <tr key={b.id} className="hover:bg-muted/30">
                  <Td>
                    <div className="flex items-center gap-2">
                      <Thumb src={b.tourImage} />
                      <span className="font-medium">{b.tourTitle}</span>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{b.tourDate}</Td>
                  <Td className="text-muted-foreground">{b.guest}</Td>
                  <Td className="font-mono text-xs text-muted-foreground">{b.code}</Td>
                  <Td>
                    <Btn variant="primary" onClick={() => action.mutate({ id: b.id, action: "complete" })}>
                      {t("backoffice.complete")}
                    </Btn>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </AdminLayout>
  );
}
