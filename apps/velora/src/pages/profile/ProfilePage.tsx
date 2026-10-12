import { formatShortAgo, isApiError, plural } from '@dle/core';
import type { Post, Profile } from '@dle/core/velora';
import { Avatar, EmptyState, ErrorState, Image, NamedIcon, Skeleton, cx } from '@dle/ui';
import { ImageOff, Link2, Mail, MapPin, Pencil, Plus, Share } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useCategories } from '@/entities/category';
import { PostRow, usePost, usePostList } from '@/entities/post';
import { useMe } from '@/entities/session';
import { useHighlights } from '@/entities/story';
import { AvatarStack, UserLine, firstName, useProfile, useSuggestions } from '@/entities/user';
import { FollowButton } from '@/features/follow-user';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { useUi } from '@/shared/model/ui-context';
import { PageHead, Segmented, Verified, WidgetHead } from '@/shared/ui';
import { Rail } from '@/shared/ui/Rail';
import { PostFeed } from '@/widgets/feed';
import { RailFooter } from '@/widgets/rail';
import { NotFoundPage } from '@/pages/not-found';
import s from './ProfilePage.module.css';

type Tab = 'posts' | 'media' | 'reposts' | 'saved';

/** «Читают Дмитрий, Марина и ещё 12». */
const followedByText = (p: Profile) => {
  const names = p.followedByPreview.map((u) => firstName(u.name));
  if (names.length === 0) return null;
  const rest = p.followersCount - names.length;
  if (rest <= 0) return `Читают ${names.join(', ').replace(/, ([^,]*)$/, ' и $1')}`;
  return `Читают ${names.slice(0, 2).join(', ')} и ещё ${rest}`;
};

export function ProfilePage() {
  const { login = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { data: me } = useMe();
  const { data: p, isPending, isError, error, refetch } = useProfile(login);
  const own = me?.login === login;
  const tab =
    (['posts', 'media', 'reposts', 'saved'] as const).find((t) => t === params.get('tab')) ??
    'posts';
  usePageMeta({
    title: p ? `${p.name} (@${p.login})` : `@${login}`,
    description: p?.bio,
    image: p?.avatar?.url,
  });

  if (isError && isApiError(error) && error.code === 'not_found') return <NotFoundPage />;

  const tabs = [
    { key: 'posts', label: 'Посты', count: p?.postsCount },
    { key: 'media', label: 'Медиа' },
    { key: 'reposts', label: 'Репосты' },
    ...(own ? [{ key: 'saved', label: 'Сохранённое' }] : []),
  ].map((t) => ({
    ...t,
    onClick: () => setParams(t.key === 'posts' ? {} : { tab: t.key }, { replace: true }),
  }));

  return (
    <>
      <PageHead back={{ to: routes.home(), label: 'Лента' }}>
        <span className={s.handle}>@{login}</span>
      </PageHead>

      {isPending && <Skeleton height={440} style={{ borderRadius: 24 }} />}
      {isError && !isPending && <ErrorState error={error} onRetry={() => void refetch()} />}
      {p && (
        <>
          <ProfileHead profile={p} own={own} />
          <Highlights login={p.login} own={own} />
          <Segmented label="Разделы профиля" active={tab} items={tabs} className={s.tabs} />
          <ProfileTab profile={p} tab={tab} own={own} />
          <Rail>
            {own ? <MyCategories /> : p.mainTopic && <WritesAbout topic={p.mainTopic} />}
            <SimilarAuthors />
            <RailFooter />
          </Rail>
        </>
      )}
    </>
  );
}

function ProfileHead({ profile: p, own }: { profile: Profile; own: boolean }) {
  const { openProfileEdit, toast } = useUi();
  const followedBy = followedByText(p);
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: p.name, url });
      } catch {
        /* закрыли окно */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Ссылка на профиль скопирована');
    } catch {
      toast('Не удалось скопировать ссылку');
    }
  };
  return (
    <section className={cx('card', s.head)} aria-labelledby="profile-name">
      <div className={s.cover}>
        {p.cover && (
          <Image
            src={p.cover}
            ratio="64/21"
            sizes="(max-width: 700px) 100vw, 640px"
            alt=""
            priority
          />
        )}
      </div>
      <div className={s.bar}>
        <Avatar name={p.name} src={p.avatar?.url} size={112} className={s.av} />
        <div className={s.actions}>
          {own ? (
            <>
              <button type="button" className={s.btn} onClick={openProfileEdit}>
                <Pencil size={16} aria-hidden /> Редактировать
              </button>
              <button
                type="button"
                className={s.square}
                onClick={() => void share()}
                aria-label="Поделиться профилем"
              >
                <Share size={17} aria-hidden />
              </button>
            </>
          ) : (
            <>
              <Link to={routes.messages()} className={s.square} aria-label={`Написать ${p.name}`}>
                <Mail size={17} aria-hidden />
              </Link>
              <FollowButton profile={p} bell />
            </>
          )}
        </div>
      </div>
      <div className={s.info}>
        <h1 id="profile-name" className={s.name}>
          {p.name} {p.isVerified && <Verified size={22} />}
        </h1>
        <p className={s.sub}>
          @{p.login}
          {p.occupation && <> · {p.occupation}</>}
          {p.isFollower && !own && <span className={s.mutual}>читает вас</span>}
        </p>
        {p.bio && <p className={s.bio}>{p.bio}</p>}
        {(p.city || p.link) && (
          <ul className={s.facts}>
            {p.city && (
              <li>
                <MapPin size={15} aria-hidden /> {p.city}
              </li>
            )}
            {p.link && (
              <li>
                <Link2 size={15} aria-hidden />
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={s.link}
                >
                  {p.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              </li>
            )}
          </ul>
        )}
        <div className={s.statsRow}>
          <dl className={s.stats}>
            <div>
              <dd>{p.postsCount}</dd>
              <dt>{plural(p.postsCount, ['пост', 'поста', 'постов'])}</dt>
            </div>
            <div>
              <dd>{p.followersCount}</dd>
              <dt>{plural(p.followersCount, ['читатель', 'читателя', 'читателей'])}</dt>
            </div>
            <div>
              <dd>{p.followingCount}</dd>
              <dt>{plural(p.followingCount, ['подписка', 'подписки', 'подписок'])}</dt>
            </div>
          </dl>
          {followedBy && (
            <p className={s.followedBy}>
              <AvatarStack users={p.followedByPreview} size={24} />
              {followedBy}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Highlights({ login, own }: { login: string; own: boolean }) {
  const { data } = useHighlights(login);
  const { toast } = useUi();
  if (!own && !data?.length) return null;
  return (
    <section className={cx('card', s.highlights)} aria-label="Актуальное">
      <ul className={s.hlList}>
        {own && (
          <li>
            <button
              type="button"
              className={s.hl}
              onClick={() => toast('Подборки историй появятся вместе с историями')}
            >
              <span className={cx(s.hlCover, s.hlNew)}>
                <Plus size={20} aria-hidden />
              </span>
              <span className={s.hlTitle}>Новое</span>
            </button>
          </li>
        )}
        {data?.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              className={s.hl}
              onClick={() => toast('Просмотр историй появится в следующем обновлении')}
            >
              <span className={s.hlCover}>
                {h.cover && <Image src={h.cover} ratio="1/1" sizes="64px" alt="" />}
              </span>
              <span className={s.hlTitle}>{h.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileTab({ profile, tab, own }: { profile: Profile; tab: Tab; own: boolean }) {
  const query = usePostList(tab === 'saved' ? { tab: 'saved' } : { author: profile.login, tab });
  const pinned = usePost(profile.pinnedPostId ?? '');
  const showPinned = tab === 'posts' && profile.pinnedPostId && pinned.data;

  if (tab === 'media') return <MediaWall query={query} />;
  return (
    <div className={s.rows}>
      {showPinned && pinned.data && (
        <div className="card">
          <PostRow post={pinned.data} pinned />
        </div>
      )}
      <PostFeed
        query={query}
        renderItem={(post: Post) =>
          post.id === profile.pinnedPostId && tab === 'posts' ? null : (
            <div key={post.id} className="card">
              <PostRow post={post} />
            </div>
          )
        }
        empty={
          <EmptyState
            title={
              tab === 'saved'
                ? 'Сохранённого пока нет'
                : tab === 'reposts'
                  ? 'Репостов пока нет'
                  : own
                    ? 'Вы ещё ничего не публиковали'
                    : 'Здесь пока пусто'
            }
            text={
              tab === 'saved'
                ? 'Нажмите на закладку под постом — он появится здесь.'
                : own
                  ? 'Расскажите о себе первым постом — кнопка «Новый пост» слева.'
                  : undefined
            }
          />
        }
      />
    </div>
  );
}

function MediaWall({ query }: { query: ReturnType<typeof usePostList> }) {
  const photos = (query.data?.pages.flatMap((p) => p.items) ?? []).flatMap((post) =>
    post.photos.map((ph) => ({ post, ph })),
  );
  if (query.isPending) return <Skeleton height={300} style={{ borderRadius: 24 }} />;
  if (photos.length === 0)
    return <EmptyState icon={<ImageOff size={28} aria-hidden />} title="Фото и видео пока нет" />;
  return (
    <ul className={cx('card', s.wall)}>
      {photos.map(({ post, ph }) => (
        <li key={ph.id}>
          <Link
            to={routes.post(post.id)}
            className={s.wallItem}
            aria-label={post.title ?? 'Открыть пост'}
          >
            <Image src={ph} ratio="1/1" sizes="(max-width: 700px) 33vw, 210px" alt={ph.alt} />
            <span className={s.wallTime}>{formatShortAgo(post.createdAt)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MyCategories() {
  const { data } = useCategories();
  const mine = data?.filter((c) => c.isSubscribed) ?? [];
  if (mine.length === 0) return null;
  return (
    <section className={cx('card', s.widget)} aria-labelledby="my-cats">
      <WidgetHead id="my-cats" title="Мои категории" />
      <div className={s.chips}>
        {mine.map((c) => (
          <Link
            key={c.id}
            to={routes.category(c.slug)}
            className={s.chip}
            style={{ '--c': c.color } as CSSProperties}
          >
            <NamedIcon name={c.icon} size={14} /> {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function WritesAbout({ topic }: { topic: string }) {
  const { data } = useCategories();
  const cat = data?.find((c) => c.name === topic);
  return (
    <section className={cx('card', s.widget)} aria-labelledby="writes-about">
      <WidgetHead id="writes-about" title="Пишет о" />
      <div className={s.chips}>
        {cat ? (
          <Link
            to={routes.category(cat.slug)}
            className={s.chip}
            style={{ '--c': cat.color } as CSSProperties}
          >
            <NamedIcon name={cat.icon} size={14} /> {cat.name}
          </Link>
        ) : (
          <span className={s.chip}>{topic}</span>
        )}
      </div>
    </section>
  );
}

function SimilarAuthors() {
  const { data } = useSuggestions(3);
  if (!data?.length) return null;
  return (
    <section className={cx('card', s.widget)} aria-labelledby="similar">
      <WidgetHead id="similar" title="Похожие авторы" />
      <ul className={s.people}>
        {data.map((u) => (
          <li key={u.login}>
            <UserLine user={u} sub={u.occupation} aside={<FollowButton profile={u} size="sm" />} />
          </li>
        ))}
      </ul>
    </section>
  );
}
