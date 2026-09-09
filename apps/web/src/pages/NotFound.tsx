import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useT } from "@/i18n/I18nProvider";

const NotFound = () => {
  const location = useLocation();
  const t = useT();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-2 text-xl font-bold">{t("notFound.title")}</p>
        <p className="mb-4 text-muted-foreground">{t("notFound.subtitle")}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t("common.home")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
