# Журнал прогресса

> В начале каждой сессии: прочитать `PROMPT.md`, этот файл и `git log --oneline -20`, продолжить с «Текущий этап».

## Текущий этап

**Этап 1 — Фундамент — готов, ждём «ок» на этап 2.** `tsc`, ESLint (0 предупреждений), Prettier, Vitest (71 тест) и `vite build` обоих приложений проходят. Скриншоты проверки — `docs/screenshots/stage-1/`.

## Сделано

### Этап 1 — Фундамент

- [x] Референсы: живые демо открыты (после входа на dlemod.com), 62 скриншота скачаны в `docs/reference/` (вне git).
- [x] `docs/design-tokens.md` — палитры обеих тем, шрифты, типографика, сетка, радиусы, брейкпоинты; контраст посчитан.
- [x] Монорепо pnpm: `apps/{time,velora}`, `packages/{core,data,ui,config}`; `.nvmrc` (22), `packageManager`, `.gitignore`, `.env.example`.
- [x] Конфиги: tsconfig (strict, noUncheckedIndexedAccess), ESLint flat (typescript-eslint strict, react-hooks, jsx-a11y, запрет `any` и `@ts-ignore`, границы слоёв), Prettier, Vitest projects, husky + lint-staged.
- [x] `@dle/core`: общие типы (Id, Slug, ISODate, Media, Paginated, User, ApiError), модели и Zod-схемы Time (Article + 5 форматов, 8 типов блоков, Rubric, Comment-дерево, реакции, сводка) и Velora (Post, Poll, Story, Highlight, Notification, Category, Profile, ProfileStats), интерфейсы всех репозиториев, утилиты (время чтения, склонения, slugify, #теги/@упоминания, подсветка поиска, даты по-русски).
- [x] `@dle/data`: HTTP-клиент (таймаут, AbortController, токен, retry только для GET/PUT/DELETE, ошибки → ApiError, Zod-валидация ответов, загрузка с прогрессом через XHR), REST-адаптеры обоих приложений, MSW-мок с фикстурами (faker seed + свои тексты на русском), фабрики `createTimeRepositories / createVeloraRepositories` по `VITE_DATA_SOURCE`.
- [x] `@dle/ui`: Button, IconButton, Spinner, NamedIcon (реестр Lucide), Image (lazy, srcset, плавное появление, заглушка), Avatar, Skeleton, Modal (`<dialog>`), Tabs (WAI-ARIA), ThemeToggle + ThemeProvider (prefers-color-scheme, localStorage, без вспышки), Empty/ErrorState, хуки (useMediaQuery, useIntersection, useNow, useDebouncedValue), base.css.
- [x] Приложения: провайдеры (Query, Theme, DI-контейнер), data router с lazy-страницами, токены CSS обеих тем, шрифты Fontsource, inline-скрипт темы; страница-проверка фундамента (данные из мока через DI).
- [x] Тесты: утилиты core, Zod-схемы, HTTP-клиент, контрактные тесты репозиториев обоих приложений (REST + MSW), тема и srcset в ui.
- [x] Документация: README, `docs/architecture.md`, ADR 0001–0004.
- [x] Проверки после установки: исправлены типы обёртки MSW-обработчиков, якоря заголовков во вводе, автоочистка Testing Library, a11y (`role=list`), разнесены не-компонентные экспорты для Fast Refresh.
- [x] Чанк мок-сервера: 596 → 193 КБ (faker без полной ru-локали, имена — свой список). Грузится лениво и только в mock-режиме.
- [x] `mockServiceWorker.js` сгенерирован в `apps/*/public`.

## Осталось (по этапам PROMPT.md)

2. Time MVP: каркас, главная, рубрика, статья (5 форматов), поиск, тёмная тема, адаптив.
3. Velora MVP: три колонки + мобильная панель, лента, пост, профиль, «Новый пост».
4. Интерактив: реакции, подписки, комментарии, озвучка, истории, уведомления, рассылка.
5. Редакторская часть, загрузка медиа, REST-адаптер (готов), Strapi-адаптер, `openapi.yaml`, `docs/api-contract.md`.
6. Полировка: статистика, обзор, 404, печать, a11y, Lighthouse, тесты, документация.

## Открытые вопросы
- Основной JS-чанк ≈ 100 КБ gzip, заметная часть — Zod 4. Если Lighthouse на этапе 6 будет < 90, перейдём на `zod/mini` в REST-слое.

- Сеть в моей песочнице не пускает к npm, поэтому зависимости ставятся на машине разработчика (`pnpm install`). В `pnpm-workspace.yaml` включены linux-бинарники (`supportedArchitectures`), чтобы проверки можно было гонять и в Linux-окружении.
- `.claude/skills/` не в git — это локальные инструменты, не часть проекта. Добавить в репозиторий?

## Отличия от оригинала (и почему)

- Бренды: Time → «Хроника», Velora → «Ольха»; свои логотипы.
- Иконки: Lucide вместо Font Awesome (открытый набор по ТЗ).
- Меню Velora на демо: Главная, Обзор, Каналы, Уведомления, Сообщения, Сохранённое, Профиль, Люди (+ «Мои каналы»). В ТЗ перечислено иначе (есть «Моя статистика») — следуем демо и добавляем «Мою статистику» в меню профиля. Порядок блоков главной Time на демо: слайдер + «Сейчас читают», «День по часам», «Рубрики», «Сколько у вас минут?», «Фото и видео», «Разделы», «Мнения», «Сводка», «Подкасты», рассылка «08:00» — следуем демо, а не порядку в ТЗ.
- Фикстуры: картинки — picsum.photos, портреты — i.pravatar.cc, видео/аудио — CC0-примеры MDN.
