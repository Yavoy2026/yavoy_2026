import { FALLBACK_LOCALE, type Locale } from "./locales";
import { isPlural, type Plural, selectPlural } from "./plural";

export type CatalogNode = string | Plural | { [key: string]: CatalogNode };

type Join<K extends string, Rest extends string> = Rest extends "" ? K : `${K}.${Rest}`;

/**
 * Точечные пути до всех листьев каталога. Даёт автодополнение ключей и ошибку
 * компиляции на опечатке — это и есть замена рантайм-проверкам i18next.
 */
export type CatalogPath<T> = T extends string
  ? ""
  : T extends Plural
    ? ""
    : { [K in keyof T & string]: Join<K, CatalogPath<T[K]>> }[keyof T & string];

export type Params = Record<string, string | number>;

const INTERPOLATION = /\{\{(\w+)\}\}/g;

const interpolate = (template: string, params?: Params): string =>
  params ? template.replace(INTERPOLATION, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  }) : template;

const lookup = (catalog: unknown, path: string): CatalogNode | undefined => {
  let node: unknown = catalog;
  for (const segment of path.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return node === undefined ? undefined : (node as CatalogNode);
};

/**
 * Собирает t() для конкретного языка. Ключ, которого нет в текущем каталоге,
 * берётся из фолбэка; если нет и там — возвращается сам ключ, чтобы дырка была
 * видна в UI, а не превращалась в пустоту.
 */
export const createTranslator =
  <C extends object>(catalogs: Record<Locale, C>, locale: Locale) =>
  (path: CatalogPath<C>, params?: Params & { count?: number }): string => {
    const key = path as string;
    const node = lookup(catalogs[locale], key) ?? lookup(catalogs[FALLBACK_LOCALE], key);

    if (typeof node === "string") return interpolate(node, params);
    if (isPlural(node)) {
      const count = params?.count ?? 0;
      return interpolate(selectPlural(locale, node, count), { count, ...params });
    }
    return key;
  };

export type Translator<C extends object> = ReturnType<typeof createTranslator<C>>;
