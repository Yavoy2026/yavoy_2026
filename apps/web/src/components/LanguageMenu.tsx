import { LOCALE_LABELS, type Locale } from "@yavoy/i18n";
import { Check, Globe } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Переключатель языка в шапке — рядом с темой, доступен гостю на любой странице.
 * Компактный: в строке шапки нет места на три полных названия, поэтому на кнопке
 * код языка, а полные подписи — в меню (в профиле остаётся развёрнутый вариант).
 */
export default function LanguageMenu() {
  const { locale, supported, setLocale, t } = useI18n();
  if (supported.length < 2) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("profile.language")}
        className="flex h-10 items-center gap-1.5 rounded-xl bg-secondary px-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/70"
      >
        <Globe size={18} />
        <span className="uppercase">{locale}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {supported.map((code: Locale) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => setLocale(code)}
            className={locale === code ? "font-semibold text-teal" : ""}
          >
            <span className="flex-1">{LOCALE_LABELS[code]}</span>
            {locale === code && <Check size={16} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
