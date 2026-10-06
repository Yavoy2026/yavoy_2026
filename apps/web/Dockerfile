# Веб-клиент: vite build → статика внутри образа Caddy.
# Caddy же терминирует TLS и проксирует API (см. deploy/Caddyfile).
# Контекст сборки — корень репо (как у backend).
FROM node:22-alpine AS build
# структуру репозитория повторяем: vite резолвит общие пакеты алиасами
# на ../../packages/*, а не через node_modules (web живёт на npm, бэкенд на pnpm)
WORKDIR /repo
COPY apps/web/package.json apps/web/package-lock.json apps/web/
RUN cd apps/web && npm ci --legacy-peer-deps
COPY packages/i18n packages/i18n
COPY packages/legal packages/legal
COPY apps/web apps/web
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN cd apps/web && npm run build

FROM caddy:2-alpine
COPY --from=build /repo/apps/web/dist /srv
