import { type Media, type User, type UserPreview } from '@dle/core';
import type {
  Category,
  Highlight,
  Notification,
  NotificationType,
  Post,
  PostComment,
  PostOriginal,
  Profile,
  Story,
} from '@dle/core/velora';
import { fakerRU as faker } from '@faker-js/faker';
import { avatar, baseNow, minutesAgo, photo } from '../shared/utils';
import { CATEGORIES, COMMENTS, POSTS, STORY_TEXTS, USERS } from './content';

export const FIXTURE_SEED = 1704;

export interface VeloraFixtures {
  users: Profile[];
  categories: Category[];
  posts: Post[];
  comments: Map<string, PostComment[]>;
  stories: Story[];
  highlights: Map<string, Highlight[]>;
  notifications: Notification[];
  /** login → множество логинов, на кого подписан. */
  follows: Map<string, Set<string>>;
  demoUser: User;
}

const logoMedia: Media = photo('olkha-team', 240, 240, 'Команда Ольхи');

export const toPreview = (u: Pick<Profile, 'id' | 'name' | 'login' | 'avatar' | 'isVerified' | 'occupation'>): UserPreview => ({
  id: u.id,
  name: u.name,
  login: u.login,
  avatar: u.avatar,
  isVerified: u.isVerified,
  ...(u.occupation ? { occupation: u.occupation } : {}),
});

export const stripRepost = ({ repostOf: _repost, ...rest }: Post): PostOriginal => rest;

export function buildVeloraFixtures(): VeloraFixtures {
  faker.seed(FIXTURE_SEED);
  const now = baseNow();

  const users: Profile[] = USERS.map((u, i) => ({
    id: `u-${u.login}`,
    name: u.name,
    login: u.login,
    avatar: u.img ? avatar(u.img, u.name) : logoMedia,
    cover: photo(`cover-${u.login}`, 1600, 500, ''),
    role: u.login === 'admin' ? 'admin' : 'author',
    occupation: u.occupation,
    ...(u.city ? { city: u.city } : {}),
    link: `https://example.com/${u.login}`,
    bio: `${u.occupation}. Пишу о том, что люблю: ${u.topic.toLowerCase()}.`,
    isVerified: i < 4 || u.login === 'admin',
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    followedByPreview: [],
    isFollowing: false,
    isFollower: false,
    notify: false,
    pinnedPostId: null,
    mainTopic: u.topic,
  }));
  const byLogin = new Map(users.map((u) => [u.login, u]));
  const userAt = (login: string): Profile => {
    const u = byLogin.get(login);
    if (!u) throw new Error(`Нет пользователя ${login}`);
    return u;
  };

  /* Граф подписок: demo читает половину, часть читает demo в ответ (это «Круги»). */
  const follows = new Map<string, Set<string>>(users.map((u) => [u.login, new Set<string>()]));
  const follow = (a: string, b: string) => follows.get(a)?.add(b);
  for (const login of ['belova', 'lebedeva', 'gromov', 'orlov', 'vetrov', 'admin']) follow('demo', login);
  for (const login of ['belova', 'lebedeva', 'kim', 'morozova', 'saveliev', 'tikhonova']) follow(login, 'demo');
  for (const u of users) {
    for (const v of faker.helpers.arrayElements(users, { min: 2, max: 6 })) {
      if (v.login !== u.login && u.login !== 'demo') follow(u.login, v.login);
    }
  }

  const categories: Category[] = CATEGORIES.map((c) => ({
    id: `cat-${c.slug}`,
    slug: c.slug,
    name: c.name,
    description: c.description,
    icon: c.icon,
    color: c.color,
    cover: photo(`cat-${c.slug}`, 1600, 600, c.name),
    postsCount: 0,
    subscribersCount: faker.number.int({ min: 180, max: 5400 }),
    isSubscribed: ['music', 'design', 'food', 'retro-cars', 'tech'].includes(c.slug),
    notify: c.slug === 'music',
  }));
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  const posts: Post[] = [];
  const comments = new Map<string, PostComment[]>();
  POSTS.forEach((seed, i) => {
    const author = userAt(seed.author);
    const id = `p-${i + 1}`;
    const likers = faker.helpers.arrayElements(
      users.filter((u) => u.login !== seed.author),
      3,
    );
    const thread: PostComment[] = Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, (_, k) => {
      const who = faker.helpers.arrayElement(users);
      return {
        id: `pc-${id}-${k}`,
        postId: id,
        parentId: null,
        author: toPreview(who),
        text: faker.helpers.arrayElement(COMMENTS),
        createdAt: minutesAgo(Math.max(1, seed.ago - faker.number.int({ min: 1, max: 30 })), now),
        likesCount: faker.number.int({ min: 0, max: 24 }),
        isLiked: false,
        replies: [],
      };
    });
    const first = thread[0];
    if (first && faker.datatype.boolean({ probability: 0.5 })) {
      first.replies.push({
        ...first,
        id: `${first.id}-r`,
        parentId: first.id,
        author: toPreview(author),
        text: 'Спасибо! Рада, что откликнулось.',
        likesCount: 2,
        replies: [],
      });
    }
    comments.set(id, thread);

    const original = seed.repostOf !== undefined ? posts[seed.repostOf] : undefined;
    const poll = seed.poll
      ? {
          id: `poll-${id}`,
          question: seed.poll.question,
          options: seed.poll.options.map(([text, votes], k) => ({ id: `opt-${id}-${k}`, text, votes })),
          totalVotes: seed.poll.options.reduce((n, [, v]) => n + v, 0),
          votedOptionId: null,
          multiple: false,
          closesAt: null,
        }
      : null;

    posts.push({
      id,
      author: toPreview(author),
      title: seed.title ?? null,
      text: seed.text,
      photos: Array.from({ length: seed.photos ?? 0 }, (_, k) =>
        photo(`${id}-${k}`, 1200, k === 0 && (seed.photos ?? 0) === 1 ? 900 : 1200, `Фото ${k + 1}`),
      ),
      video: seed.video
        ? {
            provider: 'mp4',
            url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
            poster: photo(`${id}-poster`, 1200, 675).url,
          }
        : null,
      audio: null,
      files: (seed.files ?? []).map((name, k) => ({
        id: `file-${id}-${k}`,
        type: 'file',
        url: '#',
        alt: '',
        name,
        size: faker.number.int({ min: 120_000, max: 4_800_000 }),
        mime: name.endsWith('.pdf') ? 'application/pdf' : 'image/png',
      })),
      poll,
      location: seed.location ? { name: seed.location } : null,
      categories: seed.categories.flatMap((slug) => {
        const c = catBySlug.get(slug);
        return c ? [{ id: c.id, slug: c.slug, name: c.name, icon: c.icon, color: c.color }] : [];
      }),
      likesCount: faker.number.int({ min: 3, max: 420 }),
      likedByPreview: likers.map(toPreview),
      commentsCount: thread.reduce((n, c) => n + 1 + c.replies.length, 0),
      repostsCount: faker.number.int({ min: 0, max: 30 }),
      viewsCount: faker.number.int({ min: 200, max: 9000 }),
      isLiked: faker.datatype.boolean({ probability: 0.25 }),
      isSaved: false,
      isPinned: Boolean(seed.pinned),
      createdAt: minutesAgo(seed.ago, now),
      repostOf: original ? stripRepost(original) : null,
    });
    if (seed.pinned) author.pinnedPostId = id;
  });

  for (const c of categories) c.postsCount = posts.filter((p) => p.categories.some((x) => x.id === c.id)).length;
  for (const u of users) {
    u.postsCount = posts.filter((p) => p.author.id === u.id).length;
    u.followingCount = follows.get(u.login)?.size ?? 0;
    const followers = users.filter((v) => follows.get(v.login)?.has(u.login));
    u.followersCount = followers.length + faker.number.int({ min: 0, max: 40 });
    u.followedByPreview = followers.slice(0, 3).map(toPreview);
  }

  /* Истории: у половины авторов, живут 24 часа. */
  const stories: Story[] = [];
  const storyAuthors = ['demo', 'vetrov', 'kim', 'lebedeva', 'belova', 'gromov', 'orlov', 'morozova', 'tikhonova'];
  storyAuthors.forEach((login, i) => {
    const author = userAt(login);
    const count = login === 'demo' ? 1 : faker.number.int({ min: 1, max: 3 });
    for (let k = 0; k < count; k++) {
      const ago = faker.number.int({ min: 10, max: 1200 });
      const createdAt = minutesAgo(ago, now);
      const text = k === 1 ? STORY_TEXTS[(i + k) % STORY_TEXTS.length] : undefined;
      stories.push({
        id: `s-${login}-${k}`,
        author: toPreview(author),
        content: text
          ? { kind: 'text', text: text.text, background: text.background, font: text.font }
          : { kind: 'photo', media: photo(`story-${login}-${k}`, 1080, 1920, ''), caption: '' },
        audience: k === 2 ? 'close' : 'all',
        createdAt,
        expiresAt: minutesAgo(ago - 24 * 60, now),
        isViewed: i > 5,
        isLiked: false,
        viewsCount: faker.number.int({ min: 4, max: 160 }),
        ...(login === 'demo' ? { viewers: users.slice(1, 6).map(toPreview) } : {}),
      });
    }
  });

  const highlights = new Map<string, Highlight[]>([
    [
      'demo',
      [
        { id: 'h-ladoga', title: 'Ладога', cover: photo('hl-ladoga', 400, 400), storyIds: ['s-demo-0'] },
        { id: 'h-film', title: 'Плёнка', cover: photo('hl-film', 400, 400), storyIds: [] },
        { id: 'h-city', title: 'Город', cover: photo('hl-city', 400, 400), storyIds: [] },
      ],
    ],
  ]);

  /* Уведомления для demo. */
  const types: NotificationType[] = ['like', 'follow', 'comment', 'mention', 'reply', 'repost', 'new_post'];
  const demoPosts = posts.filter((p) => p.author.login === 'demo');
  const notifications: Notification[] = Array.from({ length: 22 }, (_, i) => {
    const type = types[i % types.length] ?? 'like';
    const actor = faker.helpers.arrayElement(users.filter((u) => u.login !== 'demo'));
    const post = type === 'follow' ? undefined : faker.helpers.arrayElement(type === 'new_post' ? posts : demoPosts.length ? demoPosts : posts);
    return {
      id: `n-${i}`,
      type,
      actor: toPreview(actor),
      othersCount: type === 'like' ? faker.number.int({ min: 0, max: 14 }) : 0,
      post: post ? { id: post.id, excerpt: (post.title ?? post.text).slice(0, 80), thumb: post.photos[0]?.url ?? null } : null,
      commentExcerpt: type === 'comment' || type === 'reply' || type === 'mention' ? faker.helpers.arrayElement(COMMENTS) : null,
      createdAt: minutesAgo(15 + i * 170, now),
      isRead: i > 3,
    };
  });

  const demo = userAt('demo');
  const demoUser: User = {
    id: demo.id,
    name: demo.name,
    login: demo.login,
    avatar: demo.avatar,
    cover: demo.cover,
    role: 'author',
    occupation: demo.occupation,
    city: demo.city,
    link: demo.link,
    bio: demo.bio,
    isVerified: demo.isVerified,
  };

  return { users, categories, posts, comments, stories, highlights, notifications, follows, demoUser };
}
