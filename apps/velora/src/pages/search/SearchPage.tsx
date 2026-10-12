import { plural } from '@dle/core';
import { EmptyState, Skeleton, useDebouncedValue } from '@dle/ui';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { usePostList } from '@/entities/post';
import { UserLine, usePeopleSearch } from '@/entities/user';
import { FollowButton } from '@/features/follow-user';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { PageHead, Segmented } from '@/shared/ui';
import { PostFeed } from '@/widgets/feed';
import s from './SearchPage.module.css';

/** Поиск по постам и людям; запрос и вкладка — в адресе. */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const tab = params.get('in') === 'people' ? 'people' : 'posts';
  const [value, setValue] = useState(q);
  const term = useDebouncedValue(value.trim(), 300);
  const posts = usePostList({ search: term }, tab === 'posts' && term.length >= 2);
  const people = usePeopleSearch(term, tab === 'people' && term.length >= 1);
  usePageMeta({ title: q ? `Поиск: ${q}` : 'Поиск' });

  const update = (next: { q?: string; in?: string }) => {
    const p = new URLSearchParams(params);
    if (next.q !== undefined) {
      if (next.q) p.set('q', next.q);
      else p.delete('q');
    }
    if (next.in !== undefined) {
      if (next.in === 'people') p.set('in', 'people');
      else p.delete('in');
    }
    setParams(p, { replace: true });
  };

  return (
    <>
      <PageHead back={{ to: routes.home(), label: 'Лента' }}>
        <h1 className={s.h1}>Поиск</h1>
      </PageHead>
      <form
        role="search"
        className={`card ${s.form}`}
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: value.trim() });
        }}
      >
        <Search size={20} aria-hidden />
        <label htmlFor="search-q" className="visually-hidden">
          Что ищем
        </label>
        <input
          id="search-q"
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            update({ q: e.target.value.trim() });
          }}
          placeholder="Посты, люди, #теги"
          autoComplete="off"
          // На странице поиска поле — главное действие.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </form>
      <Segmented
        label="Где искать"
        active={tab}
        className={s.tabs}
        items={[
          { key: 'posts', label: 'Посты', onClick: () => update({ in: 'posts' }) },
          { key: 'people', label: 'Люди', onClick: () => update({ in: 'people' }) },
        ]}
      />
      {term.length < (tab === 'posts' ? 2 : 1) ? (
        <EmptyState
          icon={<Search size={28} aria-hidden />}
          title="Начните вводить запрос"
          text="Ищем по заголовкам и тексту постов, именам и логинам."
        />
      ) : tab === 'posts' ? (
        <PostFeed
          query={posts}
          empty={
            <EmptyState
              title="Ничего не нашлось"
              text="Попробуйте другое слово или поищите среди людей."
            />
          }
        />
      ) : (
        <section className={`card ${s.people}`} aria-label="Люди">
          {people.isPending && <Skeleton height={56} />}
          {people.data && people.data.items.length === 0 && (
            <EmptyState compact title="Таких людей не нашли" />
          )}
          {people.data && people.data.items.length > 0 && (
            <>
              <p className={s.count}>
                {people.data.total} {plural(people.data.total, ['человек', 'человека', 'человек'])}
              </p>
              <ul className={s.list}>
                {people.data.items.map((u) => (
                  <li key={u.login}>
                    <UserLine
                      user={u}
                      size={46}
                      sub={[u.occupation, u.city].filter(Boolean).join(' · ')}
                      aside={<FollowButton profile={u} size="sm" />}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </>
  );
}
