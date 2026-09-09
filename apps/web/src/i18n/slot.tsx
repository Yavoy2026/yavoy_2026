import { Fragment, type ReactNode } from "react";

/**
 * Плейсхолдер под кусок разметки внутри переведённой строки.
 * Нужен там, где часть фразы выделена (жирным, цветом), а порядок слов
 * в разных языках разный — просто отрезать «хвост» строки нельзя.
 */
export const SLOT = "\u0000";

/** Разбивает переведённую строку по SLOT и вставляет туда узел. */
export function withSlot(template: string, node: ReactNode): ReactNode[] {
  return template
    .split(SLOT)
    .flatMap((part, i) => (i === 0 ? [part] : [<Fragment key={`slot-${i}`}>{node}</Fragment>, part]));
}
