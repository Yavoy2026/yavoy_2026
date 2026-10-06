import type { Catalog, CatalogPath } from "@yavoy/i18n";

/** Все допустимые ключи перевода; опечатка ловится компилятором */
export type TKey = CatalogPath<Catalog>;
