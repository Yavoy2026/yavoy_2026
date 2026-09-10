import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnerOffer } from "@yavoy/legal";
import { Building2, CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { translateError } from "@/i18n/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { SLOT, withSlot } from "@/i18n/slot";
import { fetchMyApplication, submitApplication, type ApplicationForm } from "@/services/partners";

const EMPTY: ApplicationForm = { org_name: "", inn: "", phone: "", description: "" };

/**
 * Заявка на партнёрство (YAV-29). Раньше здесь жил демо-кабинет на моках —
 * фейковые заявки, гости и выручка; настоящий кабинет партнёра находится
 * в панели управления, а витрине нужна именно форма подачи.
 */
export default function Partner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const { t, formatDate } = useI18n();

  const application = useQuery({
    queryKey: ["my-application"],
    queryFn: fetchMyApplication,
    enabled: isAuthenticated,
  });

  const [form, setForm] = useState<ApplicationForm>(EMPTY);
  const [accepted, setAccepted] = useState(false);
  const set = (k: keyof ApplicationForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = useMutation({
    mutationFn: () => submitApplication(form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-application"] });
      toast.success(t("partner.applicationSent"));
    },
    onError: (e: unknown) => toast.error(translateError(e, t)),
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-teal" /></div>
      </Layout>
    );
  }

  const hero = (
    <div className="mb-6 overflow-hidden rounded-3xl bg-card p-8 text-foreground shadow-xl ring-1 ring-border/60 dark:bg-navy dark:text-white">
      <h1 className="text-2xl font-extrabold md:text-3xl">{t("partner.heroTitle")}</h1>
      <p className="mt-2 max-w-xl text-muted-foreground dark:text-white/70">{t("partner.heroSubtitle")}</p>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <Layout>
        {hero}
        <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border/60">
          <p className="mb-3 text-muted-foreground">{t("partner.authRequiredText")}</p>
          <button onClick={() => navigate("/auth")} className="rounded-xl bg-teal px-6 py-2.5 font-bold text-white">
            {t("common.loginOrRegister")}
          </button>
        </div>
      </Layout>
    );
  }

  // уже партнёр — форма ему не нужна, ему нужен кабинет
  if (role === "partner") {
    return (
      <Layout>
        {hero}
        <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border/60">
          <CheckCircle size={36} className="mx-auto mb-3 text-mint" />
          <p className="mb-3 font-semibold">{t("partner.alreadyPartner")}</p>
          <Link to="/admin" className="inline-block rounded-xl bg-teal px-6 py-2.5 font-bold text-white">
            {t("partner.goToCabinet")}
          </Link>
        </div>
      </Layout>
    );
  }

  const current = application.data;

  if (current?.status === "pending") {
    return (
      <Layout>
        {hero}
        <div className="rounded-2xl bg-card p-6 ring-1 ring-border/60">
          <div className="mb-2 flex items-center gap-2 font-semibold text-gold">
            <Clock size={18} /> {t("partner.statusPending")}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("partner.statusPendingText", { org: current.org_name, date: formatDate(current.created_at) })}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {hero}

      {current?.status === "rejected" && (
        <div className="mb-4 rounded-2xl bg-coral/10 p-4 ring-1 ring-coral/30">
          <div className="mb-1 flex items-center gap-2 font-semibold text-coral">
            <XCircle size={18} /> {t("partner.statusRejected")}
          </div>
          {/* причина обязательна на бэкенде — партнёр должен знать, что исправлять */}
          <p className="text-sm text-muted-foreground">{current.comment}</p>
        </div>
      )}

      <div className="space-y-3 rounded-2xl bg-card p-6 ring-1 ring-border/60">
        <div className="flex items-center gap-2 font-bold">
          <Building2 size={18} className="text-teal" /> {t("partner.formTitle")}
        </div>

        <label className="block text-xs font-semibold text-muted-foreground">
          {t("partner.fieldOrg")}
          <input value={form.org_name} onChange={(e) => set("org_name", e.target.value)} className="input-base mt-1" />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          {t("partner.fieldTaxId")}
          <input value={form.inn} onChange={(e) => set("inn", e.target.value)} className="input-base mt-1" inputMode="numeric" />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          {t("partner.fieldPhone")}
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input-base mt-1" />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          {t("partner.fieldAbout")}
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="input-base mt-1" />
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-teal" />
          <span className="text-muted-foreground">
            {withSlot(
              `${t("partner.acceptOfferPrefix")}${SLOT}`,
              <Link to="/partner-offer" target="_blank" className="font-semibold text-teal hover:underline">
                {t("partner.offerDocName")}
              </Link>,
            )}
          </span>
        </label>

        <button
          onClick={() => submit.mutate()}
          disabled={!accepted || !form.org_name.trim() || form.inn.trim().length < 4 || submit.isPending}
          className="flex items-center gap-2 rounded-2xl bg-teal px-6 py-3 font-bold text-white disabled:opacity-50"
        >
          {submit.isPending && <Loader2 size={16} className="animate-spin" />}
          {t("partner.submitApplication")}
        </button>

        <p className="text-xs text-muted-foreground">
          {t("partner.offerVersionNote", { version: partnerOffer.version })}
        </p>
      </div>
    </Layout>
  );
}
