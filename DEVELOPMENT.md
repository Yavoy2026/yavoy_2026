# Разработка YaVoy

Практическое руководство: как поднять стек, где что лежит, как тестировать.
Архитектурные решения — в `BACKEND_SPEC.md`, план — в `ROADMAP.md`.

## Структура репозитория

```
apps/backend/        Бэкенд: Fastify 5 + Zod + Drizzle + PostgreSQL (основная разработка)
packages/contracts/  Общие zod-схемы API (бэкенд + клиенты)
apps/expo/           Мобильное приложение (Expo, iOS/Android; основной фронт)
apps/web/            Веб-клиент (Vite + shadcn) — на том же API, паритет с приложением + админка
                     (нативные ios/ и android/ — в ветке archive/native-apps)
deploy/              Прод: docker-compose.prod.yml + Caddyfile
```

## Требования

- Node 22+, pnpm 10+ (бэкенд), npm с `--legacy-peer-deps` (expo)
- Docker (Postgres)

## Быстрый старт

```bash
pnpm install                       # workspace: backend + contracts
docker compose up -d               # Postgres 16 на порту 5434 (5432/5433 могут быть заняты)

cd apps/backend
cp .env.example .env               # DATABASE_URL уже указывает на 5434
DATABASE_URL=postgres://yavoy:yavoy@localhost:5434/yavoy pnpm db:migrate
DATABASE_URL=postgres://yavoy:yavoy@localhost:5434/yavoy pnpm db:seed    # каталог: 64 тура, 8 городов
pnpm dev                           # бэкенд на :3000 (или PORT=3002, если 3000 занят)
```

Swagger со всеми эндпоинтами: `http://localhost:<PORT>/docs`.

Expo web против локального API:

```bash
cd apps/expo
npm install --legacy-peer-deps
EXPO_PUBLIC_API_URL=http://localhost:3002/v1 npx expo start --web --port 8081
```

Для устройства/симулятора: `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3002/v1 npx expo start`.
Без переменной клиент ходит на `localhost:3000` (Android-эмулятор — `10.0.2.2:3000`).

> Claude Code: процедура запуска зафиксирована как проектный скилл `.claude/skills/run-local/SKILL.md`.

## Бэкенд

- **Слои** (`apps/backend/src/modules/<домен>/`): `routes.ts` — тонкий HTTP,
  `service.ts` — доменная логика (не импортирует fastify/drizzle),
  `repo.ts` — SQL. Правила — `BACKEND_SPEC.md` §1.3.
- **Деньги** — integer-копейки. **Статусы** — только через таблицы переходов
  (`modules/bookings/transitions.ts`).
- **Миграции**: правка `src/db/schema.ts` → `pnpm db:generate` → `pnpm db:migrate`.
  Сид-данные: `src/db/seed-data.json` (снапшот бывших моков), заливка `pnpm db:seed`.
- **Почта**: без `SMTP_URL` письма идут в лог. Прод-переменные: `SMTP_URL`, `MAIL_FROM`, `ADMIN_EMAIL`.
- **JWT**: dev — эфемерные ключи; прод требует `JWT_PRIVATE_KEY_PEM`/`JWT_PUBLIC_KEY_PEM`
  (генерация: `npx tsx scripts/gen-keys.ts`).

### Тесты

```bash
pnpm test        # из корня; нужен Postgres на 5434
```

Интеграционные, на живой БД: каждый тест-файл создаёт себе временную базу.
Покрыто: auth-флоу с ротацией refresh, каталог с пагинацией, бронирования
(конкуренция за места, RBAC, машина состояний), избранное, отзывы с модерацией.

### Роли и админ-операции

Роли: `user` | `manager` | `admin` (роль в JWT — после смены перелогин).
Админ-UI пока нет — операции через Swagger:
`POST /v1/bookings/{id}/confirm|complete`, `GET /v1/admin/bookings`,
`POST /v1/admin/reviews/{id}/approve|reject`. Назначить админа:

```bash
docker exec yavoy_2026-postgres-1 psql -U yavoy -c "UPDATE users SET role='admin' WHERE email='<email>'"
```

## Expo-клиент

- API-слой: `services/api.ts` (auth, авторефреш токенов), `services/catalog.ts`
  (bootstrap `GET /v1/catalog` + адаптер к легаси-типу `Tour`), `services/bookings.ts`, `services/social.ts`.
- Каталог грузится целиком и фильтруется на клиенте — осознанно, пока туров десятки
  (при росте перейти на серверные фильтры `GET /v1/tours`, они уже реализованы).
- Оставшиеся моки: `mocks/bookings.ts` (транзакции — до M4), `mocks/reels.ts` (Reels — backlog).
- **RN-web грабли**: вложенный Touchable/Pressable внутри другого Touchable не получает клики
  в браузере — кнопки поверх карточек размещать сиблингами тач-области (см. `CitySelector.tsx`).
- Проверка типов: `npx tsc --noEmit` в `apps/expo/`.

## Web-клиент

- Запуск: `cd apps/web && npm install --legacy-peer-deps && VITE_API_URL=http://localhost:3002/v1 npx vite`
- Сервисный слой зеркалит мобильный: `services/api.ts`, `catalog.ts`, `bookings.ts`, `social.ts`,
  `admin.ts`; избранное — общий серверный кэш с миграцией гостевого (AppContext).
- **Админка** (`/admin`, роль manager/admin): подтверждение/завершение/отмена броней,
  модерация отзывов, управление пользователями — всё реальное. Вкладки с пометкой «демо»
  ждут своих бэкенд-доменов (партнёрка — M6+).
- Оставшиеся моки web: только Reels (backlog).

## CORS, заголовки и прочие уроки локального теста

- `@fastify/cors` по умолчанию разрешает только GET/HEAD/POST — методы заданы явно в `app.ts`.
- Не слать `Content-Type: application/json` без тела — fastify отвечает 400 (учтено в `authFetch`).

## Stage-стенд

Stage (не прод!) развёрнут на VPS `89.169.21.102` (Ubuntu 24.04), домены через sslip.io:
- веб: https://89.169.21.102.sslip.io
- API: https://api.89.169.21.102.sslip.io (Swagger: `/docs`)

Файлы на сервере: `/opt/yavoy` (compose, Caddyfile, .env с секретами).
Сервисы: postgres + backend + caddy (веб-статика запечена в образ caddy, TLS автоматически).
Compose один и тот же для stage и будущего прода (`deploy/docker-compose.prod.yml`) —
окружения различаются только `.env` (домены, секреты) и сервером. Прод появится позже:
свой домен, отдельный VPS, свежие секреты.

Образы собираются **локально** (VPS 2 ГБ — на нём не собираем) и переливаются по ssh:

```bash
docker buildx build --platform linux/amd64 -f apps/backend/Dockerfile -t yavoy-backend:latest --load .
docker buildx build --platform linux/amd64 -f apps/web/Dockerfile \
  --build-arg VITE_API_URL=https://api.89.169.21.102.sslip.io/v1 -t yavoy-web:latest --load .
docker save yavoy-backend:latest yavoy-web:latest | gzip | ssh root@89.169.21.102 'gunzip | docker load'
ssh root@89.169.21.102 'cd /opt/yavoy && docker compose -f docker-compose.prod.yml up -d --no-build'
```

Образ бэкенда сам прогоняет миграции при старте. Сид каталога (одноразово, стирает
каталог и брони!): `docker compose -f docker-compose.prod.yml exec backend node dist/seed.js`.
Для прода (свой домен): поменять `API_DOMAIN`/`WEB_DOMAIN`/`VITE_API_URL` в
`.env` на сервере, пересобрать веб-образ (URL API зашивается при сборке).
