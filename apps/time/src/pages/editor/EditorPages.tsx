import { formatDayMonth } from '@dle/core';
import type { ArticlePreview } from '@dle/core/time';
import { Button, EmptyState, ErrorState, Modal, Skeleton } from '@dle/ui';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useArticle, useArticles } from '@/entities/article';
import { useRemoveArticle } from '@/entities/article/editor';
import { useMe } from '@/entities/session';
import { ArticleEditor } from '@/features/article-editor/ArticleEditor';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { useUi } from '@/shared/model/ui-context';
import s from './editor-pages.module.css';

function EditorGate({ children }: { children: ReactNode }) {
  const me = useMe();
  const { openLogin } = useUi();
  if (me.isPending) return <Skeleton height={180} />;
  if (me.isError) return <ErrorState error={me.error} onRetry={() => void me.refetch()} />;
  if (!me.data)
    return (
      <EmptyState
        title="Войдите, чтобы работать с материалами"
        text="Здесь хранятся ваши черновики и публикации."
        action={<Button onClick={() => openLogin('login')}>Войти</Button>}
      />
    );
  return children;
}

export function EditorListPage() {
  usePageMeta({ title: 'Мои материалы — Хроника' });
  return (
    <div className={s.page}>
      <header className={s.head}>
        <div>
          <Link to="/">Главная</Link>
          <h1>Мои материалы</h1>
          <p>Черновики и публикации редакции</p>
        </div>
        <Link className={s.linkButton} to={routes.newArticle()}>
          Новый материал
        </Link>
      </header>
      <EditorGate>
        <EditorList />
      </EditorGate>
    </div>
  );
}

function EditorList() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const status =
    params.get('status') === 'draft'
      ? 'draft'
      : params.get('status') === 'published'
        ? 'published'
        : 'all';
  const query = useArticles({ mine: true, status, page, pageSize: 10 });
  const [deleting, setDeleting] = useState<ArticlePreview | null>(null);
  const remove = useRemoveArticle();
  const count = query.data?.total ?? 0;
  return (
    <>
      <label className={s.filter}>
        Показывать
        <select
          value={status}
          onChange={(e) => setParams(e.target.value === 'all' ? {} : { status: e.target.value })}
        >
          <option value="all">Все материалы</option>
          <option value="draft">Черновики</option>
          <option value="published">Опубликованные</option>
        </select>
      </label>
      {query.isPending && <Skeleton height={240} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {query.data?.items.length === 0 && (
        <EmptyState
          title="Материалов пока нет"
          text="Создайте первый черновик или измените фильтр."
          action={
            <Link className={s.linkButton} to={routes.newArticle()}>
              Написать материал
            </Link>
          }
        />
      )}
      <ul className={s.list}>
        {query.data?.items.map((a) => (
          <li key={a.id}>
            <div>
              <span className={s.status}>
                {a.status === 'draft' ? 'Черновик' : 'Опубликован'} · {a.rubric.name} ·{' '}
                {formatDayMonth(a.updatedAt)}
              </span>
              <h2>
                <Link to={routes.editArticle(a.slug)}>{a.title}</Link>
              </h2>
            </div>
            <div className={s.actions}>
              <Link to={routes.editArticle(a.slug)}>Редактировать</Link>
              <Link to={routes.article(a)}>Посмотреть</Link>
              <button
                type="button"
                onClick={() => {
                  remove.reset();
                  setDeleting(a);
                }}
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
      {count > 10 && (
        <nav className={s.pagination} aria-label="Страницы материалов">
          <Button
            variant="outline"
            disabled={page === 1 || query.isPlaceholderData}
            onClick={() => setParams({ status, page: String(page - 1) })}
          >
            Назад
          </Button>
          <span>Страница {page}</span>
          <Button
            variant="outline"
            disabled={page * 10 >= count || query.isPlaceholderData}
            onClick={() => setParams({ status, page: String(page + 1) })}
          >
            Дальше
          </Button>
        </nav>
      )}
      <Modal
        open={Boolean(deleting)}
        onClose={() => {
          if (!remove.isPending) setDeleting(null);
        }}
        title="Удалить материал?"
        dismissible={!remove.isPending}
      >
        <p>«{deleting?.title}» будет удалён. Восстановить его не получится.</p>
        {remove.isError && <p role="alert">Не удалось удалить. Попробуйте ещё раз.</p>}
        <div className={s.actions}>
          <Button variant="outline" disabled={remove.isPending} onClick={() => setDeleting(null)}>
            Отмена
          </Button>
          <Button
            loading={remove.isPending}
            onClick={() => {
              if (deleting)
                remove.mutate(deleting, {
                  onSuccess: () => {
                    setDeleting(null);
                    if (query.data?.items.length === 1 && page > 1)
                      setParams({ status, page: String(page - 1) });
                  },
                });
            }}
          >
            Удалить
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function EditorArticlePage() {
  const { slug } = useParams();
  usePageMeta({ title: slug ? 'Редактирование материала — Хроника' : 'Новый материал — Хроника' });
  return (
    <div className={s.page}>
      <header className={s.head}>
        <div>
          <Link to={routes.editor()}>Мои материалы</Link>
          <h1>{slug ? 'Редактировать материал' : 'Новый материал'}</h1>
        </div>
      </header>
      <EditorGate>{slug ? <ExistingArticle slug={slug} /> : <EditForm />}</EditorGate>
    </div>
  );
}

function ExistingArticle({ slug }: { slug: string }) {
  const query = useArticle(slug);
  const me = useMe();
  if (query.isPending) return <Skeleton height={300} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (query.data.author.id !== me.data?.id && me.data?.role !== 'admin')
    return <EmptyState title="Этот материал доступен только его автору" />;
  return <EditForm article={query.data} />;
}

function EditForm({ article }: { article?: Parameters<typeof ArticleEditor>[0]['article'] }) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  if (!me) return null;
  return (
    <ArticleEditor
      key={article?.id ?? 'new'}
      article={article}
      user={me}
      onSaved={(saved) => {
        if (!article) void navigate(routes.editArticle(saved.slug), { replace: true });
      }}
    />
  );
}
