import * as common from '@dle/core';
import * as time from '@dle/core/time';
import * as velora from '@dle/core/velora';
import * as z from 'zod/mini';

/** Единственное описание транспортных операций; модели берутся из доменных Zod-схем. */
export function buildOpenApi() {
  const models: Record<string, z.ZodMiniType> = {};
  for (const module of [common, time, velora]) {
    for (const [name, value] of Object.entries(module)) {
      if (name.endsWith('Schema') && value instanceof z.ZodMiniType)
        models[name.slice(0, -6)] = value;
    }
  }
  Object.assign(models, {
    ArticlePatch: z.partial(time.ArticleInputSchema),
    PostPatch: z.partial(z.object(velora.PostInputSchema.shape)),
    ArticlePage: common.paginatedSchema(time.ArticlePreviewSchema),
    PostPage: common.paginatedSchema(velora.PostSchema),
    ProfilePage: common.paginatedSchema(velora.ProfileSchema),
    NotificationPage: common.paginatedSchema(velora.NotificationSchema),
    BooleanInput: z.object({ value: z.boolean() }),
    EmailInput: z.object({ email: z.email() }),
    LikeState: z.object({ likesCount: z.int().check(z.nonnegative()), isLiked: z.boolean() }),
    FollowState: z.pick(velora.ProfileSchema, { isFollowing: true, followersCount: true }),
    CategorySubscription: z.pick(velora.CategorySchema, {
      isSubscribed: true,
      subscribersCount: true,
    }),
    Count: z.object({ count: z.int().check(z.nonnegative()) }),
    Receipt: z.object({ id: common.IdSchema }),
    ReactionInput: z.object({ type: z.nullable(time.ReactionTypeSchema) }),
    ReadInput: z.object({ ids: z.union([z.array(common.IdSchema), z.literal('all')]) }),
    ReplyInput: z.object({ text: z.string().check(z.minLength(1)).check(z.maxLength(2000)) }),
    ReportInput: z.object({ reason: z.string().check(z.minLength(1)) }),
    VoteInput: z.object({ optionIds: z.array(common.IdSchema).check(z.minLength(1)) }),
  });
  const registry = z.registry<{ id: string }>();
  for (const [name, schema] of Object.entries(models)) registry.add(schema, { id: name });
  const { schemas } = z.toJSONSchema(registry, {
    target: 'draft-2020-12',
    uri: (id) => `#/components/schemas/${id}`,
    io: 'input',
  });
  for (const schema of Object.values(schemas)) {
    delete schema['$schema'];
    delete schema['$id'];
  }
  type Json = Record<string, unknown>;
  const paths: Record<string, Record<string, Json>> = {};
  const ref = (name: string): Json => {
    if (name.endsWith('[]')) return { type: 'array', items: ref(name.slice(0, -2)) };
    if (name.endsWith('?')) return { anyOf: [ref(name.slice(0, -1)), { type: 'null' }] };
    return { $ref: `#/components/schemas/${name}` };
  };
  const op = (
    app: 'common' | 'time' | 'velora',
    method: string,
    path: string,
    response?: string,
    body?: string,
    query: Record<string, Json> = {},
    auth = false,
  ) => {
    const parameters = [
      ...[...path.matchAll(/\{(\w+)\}/g)].map((m) => ({
        name: m[1],
        in: 'path',
        required: true,
        schema: { type: 'string', minLength: 1 },
      })),
      ...Object.entries(query).map(([name, schema]) => ({
        name,
        in: 'query',
        schema,
        ...(schema.type === 'array' ? { style: 'form', explode: true } : {}),
      })),
    ];
    const code = response
      ? method === 'post' &&
        (['/articles', '/posts', '/stories', '/submissions', '/auth/register', '/media'].includes(
          path,
        ) ||
          path.endsWith('/comments'))
        ? '201'
        : '200'
      : '204';
    const operation: Json = {
      operationId: `${app}_${method}_${path.replace(/[^a-zA-Z0-9]+/g, '_')}`,
      tags: [app],
      summary: `${method.toUpperCase()} ${path}`,
      parameters,
      security: auth ? [{ bearerAuth: [] }] : [{}, { bearerAuth: [] }],
      responses: {
        [code]: response
          ? {
              description: 'Успешный результат',
              content: { 'application/json': { schema: ref(response) } },
            }
          : { description: 'Выполнено, тело отсутствует' },
        default: { $ref: '#/components/responses/Error' },
      },
      ...(body
        ? {
            requestBody: { required: true, content: { 'application/json': { schema: ref(body) } } },
          }
        : {}),
    };
    (paths[path] ??= {})[method] = operation;
  };
  const string = { type: 'string' };
  const bool = { type: 'boolean' };
  const integer = { type: 'integer', minimum: 1 };
  const limit = { ...integer, maximum: 50 };
  const cursor = { cursor: string, limit };
  const choices = (...values: (string | number)[]) => ({
    type: typeof values[0] === 'number' ? 'integer' : 'string',
    enum: values,
  });
  op('common', 'get', '/auth/me', 'User?');
  op('common', 'post', '/auth/login', 'AuthSession', 'LoginInput');
  op('common', 'post', '/auth/register', 'AuthSession', 'RegisterInput');
  op('common', 'post', '/auth/logout');
  op('common', 'post', '/auth/password-reset', undefined, 'EmailInput');
  op('common', 'post', '/media', 'Media');
  const mediaOperation = paths['/media']?.['post'];
  if (mediaOperation)
    mediaOperation['requestBody'] = {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['file'],
            properties: {
              file: {
                type: 'string',
                format: 'binary',
                description: 'До 20 МБ; допустимые MIME проверяет сервер',
              },
              type: ref('MediaType'),
            },
          },
        },
      },
    };
  op('common', 'delete', '/media/{id}', undefined, undefined, {}, true);
  op('time', 'get', '/articles', 'ArticlePage', undefined, {
    page: integer,
    pageSize: limit,
    rubric: string,
    tag: string,
    author: string,
    format: {
      type: 'array',
      items: choices('standard', 'video', 'photoReport', 'podcast', 'opinion'),
    },
    readingTime: choices('all', 'short', 'long'),
    search: string,
    sort: choices('new', 'popular', 'discussed'),
    status: choices('draft', 'published', 'all'),
    featured: bool,
    breaking: bool,
    mine: bool,
    favorites: bool,
    subscribed: bool,
    since: { type: 'string', format: 'date-time' },
  });
  op('time', 'post', '/articles', 'Article', 'ArticleInput', {}, true);
  op('time', 'get', '/articles/trending', 'ArticlePreview[]', undefined, { limit });
  op('time', 'get', '/articles/{key}', 'Article');
  op('time', 'patch', '/articles/{key}', 'Article', 'ArticlePatch', {}, true);
  op('time', 'delete', '/articles/{key}', undefined, undefined, {}, true);
  op('time', 'get', '/articles/{id}/related', 'ArticlePreview[]', undefined, { limit });
  op('time', 'put', '/articles/{id}/favorite', undefined, 'BooleanInput', {}, true);
  op('time', 'put', '/articles/{id}/reaction', 'Reactions', 'ReactionInput', {}, true);
  op('time', 'get', '/articles/{id}/comments', 'Comment[]');
  op('time', 'post', '/articles/{id}/comments', 'Comment', 'CommentInput', {}, true);
  op('common', 'put', '/comments/{id}/like', 'LikeState', 'BooleanInput', {}, true);
  const commentLike = paths['/comments/{id}/like']?.['put'];
  if (commentLike)
    commentLike['responses'] = {
      '200': {
        description: 'Velora: новое состояние',
        content: { 'application/json': { schema: ref('LikeState') } },
      },
      '204': { description: 'Time: выполнено без тела' },
      default: { $ref: '#/components/responses/Error' },
    };
  op('time', 'get', '/rubrics', 'Rubric[]');
  op('time', 'get', '/rubrics/{key}', 'Rubric');
  op('time', 'get', '/rubrics/{id}/stats', 'RubricStats');
  op('time', 'get', '/rubrics/{id}/authors', 'Author[]');
  op('time', 'put', '/rubrics/{id}/subscription', 'SubscriptionState', 'BooleanInput', {}, true);
  op('time', 'get', '/me/subscriptions', 'Id[]', undefined, {}, true);
  op('time', 'get', '/tags/{slug}', 'Tag');
  op('time', 'get', '/topics', 'Tag[]', undefined, { limit });
  op('time', 'post', '/newsletter', 'NewsletterSubscribeResult', 'EmailInput');
  op('time', 'post', '/submissions', 'Receipt', 'ReaderSubmissionInput');
  op('time', 'get', '/widgets/weather', 'WeatherForecast', undefined, { city: string });
  op('time', 'get', '/widgets/currency', 'CurrencyRate[]');
  op('time', 'get', '/widgets/city', 'CitySummary');
  op('velora', 'get', '/feed', 'PostPage', undefined, {
    ...cursor,
    kind: choices('all', 'following', 'circles'),
    category: string,
  });
  op('velora', 'get', '/posts', 'PostPage', undefined, {
    ...cursor,
    author: string,
    category: string,
    tag: string,
    search: string,
    tab: choices('posts', 'media', 'reposts', 'saved'),
    sort: choices('new', 'popular'),
    period: choices('week', 'month', 'all'),
  });
  op('velora', 'post', '/posts', 'Post', 'PostInput', {}, true);
  op('velora', 'get', '/posts/{id}', 'Post');
  op('velora', 'patch', '/posts/{id}', 'Post', 'PostPatch', {}, true);
  op('velora', 'delete', '/posts/{id}', undefined, undefined, {}, true);
  for (const action of ['like', 'save', 'pin'])
    op(
      'velora',
      'put',
      `/posts/{id}/${action}`,
      action === 'like' ? 'LikeState' : undefined,
      'BooleanInput',
      {},
      true,
    );
  op('velora', 'post', '/posts/{id}/report', undefined, 'ReportInput', {}, true);
  op('velora', 'post', '/posts/{id}/vote', 'Post', 'VoteInput', {}, true);
  op('velora', 'get', '/posts/{id}/comments', 'PostComment[]', undefined, {
    sort: choices('new', 'popular'),
  });
  op('velora', 'post', '/posts/{id}/comments', 'PostComment', 'CommentInput', {}, true);
  op('velora', 'get', '/stories', 'StoryGroup[]');
  op('velora', 'get', '/stories/{id}', 'Story');
  op('velora', 'post', '/stories', 'Story', 'StoryInput', {}, true);
  op('velora', 'post', '/stories/{id}/view', undefined, undefined, {}, true);
  op('velora', 'put', '/stories/{id}/like', undefined, 'BooleanInput', {}, true);
  op('velora', 'post', '/stories/{id}/reply', undefined, 'ReplyInput', {}, true);
  op('velora', 'get', '/stories/{id}/viewers', 'UserPreview[]', undefined, {}, true);
  op('velora', 'get', '/users/{login}/highlights', 'Highlight[]');
  op('velora', 'get', '/notifications', 'NotificationPage', undefined, cursor, true);
  op('velora', 'get', '/notifications/unread-count', 'Count', undefined, {}, true);
  op('velora', 'post', '/notifications/read', undefined, 'ReadInput', {}, true);
  op('velora', 'get', '/users', 'ProfilePage', undefined, { ...cursor, search: string });
  op('velora', 'get', '/users/suggestions', 'Profile[]', undefined, { limit });
  op('velora', 'get', '/users/top', 'TopAuthor[]', undefined, { limit });
  op('velora', 'get', '/users/{login}', 'Profile');
  op('velora', 'patch', '/me/profile', 'Profile', 'ProfileInput', {}, true);
  op('velora', 'put', '/users/{login}/follow', 'FollowState', 'BooleanInput', {}, true);
  op('velora', 'put', '/users/{login}/notify', undefined, 'BooleanInput', {}, true);
  for (const relation of ['followers', 'following'])
    op('velora', 'get', `/users/{login}/${relation}`, 'ProfilePage', undefined, {
      cursor: string,
      search: string,
    });
  op('velora', 'get', '/categories', 'Category[]');
  op('velora', 'get', '/categories/{slug}', 'Category');
  op(
    'velora',
    'put',
    '/categories/{id}/subscription',
    'CategorySubscription',
    'BooleanInput',
    {},
    true,
  );
  op('velora', 'put', '/categories/{id}/notify', undefined, 'BooleanInput', {}, true);
  op('velora', 'get', '/tags/trending', 'TrendingTag[]', undefined, { limit });
  op('velora', 'get', '/me/stats', 'ProfileStats', undefined, { period: choices(7, 30, 90) }, true);
  return {
    openapi: '3.1.0',
    info: {
      title: 'Хроника / Ольха REST API',
      version: '1.0.0',
      description:
        'Два независимых API с одинаковым общим контрактом. Time и Velora имеют разные base URL. GET /articles/{key} принимает slug, PATCH/DELETE — id. Схемы сгенерированы из Zod; сервер также проверяет бизнес-правила, права и ссылки на медиа.',
    },
    servers: [{ url: '/api', description: 'API выбранного приложения' }],
    paths,
    components: {
      schemas,
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
      responses: {
        Error: {
          description: 'Ошибка (400/401/403/404/409/413/422/429/5xx)',
          content: { 'application/json': { schema: ref('ApiErrorBody') } },
        },
      },
    },
  };
}
