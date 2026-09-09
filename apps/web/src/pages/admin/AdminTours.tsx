import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge, Btn, Empty, Panel, Table, Td, Th, Thumb } from "@/components/admin/ui";
import { TourEditor } from "@/components/backoffice/TourEditor";
import { useAuth } from "@/context/AuthContext";
import { translateError } from "@/i18n/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { fetchAdminTours, setTourStatus, type AdminTour } from "@/services/admin";
import { useCatalog } from "@/services/catalog";

export default function AdminTours() {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { t, formatMoneyMinor } = useI18n();
  const { cities } = useCatalog();

  const isPartner = role === "partner";
  const isStaff = role === "admin" || role === "manager";

  const tours = useQuery({ queryKey: ["admin-tours"], queryFn: () => fetchAdminTours() });
  const [editor, setEditor] = useState<{ open: boolean; tour: AdminTour | null }>({ open: false, tour: null });

  const statusAction = useMutation({
    mutationFn: (vars: { id: string; status: "draft" | "published" }) => setTourStatus(vars.id, vars.status),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(t(vars.status === "published" ? "backoffice.tourPublished" : "backoffice.tourUnpublished"));
    },
    onError: (e: unknown) => toast.error(translateError(e, t)),
  });

  return (
    <AdminLayout
      section="tours"
      title={t(isPartner ? "backoffice.tabMyTours" : "backoffice.tabTours")}
      action={
        <Btn variant="primary" onClick={() => setEditor({ open: true, tour: null })}>
          <Plus size={14} /> {t("backoffice.createTour")}
        </Btn>
      }
    >
      {isPartner && (
        <p className="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {t("backoffice.draftHint")}
        </p>
      )}

      <Panel>
        {tours.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : (tours.data ?? []).length === 0 ? (
          <Empty text={t("backoffice.noTours")} />
        ) : (
          <Table
            head={
              <tr>
                <Th>{t("backoffice.colTour")}</Th>
                <Th>{t("backoffice.colStatus")}</Th>
                <Th>{t("backoffice.colCity")}</Th>
                <Th>{t("backoffice.colPrice")}</Th>
                <Th>{t("backoffice.colOrganizer")}</Th>
                <Th className="w-0" />
              </tr>
            }
          >
            {(tours.data ?? []).map((tour) => (
              <tr key={tour.id} className="hover:bg-muted/30">
                <Td>
                  <div className="flex items-center gap-2">
                    <Thumb src={tour.image_url} />
                    <span className="font-medium">{tour.title}</span>
                  </div>
                </Td>
                <Td>
                  <Badge tone={tour.status === "published" ? "ok" : "warn"}>
                    {tour.status === "published"
                      ? t("enums.tourStatus.published")
                      : isPartner
                        ? t("backoffice.draftByManager")
                        : t("enums.tourStatus.draft")}
                  </Badge>
                </Td>
                <Td className="text-muted-foreground">{tour.city_name}</Td>
                <Td className="whitespace-nowrap">{formatMoneyMinor(tour.price_kopeks)}</Td>
                <Td className="text-muted-foreground">{tour.organizer.name}</Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Btn variant="quiet" onClick={() => setEditor({ open: true, tour })} title={t("common.edit")}>
                      <Pencil size={14} />
                    </Btn>
                    {isStaff && (
                      <Btn
                        variant={tour.status === "published" ? "default" : "primary"}
                        onClick={() => statusAction.mutate({ id: tour.id, status: tour.status === "published" ? "draft" : "published" })}
                        disabled={statusAction.isPending}
                      >
                        {t(tour.status === "published" ? "backoffice.unpublish" : "backoffice.publish")}
                      </Btn>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      {editor.open && (
        <TourEditor tour={editor.tour} cities={cities} onClose={() => setEditor({ open: false, tour: null })} />
      )}
    </AdminLayout>
  );
}
