# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Магазин-каталог картин: публичный сайт + админка автора + API. Монорепо pnpm + Turborepo.
Сейчас владелец один, но модель данных рассчитана на нескольких авторов и другие арт-товары. Покупка пока идёт через заявку (`Inquiry`), корзина и онлайн-оплата запланированы на потом.

## Команды

```bash
docker compose up -d postgres s3 caddy   # Postgres, RustFS (S3), Caddy на :8080
cp .env.example .env && cp .env apps/api/.env && cp .env apps/web/.env
pnpm install
pnpm db:migrate && pnpm db:seed          # seed: owner@asya.local / owner12345
pnpm dev                                 # api :4000, web :3000, admin :5173
```

Открывать через Caddy: http://localhost:8080 (сайт), /admin/ (админка), /api/docs (Swagger).

- `pnpm typecheck` / `pnpm lint` (steiger) / `pnpm build`: по всем пакетам через turbo
- Одно приложение: `pnpm --filter @asya/api dev` (или `@asya/web`, `@asya/admin`). Аналогично для `typecheck`, `lint`, `build`
- Тесты: Jest (`apps/api`) и Vitest (`apps/admin`) установлены, но тестов и конфигов пока нет. Сквозная проверка API сейчас делается вручную через curl против запущенного `pnpm dev`
- `apps/web` typecheck запускает `next typegen` (генерирует глобальные `PageProps<'/route'>`)
- `pnpm api:generate`: после изменения DTO/контроллеров в API перегенерировать `packages/api-client` (OpenAPI → orval)
- `pnpm --filter @asya/shared build`: после правок `packages/shared` (API потребляет собранный dist)
- Prisma 7: схема `apps/api/prisma/schema.prisma`, клиент генерируется в `apps/api/src/generated` (`pnpm --filter @asya/api db:generate`)

## Архитектура

- `apps/api`: NestJS 11 + Prisma 7 (driver adapter `@prisma/adapter-pg`). Валидация через `nestjs-zod` и zod-схемы из `@asya/shared`; ответы описываются `@ZodResponse` с явным `status`. Auth: JWT access + refresh (ротация, хэш в БД) в httpOnly cookies. OWNER видит всё, AUTHOR — только своё (`ownerFilter` в сервисах).
- Изображения: presigned PUT из браузера напрямую в S3, затем `POST /me/artworks/:id/images` с ключом. Ключи `uploads/{userId}/…`, чужой ключ привязать нельзя.
- Один origin через Caddy (`/`, `/admin/*`, `/api/*`), поэтому cookies работают без CORS. Без Caddy: Vite проксирует `/api`, Next — через `rewrites` в `next.config.ts`. RSC ходят в API напрямую по `API_INTERNAL_URL` (без `/api` на конце, пути клиента уже начинаются с `/api`).
- `apps/web`: Next 16, Cache Components. Данные берутся в RSC через `getCatalog`/`getArtwork` (`'use cache'` + `cacheTag('artworks')`). API после изменений вызывает `POST /revalidate` (секрет `REVALIDATE_SECRET`), тот делает `revalidateTag(tag, { expire: 0 })`. Server Actions не используются.
- `apps/admin`: Vite SPA, `base: '/admin/'`, TanStack Router (file-based, `src/routes`), Query, Form. Хуки берутся из `@asya/api-client/query`.
- `packages/api-client`: сгенерирован orval, не править `src/generated` руками. Общий fetch с авто-refresh при 401 лежит в `src/fetcher.ts`.
- `packages/ui`: shadcn-подобный ui-kit, токены Tailwind 4 в `src/styles/theme.css`.

## FSD (проверяется steiger)

- Слои: `app → pages → widgets → features → entities → shared`. Импорт только вниз, между слайсами одного слоя импорт запрещён, наружу — только через `index.ts`.
- Подход «pages first»: код, который используется в одном месте, живёт в странице. В `features`/`entities` его выносим, когда появляется второй потребитель (иначе `fsd/insignificant-slice`).
- web: роутинг Next в корневых `app/` и пустой `pages/` (нужна, чтобы Next не принял `src/pages` за Pages Router). FSD-код в `src/`. Layout сайта лежит в `src/app/layouts`.
- admin: файлы `src/routes/*` тонкие и только подключают `src/pages/*`.

## Подводные камни

- TypeScript закреплён на 5.9.3: Nest CLI, tsup и ts-jest не работают с TS 7.
- Nest 11, а не 12: `nestjs-zod` пока не поддерживает 12.
- В `bootstrap.ts` схемы корневых DTO перезаписываются через `z.toJSONSchema`: `@nestjs/swagger` ломает nullable-поля. Не убирать, иначе orval сгенерирует `string[]` вместо `string | null`.
- Публичные образы MinIO больше не распространяются, в dev используется RustFS. API сам создаёт бакет, политику и CORS при `S3_AUTO_CREATE_BUCKET=true`.
- pnpm 12 требует явного `allowBuilds` в `pnpm-workspace.yaml` для пакетов с postinstall.
