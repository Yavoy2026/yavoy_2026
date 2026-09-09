import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: { allow: [path.resolve(__dirname, ".."), path.resolve(__dirname, "../../packages")] },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // общий с Expo пакет переводов; подключаем алиасом, а не npm-зависимостью —
      // пакет без зависимостей, а симлинки в двух разных менеджерах пакетов хрупки
      "@yavoy/i18n": path.resolve(__dirname, "../../packages/i18n/src"),
      "@yavoy/legal": path.resolve(__dirname, "../../packages/legal/src"),
    },
  },
  // Expose both VITE_* (Vite default) and EXPO_PUBLIC_* (Rork's cross-platform
  // public-env convention, written by tools like getOrCreateAuthConfig).
  envPrefix: ["VITE_", "EXPO_PUBLIC_"],
}));
