FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile
COPY packages/contracts packages/contracts
COPY apps/backend apps/backend
RUN pnpm --filter @yavoy/backend build && pnpm --filter @yavoy/backend deploy --prod /app

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
COPY --from=build /repo/apps/backend/dist /app/dist
COPY --from=build /repo/apps/backend/src/db/migrations /app/dist/migrations
EXPOSE 3000
CMD ["sh", "-c", "node dist/migrate.js && node dist/server.js"]
