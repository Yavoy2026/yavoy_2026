# Веб-клиент: vite build → статика внутри образа Caddy.
# Caddy же терминирует TLS и проксирует API (см. deploy/Caddyfile).
# Контекст сборки — корень репо (как у backend).
FROM node:22-alpine AS build
WORKDIR /web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY apps/web .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /web/dist /srv
