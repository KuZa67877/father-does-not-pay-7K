import { ErrorState, Skeleton } from '@dle/ui';
import { Form, Link } from 'react-router';
import { ArticleCard, useArticles } from '@/entities/article';
import { useTopRubrics } from '@/entities/rubric';
import { usePageMeta } from '@/shared/lib/meta';
import { ChipLink, SectionHead } from '@/shared/ui';
import s from './not-found.module.css';

export function NotFoundPage() {
  const fresh = useArticles({ pageSize: 3 });
  const rubrics = useTopRubrics();
  usePageMeta({
    title: 'Страница не найдена — Хроника',
    description: 'Найдите нужный материал через поиск или перейдите к последним новостям.',
  });
  return (
    <div className={`container ${s.page}`}>
      <header className={s.head}>
        <span className={s.code} aria-hidden>
          404
        </span>
        <h1>Такой страницы нет</h1>
        <p>Возможно, материал перенесли или в адресе опечатка.</p>
        <Link to="/">На главную</Link>
      </header>
      <Form role="search" action="/search" className={s.search}>
        <label htmlFor="missing-search">Найти материал</label>
        <div>
          <input
            id="missing-search"
            type="search"
            name="q"
            placeholder="Слово из заголовка или тема"
            required
          />
          <button type="submit">Найти</button>
        </div>
      </Form>
      <nav className={s.rubrics} aria-label="Рубрики">
        {rubrics.data?.map((r) => (
          <ChipLink key={r.id} to={`/${r.slug}`}>
            {r.name}
          </ChipLink>
        ))}
      </nav>
      {rubrics.isError && (
        <ErrorState error={rubrics.error} onRetry={() => void rubrics.refetch()} />
      )}
      <SectionHead title="Свежие материалы" />
      {fresh.isPending && <Skeleton height={250} />}
      {fresh.isError && <ErrorState error={fresh.error} onRetry={() => void fresh.refetch()} />}
      <div className={s.grid}>
        {fresh.data?.items.map((article) => (
          <ArticleCard key={article.id} a={article} />
        ))}
      </div>
      {fresh.data?.items.length === 0 && (
        <p>Новых материалов пока нет. Посмотрите другие рубрики.</p>
      )}
    </div>
  );
}
