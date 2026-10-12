import { slugify, type User } from '@dle/core';
import {
  articleReadingTime,
  type Article,
  type ArticleBlock,
  type ArticleFormat,
  type Author,
  type Comment,
  type Rubric,
  type RubricPreview,
  type Tag,
} from '@dle/core/time';
import { fakerRU as faker } from '@faker-js/faker';
import { avatar, baseNow, minutesAgo, photo } from '../shared/utils';
import {
  ARTICLES,
  AUTHORS,
  COMMENT_TEXTS,
  FACTS_POOL,
  HEADINGS,
  PARAGRAPHS,
  RUBRICS,
  SUMMARY_POOL,
  type ArticleSeed,
} from './content';

export const FIXTURE_SEED = 2026;

export interface TimeFixtures {
  rubrics: Rubric[];
  authors: Author[];
  articles: Article[];
  comments: Map<string, Comment[]>;
  tags: Tag[];
  demoUser: User;
}

const toPreview = (r: Rubric): RubricPreview => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  icon: r.icon,
  color: r.color,
});

function buildRubrics(): Rubric[] {
  const out: Rubric[] = [];
  for (const seed of RUBRICS) {
    const id = `r-${seed.slug}`;
    out.push({
      id,
      slug: seed.slug,
      name: seed.name,
      icon: seed.icon,
      color: seed.color,
      parentId: null,
      description: seed.description,
      subscribersCount: faker.number.int({ min: 1200, max: 48000 }),
    });
    for (const child of seed.children ?? []) {
      out.push({
        id: `r-${child.slug}`,
        slug: child.slug,
        name: child.name,
        icon: child.icon,
        color: seed.color,
        parentId: id,
        subscribersCount: faker.number.int({ min: 300, max: 9000 }),
      });
    }
  }
  return out;
}

function buildAuthors(): Author[] {
  return AUTHORS.map((a, i) => ({
    id: `u-${a.login}`,
    name: a.name,
    login: a.login,
    avatar: avatar(i + 11, a.name),
    isVerified: true,
    occupation: a.occupation,
    bio: `${a.occupation}. Пишет для «Хроники» с ${faker.number.int({ min: 2015, max: 2023 })} года.`,
  }));
}

let paragraphCursor = 0;
const nextParagraph = () => PARAGRAPHS[paragraphCursor++ % PARAGRAPHS.length] ?? '';

function buildBody(seed: ArticleSeed, slug: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const sections = seed.long ? 4 : 2;
  blocks.push({ type: 'summary', items: faker.helpers.arrayElements(SUMMARY_POOL, 3) });
  for (let s = 0; s < sections; s++) {
    const heading = HEADINGS[s % HEADINGS.length] ?? 'Подробности';
    blocks.push({ type: 'heading', level: 2, text: heading, anchor: `${slugify(heading, 40)}` });
    const paragraphs = seed.long ? 3 : 2;
    for (let p = 0; p < paragraphs; p++) blocks.push({ type: 'paragraph', text: nextParagraph() });
    if (s === 0 && seed.long) blocks.push({ type: 'facts', items: faker.helpers.arrayElements(FACTS_POOL, 3) });
    if (s === 1) {
      blocks.push({
        type: 'quote',
        text: 'Мы не ждём мгновенного результата. Важно, чтобы изменения были понятны людям.',
        cite: faker.person.fullName(),
      });
    }
    if (s === 1 && seed.long) {
      blocks.push({
        type: 'image',
        media: photo(`${slug}-inline`, 1200, 800, 'Иллюстрация к материалу'),
        caption: 'Фото: архив редакции',
      });
      blocks.push({
        type: 'list',
        ordered: false,
        items: ['Проверьте, касается ли это вас', 'Сохраните документы', 'Задайте вопрос через форму'],
      });
    }
  }
  return blocks;
}

function buildFormat(seed: ArticleSeed, slug: string, author: Author): ArticleFormat {
  switch (seed.format) {
    case 'video':
      return { kind: 'video', provider: 'mp4', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' };
    case 'photoReport':
      return {
        kind: 'photoReport',
        gallery: Array.from({ length: 8 }, (_, i) => ({
          ...photo(`${slug}-g${i}`, 1600, i % 3 === 2 ? 1100 : 1067, `Кадр ${i + 1}`),
        })),
      };
    case 'podcast':
      return {
        kind: 'podcast',
        audio: {
          id: `audio-${slug}`,
          type: 'audio',
          url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
          alt: '',
          duration: faker.number.int({ min: 900, max: 2700 }),
          poster: photo(`${slug}-poster`, 600, 600).url,
        },
        timecodes: [
          { time: 0, label: 'Вступление' },
          { time: 95, label: 'О чём на самом деле речь' },
          { time: 410, label: 'Вопросы слушателей' },
          { time: 780, label: 'Что делать прямо сейчас' },
        ],
      };
    case 'opinion':
      return { kind: 'opinion', quote: seed.quote ?? seed.lead, author };
    default:
      return { kind: 'standard' };
  }
}

function buildComments(articleId: string, count: number): Comment[] {
  const roots: Comment[] = [];
  for (let i = 0; i < count; i++) {
    const n = faker.number.int({ min: 20, max: 69 });
    const root: Comment = {
      id: `c-${articleId}-${i}`,
      articleId,
      parentId: null,
      author: {
        id: `reader-${n}`,
        name: faker.person.fullName(),
        login: `reader${n}`,
        avatar: avatar(n),
        isVerified: false,
      },
      text: faker.helpers.arrayElement(COMMENT_TEXTS),
      createdAt: minutesAgo(faker.number.int({ min: 5, max: 600 })),
      likesCount: faker.number.int({ min: 0, max: 40 }),
      isLiked: false,
      replies: [],
    };
    if (faker.datatype.boolean({ probability: 0.4 })) {
      const m = faker.number.int({ min: 20, max: 69 });
      root.replies.push({
        ...root,
        id: `${root.id}-r`,
        parentId: root.id,
        author: { id: `reader-${m}`, name: faker.person.fullName(), login: `reader${m}`, avatar: avatar(m), isVerified: false },
        text: faker.helpers.arrayElement(COMMENT_TEXTS),
        likesCount: faker.number.int({ min: 0, max: 9 }),
        replies: [],
      });
    }
    roots.push(root);
  }
  return roots;
}

export function buildTimeFixtures(): TimeFixtures {
  faker.seed(FIXTURE_SEED);
  paragraphCursor = 0;
  const now = baseNow();

  const rubrics = buildRubrics();
  const rubricBySlug = new Map(rubrics.map((r) => [r.slug, r]));
  const authors = buildAuthors();
  const tagsBySlug = new Map<string, Tag>();
  const comments = new Map<string, Comment[]>();

  const articles: Article[] = ARTICLES.map((seed, i) => {
    const rubric = rubricBySlug.get(seed.rubric);
    if (!rubric) throw new Error(`Неизвестная рубрика ${seed.rubric}`);
    const sub = seed.sub ? rubricBySlug.get(seed.sub) ?? null : null;
    const author = authors[seed.author % authors.length] as Author;
    const slug = slugify(seed.title, 64);
    const id = `a-${i + 1}`;
    const body = buildBody(seed, slug);
    const tags = seed.tags.map((name) => {
      const tagSlug = slugify(name, 32);
      const existing = tagsBySlug.get(tagSlug);
      if (existing) return existing;
      const tag: Tag = { id: `t-${tagSlug}`, slug: tagSlug, name };
      tagsBySlug.set(tagSlug, tag);
      return tag;
    });
    const commentsCount = faker.number.int({ min: 0, max: 6 });
    const thread = buildComments(id, commentsCount);
    comments.set(id, thread);
    const publishedAt = minutesAgo(seed.ago, now);
    return {
      id,
      slug,
      title: seed.title,
      lead: seed.lead,
      body,
      cover: photo(slug, 1600, 1000, seed.title),
      rubric: toPreview(rubric),
      subrubric: sub ? toPreview(sub) : null,
      tags,
      author,
      status: 'published',
      publishedAt,
      updatedAt: publishedAt,
      readingTimeMin: articleReadingTime(body, seed.lead) + (seed.long ? 5 : 0),
      views: faker.number.int({ min: 800, max: 64000 }),
      commentsCount: thread.reduce((n, c) => n + 1 + c.replies.length, 0),
      reactions: {
        counts: {
          useful: faker.number.int({ min: 0, max: 220 }),
          like: faker.number.int({ min: 0, max: 340 }),
          doubt: faker.number.int({ min: 0, max: 40 }),
          against: faker.number.int({ min: 0, max: 25 }),
        },
        mine: null,
      },
      format: buildFormat(seed, slug, author),
      isFeatured: Boolean(seed.featured),
      isBreaking: Boolean(seed.breaking),
      isFavorite: false,
      source: seed.source ? { name: seed.source } : null,
    };
  });

  for (const r of rubrics) {
    r.articlesCount = articles.filter((a) => a.rubric.id === r.id || a.subrubric?.id === r.id).length;
  }

  const demoUser: User = {
    id: 'u-demo',
    name: 'Анна Соколова',
    login: 'demo',
    avatar: avatar(5, 'Анна Соколова'),
    cover: null,
    role: 'editor',
    occupation: 'Читатель и автор',
    city: 'Москва',
    isVerified: false,
  };

  return { rubrics, authors, articles, comments, tags: [...tagsBySlug.values()], demoUser };
}
