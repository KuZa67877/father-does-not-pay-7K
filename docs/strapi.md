# Пример адаптера Strapi 5

`packages/data/src/strapi/time.ts` реализует статьи (список, поиск, CRUD, похожие, популярные), чтение рубрик и загрузку/удаление медиа. Остальные порты берутся из REST: авторизация, теги/темы, реакции, комментарии, подписки, избранное, личные подборки, рассылка, материалы читателей и виджеты. Приложение по-прежнему получает только `TimeRepositories`.

Это пример фронтенд-адаптера под указанную ниже схему, а не готовый сервер Strapi. Требуются коллекции и прикладные контроллеры/политики на стороне CMS. Настоящий экземпляр CMS в репозиторий не включён; транспорт проверен на MSW-стенде Strapi 5 и общим набором контрактных тестов REST/Strapi. Для Velora `strapi` не предусмотрен: используйте `mock` или `rest`.

## Подключение

```dotenv
VITE_DATA_SOURCE=strapi
VITE_STRAPI_URL=http://localhost:1337
VITE_API_URL=http://localhost:3000/api
```

`VITE_STRAPI_URL` — корень CMS без `/api`, адаптер добавляет его сам. Запускайте `pnpm dev:time`. REST API и CMS должны принимать один пользовательский Bearer-токен (либо шлюз обменивает его сервером), поддерживать CORS для фронтенда и использовать общие идентификаторы. Токен администратора CMS в клиентское окружение добавлять нельзя. Личные подборки REST должны читать те же статьи из CMS, а подписки/комментарии — ссылаться на их `documentId`.

## Договорённая схема коллекций

**Draft & Publish отключён** у `articles`; статус приложения хранится отдельно в `publicationState`. Это позволяет получать собственные черновики и публикации одной страницей, без двух версий одного документа. При подключении проекта с нативным Draft & Publish потребуется другой маппинг статуса и политика выдачи.

| Коллекция               | Поля                                                                                                                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rubrics`               | `slug`, `name`, `icon`, `color`, `parentId` (nullable documentId), `description?`, `subscribersCount`; необязательные `articlesCount`, `lastArticle`                                                                         |
| `tags`                  | `slug`, `name`                                                                                                                                                                                                               |
| `articles`              | `slug`, `title`, `lead`, `publicationState` (draft/published), `body` JSON, `format` JSON, `author` JSON, `source` nullable JSON, `rubric` relation, `subrubric` nullable relation, `tags` relations, `cover` nullable media |
| Поля проекции статьи    | `publishedAt`, `updatedAt`, `readingTimeMin`, `views`, `commentsCount`, `reactions` JSON, `isFavorite`, `isFeatured`, `isBreaking`                                                                                           |
| Индексы фильтров статьи | `authorLogin`, `formatKind`, `searchText` (заголовок + анонс + имена тегов)                                                                                                                                                  |

`body`, `format`, `author`, `source`, `reactions` соответствуют доменным схемам в `packages/core/src/time/models.ts`. Проекция ответа должна содержать их полностью, даже при создании/обновлении. Персональные `isFavorite` и `reactions.mine` вычисляются для текущего пользователя; счётчики агрегируются из прикладного API. `publishedAt` в проекции — дата публикации приложения, включая определённую дату для черновика, а не нативный nullable-флаг Strapi. Её и `updatedAt` возвращайте в ISO 8601.

Контроллеры `create`/`update` принимают `{data:{...}}`. Адаптер преобразует `rubricId → rubric`, `subrubricId → subrubric`, `coverId → cover`, `status → publicationState`, `tags → tagNames`. Прикладной контроллер обязан разрешить `tagNames` в отношения `tags`, назначить автора из сессии, уникальный slug, даты, якоря заголовков, время чтения и поля индексов. При PUT меняются переданные поля; остальные сохраняются. Пользовательские счётчики и автор из тела запроса не принимаются.

Проверка прав обязательна в `find`, `findOne`, `create`, `update`, `delete`, upload и прикладных портах. Публичная выдача содержит только опубликованные статьи; `status=all` или удаление фильтра в запросе не должны открывать чужие черновики. Не полагайтесь на фильтр `mine` или проверки UI. При обновлении/удалении разрешён автор или администратор, при чтении чужого черновика — `404`.

## DTO и маппинг

Strapi 5 возвращает плоские записи в `data`, а `meta.pagination` содержит `page`, `pageSize`, `total`. Адаптер запрашивает `populate` для cover/rubric/subrubric/tags, переводит `documentId` в строковый доменный `id`, `publicationState` в `status`, вложенные отношения — в краткие доменные объекты. DTO проверяется Zod до преобразования, готовый `Article` — после него.

```json
{
  "data": {
    "title": "Новая городская набережная",
    "rubric": "rubricDocumentId",
    "subrubric": null,
    "cover": "7",
    "tagNames": ["город"],
    "publicationState": "draft"
  }
}
```

Это пример частичного PUT `/api/articles/{documentId}`; создание требует полный ввод статьи. Ответ — `{data:{documentId,...полная проекция статьи}}` с заполненными отношениями.

Фильтры домена преобразуются в `filters[...]`, сортировка — в `sort`, пагинация — в `pagination[...]`. Рубрика фильтруется по rubric/subrubric через `$or`, теги — по отношению, форматы — по индексному `formatKind`. Сигнал отмены передаётся HTTP-клиенту. Личные списки (`favorites`, `subscribed`) запрашиваются у REST, который объединяет CMS-контент и пользовательское состояние.

Upload plugin использует поле `files` на `/api/upload` и возвращает массив файлов. У файлов сохраняется числовой `id` (в домене — строка); относительный URL раскрывается относительно корня CMS, KB переводятся в байты, MIME — в тип медиа. Удаление — `/api/upload/files/{numericId}`. Прикладной REST должен понимать те же media ID, в том числе для `submissions`.

Официальные источники: [REST Strapi 5](https://docs.strapi.io/cms/api/rest/), [populate](https://docs.strapi.io/cms/api/rest/populate-select), [фильтры](https://docs.strapi.io/cms/api/rest/filters), [сортировка и пагинация](https://docs.strapi.io/cms/api/rest/sort-pagination), [Upload](https://docs.strapi.io/cms/api/rest/upload).
