import { useState } from "react";

import { useT } from "@/i18n/I18nProvider";

/**
 * Логотипы принимаемых платёжных систем — требование п.5 требований банка к сайту
 * (YAV-21). Файлы официальные, лежат в public/payment-systems/ (см. README там же):
 * подменять их самодельными марками нельзя, банк проверяет соответствие brand guidelines.
 *
 * Пока файла нет, показываем подписанную плашку: страница не выглядит сломанной,
 * но и за настоящую марку её не примешь.
 */
const SYSTEMS = [
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "unionpay", label: "UnionPay" },
  { id: "uzcard", label: "Uzcard" },
  { id: "humo", label: "Humo" },
] as const;

export function PaymentSystems({ className = "" }: { className?: string }) {
  const t = useT();
  // подмену на подпись держим состоянием, а не правкой DOM: React затирает
  // вставленные вручную узлы на ближайшей же перерисовке
  const [missing, setMissing] = useState<Record<string, boolean>>({});

  return (
    // flex-col + items-* задаёт общий край для заголовка, плашек и подписи:
    // без этого строка марок выравнивалась независимо от текста и блок «плыл»
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="text-xs font-semibold text-muted-foreground">{t("legal.paymentsTitle")}</div>

      <ul className="flex flex-wrap items-center gap-2">
        {SYSTEMS.map((system) => (
          <li
            key={system.id}
            className="flex h-9 min-w-[4.5rem] items-center justify-center rounded-lg bg-white px-3 ring-1 ring-black/5"
          >
            {missing[system.id] ? (
              <span className="text-[11px] font-semibold text-navy/70">{system.label}</span>
            ) : (
              <img
                src={`/payment-systems/${system.id}.svg`}
                alt={system.label}
                className="h-5 w-auto object-contain"
                loading="lazy"
                onError={() => setMissing((prev) => ({ ...prev, [system.id]: true }))}
              />
            )}
          </li>
        ))}
      </ul>

      <p className="max-w-xs text-[11px] leading-snug text-muted-foreground">{t("legal.securityNote")}</p>
    </div>
  );
}
