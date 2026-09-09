import { LOCALE_LABELS } from "@yavoy/i18n";

import { useI18n } from "@/i18n/I18nProvider";

/** Переключатель языка. Скрывается, если сервер отдал единственный язык. */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, supported, setLocale } = useI18n();
  if (supported.length < 2) return null;

  return (
    <div className={`flex gap-2 ${className}`}>
      {supported.map((code) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
            locale === code ? "border-teal bg-teal/10 text-teal" : "border-border text-muted-foreground"
          }`}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
