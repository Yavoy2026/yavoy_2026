/**
 * Страж переводов (YAV-25). Проверяет три вещи:
 *  1) ключи, использованные в коде, существуют в каталоге;
 *  2) в каталоге нет осиротевших ключей;
 *  3) в UI-коде не осталось русских строк вне каталога.
 *
 * Полнота en/uz гарантируется типом Catalog — здесь не дублируется.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { CATALOGS } from "../src/index";
import { isPlural } from "../src/plural";

const ROOT = resolve(import.meta.dirname, "../../..");

/** Где ищем использование ключей (включая сам пакет — там шаблонные ключи языков) */
const KEY_DIRS = [
  "apps/web/src",
  "apps/expo/app",
  "apps/expo/components",
  "apps/expo/providers",
  "apps/expo/services",
  "apps/backend/src",
  "packages/i18n/src",
];

/**
 * Где ищем русские строки. Бэкенд исключён намеренно: его message —
 * дев-фолбэк, клиент переводит ошибку по стабильному code (BACKEND_SPEC §2).
 */
const UI_DIRS = ["apps/web/src", "apps/expo/app", "apps/expo/components", "apps/expo/providers", "apps/expo/services"];

const SKIP_DIRS = new Set(["node_modules", "dist", ".expo", "migrations", "components/ui"]);

/**
 * Файлы, где русский текст — это контент или данные, а не интерфейс.
 * Каждая строка требует причины: список не должен расти молча.
 */
const CYRILLIC_ALLOWLIST: Record<string, string> = {
  "apps/web/src/data/reels.ts": "демо-контент ленты reels",
  "apps/web/src/pages/Partner.tsx": "черновик текста заявки на партнёрство",
  "apps/expo/mocks/reels.ts": "демо-контент ленты reels",
  "apps/expo/providers/SupportProvider.ts": "системный промпт AI-консультанта (не UI)",
  "apps/expo/app/(tabs)/profile/index.tsx": "юридические тексты (условия использования, о компании)",
  "apps/backend/src/db/seed-data.json": "демо-каталог туров",
};

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (SKIP_DIRS.has(entry) || [...SKIP_DIRS].some((d) => rel.endsWith(d))) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
};

/** Плоский список путей до листьев каталога */
const leafKeys = (node: unknown, prefix = ""): string[] => {
  if (typeof node === "string" || isPlural(node)) return [prefix];
  if (typeof node !== "object" || node === null) return [];
  return Object.entries(node).flatMap(([k, v]) => leafKeys(v, prefix ? `${prefix}.${k}` : k));
};

const defined = new Set(leafKeys(CATALOGS.ru));

const filesIn = (dirs: string[]): string[] =>
  dirs.flatMap((d) => {
    try {
      return walk(join(ROOT, d));
    } catch {
      return [];
    }
  });

const files = filesIn(KEY_DIRS);
const uiFiles = filesIn(UI_DIRS);

const used = new Set<string>();
/** Префиксы из шаблонных ключей: `enums.category.${c}` покрывает всю группу */
const usedPrefixes = new Set<string>();
const missing: { file: string; key: string }[] = [];

const KEY_LITERAL = /["'`]([a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+)["'`]/g;
const KEY_TEMPLATE = /`([a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)*)\.\$\{/g;
const T_CALL = /\bt\(\s*["'`]([^"'`]+)["'`]/g;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);

  for (const m of src.matchAll(KEY_TEMPLATE)) usedPrefixes.add(m[1]!);

  for (const m of src.matchAll(KEY_LITERAL)) {
    const key = m[1]!;
    if (defined.has(key)) used.add(key);
  }
  // ключи в t(...) обязаны существовать — опечатку ловим здесь, а не в рантайме
  for (const m of src.matchAll(T_CALL)) {
    const key = m[1]!;
    if (!key.includes(".") || key.includes("${")) continue;
    if (!defined.has(key)) missing.push({ file: rel, key });
    else used.add(key);
  }
}

for (const key of defined) {
  if (used.has(key)) continue;
  for (const p of usedPrefixes) {
    if (key.startsWith(`${p}.`)) {
      used.add(key);
      break;
    }
  }
}

const orphans = [...defined].filter((k) => !used.has(k)).sort();

const CYRILLIC = /[А-Яа-яЁё]/;
const COMMENT = /^\s*(\/\/|\*|\/\*|\{\/\*)/;
const stray: { file: string; line: number; text: string }[] = [];

for (const file of uiFiles) {
  const rel = relative(ROOT, file);
  if (CYRILLIC_ALLOWLIST[rel]) continue;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (!CYRILLIC.test(line) || COMMENT.test(line)) return;
      // хвостовой комментарий в конце строки кода тоже допустим
      const code = line.split("//")[0] ?? "";
      if (!CYRILLIC.test(code)) return;
      stray.push({ file: rel, line: i + 1, text: line.trim() });
    });
}

let failed = false;

if (missing.length) {
  failed = true;
  console.error(`\n✗ Ключей нет в каталоге (${missing.length}):`);
  for (const m of missing) console.error(`  ${m.file}: ${m.key}`);
}

if (orphans.length) {
  failed = true;
  console.error(`\n✗ Осиротевшие ключи каталога (${orphans.length}):`);
  for (const k of orphans) console.error(`  ${k}`);
}

if (stray.length) {
  failed = true;
  console.error(`\n✗ Русские строки вне каталога (${stray.length}):`);
  for (const s of stray) console.error(`  ${s.file}:${s.line}  ${s.text.slice(0, 120)}`);
}

if (failed) {
  console.error("\ni18n:check не прошёл. Строки переводим через каталог packages/i18n.\n");
  process.exit(1);
}

console.log(
  `✓ i18n:check пройден: ${defined.size} ключей, ${files.length} файлов просканировано, ` +
    `${uiFiles.length} из них на русские строки`,
);
