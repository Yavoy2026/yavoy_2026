# Разработка YaVoy

Практическое руководство: как поднять стек, где что лежит, как тестировать.
Архитектурные решения — в `BACKEND_SPEC.md`, план — в `ROADMAP.md`.

## Структура репозитория

```
apps/backend/        Бэкенд: Fastify 5 + Zod + Drizzle + PostgreSQL (основная разработка)
packages/contracts/  Общие zod-схемы API (бэкенд + клиенты)
packages/i18n/       Переводы ru/en/uz, плюрализация, форматы денег и дат (бэкенд + клиенты)
packages/legal/      Публичная оферта и политика конфиденциальности (веб + Expo)
apps/expo/           Мобильное приложение (Expo, iOS/Android; основной фронт)
apps/web/            Веб-клиент (Vite + shadcn) — на том же API, паритет с приложением + бэкофис
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
  Язык писем — `MAIL_LOCALE` (ru/en/uz), один на установку.
- **Языки клиентов**: `GET /v1/config` отдаёт `default_locale` и `supported_locales`
  из `DEFAULT_LOCALE` / `SUPPORTED_LOCALES`. Меняются на стенде без пересборки приложений.
- **JWT**: dev — эфемерные ключи; прод требует `JWT_PRIVATE_KEY_PEM`/`JWT_PUBLIC_KEY_PEM`
  (генерация: `npx tsx scripts/gen-keys.ts`).

### Тесты

```bash
pnpm test        # из корня; нужен Postgres на 5434
```

Интеграционные, на живой БД: каждый тест-файл создаёт себе временную базу.
Покрыто: auth-флоу с ротацией refresh, каталог с пагинацией, бронирования
(конкуренция за места, RBAC, машина состояний), избранное, отзывы с модерацией,
публичный конфиг и язык писем.

### Эквайринг

Локально оплата выключена: `PAYMENT_PROVIDER=none` — бронь создаётся в `requested`,
как раньше. Чтобы погонять платёжный флоу, не подключаясь к банку, подставьте
свой `PaymentProvider` в `createTestApp({ payments })` — так сделано в
`test/payments.test.ts`.

Для узбекской инсталляции:

```bash
PAYMENT_PROVIDER=octo CURRENCY=UZS \
PUBLIC_API_URL=https://api.example.uz OCTO_SHOP_ID=... OCTO_SECRET=... \
OCTO_NOTIFY_SECRET=... OCTO_TEST=true pnpm dev
```

`OCTO_NOTIFY_SECRET` — отдельный ключ подписи коллбэков, выдаётся техподдержкой
OCTO, это **не** `OCTO_SECRET` из кабинета. Без любой из обязательных переменных
бэкенд не стартует: полконфига хуже, чем её отсутствие — бронь ушла бы в
`pending_payment`, а платёж создать было бы нечем.

Коллбэк приходит на `PUBLIC_API_URL/v1/webhooks/octo`; этот же адрес надо
прописать в личном кабинете магазина. Локально пробрасывается туннелем.

### Переводы

```bash
pnpm i18n:check   # из корня
```

Проверяет три вещи: ключи из кода есть в каталоге, в каталоге нет осиротевших ключей,
в UI-коде клиентов не осталось русских строк вне `packages/i18n`. Файлы, где русский —
это контент (демо-данные, юридические тексты, промпт AI), перечислены в allowlist'е
`packages/i18n/scripts/check.ts` с указанием причины.

Добавление строки: ключ в `catalog/ru.ts` (задаёт структуру), затем `en.ts` и `uz.ts` —
без них не пройдёт `tsc`, потому что оба каталога типизированы как `Catalog = typeof ru`.
Клиенты подключают пакет алиасом на исходники: `apps/web/vite.config.ts` и
`apps/expo/metro.config.js` — npm-зависимости между менеджерами пакетов нет.

### Роли и операции бэкофиса

Роли: `user` | `partner` | `manager` | `admin` (роль в JWT — после смены перелогин;
refresh обновит её сам в пределах 15 минут). Рабочий UI — веб-бэкофис `/backoffice`;
те же операции доступны через Swagger (`/v1/admin/*`, `/v1/bookings/{id}/confirm` и т.д.).
Партнёра назначает админ на вкладке «Партнёры» (роль + профиль организации разом).
Самого первого админа на пустой базе — руками:

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
- **Бэкофис** (`/backoffice`; старый `/admin` редиректит): один кабинет, вкладки по ролям.
  Manager/admin: брони, модерация отзывов, пользователи, CRUD туров (создание/правка/
  публикация, даты с местами), партнёры (назначение — admin-only, verified-галочка).
  Partner: «Мои туры» (создаёт и правит только свои; всё сохраняется черновиком,
  публикует менеджер) + «Профиль организации».
- Оставшиеся моки web: только Reels и демо-кабинет партнёра `/partner` (backlog).
- Переключатель языка — в профиле (`components/LanguageSwitcher.tsx`); в Expo — там же
  (`components/LanguageSelector.tsx`).

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

Язык стенда меняется без пересборки: `DEFAULT_LOCALE` / `SUPPORTED_LOCALES` /
`MAIL_LOCALE` в `.env` на сервере + `docker compose … up -d backend`. Клиенты берут
дефолт из `GET /v1/config`, поэтому ни веб-образ, ни APK трогать не нужно.
`SUPPORTED_LOCALES` позволяет временно убрать язык из переключателя — например,
пока узбекский не вычитан носителем.
