import { Building2, Check, ExternalLink, LogOut, Map, MessageSquare, Moon, ShieldCheck, Sun, Users, Loader2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import LanguageMenu from "@/components/LanguageMenu";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import type { TKey } from "@/i18n/keys";
import { cn } from "@/lib/utils";

export type AdminSection = "bookings" | "reviews" | "users" | "tours" | "partners" | "org";

const STAFF_NAV: { section: AdminSection; label: TKey; icon: typeof Map }[] = [
  { section: "bookings", label: "backoffice.tabBookings", icon: Check },
  { section: "reviews", label: "backoffice.tabReviews", icon: MessageSquare },
  { section: "tours", label: "backoffice.tabTours", icon: Map },
  { section: "users", label: "backoffice.tabUsers", icon: Users },
  { section: "partners", label: "backoffice.tabPartners", icon: Building2 },
];

const PARTNER_NAV: { section: AdminSection; label: TKey; icon: typeof Map }[] = [
  { section: "tours", label: "backoffice.tabMyTours", icon: Map },
  { section: "org", label: "backoffice.tabOrg", icon: Building2 },
];

/**
 * Макет панели управления. Витринный Layout здесь не используется намеренно:
 * футер с марками платёжных систем, нижняя навигация покупателя и герой-баннер
 * под таблицей модерации — источник большей части UI-багов бэкофиса.
 *
 * Переходы между разделами — обычными <a href>, а не роутерными Link: документ
 * грузится заново, React стартует с чистого листа, и стейт предыдущего раздела
 * не переезжает в следующий (осознанное решение владельца, YAV-26).
 */
export function AdminLayout({ section, children }: { section: AdminSection; children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading, logout } = useAuth();
  const { isDark, setThemeMode } = useApp();
  const { t } = useI18n();

  const isPartner = role === "partner";
  const hasAccess = isPartner || role === "admin" || role === "manager";
  const nav = isPartner ? PARTNER_NAV : STAFF_NAV;
  // раздела нет в меню роли — значит и по прямой ссылке он недоступен:
  // партнёру нечего делать в пользователях, сотруднику — в профиле чужой организации
  const sectionAllowed = nav.some((item) => item.section === section);

  if (authLoading) {
    // сессия ещё проверяется (whoami) — не показывать «доступ запрещён» раньше времени
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-teal" />
      </div>
    );
  }

  if (hasAccess && !sectionAllowed) {
    return <Navigate to={isPartner ? "/admin/tours" : "/admin/bookings"} replace />;
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <ShieldCheck size={48} className="text-muted-foreground" />
        <h1 className="text-xl font-extrabold">{t("backoffice.deniedTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("backoffice.deniedText")}</p>
        <a href="/" className="mt-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-bold text-white">
          {t("common.home")}
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="border-b border-border/70 bg-card md:min-h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15">
            <ShieldCheck size={20} className="text-gold" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold">
              {t(isPartner ? "backoffice.titlePartner" : "backoffice.title")}
            </div>
            <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
          {nav.map((item) => (
            <a
              key={item.section}
              href={`/admin/${item.section}`}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                section === item.section ? "bg-teal text-white" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              <item.icon size={16} /> {t(item.label)}
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-end gap-2 border-b border-border/70 px-4 py-3">
          <a
            href="/"
            className="mr-auto flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ExternalLink size={15} /> {t("backoffice.toStorefront")}
          </a>
          <LanguageMenu />
          <button
            onClick={() => setThemeMode(isDark ? "light" : "dark")}
            aria-label={t("nav.theme")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-secondary/70"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            aria-label={t("common.logout")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut size={18} />
          </button>
        </header>

        <main className="px-4 py-5 md:px-6">{children}</main>
      </div>
    </div>
  );
}
