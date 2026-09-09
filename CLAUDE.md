# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

YaVoy — агрегатор туристических экскурсий по России. Монорепо: свой бэкенд + два
клиента (мобильный Expo и веб) на одном API. Язык проекта, коммитов и UI — русский.

## Структура

```
apps/backend/        Fastify 5 + Zod + Drizzle + PostgreSQL 16 (pnpm workspace)
packages/contracts/  Общие zod-схемы API — единственный источник типов запросов/ответов
packages/i18n/       Переводы ru/en/uz + плюрализация и форматтеры; общий для всех трёх приложений
apps/expo/           Мобильное приложение (Expo SDK 54, React Query) — npm, НЕ pnpm
apps/web/            Веб-клиент (Vite + React + shadcn) + бэкофис /backoffice — npm, НЕ pnpm
deploy/              Stage/prod: docker-compose.prod.yml, Caddyfile, .env.example
```

Подробные доки: `DEVELOPMENT.md` (как запускать/тестировать), `BACKEND_SPEC.md`
(модель данных, API, целевые фазы), `ROADMAP.md` (что сделано, backlog по триггерам).
При изменении поведения обновлять их в том же коммите.

## Команды

```bash
# Бэкенд + контракты (pnpm workspace, из корня)
pnpm install
docker compose up -d                 # Postgres 16 на порту 5434 (5432/5433 заняты чужим проектом!)
pnpm dev                             # tsx watch; локально использовать PORT=3002 (3000/3001 заняты)
pnpm test                            # vitest, нужен Postgres на 5434; каждый файл создаёт себе БД
pnpm --filter @yavoy/backend exec vitest run test/auth.test.ts   # один тест-файл
pnpm typecheck                       # tsc по всем workspace-пакетам
pnpm i18n:check                      # переводы: нет дырок, нет осиротевших ключей, нет русского в UI
pnpm db:generate                     # drizzle-kit: миграция из изменений src/db/schema.ts
DATABASE_URL=postgres://yavoy:yavoy@localhost:5434/yavoy pnpm db:migrate
DATABASE_URL=postgres://yavoy:yavoy@localhost:5434/yavoy pnpm db:seed   # демо-каталог; СТИРАЕТ каталог и брони

# Expo (из apps/expo; зависимости только так)
npm install --legacy-peer-deps
EXPO_PUBLIC_API_URL=http://localhost:3002/v1 npx expo start --web --port 8081
npx tsc --noEmit                     # typecheck

# Web (из apps/web)
npm install --legacy-peer-deps
VITE_API_URL=http://localhost:3002/v1 npx vite --port 5175
npx tsc --noEmit -p tsconfig.app.json && npx vite build
```

Запуск полного локального стека со смоуком — проектный скилл `.claude/skills/run-local`.
Деплой на stage (VPS, sslip.io-домены): образы собираются локально
`docker buildx --platform linux/amd64` и переливаются по ssh — процедура в DEVELOPMENT.md.

## Архитектура — главное

**Контракты как ось.** `packages/contracts` — zod-схемы, из которых бэкенд получает
валидацию + сериализацию + OpenAPI (fastify-type-provider-zod), а типы выводятся
инференсом. В прод-сборку бэкенда контракты вбандливаются tsup'ом (`noExternal`).
Клиенты contracts не импортируют — у каждого свой `services/api.ts` с зеркальными
типами и адаптерами к легаси-типам UI (snake_case API → camelCase, копейки → рубли).
Меняешь API — меняй контракт, оба сервисных слоя и адаптеры.

**Слои бэкенда** (`apps/backend/src/modules/<домен>/`): `routes.ts` — тонкий HTTP
(схемы из контрактов, `preHandler: [app.requireRole(...)]`), `service.ts` — доменная
логика (не импортирует fastify), `repo.ts` — SQL. Ошибки — `AppError` из `errors.ts`
со стабильными кодами (`{error: {code, message, details}}`), клиенты матчатся по code.

**Жёсткие доменные правила** (BACKEND_SPEC §1.3):
- Деньги — только integer-копейки; конвертация в рубли — на границе UI.
- Статусы броней меняются только через таблицу переходов `modules/bookings/transitions.ts`.
- Инварианты держит БД + одиночные условные UPDATE (паттерн `reserveSeats`:
  `SET seats_left = seats_left - N WHERE ... seats_left >= N` + CHECK) — так же
  сделаны списание OTP-попыток и смена вместимости дат. Новую конкурентную логику
  делать этим же приёмом, не check-then-act.

**Auth — passwordless OTP.** Паролей нет: `/auth/otp/request` (код письмом, кулдаун
60 c) → `/auth/otp/verify` (одноразовость через DELETE в транзакции; новый юзер
создаётся здесь с пустым именем, `is_new_user` велит клиенту спросить имя).
Access JWT RS256 15 мин (роль зашита — после смены роли нужен перелогин/refresh),
refresh 30 дней с ротацией и reuse-detection (повтор → отзыв всех сессий).
Без `SMTP_URL` письма пишутся в лог целиком — так на стенде читают коды.

**Роли и бэкофис.** `user | partner | manager | admin`. Веб-бэкофис — `/backoffice`
(бывший `/admin` редиректит), один кабинет, вкладки по ролям. Партнёр: профиль в
`partner_profiles` (назначает админ через POST /admin/partners — роль + профиль одной
транзакцией), работает теми же `/admin/tours`-эндпоинтами со скоупингом в service
(чужие туры → 404, не 403; создание/правка — принудительно draft, публикует
manager/admin). Витринный `tours.organizer` (jsonb) для партнёрских туров
синхронизируется из профиля (`organizerFromProfile`) при каждой записи.

**Каталог.** Клиенты грузят его целиком через bootstrap `GET /v1/catalog` и фильтруют
на клиенте — осознанно, пока туров десятки; серверные фильтры `GET /v1/tours` уже
готовы. Гостевые выборки всегда фильтруют `status='published'` — черновики невидимы.
Денормализации на tours (rating, reviews_count, organizer) пересчитываются на
write-путях (модерация отзывов, правка партнёра), не на чтении.

**Тесты** (`apps/backend/test/`) — интеграционные на живой БД: `createTestApp()`
создаёт свежую базу на файл и capture-мейлер (`outbox`), auth в тестах — реальный
OTP-флоу через хелперы `loginViaOtp`/`signupWithRole` из `test/helpers.ts`.
Rate-limit-плагин в NODE_ENV=test не регистрируется; кулдаун OTP сбрасывают UPDATE'ом.

**Переводы (YAV-25).** Интерфейс на трёх языках: ru / en / uz (латиница). Каталог —
`packages/i18n`, один набор ключей на оба клиента; своё крошечное ядро вместо i18next
(плюрализация зашита правилами CLDR, чтобы не зависеть от урезанного Intl в Hermes).
Клиенты подключают пакет **алиасом на исходники** (`vite.config.ts`, `metro.config.js`),
а не npm-зависимостью: expo и web живут на npm, бэкенд на pnpm. Ключ проверяется
компилятором — тип `TKey` не даст опечататься.

- **Язык устройства не читаем.** Дефолт приходит с сервера: `GET /v1/config` →
  `{default_locale, supported_locales}` из `DEFAULT_LOCALE`/`SUPPORTED_LOCALES`.
  Меняется без пересборки клиентов; выбор пользователя в профиле перекрывает его навсегда.
- **Ошибки переводятся по коду**, а не по тексту: `errors.<AppError.code>`, затем
  `api.<код фолбэка сервиса>`. Русский `message` с бэкенда — дев-фолбэк, в UI не попадает.
- **Письма** — один язык на установку (`MAIL_LOCALE`), переводы всех трёх лежат в каталоге.
- **Контент из БД не переводится** (названия туров, города, отзывы) — осознанное решение.
  Демо-данные, юридические тексты и системный промпт AI тоже остаются русскими; они
  перечислены в allowlist'е `packages/i18n/scripts/check.ts` — список не должен расти молча.
- `tours.languages` хранит **коды** (`ru`/`en`/`uz`/`de`/`fr`/`zh`/`tt`), подписи — из каталога.

## Правила паритета платформ (требование владельца)

- **Паритет фич приложение ↔ веб поддерживаем всегда, когда осуществимо**; отход
  от паритета — только осознанное решение владельца.
- **Перед имплементацией каждой фичи уточнять у владельца**, нужна ли она на обеих
  платформах или на одной. Не решать молча.
- **Легаси, моки и мёртвый код вычищать на обеих платформах одновременно** — нельзя
  оставлять фейковый экран на одной платформе, когда на другой работает реальная
  версия (антипример: мок-админка в Expo жила месяц после запуска веб-бэкофиса).

## Грабли, уже собранные

- Порты на этой машине: 3000/3001/5432/5433 заняты другими проектами — YaVoy
  использует Postgres **5434**, бэкенд **3002**, expo 8081, web 5175.
- RN-web: вложенный Touchable внутри Touchable не получает клики в браузере —
  интерактивные элементы поверх карточек делать сиблингами (см. `CitySelector.tsx`).
- `@fastify/cors` по умолчанию режет PUT/PATCH/DELETE — методы заданы явно в `app.ts`.
- Fastify отвечает 400 на `Content-Type: application/json` без тела — клиентские
  `authFetch` ставят заголовок только при наличии body.
- `pnpm deploy` в Dockerfile бэкенда требует `--legacy` (pnpm 10).
- Убить процесс на порту: `kill $(lsof -tnP -iTCP:3002 -sTCP:LISTEN)` (pkill tsx не находит).
- Файл `resume` в корне — личный файл владельца: в коммиты не включать
  (`git reset -q -- resume` перед `git add -A`).
- `apps/expo/android|ios` — сгенерированы `expo prebuild`, в .gitignore; APK собирается
  gradle'ом с `EXPO_PUBLIC_API_URL`, зашиваемым в бандл на этапе сборки.
- Новую строку интерфейса добавлять только через `packages/i18n`: сначала ключ в `ru.ts`
  (структура каталога), затем `en.ts`/`uz.ts` — иначе не соберётся. Узбекский черновой,
  до релиза нужна вычитка носителем.
