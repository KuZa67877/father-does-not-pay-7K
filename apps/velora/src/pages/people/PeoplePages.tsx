import { compactNumber, plural } from '@dle/core';
import { Avatar, EmptyState, ErrorState, Image, Skeleton, useDebouncedValue } from '@dle/ui';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigationType, useParams, useSearchParams } from 'react-router';
import { usePeopleDirectory, useProfile } from '@/entities/user/api';
import { FollowButton } from '@/features/follow-user';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { PageHead, Verified } from '@/shared/ui';
import s from './people.module.css';

export const PeoplePage = () => <Directory kind="all" />;
export function FollowersPage() {
  const { login = '' } = useParams();
  return <Directory kind="followers" login={login} />;
}
export function FollowingPage() {
  const { login = '' } = useParams();
  return <Directory kind="following" login={login} />;
}

function Directory({
  kind,
  login = '',
}: {
  kind: 'all' | 'followers' | 'following';
  login?: string;
}) {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const navigation = useNavigationType();
  const [value, setValue] = useState(search);
  useEffect(() => {
    if (navigation === 'POP') setValue(search);
  }, [navigation, search]);
  const term = useDebouncedValue(value, 250);
  const query = usePeopleDirectory(kind, term, login);
  const profile = useProfile(kind === 'all' ? null : login);
  const title = kind === 'all' ? 'Люди' : kind === 'followers' ? 'Читатели' : 'Подписки';
  usePageMeta({
    title: login ? `${title} @${login}` : title,
    description: 'Авторы Ольхи: найдите интересных людей и подпишитесь на их публикации.',
  });
  const people = query.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <>
      <PageHead
        back={{
          to: login ? routes.user(login) : routes.home(),
          label: login ? 'Профиль' : 'Лента',
        }}
      >
        <h1 className={s.title}>{title}</h1>
      </PageHead>
      <p className={s.intro}>
        {kind === 'all'
          ? 'Находите авторов по имени, логину или занятию.'
          : `Люди ${profile.data?.name ?? `@${login}`}`}
      </p>
      <form role="search" className={`card ${s.search}`} onSubmit={(e) => e.preventDefault()}>
        <Search size={20} aria-hidden />
        <label className="visually-hidden" htmlFor="people-search">
          Поиск людей
        </label>
        <input
          id="people-search"
          type="search"
          placeholder={kind === 'all' ? 'Имя, логин или занятие' : 'Имя или логин'}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setParams(e.target.value ? { q: e.target.value } : {}, { replace: true });
          }}
        />
      </form>
      {profile.isError ? (
        <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
      ) : (
        <>
          {query.isPending && (
            <div className={s.grid} aria-busy="true">
              {[0, 1, 2, 3].map((n) => (
                <Skeleton key={n} height={300} />
              ))}
            </div>
          )}
          {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
          {query.data && (
            <p className={s.count} role="status">
              Найдено: {query.data.pages[0]?.total ?? 0}
            </p>
          )}
          {!query.isPending && !query.isError && !people.length && (
            <EmptyState
              title="Никого не нашли"
              text={term ? 'Попробуйте другое имя или логин.' : 'В этом списке пока нет людей.'}
            />
          )}
          <ul className={s.grid}>
            {people.map((person) => (
              <li key={person.id} className={`card ${s.person}`}>
                <div className={s.cover}>
                  {person.cover && <Image src={person.cover} ratio="4/1" sizes="320px" alt="" />}
                </div>
                <div className={s.body}>
                  <Avatar
                    size={58}
                    name={person.name}
                    src={person.avatar?.url}
                    className={s.avatar}
                  />
                  <h2>
                    <Link to={routes.user(person.login)}>{person.name}</Link>{' '}
                    {person.isVerified && <Verified />}
                  </h2>
                  <p className={s.meta}>
                    @{person.login}
                    {person.occupation ? ` · ${person.occupation}` : ''}
                  </p>
                  {person.bio && <p className={s.bio}>{person.bio}</p>}
                  <p className={s.meta}>
                    {compactNumber(person.postsCount)}{' '}
                    {plural(person.postsCount, ['пост', 'поста', 'постов'])} ·{' '}
                    {compactNumber(person.followersCount)}{' '}
                    {plural(person.followersCount, ['читатель', 'читателя', 'читателей'])}
                  </p>
                  <div className={s.action}>
                    <FollowButton profile={person} block />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <button
              className="cta"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? 'Загружаем…' : 'Показать ещё'}
            </button>
          )}
        </>
      )}
    </>
  );
}
