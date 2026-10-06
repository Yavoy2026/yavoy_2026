import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    server: "src/server.ts",
    migrate: "src/db/migrate.ts",
    seed: "scripts/seed.ts",
    // наполнение каталога инсталляции: запускается руками на сервере
    "import-catalog": "scripts/import-catalog.ts",
  },
  format: "esm",
  platform: "node",
  target: "node22",
  // контракты — workspace-пакет из TS-исходников, вбандливаем; node_modules остаются external
  noExternal: ["@yavoy/contracts", "@yavoy/i18n", "@yavoy/legal"],
  sourcemap: true,
  clean: true,
})
