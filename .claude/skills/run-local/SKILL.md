---
name: run-local
description: Запустить локальный стек YaVoy (Postgres + бэкенд Fastify + Expo web) и проверить его смоуком. Использовать, когда нужно запустить/потестировать приложение локально, увидеть изменение в работающем приложении или отладить связку Expo ↔ API.
---

# Локальный стек YaVoy

Проверенная процедура (июль 2026, macOS). Стек: Postgres 16 (docker, порт **5434**),
бэкенд `apps/backend` (Fastify, tsx), Expo web (`apps/expo/`, Metro на 8081).

## Порты — главная ловушка

На этой машине заняты чужими проектами: **3000** (node server.js), **3001** (Next.js, проект sova),
**5432/5433** (sova-postgres). Поэтому:

- Postgres YaVoy — **5434** (уже прописан в docker-compose.yml и всех конфигах)
- Бэкенд запускать на **3002** (или проверить `lsof -nP -iTCP:3002 -sTCP:LISTEN`)
- Expo web — 8081

## Запуск

```bash
# 1. Postgres (из корня репо)
docker compose up -d
docker compose ps   # ждать (healthy)

# 2. Миграции + сид (64 тура, 8 городов, 256 дат) — идемпотентно, стирает каталог и брони!
cd apps/backend
DATABASE_URL=postgres://yavoy:yavoy@localhost:5434/yavoy pnpm db:migrate
DATABASE_URL=postgres://yavoy:yavoy@localhost:5434/yavoy pnpm db:seed   # только при первом запуске/сбросе

# 3. Бэкенд (фон)
DATABASE_URL=postgres://yavoy:yavoy@localhost:5434/yavoy PORT=3002 NODE_ENV=development npx tsx src/server.ts
# проверка: curl -s localhost:3002/v1/health  → {"status":"ok","db":true}
# Swagger: http://localhost:3002/docs

# 4. Expo web (фон, из apps/expo/)
cd ../expo
EXPO_PUBLIC_API_URL=http://localhost:3002/v1 npx expo start --web --port 8081
# готовность: в логе "Web Bundled", curl -s -o /dev/null -w "%{http_code}" localhost:8081 → 200

# 5. Веб-клиент (опционально, из apps/web/)
cd ../web
VITE_API_URL=http://localhost:3002/v1 npx vite --port 5175
# админка: http://localhost:5175/admin (нужна роль admin/manager)
```

## Смоук после запуска

Открыть http://localhost:8081 и убедиться:
- главная показывает «Все направления · 64 экскурсии» (данные из БД, не мок);
- карточка тура открывается (не «Something went wrong»);
- бронирование: тур → «Забронировать» → чипы дат с остатком мест → заявка возвращает код `YV-…`.

Тестовый аккаунт: `eugene.local@test.ru` / `Password123` (если БД пересеяна — зарегистрировать заново).
Для admin-операций (подтверждение брони, модерация): создать пользователя и
`docker exec yavoy_2026-postgres-1 psql -U yavoy -c "UPDATE users SET role='admin' WHERE email='...'"`,
затем перелогиниться (роль зашита в JWT).

## Известные грабли

- **Зависимости expo ставить `npm install --legacy-peer-deps`** (bun на машине нет). После этого
  проверить, что `zod` установлен (peer от @rork-ai/toolkit-sdk; без него web-бандл падает на `zod/v4`).
- Бэкенд-зависимости — `pnpm install` из корня (workspace).
- Убить бэкенд на порту: `kill $(lsof -tnP -iTCP:3002 -sTCP:LISTEN)` (pkill по имени не находит tsx-процесс).
- Тесты бэкенда требуют живой Postgres на 5434: `pnpm test` из корня (создают себе временные БД).
- RN-web специфика: вложенные тач-элементы не получают клики — интерактивные кнопки поверх карточек
  делать сиблингами тач-области (см. CitySelector/TourCard).
