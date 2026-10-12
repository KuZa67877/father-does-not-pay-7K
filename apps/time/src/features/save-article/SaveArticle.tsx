import type { Article } from '@dle/core/time';
import { cx } from '@dle/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useMe } from '@/entities/session';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';
import { useUi } from '@/shared/model/ui-context';
import s from './save.module.css';

/** «Сохранить» в избранное: кнопка меняется сразу, при ошибке — откат. */
export function SaveArticle({ article, className }: { article: Article; className?: string }) {
  const { articles } = useRepositories();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { openLogin } = useUi();
  const key = qk.articles.detail(article.slug);

  const m = useMutation({
    mutationFn: (value: boolean) => articles.setFavorite(article.id, value),
    onMutate: async (value) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Article>(key);
      if (prev) qc.setQueryData<Article>(key, { ...prev, isFavorite: value });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.articles.all, refetchType: 'none' }),
  });

  const on = article.isFavorite;
  return (
    <button
      type="button"
      className={cx(s.save, on && s.on, className)}
      aria-pressed={on}
      onClick={() => (me ? m.mutate(!on) : openLogin('login'))}
    >
      {on ? <BookmarkCheck size={17} aria-hidden /> : <Bookmark size={17} aria-hidden />}
      {on ? 'Сохранено' : 'Сохранить'}
    </button>
  );
}
