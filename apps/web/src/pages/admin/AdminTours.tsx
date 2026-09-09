import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Queue } from "@/components/admin/Queue";
import { TourEditor } from "@/components/backoffice/TourEditor";
import { useAuth } from "@/context/AuthContext";
import { translateError } from "@/i18n/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
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
    <AdminLayout section="tours">
      <h1 className="mb-4 text-xl font-extrabold">{t(isPartner ? "backoffice.tabMyTours" : "backoffice.tabTours")}</h1>

      <div className="space-y-3">
        {isPartner && (
          <div className="rounded-2xl bg-card p-3 text-sm text-muted-foreground ring-1 ring-border/60">
            {t("backoffice.draftHint")}
          </div>
        )}

        <button
          onClick={() => setEditor({ open: true, tour: null })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teal/40 py-3 font-semibold text-teal hover:bg-teal/5"
        >
          <Plus size={18} /> {t("backoffice.createTour")}
        </button>

        {tours.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal" /></div>
        ) : (
          <Queue empty={t("backoffice.noTours")} items={tours.data ?? []}>
            {(tour) => (
              <div key={tour.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
                <img src={tour.image_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{tour.title}</span>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      tour.status === "published" ? "bg-mint/15 text-mint" : "bg-gold/15 text-gold",
                    )}>
                      {tour.status === "published"
                        ? t("enums.tourStatus.published")
                        : isPartner
                          ? t("backoffice.draftByManager")
                          : t("enums.tourStatus.draft")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tour.city_name} · {formatMoneyMinor(tour.price_kopeks)} · {tour.organizer.name}
                  </div>
                </div>
                <button
                  onClick={() => setEditor({ open: true, tour })}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
                  title={t("common.edit")}
                >
                  <Pencil size={15} />
                </button>
                {isStaff && (
                  <button
                    onClick={() => statusAction.mutate({ id: tour.id, status: tour.status === "published" ? "draft" : "published" })}
                    disabled={statusAction.isPending}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-bold",
                      tour.status === "published" ? "bg-secondary text-muted-foreground" : "bg-teal text-white",
                    )}
                  >
                    {t(tour.status === "published" ? "backoffice.unpublish" : "backoffice.publish")}
                  </button>
                )}
              </div>
            )}
          </Queue>
        )}

        {editor.open && (
          <TourEditor tour={editor.tour} cities={cities} onClose={() => setEditor({ open: false, tour: null })} />
        )}
      </div>
    </AdminLayout>
  );
}
