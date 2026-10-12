import { paginatedSchema, UserPreviewSchema, type TokenStore } from '@dle/core';
import {
  CategorySchema,
  HighlightSchema,
  NotificationSchema,
  PostCommentSchema,
  PostSchema,
  ProfileSchema,
  ProfileStatsSchema,
  StorySchema,
  StoryGroupSchema,
  TopAuthorSchema,
  TrendingTagSchema,
  type VeloraRepositories,
} from '@dle/core/velora';
import { z } from 'zod';
import type { HttpClient } from '../http/client';
import { createRestAuthRepository, createRestMediaRepository, Void } from './common';

const enc = encodeURIComponent;
const PaginatedPosts = paginatedSchema(PostSchema);
const PaginatedProfiles = paginatedSchema(ProfileSchema);
const PaginatedNotifications = paginatedSchema(NotificationSchema);
const LikeState = z.object({ likesCount: z.number().int(), isLiked: z.boolean() });

/** REST-адаптер Velora по контракту openapi.yaml. */
export function createRestVeloraRepositories(
  http: HttpClient,
  tokens: TokenStore,
): VeloraRepositories {
  return {
    feed: {
      list: (q, opts) =>
        http.get('/feed', { query: { ...q }, schema: PaginatedPosts, signal: opts?.signal }),
    },
    posts: {
      list: (q, opts) =>
        http.get('/posts', { query: { ...q }, schema: PaginatedPosts, signal: opts?.signal }),
      get: (id, opts) =>
        http.get(`/posts/${enc(id)}`, { schema: PostSchema, signal: opts?.signal }),
      create: (input) => http.post('/posts', { body: input, schema: PostSchema }),
      update: (id, input) => http.patch(`/posts/${enc(id)}`, { body: input, schema: PostSchema }),
      remove: (id) => http.delete(`/posts/${enc(id)}`, { schema: Void }),
      like: (id, value) =>
        http.put(`/posts/${enc(id)}/like`, { body: { value }, schema: LikeState }),
      save: (id, value) => http.put(`/posts/${enc(id)}/save`, { body: { value }, schema: Void }),
      pin: (id, value) => http.put(`/posts/${enc(id)}/pin`, { body: { value }, schema: Void }),
      report: (id, reason) =>
        http.post(`/posts/${enc(id)}/report`, { body: { reason }, schema: Void }),
      vote: (id, optionIds) =>
        http.post(`/posts/${enc(id)}/vote`, { body: { optionIds }, schema: PostSchema }),
      comments: (id, sort, opts) =>
        http.get(`/posts/${enc(id)}/comments`, {
          query: { sort },
          schema: z.array(PostCommentSchema),
          signal: opts?.signal,
        }),
      addComment: (id, input) =>
        http.post(`/posts/${enc(id)}/comments`, { body: input, schema: PostCommentSchema }),
    },
    stories: {
      groups: (opts) =>
        http.get('/stories', { schema: z.array(StoryGroupSchema), signal: opts?.signal }),
      create: (input) => http.post('/stories', { body: input, schema: StorySchema }),
      markViewed: (id) => http.post(`/stories/${enc(id)}/view`, { schema: Void }),
      like: (id, value) => http.put(`/stories/${enc(id)}/like`, { body: { value }, schema: Void }),
      reply: (id, text) => http.post(`/stories/${enc(id)}/reply`, { body: { text }, schema: Void }),
      viewers: (id, opts) =>
        http.get(`/stories/${enc(id)}/viewers`, {
          schema: z.array(UserPreviewSchema),
          signal: opts?.signal,
        }),
      highlights: (login, opts) =>
        http.get(`/users/${enc(login)}/highlights`, {
          schema: z.array(HighlightSchema),
          signal: opts?.signal,
        }),
    },
    notifications: {
      list: (q, opts) =>
        http.get('/notifications', {
          query: { ...q },
          schema: PaginatedNotifications,
          signal: opts?.signal,
        }),
      unreadCount: (opts) =>
        http.get('/notifications/unread-count', {
          schema: z.object({ count: z.number().int() }).transform((r) => r.count),
          signal: opts?.signal,
        }),
      markRead: (ids) => http.post('/notifications/read', { body: { ids }, schema: Void }),
    },
    users: {
      getProfile: (login, opts) =>
        http.get(`/users/${enc(login)}`, { schema: ProfileSchema, signal: opts?.signal }),
      updateProfile: (input) => http.patch('/me/profile', { body: input, schema: ProfileSchema }),
      follow: (login, value) =>
        http.put(`/users/${enc(login)}/follow`, {
          body: { value },
          schema: ProfileSchema.pick({ isFollowing: true, followersCount: true }),
        }),
      setNotify: (login, value) =>
        http.put(`/users/${enc(login)}/notify`, { body: { value }, schema: Void }),
      followers: (login, q, opts) =>
        http.get(`/users/${enc(login)}/followers`, {
          query: { ...q },
          schema: PaginatedProfiles,
          signal: opts?.signal,
        }),
      following: (login, q, opts) =>
        http.get(`/users/${enc(login)}/following`, {
          query: { ...q },
          schema: PaginatedProfiles,
          signal: opts?.signal,
        }),
      search: (q, opts) =>
        http.get('/users', { query: { ...q }, schema: PaginatedProfiles, signal: opts?.signal }),
      suggestions: (limit = 3, opts) =>
        http.get('/users/suggestions', {
          query: { limit },
          schema: z.array(ProfileSchema),
          signal: opts?.signal,
        }),
      topAuthors: (limit = 4, opts) =>
        http.get('/users/top', {
          query: { limit },
          schema: z.array(TopAuthorSchema),
          signal: opts?.signal,
        }),
    },
    categories: {
      list: (opts) =>
        http.get('/categories', { schema: z.array(CategorySchema), signal: opts?.signal }),
      getBySlug: (slug, opts) =>
        http.get(`/categories/${enc(slug)}`, { schema: CategorySchema, signal: opts?.signal }),
      subscribe: (id, value) =>
        http.put(`/categories/${enc(id)}/subscription`, {
          body: { value },
          schema: CategorySchema.pick({ isSubscribed: true, subscribersCount: true }),
        }),
      setNotify: (id, value) =>
        http.put(`/categories/${enc(id)}/notify`, { body: { value }, schema: Void }),
      trendingTags: (limit = 5, opts) =>
        http.get('/tags/trending', {
          query: { limit },
          schema: z.array(TrendingTagSchema),
          signal: opts?.signal,
        }),
    },
    stats: {
      get: (period, opts) =>
        http.get('/me/stats', {
          query: { period },
          schema: ProfileStatsSchema,
          signal: opts?.signal,
        }),
    },
    media: createRestMediaRepository(http),
    auth: createRestAuthRepository(http, tokens),
  };
}
