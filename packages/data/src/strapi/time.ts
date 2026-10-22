import { ApiError, MediaSchema, type TokenStore } from '@dle/core';
import {
  ArticleSchema,
  RubricSchema,
  SHORT_READ_MAX_MIN,
  type ArticleInput,
  type ArticleQuery,
  type TimeRepositories,
} from '@dle/core/time';
import * as z from 'zod/mini';
import type { HttpClient, Query } from '../http/client';
import { createRestTimeRepositories } from '../rest/time';
import { mediaTypeFromMime, Void } from '../rest/common';

const enc = encodeURIComponent;
const RubricDto = z.extend(z.omit(RubricSchema, { id: true }), {
  documentId: z.string().check(z.minLength(1)),
});
const TagDto = z.object({ documentId: z.string(), slug: z.string(), name: z.string() });
const UploadDto = z.object({
  id: z.int(),
  url: z.string(),
  mime: z.string(),
  name: z.string(),
  size: z.number(),
  alternativeText: z.optional(z.nullable(z.string())),
  width: z.optional(z.nullable(z.number())),
  height: z.optional(z.nullable(z.number())),
});
const ArticleDto = z.extend(
  z.omit(ArticleSchema, {
    id: true,
    status: true,
    cover: true,
    rubric: true,
    subrubric: true,
    tags: true,
  }),
  {
    documentId: z.string().check(z.minLength(1)),
    publicationState: z.enum(['draft', 'published']),
    cover: z.nullable(UploadDto),
    rubric: RubricDto,
    subrubric: z.nullable(RubricDto),
    tags: z.array(TagDto),
  },
);
const Single = z.object({ data: ArticleDto });
const List = z.object({
  data: z.array(ArticleDto),
  meta: z.object({
    pagination: z.object({ page: z.number(), pageSize: z.number(), total: z.number() }),
  }),
});
const populate: Query = {
  'populate[0]': 'cover',
  'populate[1]': 'rubric',
  'populate[2]': 'subrubric',
  'populate[3]': 'tags',
};

const mapCms = <T>(map: () => T): T => {
  try {
    return map();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('invalid_response', 'CMS вернула некорректные данные', undefined, error);
  }
};

/** Пример интеграции Strapi 5: коллекции и обязательные серверные политики описаны в docs/strapi.md. */
export function createStrapiTimeRepositories(
  cms: HttpClient,
  rest: HttpClient,
  tokens: TokenStore,
  origin: string,
): TimeRepositories {
  const fallback = createRestTimeRepositories(rest, tokens);
  const media = (dto: z.infer<typeof UploadDto>) =>
    mapCms(() =>
      MediaSchema.parse({
        id: String(dto.id),
        type: mediaTypeFromMime(dto.mime),
        url: new URL(dto.url, origin).href,
        alt: dto.alternativeText ?? '',
        name: dto.name,
        mime: dto.mime,
        size: Math.round(dto.size * 1024),
        ...(dto.width ? { width: dto.width } : {}),
        ...(dto.height ? { height: dto.height } : {}),
      }),
    );
  const rubric = (dto: z.infer<typeof RubricDto>) =>
    mapCms(() => RubricSchema.parse({ ...dto, id: dto.documentId }));
  const article = (dto: z.infer<typeof ArticleDto>) =>
    mapCms(() =>
      ArticleSchema.parse({
        ...dto,
        id: dto.documentId,
        status: dto.publicationState,
        cover: dto.cover ? media(dto.cover) : null,
        rubric: rubric(dto.rubric),
        subrubric: dto.subrubric ? rubric(dto.subrubric) : null,
        tags: dto.tags.map((t) => ({ ...t, id: t.documentId })),
      }),
    );
  const data = (input: Partial<ArticleInput>) => {
    const { rubricId, subrubricId, coverId, tags, status, ...fields } = input;
    return {
      ...fields,
      ...(rubricId !== undefined ? { rubric: rubricId } : {}),
      ...(subrubricId !== undefined ? { subrubric: subrubricId } : {}),
      ...(coverId !== undefined ? { cover: coverId } : {}),
      // Серверный контроллер разрешает названия тегов и вычисляет производные поля.
      ...(tags !== undefined ? { tagNames: tags } : {}),
      ...(status !== undefined ? { publicationState: status } : {}),
    };
  };
  const query = async (q: ArticleQuery): Promise<Query> => {
    const filters: Query = {
      ...populate,
      'pagination[page]': q.page ?? 1,
      'pagination[pageSize]': q.pageSize ?? 12,
      sort: `${q.sort === 'popular' ? 'views' : q.sort === 'discussed' ? 'commentsCount' : 'publishedAt'}:desc`,
    };
    const eq = (field: string, value: string | boolean | undefined) => {
      if (value !== undefined) filters[`filters[${field}][$eq]`] = value;
    };
    if (q.status !== 'all') eq('publicationState', q.status ?? 'published');
    eq('isFeatured', q.featured);
    eq('isBreaking', q.breaking);
    eq('authorLogin', q.author);
    if (q.mine) {
      const user = await fallback.auth.me();
      if (!user) throw new ApiError('unauthorized', 'Войдите в аккаунт', 401);
      eq('authorLogin', user.login);
    }
    if (q.rubric) {
      filters['filters[$or][0][rubric][slug][$eq]'] = q.rubric;
      filters['filters[$or][1][subrubric][slug][$eq]'] = q.rubric;
    }
    if (q.tag) filters['filters[tags][slug][$eq]'] = q.tag;
    if (q.search) filters['filters[searchText][$containsi]'] = q.search;
    if (q.since) filters['filters[publishedAt][$gte]'] = q.since;
    if (q.readingTime === 'short') filters['filters[readingTimeMin][$lte]'] = SHORT_READ_MAX_MIN;
    if (q.readingTime === 'long') filters['filters[readingTimeMin][$gt]'] = SHORT_READ_MAX_MIN;
    if (q.format)
      (Array.isArray(q.format) ? q.format : [q.format]).forEach((f, i) => {
        filters[`filters[formatKind][$in][${i}]`] = f;
      });
    return filters;
  };
  const list: TimeRepositories['articles']['list'] = async (q, opts) => {
    // Личные подборки требуют пользовательского состояния из прикладного API.
    if (q.favorites || q.subscribed) return fallback.articles.list(q, opts);
    const dto = await cms.get('/articles', {
      query: await query(q),
      schema: List,
      signal: opts?.signal,
    });
    return { items: dto.data.map(article), ...dto.meta.pagination };
  };
  return {
    ...fallback,
    articles: {
      ...fallback.articles,
      list,
      getBySlug: async (slug, opts) => {
        const dto = await cms.get('/articles', {
          query: { ...populate, 'filters[slug][$eq]': slug, 'pagination[pageSize]': 1 },
          schema: List,
          signal: opts?.signal,
        });
        const first = dto.data[0];
        if (!first) throw new ApiError('not_found', 'Материал не найден', 404);
        return article(first);
      },
      trending: async (limit = 5, opts) =>
        (
          await list(
            {
              sort: 'popular',
              pageSize: limit,
              since: new Date(Date.now() - 86400000).toISOString(),
            },
            opts,
          )
        ).items,
      related: async (id, limit = 4, opts) => {
        const current = article(
          (
            await cms.get(`/articles/${enc(id)}`, {
              query: populate,
              schema: Single,
              signal: opts?.signal,
            })
          ).data,
        );
        return (
          await list({ rubric: current.rubric.slug, pageSize: Math.min(50, limit + 1) }, opts)
        ).items
          .filter((a) => a.id !== id)
          .slice(0, limit);
      },
      create: async (input) =>
        article(
          (
            await cms.post('/articles', {
              query: populate,
              body: { data: data(input) },
              schema: Single,
            })
          ).data,
        ),
      update: async (id, input) =>
        article(
          (
            await cms.put(`/articles/${enc(id)}`, {
              query: populate,
              body: { data: data(input) },
              schema: Single,
            })
          ).data,
        ),
      remove: async (id) => {
        await cms.delete(`/articles/${enc(id)}`, { schema: Void });
      },
    },
    rubrics: {
      ...fallback.rubrics,
      list: async (opts) =>
        (
          await cms.get('/rubrics', {
            query: { 'pagination[pageSize]': 100 },
            schema: z.object({ data: z.array(RubricDto) }),
            signal: opts?.signal,
          })
        ).data.map(rubric),
      getBySlug: async (slug, opts) => {
        const dto = await cms.get('/rubrics', {
          query: { 'filters[slug][$eq]': slug },
          schema: z.object({ data: z.array(RubricDto) }),
          signal: opts?.signal,
        });
        if (!dto.data[0]) throw new ApiError('not_found', 'Рубрика не найдена', 404);
        return rubric(dto.data[0]);
      },
    },
    media: {
      upload: async (file, opts) => {
        const form = new FormData();
        form.append('files', file);
        const files = await cms.upload('/upload', form, {
          schema: z.array(UploadDto).check(z.minLength(1)),
          signal: opts?.signal,
          onProgress: opts?.onProgress,
        });
        const first = files[0];
        if (!first) throw new ApiError('invalid_response', 'Сервер не вернул загруженный файл');
        return media(first);
      },
      remove: async (id) => {
        await cms.delete(`/upload/files/${enc(id)}`, { schema: Void });
      },
    },
  };
}
