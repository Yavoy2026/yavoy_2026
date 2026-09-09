import { AdminLayout } from "@/components/admin/AdminLayout";
import { PartnerProfileTab } from "@/components/backoffice/PartnerProfileTab";
import { useI18n } from "@/i18n/I18nProvider";

export default function AdminOrg() {
  const { t } = useI18n();
  return (
    <AdminLayout section="org">
      <h1 className="mb-4 text-xl font-extrabold">{t("backoffice.tabOrg")}</h1>
      <PartnerProfileTab />
    </AdminLayout>
  );
}
