import type { FeedKind } from '@dle/core/velora';
import { EmptyState } from '@dle/ui';
import { Users } from 'lucide-react';
import { Link } from 'react-router';
import { useFeed } from '@/entities/post';
import { useMe } from '@/entities/session';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { useUi } from '@/shared/model/ui-context';
import { Segmented } from '@/shared/ui';
import { PostFeed } from '@/widgets/feed';
import { AuthorsStrip, CategoryChips, ComposerBar, FeedHead, StoriesBar } from '@/widgets/home';
import s from './HomePage.module.css';

const TABS = [
  { key: 'all', label: 'Для вас', to: routes.home() },
  { key: 'following', label: 'Подписки', to: routes.following() },
  { key: 'circles', label: 'Круги', to: routes.circles() },
] as const;

const NOTES: Partial<Record<FeedKind, string>> = {
  following: 'Подписки — авторы и каналы, на которые вы подписаны, вместе с их репостами.',
  circles: 'Круги — люди, с которыми вы подписаны друг на друга.',
};

/** Главная: истории, «Что у вас на уме?» и ленты «Для вас / Подписки / Круги». */
export function HomePage({ kind = 'all' }: { kind?: FeedKind }) {
  const { data: me } = useMe();
  const { openLogin } = useUi();
  const feed = useFeed(kind);
  usePageMeta({
    title: kind === 'all' ? 'Ольха' : kind === 'following' ? 'Подписки' : 'Круги',
    description: 'Спокойная соцсеть: люди, каналы и разговоры без бесконечной ленты рекомендаций.',
  });
  const needsLogin = kind !== 'all' && !me;

  return (
    <>
      <FeedHead
        tabs={<Segmented label="Лента" active={kind} items={TABS.map((t) => ({ ...t }))} />}
      />
      <CategoryChips />
      <StoriesBar />
      <ComposerBar />
      <AuthorsStrip />
      {NOTES[kind] && <p className={s.note}>{NOTES[kind]}</p>}
      {needsLogin ? (
        <EmptyState
          icon={<Users size={28} aria-hidden />}
          title="Войдите, чтобы увидеть свою ленту"
          text="Здесь будут посты людей и каналов, на которые вы подписаны."
          action={
            <button type="button" className={s.cta} onClick={() => openLogin('login')}>
              Войти
            </button>
          }
        />
      ) : (
        <PostFeed
          query={feed}
          showPin={kind === 'all'}
          empty={
            <EmptyState
              icon={<Users size={28} aria-hidden />}
              title={kind === 'circles' ? 'В кругах пока тихо' : 'Подписок пока нет'}
              text={
                kind === 'circles'
                  ? 'Круги появляются, когда вы и автор подписаны друг на друга.'
                  : 'Подпишитесь на людей или каналы — их посты появятся здесь.'
              }
              action={
                <Link to={routes.people()} className={s.cta}>
                  Найти людей
                </Link>
              }
            />
          }
        />
      )}
    </>
  );
}

export function FollowingPage() {
  return <HomePage kind="following" />;
}

export function CirclesPage() {
  return <HomePage kind="circles" />;
}
