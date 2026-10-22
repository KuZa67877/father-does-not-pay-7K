import { ErrorState, Skeleton } from '@dle/ui';
import { Form, Link } from 'react-router';
import { useCategories } from '@/entities/category';
import { MiniPost, usePostList } from '@/entities/post';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { ChipLink, PageHead } from '@/shared/ui';
import s from './not-found.module.css';

export function NotFoundPage() {
  usePageMeta({
    title: 'Страница не найдена',
    description: 'Поиск, каналы и последние публикации Ольхи.',
  });
  const channels = useCategories();
  const posts = usePostList({ limit: 3, sort: 'new' });
  return (
    <>
      <PageHead back={{ to: routes.home(), label: 'Лента' }} />
      <section className={`card ${s.box}`}>
        <h1>Такой страницы нет</h1>
        <p>Возможно, пост удалили или в адресе опечатка.</p>
        <Form role="search" action="/search">
          <label htmlFor="missing-search">Найти публикацию</label>
          <div>
            <input
              id="missing-search"
              type="search"
              name="q"
              placeholder="Посты, люди или темы"
              required
            />
            <button className="cta" type="submit">
              Найти
            </button>
          </div>
        </Form>
        <Link to={routes.home()}>Вернуться в ленту</Link>
      </section>
      <nav className={s.chips} aria-label="Каналы">
        {channels.data?.map((c) => (
          <ChipLink key={c.id} to={routes.category(c.slug)}>
            {c.name}
          </ChipLink>
        ))}
      </nav>
      {channels.isError && (
        <ErrorState error={channels.error} onRetry={() => void channels.refetch()} />
      )}
      <section className={`card ${s.box}`}>
        <h2>Свежие публикации</h2>
        {posts.isPending && <Skeleton height={180} />}
        {posts.isError && <ErrorState error={posts.error} onRetry={() => void posts.refetch()} />}
        {posts.data?.pages
          .flatMap((p) => p.items)
          .map((post) => (
            <MiniPost key={post.id} post={post} />
          ))}
        {posts.data?.pages[0]?.total === 0 && <p>Публикаций пока нет.</p>}
      </section>
    </>
  );
}
