const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const workspaceRoot = path.resolve(__dirname, "../..");
const config = getDefaultConfig(__dirname);

// packages/i18n — общий с вебом пакет переводов (исходники на TS, без зависимостей).
// Подключаем алиасом, а не npm-зависимостью: expo и web живут на npm, бэкенд на pnpm.
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(workspaceRoot, "packages/i18n")];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  "@yavoy/i18n": path.resolve(workspaceRoot, "packages/i18n/src"),
};
// зависимости пакета (их нет) и react резолвим из node_modules приложения
config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths ?? []),
  path.resolve(__dirname, "node_modules"),
];

module.exports = withRorkMetro(config);
