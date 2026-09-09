import { AdminLayout } from "@/components/admin/AdminLayout";
import { PartnerProfileTab } from "@/components/backoffice/PartnerProfileTab";
import { useI18n } from "@/i18n/I18nProvider";

export default function AdminOrg() {
  const { t } = useI18n();
  return (
    <AdminLayout section="org" title={t("backoffice.tabOrg")}>
      <PartnerProfileTab />
    </AdminLayout>
  );
}
