# dle-templates-frontend

Учебная реализация фронтенда двух сайтов на TypeScript с архитектурой под любой бекенд или headless-CMS:

| Приложение | По мотивам | Что это | Порт |
|---|---|---|---|
| `apps/time` — **«Хроника»** | шаблон Time | городское издание: лента, рубрики, статьи пяти форматов, сводка | 5173 |
| `apps/velora` — **«Ольха»** | шаблон Velora | спокойная соцсеть: лента, истории, профили, каналы | 5174 |

Названия, логотипы, тексты и картинки — свои; от оригинала взяты композиция, сетка и числовые токены (см. [`docs/design-tokens.md`](docs/design-tokens.md)).

## Запуск

```bash
nvm use                 # Node 22 LTS (.nvmrc)
corepack enable         # pnpm из поля packageManager
pnpm install
cp .env.example .env.local
pnpm dev                # оба приложения: http://localhost:5173 и http://localhost:5174
pnpm dev:time           # только «Хроника»
pnpm dev:velora         # только «Ольха»
```

По умолчанию всё работает без бекенда: запросы к `/api` перехватывает MSW (Mock Service Worker) и отвечает фикстурами. Созданные статьи, посты и загруженные файлы живут в памяти вкладки до перезагрузки.

## Скрипты

| Команда | Что делает |
|---|---|
| `pnpm dev` | dev-серверы обоих приложений |
| `pnpm build` | `tsc` + `vite build` для приложений |
| `pnpm typecheck` | `tsc --noEmit` во всех пакетах |
| `pnpm lint` | ESLint (typescript-eslint, react-hooks, jsx-a11y), без предупреждений |
| `pnpm test` | Vitest: юнит-, контрактные и компонентные тесты всех пакетов |
| `pnpm check` | всё сразу: typecheck + lint + test |
| `pnpm format` | Prettier |

Перед коммитом husky запускает lint-staged.

## Переменные окружения

| Переменная | Значения | По умолчанию |
|---|---|---|
| `VITE_DATA_SOURCE` | `mock` · `rest` · `strapi` | `mock` |
| `VITE_API_URL` | базовый URL REST API по `openapi.yaml` | `/api` |
| `VITE_STRAPI_URL` | URL Strapi (пример CMS-адаптера, этап 5) | `http://localhost:1337` |

### Как переключить источник данных

```bash
# .env.local
VITE_DATA_SOURCE=rest
VITE_API_URL=https://api.example.com
```

Компоненты не меняются: адаптер выбирается в `apps/*/src/app/data-source.ts` и кладётся в DI-контейнер (React Context). Остальной код видит только интерфейсы из `@dle/core`. Подробнее — [`docs/architecture.md`](docs/architecture.md).

## Структура

```
apps/time, apps/velora   приложения (feature-sliced: app → pages → widgets → features → entities → shared)
packages/core            доменные модели, Zod-схемы, интерфейсы репозиториев, утилиты — без React
packages/data            HTTP-клиент, REST-адаптеры, MSW-мок с фикстурами
packages/ui              общие примитивы: Button, Modal, Tabs, Image, Avatar, Skeleton, ThemeToggle…
packages/config          общие tsconfig, ESLint, Prettier
docs/                    архитектура, токены, ADR, контракт API
```

Ход работы и открытые вопросы — в [`PROGRESS.md`](PROGRESS.md).
