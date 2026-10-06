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
apps/web/            Веб-клиент (Vite + shadcn) — на том же API, паритет с приложением,
                     плюс панель управления /admin со своим макетом и стилем
deploy/              Прод: docker-compose.prod.yml + Caddyfile
```

Нативные `ios/` и `android/` — в ветке `archive/native-apps`, не развиваются.

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
- **Деньги** — integer в минорных единицах валюты (`bigint`; копейки для RUB,
  тийины для UZS). **Статусы** — только через таблицы переходов
  (`modules/bookings/transitions.ts`).
- **Миграции**: правка `src/db/schema.ts` → `pnpm db:generate` → `pnpm db:migrate`.
  Сид-данные: `src/db/seed-data.json` (снапшот бывших моков), заливка `pnpm db:seed`.
- **Почта**: без `SMTP_URL` письма идут в лог. Прод-переменные: `SMTP_URL`, `MAIL_FROM`, `ADMIN_EMAIL`.
  Язык писем — `MAIL_LOCALE` (ru/en/uz), один на установку.
- **Языки клиентов**: `GET /v1/config` отдаёт `default_locale` и `supported_locales`
  из `DEFAULT_LOCALE` / `SUPPORTED_LOCALES`. Меняются на сервере без пересборки приложений.
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

### Роли и операции панели управления

Роли: `user` | `partner` | `manager` | `admin` (роль в JWT — после смены перелогин;
refresh обновит её сам в пределах 15 минут). Рабочий UI — веб-панель `/admin`;
те же операции доступны через Swagger (`/v1/admin/*`, `/v1/bookings/{id}/confirm` и т.д.).
Партнёра назначает админ в разделе «Партнёры» (роль + профиль организации разом).
Самого первого админа на пустой базе — руками:

```bash
docker exec yavoy_2026-postgres-1 psql -U yavoy -c "UPDATE users SET role='admin' WHERE email='<email>'"
```

## Expo-клиент

- API-слой: `services/api.ts` (auth, авторефреш токенов), `services/catalog.ts`
  (bootstrap `GET /v1/catalog` + адаптер к легаси-типу `Tour`), `services/bookings.ts`, `services/social.ts`.
- Каталог грузится целиком и фильтруется на клиенте — осознанно, пока туров десятки
  (при росте перейти на серверные фильтры `GET /v1/tours`, они уже реализованы).
- Оставшийся мок Expo: только `mocks/reels.ts` (Reels — backlog, оставлен сознательно).
  Мок транзакций удалён: история платежей идёт из `GET /v1/me/transactions`.
- **RN-web грабли**: вложенный Touchable/Pressable внутри другого Touchable не получает клики
  в браузере — кнопки поверх карточек размещать сиблингами тач-области (см. `CitySelector.tsx`).
- Проверка типов: `npx tsc --noEmit` в `apps/expo/`.

## Web-клиент

- Запуск: `cd apps/web && npm install --legacy-peer-deps && VITE_API_URL=http://localhost:3002/v1 npx vite`
- Сервисный слой зеркалит мобильный: `services/api.ts`, `catalog.ts`, `bookings.ts`, `social.ts`,
  `admin.ts`; избранное — общий серверный кэш с миграцией гостевого (AppContext).
- **Панель управления** (`/admin`; старый `/backoffice` редиректит): один кабинет,
  разделы по ролям. Manager/admin: `/admin/bookings`, `/admin/reviews`, `/admin/tours`
  (создание/правка/публикация, даты с местами), `/admin/users`, `/admin/partners`
  (назначение — admin-only, verified-галочка). Partner: `/admin/tours` — только свои,
  всё сохраняется черновиком, публикует менеджер, — и `/admin/org`.
- Панель живёт **отдельно от витрины**: свой `components/admin/AdminLayout.tsx`
  с боковым меню, без витринного футера, нижней навигации и герой-баннеров,
  и свой набор примитивов `components/admin/ui.tsx` (`Panel`, `Table`, `Btn`,
  `Badge`, `inputClass`). Разделы верстать ими, а не витринными карточками:
  у панели задача — плотность и читаемость таблиц. Разделы —
  отдельные адреса, а не вкладки в стейте. Переходы роутерные: сначала были полные
  перезагрузки ради изоляции стейта, но они страховали грубой силой от того, что и так
  не ломалось, и стоили разбора всего бандла на каждом клике. Изоляцию держит правило:
  **каждая мутация в панели обязана сбрасывать свои ключи** (`invalidateQueries`).
  Раздел, отсутствующий в меню роли, закрыт и по прямой ссылке.
- Входа в панель с витрины нет: она открывается по своему адресу. Переключатель
  языка в вебе живёт только в шапке — в настройках профиля он дублировался.
- **Управления в мобильном приложении нет.** Админку из Expo вычистили целиком
  (сен 2026, решение владельца): экран, редактор туров, сервисный слой и пункт
  меню в профиле. Панель — только веб. Эндпоинты `/admin/*` при этом никуда не
  делись, так что вернуть мобильную версию при желании можно.
- `app/partner.tsx` в Expo — **форма заявки на партнёрство**, не кабинет: подача,
  статус, причина отказа. Управление турами и бронями партнёр ведёт в веб-панели.
- Оставшиеся моки web: только Reels (backlog, оставлены сознательно). Демо-кабинет
  партнёра заменён формой заявки.
- **Выключенные фичи** — через `features.ts` (свой в каждом клиенте, списки обязаны
  совпадать), а не удалением кода: сертификаты и промокоды ждут бэкенда. Раздел
  просто не рендерится, ключи переводов остаются «использованными».
- Переключатель языка в вебе — в шапке (`components/LanguageMenu.tsx`, компактное
  меню с кодом языка); в Expo — в профиле (`components/LanguageSelector.tsx`),
  своей шапки там нет.

## CORS, заголовки и прочие уроки локального теста

- `@fastify/cors` по умолчанию разрешает только GET/HEAD/POST — методы заданы явно в `app.ts`.
- Не слать `Content-Type: application/json` без тела — fastify отвечает 400 (учтено в `authFetch`).

## Прод

Прод-нода создана 6 октября 2026: Serverspace, Ташкент, Ubuntu 26.04 LTS,
2 vCPU / 4 ГБ / 80 ГБ NVMe / 100 Мбит/с, `89.31.28.161`, домен **yavay.uz**.
Доступ — `ssh yavoy-prod` (отдельный ключ `~/.ssh/yavoy-prod`, алиас в `~/.ssh/config.d/yavoy.conf`).

Сервер, DNS-зона, настройка ноды, бэкапы и почта — в `deploy/PROD.md`.
Доступы к инфраструктуре (токен API, домен, IP) — `deploy/infra.env` по образцу
`deploy/infra.env.example`; на сервер этот файл не копируется, в отличие от `deploy/.env`.

Нода настроена (swap, ufw, docker с ротацией логов, бэкапы с проверенным восстановлением),
стек поднят целиком, домен делегирован, сертификаты Let's Encrypt выпущены:
https://yavay.uz и https://api.yavay.uz. Каталог пуст, почты пока нет
(аккаунт Mailgun не активирован) — остаток в `deploy/PROD.md`.

### Выкатка

Образы собираются локально (на ноде не собираем) и переливаются по ssh:

```bash
SHA=$(git rev-parse --short HEAD)
docker buildx build --platform linux/amd64 -f apps/backend/Dockerfile -t yavoy-backend:$SHA --load .
docker buildx build --platform linux/amd64 -f apps/web/Dockerfile \
  --build-arg VITE_API_URL=https://api.yavay.uz/v1 -t yavoy-web:$SHA --load .
docker save yavoy-backend:$SHA yavoy-web:$SHA | gzip -1 | ssh yavoy-prod 'gunzip | docker load'
ssh yavoy-prod "docker tag yavoy-backend:$SHA yavoy-backend:latest \
  && docker tag yavoy-web:$SHA yavoy-web:latest \
  && cd /opt/yavoy && docker compose -f docker-compose.prod.yml up -d --no-build"
```

Тег по коммиту — это возможность отката: `:latest` перевешивается на нужный образ,
`up -d` поднимает прежнюю версию. URL API зашивается в веб-образ **при сборке**,
поэтому смена домена требует пересборки веба, а не только правки `.env`.

### Миграции: сверять схему, а не строчку в логе

Образ бэкенда прогоняет миграции при старте, но **«Migrations applied» ничего не доказывает**:
drizzle сравнивает `when` из журнала с максимумом в БД, и миграция с меткой меньше уже
применённой пропускается молча. После выкатки со схемными изменениями:

```bash
ssh yavoy-prod "cd /opt/yavoy && docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U yavoy -d yavoy -c 'select count(*) from drizzle.__drizzle_migrations' \
  -c \"select table_name from information_schema.tables where table_schema='public'\""
```

Число записей должно совпадать с числом файлов в `apps/backend/src/db/migrations`.
Пропущенную доводят руками: `docker cp` файла в контейнер postgres и
`psql -v ON_ERROR_STOP=1 -f`. После этого **дописать строку в журнал БД**, иначе счётчик
разойдётся с числом файлов и следующего человека это собьёт:

```sql
insert into drizzle.__drizzle_migrations (hash, created_at)
values ('<sha256 файла миграции>', <when из _journal.json>);
```

На поведение это не влияет (сравнение идёт только с максимумом), но запись становится честной.

### Сид на прод не запускать

`seed.js` заливает демонстрационный каталог по России и **стирает существующий каталог
вместе с бронями**. Для узбекской инсталляции он не годится ни содержимым, ни этим
побочным эффектом. Даты выездов он к тому же раскладывает относительно дня запуска
(+3/+10/+17/+24), поэтому засеянная им база через месяц остаётся без будущих дат.

### Язык и валюта меняются без пересборки

`DEFAULT_LOCALE` / `SUPPORTED_LOCALES` / `MAIL_LOCALE` / `CURRENCY` в `.env` на сервере
плюс `docker compose … up -d backend`. Клиенты берут и то и другое из `GET /v1/config`,
поэтому ни веб-образ, ни APK трогать не нужно. Так же переключается инсталляция целиком:
узбекская витрина — это `DEFAULT_LOCALE=uz` + `CURRENCY=UZS` + `PAYMENT_PROVIDER=octo`
и ничего больше. Валюта применяется к **новым** турам и броням; уже лежащие в базе строки
хранят ту, с которой были созданы. `SUPPORTED_LOCALES` позволяет временно убрать язык
из переключателя — например, пока узбекский не вычитан носителем.
