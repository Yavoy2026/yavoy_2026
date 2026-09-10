FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/contracts/package.json packages/contracts/
COPY packages/i18n/package.json packages/i18n/
COPY packages/legal/package.json packages/legal/
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile
COPY packages/contracts packages/contracts
# переводы писем и коды языков/валют — бэкенд импортирует их наравне с контрактами
COPY packages/i18n packages/i18n
# оферта для организаторов: бэкенд сверяет её версию при подаче заявки
COPY packages/legal packages/legal
COPY apps/backend apps/backend
# --legacy: контракты и i18n вбандлены tsup'ом, инжектить workspace-пакеты не нужно
RUN pnpm --filter @yavoy/backend build && pnpm --filter @yavoy/backend deploy --prod --legacy /app

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
COPY --from=build /repo/apps/backend/dist /app/dist
COPY --from=build /repo/apps/backend/src/db/migrations /app/dist/migrations
# dist/seed.js читает JSON по пути ../src/db/seed-data.json относительно себя
COPY --from=build /repo/apps/backend/src/db/seed-data.json /app/src/db/seed-data.json
EXPOSE 3000
CMD ["sh", "-c", "node dist/migrate.js && node dist/server.js"]
