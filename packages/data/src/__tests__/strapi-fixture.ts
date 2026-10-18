import type { Article, ArticleInput, ArticleQuery } from '@dle/core/time';
import type { Media } from '@dle/core';
import { http, HttpResponse } from 'msw';
import { createMemoryTokenStore, createHttpClient } from '../http/client';
import { createRestTimeRepositories } from '../rest/time';
import { handle, readJson } from '../mock/shared/utils';

/** Транспортный стенд Strapi 5 поверх тех же доменных фикстур, что и REST. */
export function strapiContractHandlers(cms: string, rest: string) {
  const repo = createRestTimeRepositories(
    createHttpClient({ baseUrl: rest, retries: 0 }),
    createMemoryTokenStore(),
  );
  const uploads = new Map<number, Media>();
  const uploadDto = (media: Media) => {
    let entry = [...uploads].find(([, m]) => m.id === media.id);
    if (!entry) {
      entry = [uploads.size + 1, media];
      uploads.set(...entry);
    }
    return {
      id: entry[0],
      url: media.url,
      mime: media.mime ?? 'image/jpeg',
      name: media.name ?? 'image.jpg',
      size: (media.size ?? 0) / 1024,
      alternativeText: media.alt,
    };
  };
  const dto = (a: Article) => ({
    ...a,
    documentId: a.id,
    publicationState: a.status,
    cover: a.cover ? uploadDto(a.cover) : null,
    rubric: { ...a.rubric, documentId: a.rubric.id, parentId: null, subscribersCount: 0 },
    subrubric: a.subrubric
      ? { ...a.subrubric, documentId: a.subrubric.id, parentId: a.rubric.id, subscribersCount: 0 }
      : null,
    tags: a.tags.map((t) => ({ ...t, documentId: t.id })),
  });
  const input = async (request: Request) => {
    const { data } = await readJson<{
      data: Partial<ArticleInput> & {
        rubric?: string;
        subrubric?: string | null;
        cover?: string | null;
        tagNames?: string[];
        publicationState?: ArticleInput['status'];
      };
    }>(request);
    const { rubric, subrubric, cover, tagNames, publicationState, ...other } = data;
    return {
      ...other,
      ...(rubric !== undefined ? { rubricId: rubric } : {}),
      ...(subrubric !== undefined ? { subrubricId: subrubric } : {}),
      ...(cover !== undefined
        ? { coverId: cover ? (uploads.get(Number(cover))?.id ?? cover) : null }
        : {}),
      ...(tagNames ? { tags: tagNames } : {}),
      ...(publicationState ? { status: publicationState } : {}),
    };
  };
  return [
    http.get(
      `${cms}/articles`,
      handle(async ({ request }) => {
        const p = new URL(request.url).searchParams;
        const slug = p.get('filters[slug][$eq]');
        if (slug)
          return HttpResponse.json({
            data: [dto(await repo.articles.getBySlug(slug))],
            meta: { pagination: { page: 1, pageSize: 1, total: 1 } },
          });
        const q: ArticleQuery = {
          page: Number(p.get('pagination[page]') ?? 1),
          pageSize: Number(p.get('pagination[pageSize]') ?? 12),
          status: (p.get('filters[publicationState][$eq]') ?? 'all') as ArticleQuery['status'],
          sort: p.get('sort')?.startsWith('views')
            ? 'popular'
            : p.get('sort')?.startsWith('commentsCount')
              ? 'discussed'
              : 'new',
        };
        const rubric = p.get('filters[$or][0][rubric][slug][$eq]');
        if (rubric) q.rubric = rubric;
        const author = p.get('filters[authorLogin][$eq]');
        if (author) q.author = author;
        const tag = p.get('filters[tags][slug][$eq]');
        if (tag) q.tag = tag;
        const search = p.get('filters[searchText][$containsi]');
        if (search) q.search = search;
        const since = p.get('filters[publishedAt][$gte]');
        if (since) q.since = since;
        const formats = [...p]
          .filter(([k]) => k.startsWith('filters[formatKind][$in]'))
          .map(([, v]) => v);
        if (formats.length) q.format = formats as NonNullable<ArticleQuery['format']>;
        if (p.has('filters[readingTimeMin][$lte]')) q.readingTime = 'short';
        if (p.has('filters[readingTimeMin][$gt]')) q.readingTime = 'long';
        if (p.has('filters[isFeatured][$eq]'))
          q.featured = p.get('filters[isFeatured][$eq]') === 'true';
        if (p.has('filters[isBreaking][$eq]'))
          q.breaking = p.get('filters[isBreaking][$eq]') === 'true';
        const page = await repo.articles.list(q);
        const data = await Promise.all(
          page.items.map(async (a) => dto(await repo.articles.getBySlug(a.slug))),
        );
        return HttpResponse.json({
          data,
          meta: { pagination: { page: page.page, pageSize: page.pageSize, total: page.total } },
        });
      }),
    ),
    http.get(
      `${cms}/articles/:id`,
      handle(async ({ params }) =>
        HttpResponse.json({ data: dto(await repo.articles.getBySlug(String(params['id']))) }),
      ),
    ),
    http.post(
      `${cms}/articles`,
      handle(async ({ request }) =>
        HttpResponse.json(
          { data: dto(await repo.articles.create((await input(request)) as ArticleInput)) },
          { status: 201 },
        ),
      ),
    ),
    http.put(
      `${cms}/articles/:id`,
      handle(async ({ request, params }) =>
        HttpResponse.json({
          data: dto(await repo.articles.update(String(params['id']), await input(request))),
        }),
      ),
    ),
    http.delete(
      `${cms}/articles/:id`,
      handle(async ({ params }) => {
        await repo.articles.remove(String(params['id']));
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.get(
      `${cms}/rubrics`,
      handle(async ({ request }) => {
        const slug = new URL(request.url).searchParams.get('filters[slug][$eq]');
        return HttpResponse.json({
          data: (await repo.rubrics.list())
            .filter((r) => !slug || r.slug === slug)
            .map((r) => ({ ...r, documentId: r.id })),
        });
      }),
    ),
    http.post(
      `${cms}/upload`,
      handle(async ({ request }) => {
        const file = (await request.formData()).get('files');
        if (!(file instanceof File)) throw new Error('Ожидается поле files');
        return HttpResponse.json([uploadDto(await repo.media.upload(file))]);
      }),
    ),
    http.delete(
      `${cms}/upload/files/:id`,
      handle(async ({ params }) => {
        const media = uploads.get(Number(params['id']));
        if (media) await repo.media.remove(media.id);
        return new HttpResponse(null, { status: 204 });
      }),
    ),
  ];
}
