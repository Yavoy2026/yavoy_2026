import { Link } from "react-router-dom";

import { PaymentSystems } from "@/components/PaymentSystems";
import { useT } from "@/i18n/I18nProvider";

/**
 * Футер витрины. Несёт обязательные для эквайринга элементы (YAV-21):
 * ссылки на оферту и политику конфиденциальности + марки платёжных систем.
 */
export function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-border/70 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-28 md:flex-row md:items-start md:justify-between md:px-6 md:pb-8">
        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/offer" className="font-semibold text-muted-foreground hover:text-foreground">
            {t("legal.offer")}
          </Link>
          <Link to="/privacy" className="font-semibold text-muted-foreground hover:text-foreground">
            {t("legal.privacy")}
          </Link>
        </nav>

        <PaymentSystems className="items-start md:items-end md:text-right" />
      </div>
    </footer>
  );
}
