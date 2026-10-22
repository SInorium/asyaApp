# Руководство разработчика

Документ для того, кто будет сопровождать проект: запускать, менять, выкладывать и чинить. Краткая памятка для ассистентов лежит в [`CLAUDE.md`](../CLAUDE.md), здесь всё подробнее.

## Содержание

1. [Обзор](#1-обзор)
2. [Запуск с нуля](#2-запуск-с-нуля)
3. [Карта репозитория](#3-карта-репозитория)
4. [Ключевые потоки](#4-ключевые-потоки)
5. [Типовые задачи](#5-типовые-задачи)
6. [Правила и соглашения](#6-правила-и-соглашения)
7. [Конфигурация](#7-конфигурация)
8. [Выкладка в прод](#8-выкладка-в-прод)
9. [Эксплуатация](#9-эксплуатация)
10. [Диагностика](#10-диагностика)
11. [Известные ограничения и что дальше](#11-известные-ограничения-и-что-дальше)

---

## 1. Обзор

Три приложения и четыре общих пакета в одном репозитории (pnpm + Turborepo).

```
                браузер
                   │
              ┌────▼────┐         одна точка входа (Caddy, :8080)
              │  Caddy  │         один origin, поэтому cookies без CORS
              └─┬───┬───┬┘
         /      │   │   │  /api/*
   ┌────────────┘   │   └────────────┐
   │   /admin/*     │                │
┌──▼────────┐ ┌─────▼─────┐   ┌──────▼──────┐
│ web       │ │ admin     │   │ api         │
│ Next 16   │ │ Vite SPA  │   │ NestJS      │
│ :3000     │ │ :5173     │   │ :4000       │
└──┬────────┘ └───────────┘   └──┬───────┬──┘
   │  RSC ходят в API напрямую   │       │
   └─────────────────────────────►       │
                                  ┌──────▼──┐ ┌────▼─────┐
                                  │Postgres │ │ S3 (файлы)│
                                  └─────────┘ └──────────┘
```

Принципы:

- **Один источник правды для данных — zod-схемы в `packages/shared`.** Из них валидируется запрос на сервере, строится OpenAPI, из OpenAPI генерируется клиент, ими же проверяются формы на фронтендах.
- **Публичный сайт читает данные на сервере (RSC)** и кэширует их по тегу `artworks`. Админка — обычное одностраничное приложение.
- **Файлы не проходят через API.** Браузер кладёт их прямо в S3 по одноразовой ссылке.

## 2. Запуск с нуля

Нужны Node.js (проверялось на 26.x), pnpm 12 (версия закреплена в `packageManager`, подойдёт `corepack enable`) и Docker.

```bash
pnpm install
docker compose up -d postgres s3 caddy

cp .env.example .env
cp .env apps/api/.env      # api читает .env из своей папки или из корня
cp .env apps/web/.env      # Next читает .env только из папки приложения

pnpm --filter @asya/api db:generate   # клиент Prisma (папка src/generated в git не входит)
pnpm db:migrate                       # prisma migrate dev
pnpm db:seed                          # владелец и 5 демо-картин
pnpm dev
```

Проверка, что всё живо:

```bash
curl -s localhost:4000/api/artworks | head -c 200      # каталог из API
open http://localhost:8080                             # сайт
open http://localhost:8080/admin/                      # вход: owner@asya.local / owner12345
open http://localhost:8080/api/docs                    # Swagger
```

**Если Docker не может скачать образы** (`TLS handshake timeout`): повторите попытку позже, включите VPN или настройте зеркало реестра. Образов MinIO в публичном доступе больше нет, поэтому в `docker-compose.yml` используется `rustfs/rustfs`.

**Порты:** 5432 (Postgres), 9000 и 9001 (S3 и консоль), 8080 (Caddy), 4000, 3000, 5173. Если порт занят, приложение не стартует (у Vite включён `strictPort`).

Caddy в Docker обращается к приложениям на хосте через `host.docker.internal`, поэтому Vite слушает `host: true`. Без Caddy сайт, админка и API тоже работают по отдельным портам: Vite проксирует `/api` в Nest, Next делает то же через `rewrites`.

## 3. Карта репозитория

| Путь | Назначение | Зависит от |
|---|---|---|
| `apps/api` | NestJS: модули `auth`, `artworks`, `inquiries`, `storage`, `integrations` | `shared` |
| `apps/web` | Next 16, публичный каталог | `shared`, `ui`, `api-client` |
| `apps/admin` | Vite SPA, базовый путь `/admin/` | `shared`, `ui`, `api-client` |
| `packages/shared` | zod-схемы, перечисления, подписи статусов. **Собирается через tsup в `dist`** | — |
| `packages/ui` | компоненты и токены Tailwind 4, потребляется исходниками | — |
| `packages/api-client` | `src/generated/*` создаёт orval, `src/fetcher.ts` написан вручную | — |
| `packages/config` | базовые `tsconfig` | — |

Turborepo сам собирает зависимости перед `typecheck`, `build` и `dev` (`dependsOn: ["^build"]`).

### Структура фронтендов (FSD)

Слои сверху вниз: `app → pages → widgets → features → entities → shared`. Импортировать можно только вниз; слайсы одного слоя друг друга не импортируют; снаружи слайс доступен только через `index.ts`. Проверяет `pnpm lint` (steiger).

- **Подход «страница первой».** Код, который нужен одному месту, живёт внутри страницы. В `features`/`entities` его выносят, когда появился второй потребитель, иначе steiger выдаст `insignificant-slice`.
- **`apps/web`.** Маршруты Next лежат в корневой `app/`. FSD-слой страниц называется `src/pages`, а чтобы Next не принял его за свой старый роутер, в корне есть пустая `pages/` с README. **Не удаляйте её.** Глобальные вещи (шрифты, layout сайта) лежат в `src/app`.
- **`apps/admin`.** Файлы `src/routes/*` — тонкие обёртки TanStack Router, которые подключают `src/pages/*`. Дерево маршрутов `src/app/routeTree.gen.ts` генерируется плагином Vite, не правьте его руками.

## 4. Ключевые потоки

### Авторизация

- `POST /api/auth/login` ставит две cookie: `access_token` (15 минут, путь `/`) и `refresh_token` (30 дней, путь `/api/auth`). Обе `httpOnly`, `SameSite=Lax`, `secure` при `NODE_ENV=production`.
- Refresh-токен — случайная строка. В БД лежит только её SHA-256. Каждое обновление (`POST /api/auth/refresh`) отзывает старый токен и выдаёт новую пару.
- `JwtAuthGuard` читает access-токен из cookie или из заголовка `Authorization: Bearer`. `RolesGuard` и `@Roles()` проверяют роль.
- Клиент (`packages/api-client/src/fetcher.ts`) при ответе 401 один раз пробует `/api/auth/refresh` (параллельные запросы ждут один и тот же refresh) и повторяет запрос. Если не вышло, вызывается `onUnauthorized` и админка отправляет на страницу входа.
- **Права:** `OWNER` видит и меняет всё, `AUTHOR` — только свои картины и заявки на них (`ownerFilter` в сервисах). Роль `BUYER` в коде есть, но не используется.
- **Регистрация:** `AUTHOR_REGISTRATION=invite` требует `inviteCode` из `AUTHOR_INVITE_CODE`; значение `open` включает свободную регистрацию.

### Загрузка фотографий

1. Админка: `POST /api/me/artworks/uploads/presign` → `{ uploadUrl, key }`.
2. Браузер делает `PUT` файла прямо на `uploadUrl`.
3. Админка: `POST /api/me/artworks/:id/images` с `{ key }`. API проверяет, что ключ начинается с `uploads/{userId}/`, и создаёт запись. Первое фото становится обложкой.

Адрес `uploadUrl` строится из `S3_ENDPOINT`, и именно по нему ходит браузер. В проде этот адрес должен быть доступен из интернета.

### Каталог и сброс кэша

- `apps/web/src/entities/artwork/api/queries.ts`: функции `getCatalog` и `getArtwork` помечены `'use cache'`, `cacheTag('artworks')`, `cacheLife('hours')`.
- После любого изменения публичных данных `ArtworksService.touchCatalog` вызывает `RevalidationService`, тот шлёт `POST {WEB_REVALIDATE_URL}` с заголовком `x-revalidate-secret`. Маршрут `apps/web/app/revalidate/route.ts` вызывает `revalidateTag('artworks', { expire: 0 })`, так что следующий посетитель сразу видит свежие данные. Правки черновиков кэш не сбрасывают.
- Если вебхук потерялся, данные обновятся сами через час (`cacheLife('hours')`).
- Страницы каталога и картины используют PPR: статичная оболочка и данные в `<Suspense>`.

### Клиент API

`pnpm api:generate` делает две вещи: экспортирует `apps/api/openapi.json` (без запуска сервера и без БД), затем orval пишет `packages/api-client/src/generated/fetch.ts` (простые функции для RSC) и `query.ts` (хуки TanStack Query для админки). Сгенерированные файлы лежат в git, чтобы свежий клон собирался без запуска API. **После любого изменения DTO или контроллеров запускайте генерацию и коммитьте результат.**

## 5. Типовые задачи

### Добавить поле картине (например, `framed: boolean`)

1. `apps/api/prisma/schema.prisma`: добавьте поле в `Artwork`, затем `pnpm db:migrate` (дайте миграции имя).
2. `packages/shared/src/schemas.ts`: добавьте поле в `ArtworkSchema` (ответ) и `ArtworkUpsertSchema` (запись).
3. `apps/api/src/modules/artworks/artworks.mapper.ts`: отдайте поле в `toArtwork`.
4. `pnpm --filter @asya/shared build`, затем `pnpm api:generate`.
5. Админка: добавьте поле в `features/artwork-upsert/model/form-values.ts` и `ui/artwork-form.tsx`.
6. Сайт: выведите поле на странице `src/pages/artwork`.
7. `pnpm typecheck && pnpm lint`.

### Добавить эндпоинт

1. Опишите схему в `packages/shared`, создайте DTO через `createZodDto` в `*.dto.ts` модуля.
2. В контроллере укажите ответ через `@ZodResponse({ status, type })`. **Статус нужно писать явно**, иначе в OpenAPI он станет `default`, и клиент потеряет типы.
3. Закрытые маршруты: `@UseGuards(JwtAuthGuard, RolesGuard)` и `@Roles(...)`.
4. `pnpm api:generate` и используйте новые хуки из `@asya/api-client/query`.

### Добавить страницу

- **Админка:** создайте `src/pages/<имя>` (с `index.ts`) и тонкий файл маршрута в `src/routes/`. Закрытые страницы кладите внутрь `src/routes/_authed/`.
- **Сайт:** страница в `src/pages/<имя>`, тонкий `page.tsx` в `app/`. Всё, что читает `searchParams`, `params` или другие данные запроса, оборачивайте в `<Suspense>` (требование Cache Components).
- Сверяйтесь с документацией именно этой версии Next: она лежит в `apps/web/node_modules/next/dist/docs/`. API Next 16 отличается от того, что описано в старых статьях (`middleware` стал `proxy`, `revalidateTag` требует второй аргумент).

### Новый компонент в ui-kit

Файл в `packages/ui/src/components/<имя>.tsx`, подключение `import { X } from '@asya/ui/components/<имя>'`. Приложения явно сканируют исходники ui (`@source` в их `globals.css`/`index.css`), иначе Tailwind не увидит классы.

### Миграции

- Разработка: `pnpm db:migrate` (`prisma migrate dev`), коммитьте папку `prisma/migrations`.
- Прод: `pnpm --filter @asya/api exec prisma migrate deploy`.

## 6. Правила и соглашения

- **Коммиты:** Conventional Commits на русском, `<тип>(<область>): описание`. Типы: `feature`, `chore`, `docs` и т. п. Область — приложение или пакет (`api`, `web`, `admin`, `ui`, `repo`).
- **Версии, которые нельзя поднимать без проверки:**
  - `typescript` **5.9.3**: с TypeScript 7 не работают Nest CLI, tsup и ts-jest;
  - `@nestjs/*` **11**: `nestjs-zod` пока не поддерживает Nest 12;
  - `prisma` и `@prisma/*` **7.10.1** закреплены точной версией.
- **pnpm 12** требует явного разрешения postinstall-скриптов: список в `allowBuilds` файла `pnpm-workspace.yaml`. Новый пакет с нативной сборкой нужно добавить туда.
- **Обход в `apps/api/src/bootstrap.ts`.** `@nestjs/swagger` портит поля, которые могут быть `null`, превращая их в массивы. Функция `patchDtoSchemas` перезаписывает схемы корневых DTO через `z.toJSONSchema`. Если её убрать, клиент получит `string[]` вместо `string | null`.
- **Не добавляйте `.meta({ id })` к схемам, которые являются корневым DTO.** Это ломает генерацию OpenAPI (`Found multiple schemas with name`). Для вложенных схем можно.
- **Не редактируйте вручную:** `packages/api-client/src/generated/*`, `apps/admin/src/app/routeTree.gen.ts`, `apps/api/src/generated/*` (в git не входит).
- **Server Actions не используются.** Вся запись идёт через API.

## 7. Конфигурация

Переменные из `.env.example` (для `NEXT_PUBLIC_SITE_URL` в нём стоит значение для разработки, в проде задайте свой адрес). API читает `apps/api/.env` или корневой `.env`, Next — `apps/web/.env`, Vite-админка своих переменных не имеет.

| Переменная | Кто читает | Назначение |
|---|---|---|
| `DATABASE_URL` | api, prisma | подключение к Postgres |
| `API_PORT` | api | порт API, по умолчанию 4000 |
| `JWT_ACCESS_SECRET` | api | подпись access-токена. **В проде своя, длинная, случайная** |
| `JWT_REFRESH_SECRET` | api | зарезервирована в `.env.example`, но сейчас не используется (refresh-токен случайный и хранится хэшем) |
| `AUTHOR_REGISTRATION` | api | `invite` или `open` |
| `AUTHOR_INVITE_CODE` | api | код приглашения для регистрации |
| `S3_ENDPOINT` | api | адрес S3. **Из него строится `uploadUrl`, его должен видеть браузер** |
| `S3_REGION`, `S3_BUCKET` | api | регион и имя бакета |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | api | ключи доступа |
| `S3_AUTO_CREATE_BUCKET` | api | `true` только для разработки: создаёт бакет, политику публичного чтения и CORS |
| `S3_PUBLIC_URL` | api | базовый адрес, по которому браузер читает картинки |
| `WEB_REVALIDATE_URL` | api | куда API сообщает о смене каталога (`…/revalidate`) |
| `REVALIDATE_SECRET` | api, web | общий секрет вебхука. Без него маршрут отвечает 401 |
| `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD` | seed | аккаунт владельца, создаётся при `db:seed` |
| `API_INTERNAL_URL` | web | адрес API для серверного рендеринга, **без `/api` на конце** |
| `NEXT_PUBLIC_S3_PUBLIC_URL` | web | нужен `next/image` (список разрешённых адресов картинок) |
| `NEXT_PUBLIC_SITE_URL` | web | публичный адрес сайта для sitemap и метаданных |
| `NODE_ENV` | api, web | `production` включает `secure` у cookie |

## 8. Выкладка в прод

**Чего в репозитории пока нет:** Dockerfile, CI, скриптов деплоя и боевого конфига Caddy. `Caddyfile` и `docker-compose.yml` рассчитаны только на разработку. Ниже чек-лист того, что нужно сделать.

1. **Окружение.** Сервер с Node.js, Postgres и S3-совместимым хранилищем (подойдёт любой облачный S3 с публичным чтением объектов).
2. **Секреты.** Задайте новые `JWT_ACCESS_SECRET`, `REVALIDATE_SECRET`, `AUTHOR_INVITE_CODE`, пароль владельца в `SEED_OWNER_PASSWORD` (до запуска seed), пароль БД, ключи S3. Значения из `.env.example` — учебные.
3. **Сборка.**
   ```bash
   pnpm install --frozen-lockfile
   pnpm --filter @asya/api db:generate
   pnpm build
   ```
4. **База.** `pnpm --filter @asya/api exec prisma migrate deploy`, затем один раз `pnpm db:seed` (создаёт владельца; демо-картины появятся только в пустой базе, при необходимости удалите их потом).
5. **S3.** `S3_AUTO_CREATE_BUCKET=false` и настройте бакет вручную:
   - публичное чтение объектов (`s3:GetObject` для всех);
   - CORS: разрешить `PUT` и `GET` с адреса вашего сайта (`AllowedOrigins`), заголовки `*`;
   - `S3_ENDPOINT` и `S3_PUBLIC_URL` должны быть доступны из интернета, а `NEXT_PUBLIC_S3_PUBLIC_URL` совпадать с `S3_PUBLIC_URL`.
6. **Процессы.** API: `node apps/api/dist/main.js` (`pnpm --filter @asya/api start`). Сайт: `pnpm --filter @asya/web start`. Запускайте под systemd, pm2 или в контейнерах. Админка — статика из `apps/admin/dist`, отдельный процесс не нужен.
7. **HTTPS обязателен.** При `NODE_ENV=production` cookie помечаются `secure` и без HTTPS не сохранятся, вход не заработает. API включает `trust proxy 1`, он рассчитан на ровно один обратный прокси перед ним.
8. **Обратный прокси.** Пример для Caddy (не проверялся, сверьте с документацией Caddy):
   ```caddyfile
   example.ru {
       handle /api/* {
           reverse_proxy 127.0.0.1:4000
       }
       handle /admin* {
           root * /srv/asya/apps/admin/dist
           uri strip_prefix /admin
           try_files {path} /index.html
           file_server
       }
       handle {
           reverse_proxy 127.0.0.1:3000
       }
   }
   ```
9. **Вебхук.** `WEB_REVALIDATE_URL` укажите на внутренний адрес сайта (`http://127.0.0.1:3000/revalidate`), `REVALIDATE_SECRET` одинаковый у API и сайта.
10. **Сквозная проверка** после выкладки: войти в `/admin/`, создать картину с фото, поставить «В продаже», убедиться, что она сразу видна на `/`, оставить заявку анонимно, увидеть её в «Заявках».

## 9. Эксплуатация

### Резервные копии

- База: `pg_dump` по расписанию.
- Фотографии: копия бакета (`aws s3 sync` или средства провайдера).
- Копии базы и бакета делайте **вместе**: в базе лежат только ключи файлов.

### Смена пароля и сброс сессий

В интерфейсе смены пароля нет. Делается через базу:

```bash
cd apps/api
node -e "require('argon2').hash(process.argv[1]).then(console.log)" 'НовыйПароль'
```

Затем в `psql` (интерактивно, чтобы оболочка не раскрыла символы `$` в хэше):

```sql
UPDATE "User" SET "passwordHash" = '<полученный хэш>' WHERE email = 'owner@example.ru';
-- выйти из всех устройств:
UPDATE "RefreshToken" SET "revokedAt" = now()
 WHERE "userId" = (SELECT id FROM "User" WHERE email = 'owner@example.ru');
```

Access-токен живёт ещё до 15 минут после отзыва.

### Создать автора вручную

Включите на время `AUTHOR_REGISTRATION=open` или выдайте код приглашения и пусть человек зарегистрируется на `/admin/register`. Владельца (`OWNER`) создаёт только seed; повысить роль можно запросом `UPDATE "User" SET role = 'OWNER' …`.

### Вручную сбросить кэш каталога

```bash
curl -X POST http://127.0.0.1:3000/revalidate \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -H 'content-type: application/json' \
  -d '{"tags":["artworks"]}'
```

### Логи

Nest пишет в stdout (запросы не логируются, только запуск и предупреждения). Новые заявки пока попадают только в лог строкой `Новая заявка на «…»` (см. раздел 11).

### Обновление зависимостей

Закреплённые версии (раздел 6) поднимайте по одной и проверяйте `pnpm typecheck && pnpm lint && pnpm build`, затем вручную пройдите сценарий из пункта 10 выкладки. Автотестов, которые поймали бы поломку, пока нет.

## 10. Диагностика

| Симптом | Вероятная причина и решение |
|---|---|
| `pnpm typecheck` в api: нет `generated/prisma` | не выполнен `pnpm --filter @asya/api db:generate` |
| Ошибки типов про `@asya/shared` | не собран пакет: `pnpm --filter @asya/shared build` (при `pnpm dev` он пересобирается сам) |
| Админка получает 401 по кругу | cookie не доходят: открыто не через Caddy/Vite-прокси, либо в проде нет HTTPS |
| `Found multiple schemas with name …` при `api:generate` | добавлен `.meta({ id })` корневому DTO (раздел 6) |
| В клиенте типы вида `string[]` вместо `string \| null` | сломан или удалён `patchDtoSchemas` в `bootstrap.ts` |
| Каталог не обновляется после правки | сайт недоступен для API (`WEB_REVALIDATE_URL`), не совпадает `REVALIDATE_SECRET`, либо картина осталась черновиком (черновики кэш не сбрасывают) |
| Фото не показываются | не совпадают `S3_PUBLIC_URL` и `NEXT_PUBLIC_S3_PUBLIC_URL`; бакет без публичного чтения; адрес не разрешён в `images.remotePatterns` |
| Фото не загружается (ошибка PUT) | в бакете нет CORS для адреса сайта, либо `S3_ENDPOINT` недоступен из браузера |
| `next build` падает с `ECONNREFUSED :4000` | при сборке страница обращается к API. Либо поднимите API, либо оберните вызов в `connection()` (так сделан `sitemap`) |
| Сайт отдаёт 502 через Caddy | приложение не запущено или слушает только loopback (Vite должен иметь `host: true`) |
| Next ругается: `pages and app directories should be under the same folder` | удалена пустая `apps/web/pages/` |
| `pnpm lint`: `insignificant-slice` | слайс используется в одном месте. Переместите его внутрь страницы (раздел 3) |
| Postgres или S3 не стартуют | порты 5432/9000 заняты другими контейнерами; `docker compose ps` и `docker compose logs <сервис>` |

## 11. Известные ограничения и что дальше

Всё это осознанно не сделано в первой версии.

**Безопасность и учётные записи**
- Нет смены и восстановления пароля в интерфейсе (см. раздел 9).
- Нет отдельного ограничения числа попыток входа: действует общий лимит 300 запросов в минуту с адреса. Заявки ограничены 5 в минуту. Стоит добавить `@Throttle` на `/auth/login`.
- Страницы профиля автора (`/admin/profile`, аватар, био) нет, хотя поля в `AuthorProfile` уже есть. Публичных страниц авторов тоже нет.

**Заявки**
- Автор **не получает уведомлений** о новой заявке. Точка расширения: `NotificationService.newInquiry` (`apps/api/src/modules/integrations/notification.service.ts`), её вызывает `InquiriesService.create`. Достаточно реализовать отправку на почту или в Telegram, остальной код не меняется.

**Файлы**
- Нет очистки «осиротевших» файлов: если файл загружен в S3, а привязка к картине не состоялась, он остаётся в бакете. Нужна периодическая задача.
- Нет уменьшения изображений: в админке показываются оригиналы (до 20 МБ), а сайт оптимизирует их через `next/image` на лету.

**Данные**
- Адрес картины (`slug`) не меняется при переименовании: так ссылки остаются рабочими.
- В списках админки нет постраничного вывода, в каталоге сайта он есть.
- Удаление картины каскадно удаляет заявки на неё.

**Инфраструктура**
- Нет автотестов (Jest и Vitest подключены, тестов и конфигов нет), нет CI, Dockerfile и скриптов деплоя.
- Миграция `20261022162635_init` — единственная.

**Планы продукта**
- Корзина и онлайн-оплата: под них нужны модели `Cart`, `Order`, `Payment` и вебхуки платёжного шлюза. Статус `RESERVED` и таблица `Inquiry` с ними совместимы.
- Несколько авторов и другие виды арт-товаров: основа уже есть (`AuthorProfile`, `ArtworkType`, режим `AUTHOR_REGISTRATION=open`).
