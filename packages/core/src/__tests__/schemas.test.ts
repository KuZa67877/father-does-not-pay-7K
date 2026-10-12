import { describe, expect, it } from 'vitest';
import { ArticleFormatSchema, ArticleInputSchema, CommentSchema } from '../time/models';
import { buildToc, ensureHeadingAnchors, matchesReadingTime } from '../time/utils';
import { PostInputSchema } from '../velora/models';

describe('ArticleFormat — discriminated union', () => {
  it('принимает подкаст с таймкодами', () => {
    const r = ArticleFormatSchema.safeParse({
      kind: 'podcast',
      audio: { id: 'a1', type: 'audio', url: '/a.mp3' },
      timecodes: [{ time: 0, label: 'Вступление' }],
    });
    expect(r.success).toBe(true);
  });
  it('отклоняет видео без провайдера', () => {
    expect(ArticleFormatSchema.safeParse({ kind: 'video', url: 'x' }).success).toBe(false);
  });
});

describe('ArticleInput', () => {
  it('сообщает понятную ошибку на коротком заголовке', () => {
    const r = ArticleInputSchema.safeParse({
      title: 'Ой',
      lead: '',
      body: [],
      coverId: null,
      rubricId: 'r1',
      subrubricId: null,
      tags: [],
      format: { kind: 'standard' },
      status: 'draft',
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/минимум 5/);
  });
});

describe('CommentSchema — рекурсивное дерево', () => {
  it('валидирует вложенные ответы', () => {
    const author = { id: 'u1', name: 'Анна', login: 'anna', avatar: null, isVerified: false };
    const leaf = {
      id: 'c2',
      articleId: 'a1',
      parentId: 'c1',
      author,
      text: 'Согласна',
      createdAt: '2026-10-12T10:00:00+03:00',
      likesCount: 0,
      isLiked: false,
      replies: [],
    };
    const r = CommentSchema.safeParse({ ...leaf, id: 'c1', parentId: null, replies: [leaf] });
    expect(r.success).toBe(true);
  });
});

describe('PostInput', () => {
  const base = {
    title: null,
    text: '',
    photoIds: [],
    video: null,
    fileIds: [],
    poll: null,
    location: null,
    categoryIds: ['c1'],
  };
  it('запрещает пустой пост', () => {
    expect(PostInputSchema.safeParse(base).success).toBe(false);
  });
  it('не больше 4 фото', () => {
    const r = PostInputSchema.safeParse({ ...base, photoIds: ['1', '2', '3', '4', '5'] });
    expect(r.success).toBe(false);
  });
  it('опрос — минимум 2 варианта', () => {
    const r = PostInputSchema.safeParse({
      ...base,
      poll: { question: 'Кофе или чай?', options: ['Кофе'], multiple: false },
    });
    expect(r.success).toBe(false);
  });
});

describe('утилиты статьи', () => {
  it('оглавление и уникальные якоря', () => {
    const blocks = ensureHeadingAnchors([
      { type: 'heading', level: 2, text: 'Что случилось', anchor: '' },
      { type: 'paragraph', text: '…' },
      { type: 'heading', level: 2, text: 'Что случилось', anchor: '' },
    ]);
    expect(buildToc(blocks).map((t) => t.anchor)).toEqual(['chto-sluchilos', 'chto-sluchilos-2']);
  });
  it('фильтр «Сколько у вас минут?»', () => {
    expect(matchesReadingTime({ readingTimeMin: 5 }, 'short')).toBe(true);
    expect(matchesReadingTime({ readingTimeMin: 6 }, 'short')).toBe(false);
    expect(matchesReadingTime({ readingTimeMin: 6 }, 'long')).toBe(true);
  });
});
