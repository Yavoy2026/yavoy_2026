import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Compass, Map, Heart, User, Play, Sun, Moon, Search } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Footer } from "@/components/Footer";
import { useT } from "@/i18n/I18nProvider";
import type { TKey } from "@/i18n/keys";
import { cn } from "@/lib/utils";

const navItems: { to: string; key: TKey; icon: typeof Compass; end?: boolean }[] = [
  { to: "/", key: "nav.tours", icon: Compass, end: true },
  { to: "/explore", key: "nav.explore", icon: Map },
  { to: "/favorites", key: "nav.favorites", icon: Heart },
  { to: "/profile", key: "nav.profile", icon: User },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-teal-dark shadow-md">
        <Compass size={20} className="text-white" />
      </div>
      <span className="text-lg font-extrabold tracking-tight text-navy dark:text-white">
        Ya<span className="text-teal">Voy</span>
      </span>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { themeMode, setThemeMode, isDark } = useApp();
  const t = useT();

  return (
    <div className="min-h-screen bg-background">
      {/* Top header (desktop) */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <button onClick={() => navigate("/")} aria-label={t("nav.main")}>
            <Logo />
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                    isActive ? "bg-teal/10 text-teal" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <item.icon size={18} />
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/reels")}
              className="hidden items-center gap-1.5 rounded-xl bg-coral/10 px-3 py-2 text-sm font-semibold text-coral transition-colors hover:bg-coral/20 sm:flex"
            >
              <Play size={16} fill="#FF6B6B" /> Reels
            </button>
            <button
              onClick={() => setThemeMode(isDark ? "light" : "dark")}
              aria-label={t("nav.theme")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-secondary/70"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 md:px-6">{children}</main>

      <Footer />

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-xl md:hidden">
        <div className="flex items-stretch justify-around">
          {navItems.map((item) => {
            const isActive = item.end ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                  isActive ? "text-teal" : "text-muted-foreground",
                )}
              >
                <item.icon size={22} />
                {t(item.key)}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export { Search };
