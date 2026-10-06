import { cn } from "@/lib/utils";

/**
 * Примитивы панели управления. Витринные карточки здесь не используются
 * намеренно: у панели другая задача — плотность и читаемость таблиц, а не
 * впечатление. Отсюда мелкий радиус, строки вместо карточек, нейтральные
 * цвета и фирменный акцент только там, где он несёт смысл.
 */

export function Panel({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Table({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          {head}
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("whitespace-nowrap px-4 py-2 font-medium", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-2.5 align-middle", className)}>{children}</td>;
}

/** Пустая таблица — не повод для иллюстрации: одна строка текста. */
export function Empty({ text }: { text: string }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

/** Превью 32×32 квадратом: в списке важен опознавательный знак, а не картинка. */
export function Thumb({ src }: { src: string }) {
  return <img src={src} alt="" className="h-8 w-8 shrink-0 rounded-sm object-cover" />;
}

const BTN: Record<string, string> = {
  primary: "bg-foreground text-background hover:opacity-90",
  default: "border border-border text-foreground hover:bg-muted",
  quiet: "text-muted-foreground hover:bg-muted hover:text-foreground",
  success: "border border-mint/40 text-mint hover:bg-mint/10",
  danger: "border border-coral/40 text-coral hover:bg-coral/10",
};

export function Btn({
  variant = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BTN }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
        BTN[variant],
        className,
      )}
    />
  );
}

const BADGE: Record<string, string> = {
  neutral: "border-border text-muted-foreground",
  ok: "border-mint/40 text-mint",
  warn: "border-gold/40 text-gold",
  bad: "border-coral/40 text-coral",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE; children: React.ReactNode }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", BADGE[tone])}>
      {children}
    </span>
  );
}

/** Поля форм панели: тот же мелкий радиус и нейтральная рамка. */
export const inputClass =
  "rounded border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-foreground/40";
