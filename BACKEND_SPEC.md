# Спецификация бэкенда YaVoy Travel Group

**Версия:** 1.0 (черновик для утверждения)
**Дата:** 6 июля 2026
**Решения приняты:** фронт — только Expo (нативные iOS/Android замораживаются), бэкенд — новый, с нуля, на TypeScript.

---

## 1. Выбор стека

### 1.1 Рекомендуемый стек

| Слой | Выбор | Обоснование |
|------|-------|-------------|
| Runtime | **Node.js 22 LTS** | Стабильность; Bun можно включить позже без переписывания |
| Фреймворк | **Fastify 5** | Быстрый, зрелая экосистема плагинов (multipart, rate-limit, websocket), первоклассный TypeScript |
| Валидация / контракт | **Zod** + `fastify-type-provider-zod` + `@fastify/swagger` | Одна zod-схема = валидация запроса + тип TS + OpenAPI-спека. Схемы живут в общем пакете и импортируются Expo-приложением — контракт не разъезжается по построению |
| ORM | **Drizzle ORM** + drizzle-kit | TS-native, лёгкий, SQL-прозрачный, миграции из коробки; проще Prisma в эксплуатации на VPS |
| БД | **PostgreSQL 16** | Реляционная модель домена (туры-брони-платежи), full-text search для поиска туров, JSONB для гибких полей |
| Кэш / очереди | **Redis 7** + **BullMQ** | Джобы: email-рассылки, обработка медиа, начисление баллов, ретраи вебхуков |
| Файлы | **S3-совместимое хранилище** (Yandex Object Storage / Selectel) | Фото туров, аватары, видео Reels; presigned upload с клиента |
| Auth | Собственный JWT (RS256), **argon2id** для паролей | Access 15 мин + refresh 30 дней с ротацией; детали в §4 |
| Платежи | **ЮKassa** | Стандарт для РФ, вебхуки, возвраты, 54-ФЗ чеки |
| Проверка ИНН/ОГРН | **DaData API** | Реальная верификация партнёров вместо мока |
| Push | **Expo Push Notifications** | Нативно для Expo-клиента, бесплатно |
| AI-поддержка | Прокси на LLM API через бэкенд | Ключ не в клиенте; лимиты и логирование на сервере |
| Логи / ошибки | pino + **Sentry** | |
| Тесты | **Vitest** + `fastify.inject()` + testcontainers (Postgres) | |
| Деплой | **Docker Compose на VPS в РФ** (Timeweb Cloud / Selectel), Caddy (auto-TLS) | 152-ФЗ: персональные данные граждан РФ — на серверах в РФ. Это исключает Supabase/Fly/Railway |
| CI | GitHub Actions: lint → typecheck → test → build → deploy | |

### 1.2 Отклонённые альтернативы

- **NestJS** — много церемоний (модули/декораторы/DI) для соло-разработки; Fastify с той же производительностью и меньшим объёмом кода.
- **Supabase** — быстрее до MVP, но данные вне РФ (152-ФЗ), а бронирования/платежи/модерация всё равно требуют полноценного кастомного слоя.
- **tRPC вместо REST** — заманчиво при TS-монорепо, но REST + OpenAPI оставляет дверь открытой для сторонних интеграций (партнёрские API, виджеты) и не привязывает клиент к серверу намертво. Компромисс: типы всё равно общие через zod-пакет.

### 1.3 Архитектура доменного слоя

Сложность проекта сосредоточена в домене (бронирования, деньги, модерация), а не в транспорте — поэтому управляем ею дисциплиной слоёв, а не фреймворком:

```
routes.ts   → тонкий: zod-парсинг, вызов сервиса, маппинг ошибок в HTTP. Без логики.
service.ts  → доменная логика. НЕ импортирует fastify и drizzle — только чистый TS + repo-интерфейс.
repo.ts     → весь SQL/Drizzle. Без бизнес-решений.
```

Правила (проверяются на ревью):

1. **Переходы статусов — только через явные таблицы переходов** (бронь, модерация, партнёрская анкета). Прямое присваивание статуса вне модуля перехода запрещено.
2. **Деньги — integer в минорных единицах (bigint), все расчёты (возвраты, комиссии, баллы) — чистые функции** вида `(policy, booking, now) → amount` в отдельном модуле; тестируются без БД и HTTP.
3. **Инварианты — в БД:** `CHECK (seats_left >= 0)`, UNIQUE на идемпотентность/один-отзыв-на-бронь, транзакции с `SELECT FOR UPDATE` на списании мест. Конкурентность решает Postgres, не код.
4. **Побочные эффекты (email, push, начисление баллов) — не в сервисах, а в BullMQ-джобах** по событию; при росте числа событий — переход на outbox-паттерн.

### 1.4 Структура монорепо

```
yavoy_2026/
├── apps/
│   ├── expo/           # мобильное приложение (основной фронт)
│   ├── web/            # веб-клиент (Vite + shadcn) + админка
│   └── backend/        # бэкенд
│       ├── src/
│       │   ├── modules/        # по доменам: auth, users, catalog, bookings, ...
│       │   │   └── <domain>/{routes,service,repo}.ts
│       │   ├── plugins/        # auth-guard, rbac, error-handler, rate-limit
│       │   ├── jobs/           # BullMQ-воркеры (с M4)
│       │   └── db/{schema,migrations}/
│       └── Dockerfile
├── packages/
│   ├── contracts/      # zod-схемы + типы, импортируются бэкендом (клиенты — через адаптеры)
│   ├── i18n/           # каталоги ru/en/uz, плюрализация, форматтеры; общий для бэкенда и клиентов
│   └── legal/          # оферта и политика конфиденциальности; общий текст для клиентов
├── docker-compose.yml  # dev: postgres
├── deploy/             # прод: compose + Caddy
└── pnpm-workspace.yaml # workspace: apps/backend + packages/*
```

Менеджер пакетов бэкенда — **pnpm** (workspaces); клиенты живут на npm. Нативные `ios/`/`android/` — в ветке `archive/native-apps`.

---

## 2. Общие соглашения API

- **База:** `https://api.yavoy.ru/v1` (версия в URL).
- **Формат:** JSON; ошибки — единый конверт:
  ```json
  { "error": { "code": "booking_sold_out", "message": "Мест не осталось", "details": {} } }
  ```
  `code` — машиночитаемый, стабильный (клиент матчится по нему, не по тексту).
  `message` — **дев-фолбэк**: в UI попадает перевод по коду из `packages/i18n`
  (`errors.<code>`), а не текст с сервера. Новый код ошибки → новый ключ в каталоге.
- **Пагинация:** cursor-based везде: `?cursor=<opaque>&limit=20` → `{ items: [], next_cursor: string|null }`.
- **Датавремя:** ISO 8601 UTC. **Деньги:** integer в минорных единицах валюты
  (копейки для RUB, тийины для UZS) + код валюты (никаких float). Колонки — `bigint`:
  в int4 помещается лишь 21,5 млн сум, а групповая бронь узбекского тура это пробивает.
- **Идентификаторы:** UUID v7.
- **Идемпотентность:** мутации с деньгами (`POST /bookings`, оплата) принимают заголовок `Idempotency-Key`; повтор с тем же ключом возвращает исходный результат.
- **Rate limiting:** глобально 100 rps/IP; auth-эндпоинты — 5/мин/IP.
- **Языки:** интерфейс клиентов — ru/en/uz (YAV-25). Язык по умолчанию отдаёт сервер
  (`GET /v1/config`), исходящие письма — на одном языке `MAIL_LOCALE`. Контент каталога
  (названия, описания) не локализован и хранится в одном языке.
- **RBAC-роли:** `user` | `manager` | `admin`. «Партнёр» — не роль, а наличие одобренного `partner_profile` у пользователя (закрывает старый рассинхрон `manager`/`moderator`).

---

## 3. Модель данных (PostgreSQL)

### 3.1 Ядро

```
users              id, email UNIQUE, role (user|partner|manager|admin), is_active,
                   first_name, last_name, photo_key, created_at, last_login_at
                   -- пароля нет: вход passwordless по OTP (авг 2026)

email_otps         email PK, code_hash, expires_at (10 мин), attempts_left (5),
                   last_sent_at (кулдаун 60 c) -- один активный код на email

refresh_sessions   id, user_id FK, token_hash, expires_at, created_at,
                   revoked_at, replaced_by (ротация), user_agent, ip

cities             id, name, slug UNIQUE, emoji, photo_key, is_published, position

tours              id, partner_id FK->partner_profiles (nullable для собственных туров),
                   city_id FK, title, description, status (draft|pending|published|rejected|archived),
                   price_kopeks, original_price_kopeks, currency,
                   duration_type (one_day|multi_day), duration_text,
                   transport (auto|water|sea|bike|air),
                   interest, category, season,          -- enum'ы как в PROJECT_DOCS §8.1
                   group_size_min, group_size_max, languages text[],
                   meeting_point, meeting_lat, meeting_lng, start_time,
                   highlights jsonb, includes jsonb, excludes jsonb, what_to_bring jsonb,
                   booking_conditions, prepayment_percent, cancellation_policy,
                   is_instant_confirmation, is_free_cancellation,
                   popularity_score (денормализация для сортировки),
                   rejected_reason, created_at, published_at

tour_media         id, tour_id FK, kind (photo|video), object_key, position

tour_dates         id, tour_id FK, starts_on date, seats_total, seats_left, price_override
                   -- расписание/наличие мест; фильтр по дате ищет по этой таблице
```

### 3.2 Бронирования и деньги

```
bookings           id, user_id FK, tour_id FK, tour_date_id FK,
                   status (pending_payment|confirmed|completed|cancelled|refunded),
                   tickets_count, amount_kopeks, contact_name, contact_phone, contact_email,
                   voucher_code UNIQUE, confirmation_code,
                   idempotency_key UNIQUE, expires_at (TTL неоплаченной брони),
                   cancelled_at, cancel_reason, created_at

payments           РЕАЛИЗОВАНО (YAV-21): id, booking_id FK, provider (octo|yookassa),
                   provider_payment_id (UNIQUE вместе с provider), status
                   (created|pending|succeeded|cancelled|failed), amount_minor, currency,
                   pay_url, refunded_minor, last_event jsonb (сырой коллбэк),
                   masked_pan, card_vendor, created_at, updated_at, paid_at

loyalty_accounts   user_id PK, balance_points
loyalty_entries    id, user_id, delta, reason (booking|reel|promo|redeem), ref_id, created_at

promo_codes        id, code UNIQUE, owner_user_id (пригласивший), bonus_points,
                   max_uses, used_count, expires_at
promo_redemptions  id, promo_id FK, user_id FK, UNIQUE(promo_id, user_id)

gift_certificates  id, code UNIQUE, buyer_user_id, amount_kopeks,
                   status (active|redeemed|expired), redeemed_by, redeemed_at
```

**Машина состояний брони:**
`pending_payment` →(вебхук succeeded)→ `confirmed` →(дата прошла)→ `completed`;
`pending_payment` →(TTL 30 мин / отмена)→ `cancelled`;
`confirmed` →(отмена по политике)→ `refunded` (через возврат ЮKassa).
Списание `seats_left` — при создании брони в одной транзакции c `SELECT ... FOR UPDATE`; возврат мест — при `cancelled`/TTL.

### 3.3 UGC и социальное

```
favorites          user_id, entity_type (tour|city), entity_id, created_at
                   PK(user_id, entity_type, entity_id)

reviews            id, user_id FK, tour_id FK, booking_id FK UNIQUE (1 отзыв на бронь),
                   rating 1..5, text, status (pending|published|rejected), created_at

review_replies     id, review_id FK UNIQUE, partner_id FK, text,
                   status (pending|approved|rejected), created_at

reels              id, author_user_id FK, tour_id FK nullable, city_id FK,
                   title, story_text, video_key, poster_key,
                   status (moderation|published|rejected), rejected_reason,
                   likes_count, views_count, created_at
reel_likes         reel_id, user_id, PK(reel_id, user_id)
```

### 3.4 Партнёрка, модерация, коммуникации

```
partner_profiles   -- РЕАЛИЗОВАНА упрощённая версия (авг 2026):
                   -- id, user_id FK UNIQUE, org_name, description, phone,
                   -- inn (текст, проверка ручная менеджером), verified bool, created_at.
                   -- Полная анкета ниже — целевая, добирается по мере надобности:
                   id, user_id FK UNIQUE, inn, ogrn, entity_type (company|ip|self_employed),
                   legal_name, director_name, legal_address,
                   email, phone, telegram,
                   fns_verified_at, fns_payload jsonb (опция: DaData, НЕ обязательство),
                   status (contacts_required|pending_approval|approved|rejected),
                   rejected_reason, accepted_docs jsonb (версии принятых документов), created_at

legal_documents    key PK (terms|privacy|offer), title, body, version, updated_at
legal_doc_history  id, key, body, version, updated_by, created_at

chat_threads       id, kind (support|partner_admin|tour_client), tour_id?, booking_id?,
                   user_id, partner_id?, created_at, last_message_at
chat_messages      id, thread_id FK, sender_user_id, sender_role (user|partner|admin|ai),
                   text, created_at, read_at

devices            id, user_id FK, expo_push_token UNIQUE, platform, created_at
notification_prefs user_id PK, all, new_tours, price_drops, bookings, promos (bool)

email_log          id, to_email, template, payload jsonb, status, created_at
audit_log          id, actor_user_id, action, entity_type, entity_id, payload jsonb, created_at
                   -- каждое действие модерации/админа
```

---

## 4. Аутентификация и безопасность

- **Access JWT** (RS256, 15 мин): `sub`, `role`, `partner_id?`. Публичный ключ можно раздавать другим сервисам.
- **Refresh** (30 дней): случайный 256-бит токен, в БД — только hash. **Ротация при каждом refresh**; повторное использование старого refresh = кража → отзыв всей цепочки сессий.
- Все auth-мутации — `POST` с телом (исправляем токены в query string из старого API).
- Пароли — argon2id. Брутфорс-защита: rate limit + экспоненциальная задержка по email.
- Админ-доступ — **только** по `role` из JWT; никаких паролей в клиенте (`admin`/`Lotofond` — удалить).
- Загрузка файлов: presigned URL (клиент → S3 напрямую), бэкенд валидирует mime/размер и записывает `object_key`. Видео Reels — лимит 100 МБ, до 60 сек.
- Вебхуки ЮKassa: проверка по HTTPS + верификация из списка IP ЮKassa, идемпотентная обработка по `provider_payment_id`.
- Секреты — env-переменные (SOPS/age или Vault по мере роста), не в git.

---

## 5. API v1 — эндпоинты по доменам

### 5.1 Auth (реализовано; авг 2026 — passwordless OTP вместо паролей)
```
POST   /auth/otp/request       {email} → {ok}                  (6-значный код письмом;
                                                                регистрация и вход — один флоу)
POST   /auth/otp/verify        {email, code} → {tokens, user, is_new_user}
                                                               (новый юзер создаётся здесь,
                                                                имя добирается через PATCH /users/me)
POST   /auth/refresh           {refresh_token} → {tokens}      (ротация)
POST   /auth/logout            {refresh_token}                 (отзыв сессии)
GET    /auth/whoami            → UserProfile
```

### 5.2 Users (реализовано частично)
```
PATCH  /users/me               {first_name?, last_name?}
POST   /users/me/photo         presigned-flow → {photo_url}    (ждёт S3 — backlog)
GET    /users/me/notifications-prefs | PATCH ...               (backlog)
POST   /users/me/devices       {expo_push_token, platform}     (backlog)
```

### 5.2а Конфигурация клиентов (реализовано; YAV-25, YAV-21)
```
GET    /config                                  → { default_locale, supported_locales[], currency }
```
Публичный, без авторизации: клиент запрашивает его до каталога, потому что экран входа
рисуется раньше. Источник — `DEFAULT_LOCALE` / `SUPPORTED_LOCALES` / `CURRENCY` в env
бэкенда, поэтому язык по умолчанию и валюта меняются без пересборки приложений. Выбор
языка пользователем хранится на клиенте и перекрывает дефолт; валюту пользователь не
выбирает — она одна на инсталляцию.

`currency` — код ISO (`RUB` | `UZS` | `USD`), а не символ: символ подставляют клиенты
(`CURRENCY_SYMBOL` в `@yavoy/i18n`) на границе UI. Тот же код сервер проставляет новым
турам и броням и передаёт платёжному провайдеру, так что рассинхрона витрины и платежа
быть не может.

### 5.3 Каталог (Фаза 2, публичный, кэшируемый)
```
GET    /cities                                  → [{id, name, emoji, photo, tours_count}]
GET    /tours?city&duration&transport&interest[]&category[]&season&date
             &price_min&price_max&q&sort&cursor&limit
       sort: popularity|newest|price_asc|price_desc
       → { items: TourCard[], next_cursor }     (TourCard — усечённая модель для списка)
GET    /tours/{id}                              → TourDetail (полная модель + даты + организатор)
GET    /tours/{id}/reviews?cursor               → { items, next_cursor }
GET    /tours/{id}/dates?from&to                → доступные даты с местами
```
Поиск `q` — Postgres FTS (title, description, city, организатор) с русской морфологией.

### 5.4 Избранное (Фаза 3, требует auth)
```
GET    /me/favorites                            → {tours: [], cities: []}
PUT    /me/favorites/{tour|city}/{id}           (идемпотентно)
DELETE /me/favorites/{tour|city}/{id}
```

### 5.5 Бронирования и оплата (реализовано частично; YAV-21)
```
POST   /bookings               {tour_date_id, tickets_count, contact...}
                               → {booking, payment_url}   payment_url=null без эквайринга
GET    /me/bookings
POST   /bookings/{id}/cancel   (владелец / staff)
POST   /bookings/{id}/confirm  (manager+) — ручное подтверждение там, где оплаты нет
POST   /bookings/{id}/complete (manager+)
POST   /webhooks/{provider}    без auth, подлинность — по подписи в теле
GET    /me/transactions?cursor (backlog)
```

**Эквайринг — параметр инсталляции.** Релиза два (РФ и Узбекистан), у каждого
свой провайдер и своя валюта, поэтому доменный код знает только интерфейс
`PaymentProvider` (`modules/payments/provider.ts`): `createPayment`,
`parseWebhook`, `refund`. Реализация выбирается по `PAYMENT_PROVIDER`;
`none` — оплаты нет, бронь идёт в `requested` и подтверждается менеджером.

Жизненный цикл с оплатой:
`pending_payment` (места удержаны) → коллбэк `succeeded` → `confirmed` + ваучер;
`cancelled`/`failed` или истёкший `PAYMENT_TTL_MIN` → `cancelled`, места в продажу.
Коллбэки идемпотентны: повторная доставка того же статуса не меняет ничего.

**Реквизиты карт не проходят через наш код ни при каких условиях** — оплата
на странице банка, нам приходит только результат. Это требование раздела VIII
правил АО «Октобанк» и оно же снимает с нас PCI DSS.

### 5.6 Отзывы (Фаза 5)
```
POST   /bookings/{id}/review   {rating, text}   (только status=completed, один раз)
GET    /me/reviews
POST   /reviews/{id}/reply     {text}           (партнёр тура → модерация)
```

### 5.7 Reels (Фаза 5)
```
GET    /reels?city&cursor                       (published)
POST   /reels                  presigned-flow {video, poster, title, story, tour_id?} → moderation
GET    /me/reels                                (со статусами)
PUT    /reels/{id}/like | DELETE .../like
POST   /reels/{id}/view                         (инкремент, дедуп по user/device)
```

### 5.8 Лояльность (Фаза 5)
```
GET    /me/loyalty             → {balance, entries[]}
POST   /me/promo-code          → создать код «пригласи друга»
POST   /promo/redeem           {code}
POST   /gift-certificates      {amount} → оплата через ЮKassa
POST   /gift-certificates/redeem {code}
```

### 5.9 Партнёрка — РЕАЛИЗОВАНО в упрощённом виде (авг 2026)

Вместо самозаписи с анкетой — назначение админом; кабинет один (`/backoffice` в web),
вкладки по ролям. Партнёр работает теми же `/admin/tours`-эндпоинтами со скоупингом
(видит/правит только свои; чужие → 404; правка опубликованного снимает тур в draft;
публикация — только manager/admin):

```
POST   /admin/partners         {user_id, org_name, inn?, ...} (admin-only)
                               → профиль + роль partner одной транзакцией
GET    /admin/partners         (manager/admin)  |  PATCH /admin/partners/{id} (+verified)
GET    /admin/partners/me      (partner)        |  PATCH /admin/partners/me (без verified)
```

Целевые допы из старой спеки (самозапись по анкете, dashboard/KPI, гости,
транзакции) — добираются по триггерам; verified синхронизируется в organizer-jsonb туров.

### 5.10 Админ (role ≥ manager)
```
GET    /admin/users?q          |  PATCH /admin/users/{id}  {role?, is_active?}   [реализовано]
GET    /admin/bookings?status  |  POST /bookings/{id}/confirm|complete|cancel    [реализовано]
GET    /admin/reviews          |  POST /admin/reviews/{id}/approve|reject        [реализовано]
GET/POST /admin/tours, GET/PATCH /admin/tours/{id}, PATCH .../status,
GET/POST/PATCH/DELETE /admin/tours/{id}/dates[/{dateId}]                         [реализовано]
GET    /admin/stats            |  audit_log  |  legal-docs  |  emails            [backlog]
```

### 5.11 Чаты и поддержка (Фаза 7)
```
GET    /chats                  → треды текущего пользователя/партнёра/админа
POST   /chats                  {kind, tour_id?} → thread
GET    /chats/{id}/messages?cursor  |  POST /chats/{id}/messages {text}
GET    /chats/{id}/stream      SSE (новые сообщения; для MVP вместо WebSocket)
POST   /support/message        {text} → ответ AI (прокси LLM, системный промпт с каталогом)
POST   /support/escalate       → создаёт support-тред с админом
```

---

## 6. Фоновые джобы (BullMQ)

| Джоба | Триггер | Действие |
|-------|---------|----------|
| `booking-ttl` | delayed, 30 мин | Отмена неоплаченной брони, возврат мест |
| `booking-complete` | cron ежедневно | `confirmed` с прошедшей датой → `completed`, +баллы, пуш «оставьте отзыв» |
| `email-send` | события | Подтверждение брони, ваучер, смена документов, решения модерации |
| `push-send` | события | Статус брони, модерация Reels, снижение цены избранного |
| `media-process` | загрузка | Постер из видео, ресайз фото (photo_min) |
| `popularity-recalc` | cron ночью | Пересчёт popularity_score (брони + просмотры + избранное) |

---

## 7. План работ по фазам

| Фаза | Содержимое | Готовность к |
|------|-----------|--------------|
| **0. Каркас** | Монорепо pnpm, Fastify-скелет, Drizzle + миграции, docker-compose (pg/redis/caddy), CI, Sentry, `GET /health`, деплой на VPS | пустой API в проде |
| **1. Auth + Users** | §5.1–5.2 полностью, RBAC-плагин, тесты auth-флоу | вход из Expo через свой бэкенд |
| **2. Каталог** | §5.3, seed из существующих моков (20 туров, 8 городов), FTS-поиск, кэш | удаление ~3000 строк моков из Expo |
| **3. Избранное + профиль** | §5.4, синхронизация избранного между устройствами | |
| **4. Бронирования + деньги** | §5.5, ЮKassa (тестовый магазин), машина состояний, идемпотентность, TTL-джоба, email-ваучеры | первые реальные продажи |
| **5. UGC + лояльность** | §5.6–5.8, presigned-загрузка Reels, баллы, промо, сертификаты | |
| **6. Партнёрка + модерация** | §5.9–5.10, DaData, audit_log, рассылки | онбординг реальных организаторов |
| **7. Коммуникации** | §5.11, SSE-чаты, Expo push, AI-прокси | полный паритет с текущим UI |

Каждая фаза заканчивается переключением соответствующего экрана Expo с моков на API (React Query уже используется — меняются только источники данных) и удалением моков этого домена.

Порядок фаз 0–4 — жёсткий (зависимости), фазы 5–7 можно переставлять по бизнес-приоритету.

---

## 8. Открытые вопросы (утвердить до Фазы 4)

1. **Домен API** — `api.yavoy.ru` или остаёмся на `yavay.ru/backend`? (Написание бренда в домене сейчас `yavay`, в коде — `yavoy`.)
2. **Комиссионная модель** — платит турист полную стоимость нам (мы переводим партнёру за вычетом комиссии) или предоплату-процент? Влияет на схему `payments` и на 54-ФЗ (кто пробивает чек).
3. **Юрлицо и ставка ЮKassa** — нужен договор до Фазы 4.
4. **Reels-видео** — своё хранилище + HLS или загрузка на VK Video/Kinescope? Для MVP: прямые MP4 из S3, HLS — потом.
5. **AI-поддержка** — какой LLM-провайдер доступен с оплатой из РФ (YandexGPT / GigaChat / прокси к OpenAI-совместимому API)?
