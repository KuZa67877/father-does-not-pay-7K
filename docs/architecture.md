# Архитектура

## Слои

```
┌──────────────────────── apps/time · apps/velora ────────────────────────┐
│  app/        провайдеры (Query, Theme, DI), роутер, глобальные стили    │
│     │        data-source.ts — ЕДИНСТВЕННОЕ место, где импортируется      │
│     │        @dle/data и выбирается адаптер по VITE_DATA_SOURCE          │
│     ▼                                                                    │
│  pages/  →  widgets/  →  features/  →  entities/  →  shared/            │
│  (композиция) (блоки)    (действия)    (карточки,    (утилиты, DI-хук,   │
│                                         хуки данных)  ключи запросов)    │
└──────────────────────────────────────────────────────────────────────────┘
          │ все слои могут использовать           │ только интерфейсы
          ▼                                       ▼
   packages/ui (примитивы)              packages/core (модели, Zod, порты)
                                                  ▲
                                                  │ реализует порты
                                          packages/data (http, rest, mock)
```

Правило зависимостей проверяет ESLint (`no-restricted-imports`):

- `packages/core` не импортирует React, `@dle/data`, `@dle/ui`;
- в приложениях `@dle/data` разрешён только в `src/app/**`.

## Поток данных

```
Компонент ──► хук сущности (useArticles)            entities/article/api.ts
              │  useQuery({ queryKey: qk…, queryFn })
              ▼
         useRepositories().articles.list(q)          shared/api/di.ts (Context)
              │  интерфейс ArticleRepository         @dle/core
              ▼
         RestArticleRepository                       @dle/data/rest
              │  http.get('/articles', { schema })
              ▼
         HttpClient: таймаут, AbortSignal, токен,    @dle/data/http
         retry только для GET/PUT/DELETE,
         ошибки → ApiError(code), ответ → Zod.parse
              │
              ▼
   VITE_DATA_SOURCE=mock → MSW перехватывает fetch, отвечает фикстурами
   VITE_DATA_SOURCE=rest → настоящий бекенд по openapi.yaml
```

Почему mock — это тот же REST-адаптер плюс MSW, а не отдельные in-memory-классы: так mock-режим проходит ровно тот же путь (URL, сериализация, Zod-валидация, коды ошибок), что и боевой. Расхождение контракта ловится в разработке, а не на стенде.

Компоненты никогда не вызывают `fetch` и не знают о DTO: на вход им приходят доменные типы (`Article`, `Post`), уже прошедшие валидацию.

## Состояние

- **Серверное** — TanStack Query. Ключи — в `shared/api/query-keys.ts`. Мутации реакций/лайков/подписок — оптимистичные (`onMutate` → откат в `onError` → `invalidateQueries` в `onSettled`).
- **Клиентское** — локальный `useState`; глобально только тема (`ThemeProvider`) и размер шрифта статьи (localStorage).
- **URL** — фильтры и пагинация («Показать ещё» → `?page=N`) живут в адресе.

## Как добавить адаптер к своей CMS

1. Создайте `packages/data/src/cms/<cms>/dto.ts` — Zod-схемы ответов CMS как они есть.
2. Напишите мапперы `dto → домен` в `packages/data/src/cms/<cms>/mappers.ts` (чистые функции, покройте юнит-тестами).
3. Реализуйте нужные порты (`ArticleRepository`, `RubricRepository`, …) в `packages/data/src/cms/<cms>/repositories.ts`, используя `createHttpClient` — таймауты, токен и ошибки уже решены.
4. Порты, которых CMS не умеет (реакции, рассылка), возьмите из прикладного REST-адаптера; идентификаторы и авторизация должны совпадать.
5. Добавьте ветку в `createTimeRepositories()` (`packages/data/src/time.ts`) и значение в `DataSource`.
6. Прогоните контрактные тесты: добавьте адаптер в объект `adapters` в `packages/data/src/__tests__/time.contract.test.ts` — тот же набор проверок, что и для REST.
7. Переключите `VITE_DATA_SOURCE` — в приложениях ничего менять не нужно.

Рабочий пример адаптера — `packages/data/src/strapi/time.ts`; договорённая схема CMS и необходимые серверные политики описаны в [strapi.md](strapi.md). Статьи, рубрики и медиа читаются из Strapi 5, остальные порты — из REST. Набор контрактных тестов общий для обоих адаптеров; Strapi проверяется транспортным MSW-стендом.

Редактор разделён на форму с RHF/Zod, поля формата и блочное тело; мутации и инвалидация кэша находятся в `entities/article/editor.ts`. Общий `useUploadQueue` в `packages/ui` принимает структурный интерфейс загрузки и не зависит от DTO или пакета данных. Приложения инжектируют свой `MediaRepository` через маленькие обёртки.

Операции API описаны в `packages/data/src/contract/openapi.ts`, модели получаются из доменных Zod-схем. `pnpm api:generate` обновляет OpenAPI и типы `openapi-typescript`; `pnpm api:check` проверяет их актуальность. REST-мутации проверяют тела по сгенерированным типам, ответы — по Zod.
