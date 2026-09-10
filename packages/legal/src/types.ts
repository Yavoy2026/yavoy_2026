/**
 * Юридические документы витрины (YAV-21). Лежат общим пакетом, а не в каждом
 * клиенте, чтобы текст оферты не разъезжался между вебом и приложением.
 *
 * Это НЕ переводы: документ ведётся на одном языке и переводу через
 * packages/i18n не подлежит — перевод юридического текста требует юриста.
 */
export interface LegalSection {
  /** Номер раздела, как в документе: "1", "4.2" */
  no: string;
  title: string;
  /** Абзацы; пункты списка начинаются с "— " */
  body: string[];
}

export interface LegalDocument {
  id: "offer" | "partner_offer" | "privacy";
  title: string;
  /**
   * Номер редакции. Растёт при каждом изменении текста и записывается в момент
   * акцепта: «принял версию 3» доказуемо, а «принял то, что тогда лежало по
   * этому адресу» — нет (YAV-29).
   */
  version: number;
  /** Дата последней редакции, ISO */
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
}

/**
 * Незаполненные реквизиты. Помечены так, чтобы их было видно и в тексте,
 * и грепом: перед подачей в банк ни одного PLACEHOLDER остаться не должно.
 */
export const PLACEHOLDER = (what: string): string => `‹${what}›`;

/** Все плейсхолдеры документа — для проверки готовности перед подачей в банк */
export const findPlaceholders = (doc: LegalDocument): string[] => {
  const text = [doc.title, ...doc.intro, ...doc.sections.flatMap((s) => [s.title, ...s.body])].join("\n");
  return [...new Set(text.match(/‹[^›]+›/g) ?? [])];
};
