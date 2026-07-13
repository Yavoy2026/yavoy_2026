import { defineConfig } from "tsup";

export default defineConfig({
  entry: { server: "src/server.ts", migrate: "src/db/migrate.ts" },
  format: "esm",
  platform: "node",
  target: "node22",
  // контракты — workspace-пакет из TS-исходников, вбандливаем; node_modules остаются external
  noExternal: ["@yavoy/contracts"],
  sourcemap: true,
  clean: true,
})
