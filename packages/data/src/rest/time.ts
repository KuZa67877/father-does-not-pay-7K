import { paginatedSchema, type TokenStore } from '@dle/core';
import {
  ArticlePreviewSchema,
  ArticleSchema,
  AuthorSchema,
  CitySummarySchema,
  CommentSchema,
  CurrencyRateSchema,
  NewsletterSubscribeResultSchema,
  ReactionsSchema,
  RubricSchema,
  RubricStatsSchema,
  SubscriptionStateSchema,
  TagSchema,
  WeatherForecastSchema,
  type ArticleQuery,
  type TimeRepositories,
} from '@dle/core/time';
import { z } from 'zod';
import type { HttpClient, Query } from '../http/client';
import { createRestAuthRepository, createRestMediaRepository, Void } from './common';

const PaginatedArticles = paginatedSchema(ArticlePreviewSchema);
const enc = encodeURIComponent;

const articleQuery = (q: ArticleQuery): Query => ({ ...q });

/** REST-адаптер «Хроники» по контракту openapi.yaml. */
export function createRestTimeRepositories(http: HttpClient, tokens: TokenStore): TimeRepositories {
  return {
    articles: {
      list: (params, opts) =>
        http.get('/articles', { query: articleQuery(params), schema: PaginatedArticles, signal: opts?.signal }),
      trending: (limit = 5, opts) =>
        http.get('/articles/trending', { query: { limit }, schema: z.array(ArticlePreviewSchema), signal: opts?.signal }),
      getBySlug: (slug, opts) => http.get(`/articles/${enc(slug)}`, { schema: ArticleSchema, signal: opts?.signal }),
      related: (id, limit = 4, opts) =>
        http.get(`/articles/${enc(id)}/related`, {
          query: { limit },
          schema: z.array(ArticlePreviewSchema),
          signal: opts?.signal,
        }),
      create: (input) => http.post('/articles', { body: input, schema: ArticleSchema }),
      update: (id, input) => http.patch(`/articles/${enc(id)}`, { body: input, schema: ArticleSchema }),
      remove: (id) => http.delete(`/articles/${enc(id)}`, { schema: Void }),
      setFavorite: (id, value) => http.put(`/articles/${enc(id)}/favorite`, { body: { value }, schema: Void }),
    },
    rubrics: {
      list: (opts) => http.get('/rubrics', { schema: z.array(RubricSchema), signal: opts?.signal }),
      getBySlug: (slug, opts) => http.get(`/rubrics/${enc(slug)}`, { schema: RubricSchema, signal: opts?.signal }),
      stats: (id, opts) => http.get(`/rubrics/${enc(id)}/stats`, { schema: RubricStatsSchema, signal: opts?.signal }),
      authors: (id, opts) =>
        http.get(`/rubrics/${enc(id)}/authors`, { schema: z.array(AuthorSchema), signal: opts?.signal }),
    },
    tags: {
      getBySlug: (slug, opts) => http.get(`/tags/${enc(slug)}`, { schema: TagSchema, signal: opts?.signal }),
      topics: (limit = 6, opts) =>
        http.get('/topics', { query: { limit }, schema: z.array(TagSchema), signal: opts?.signal }),
    },
    comments: {
      list: (articleId, opts) =>
        http.get(`/articles/${enc(articleId)}/comments`, { schema: z.array(CommentSchema), signal: opts?.signal }),
      create: (articleId, input) =>
        http.post(`/articles/${enc(articleId)}/comments`, { body: input, schema: CommentSchema }),
      like: (id, value) => http.put(`/comments/${enc(id)}/like`, { body: { value }, schema: Void }),
    },
    reactions: {
      react: (articleId, type) =>
        http.put(`/articles/${enc(articleId)}/reaction`, { body: { type }, schema: ReactionsSchema }),
    },
    subscriptions: {
      list: (opts) => http.get('/me/subscriptions', { schema: z.array(z.string()), signal: opts?.signal }),
      set: (rubricId, value) =>
        http.put(`/rubrics/${enc(rubricId)}/subscription`, { body: { value }, schema: SubscriptionStateSchema }),
    },
    newsletter: {
      subscribe: (email) => http.post('/newsletter', { body: { email }, schema: NewsletterSubscribeResultSchema }),
    },
    submissions: {
      send: (input) => http.post('/submissions', { body: input, schema: z.object({ id: z.string() }) }),
    },
    weather: {
      forecast: (city, opts) =>
        http.get('/widgets/weather', { query: { city }, schema: WeatherForecastSchema, signal: opts?.signal }),
    },
    currency: {
      rates: (opts) => http.get('/widgets/currency', { schema: z.array(CurrencyRateSchema), signal: opts?.signal }),
    },
    city: {
      today: (opts) => http.get('/widgets/city', { schema: CitySummarySchema, signal: opts?.signal }),
    },
    media: createRestMediaRepository(http),
    auth: createRestAuthRepository(http, tokens),
  };
}
