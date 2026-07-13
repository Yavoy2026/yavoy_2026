# Разработка YaVoy

Практическое руководство: как поднять стек, где что лежит, как тестировать.
Архитектурные решения — в `BACKEND_SPEC.md`, план — в `ROADMAP.md`.

## Структура репозитория

```
apps/backend/        Бэкенд: Fastify 5 + Zod + Drizzle + PostgreSQL (основная разработка)
packages/contracts/  Общие zod-схемы API (бэкенд + клиенты)
expo/                Мобильное приложение (Expo, iOS/Android; основной фронт)
web/                 Vite-витрина — ЗАМОРОЖЕНА на моках (демо https://tur-ekskursiya.rork.app)
ios/ android/        Нативные версии — АРХИВ, не развиваются
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
cd expo
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
- Проверка типов: `npx tsc --noEmit` в `expo/`.

## CORS, заголовки и прочие уроки локального теста

- `@fastify/cors` по умолчанию разрешает только GET/HEAD/POST — методы заданы явно в `app.ts`.
- Не слать `Content-Type: application/json` без тела — fastify отвечает 400 (учтено в `authFetch`).

## Прод (когда появится VPS)

```bash
cd deploy && cp .env.example .env   # POSTGRES_PASSWORD, JWT-ключи, API_DOMAIN
docker compose -f docker-compose.prod.yml up -d --build
```

Образ бэкенда сам прогоняет миграции при старте; TLS — Caddy по `API_DOMAIN`.
