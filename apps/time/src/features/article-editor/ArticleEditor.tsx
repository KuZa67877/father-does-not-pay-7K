import { isApiError, type User } from '@dle/core';
import { ArticleInputSchema, type Article, type ArticleInput } from '@dle/core/time';
import { Button, ErrorState } from '@dle/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSaveArticle } from '@/entities/article/editor';
import { useRubrics } from '@/entities/rubric';
import { MediaPicker } from '@/shared/ui/MediaPicker';
import { BlockEditor } from './BlockEditor';
import { FormatFields } from './FormatFields';
import { articleInput, type EditorInput } from './model';
import s from './editor.module.css';

export function ArticleEditor({
  article,
  user,
  onSaved,
}: {
  article?: Article;
  user: User;
  onSaved: (a: Article) => void;
}) {
  const save = useSaveArticle(article);
  const rubrics = useRubrics();
  const [busyFields, setBusyFields] = useState<Record<string, boolean>>({});
  const [invalid, setInvalid] = useState(false);
  const [notice, setNotice] = useState('');
  const form = useForm<EditorInput, unknown, ArticleInput>({
    resolver: zodResolver(ArticleInputSchema),
    defaultValues: articleInput(article),
  });
  const busy = Object.values(busyFields).some(Boolean);
  const onBusy = useCallback(
    (key: string, value: boolean) =>
      setBusyFields((prev) => (prev[key] === value ? prev : { ...prev, [key]: value })),
    [],
  );
  const submit = (status: 'draft' | 'published') => {
    if (busy || save.isPending) return;
    setInvalid(false);
    setNotice('');
    form.setValue('status', status);
    void form.handleSubmit(
      (input) =>
        save.mutate(input, {
          onSuccess: (a) => {
            form.reset(articleInput(a));
            setNotice(a.status === 'draft' ? 'Черновик сохранён' : 'Материал опубликован');
            onSaved(a);
          },
        }),
      () => setInvalid(true),
    )();
  };
  const rubricId = form.watch('rubricId');
  const errors = form.formState.errors;
  return (
    <form
      className={s.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit(form.getValues('status'));
      }}
    >
      <fieldset disabled={save.isPending} className={s.fields}>
        <section className={s.section} aria-labelledby="basics-title">
          <h2 id="basics-title">Основное</h2>
          <div className={s.field}>
            <label htmlFor="article-title">Заголовок</label>
            <input
              id="article-title"
              maxLength={200}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'article-title-error' : undefined}
              {...form.register('title')}
            />
            {errors.title && (
              <span id="article-title-error" className={s.error}>
                {errors.title.message}
              </span>
            )}
          </div>
          <label className={s.field}>
            Анонс
            <textarea rows={3} maxLength={400} {...form.register('lead')} />
          </label>
          {rubrics.isError && (
            <ErrorState error={rubrics.error} onRetry={() => void rubrics.refetch()} />
          )}
          <div className={s.row}>
            <label className={s.field}>
              Рубрика
              <select
                {...form.register('rubricId', {
                  onChange: () => form.setValue('subrubricId', null),
                })}
                aria-invalid={Boolean(errors.rubricId)}
              >
                <option value="">
                  {rubrics.isPending ? 'Загружаем рубрики…' : 'Выберите рубрику'}
                </option>
                {rubrics.data
                  ?.filter((r) => !r.parentId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className={s.field}>
              Подрубрика
              <select {...form.register('subrubricId', { setValueAs: (v: string) => v || null })}>
                <option value="">Без подрубрики</option>
                {rubrics.data
                  ?.filter((r) => r.parentId === rubricId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <label className={s.field}>
            Теги через запятую
            <input
              {...form.register('tags', {
                setValueAs: (value: unknown) =>
                  typeof value === 'string'
                    ? value
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean)
                    : value,
              })}
            />
          </label>
          <MediaPicker
            label="Обложка"
            initial={article?.cover ? [article.cover] : []}
            onChange={(media) => form.setValue('coverId', media[0]?.id ?? null)}
            onBusy={(value) => onBusy('cover', value)}
          />
        </section>
        <FormatFields
          form={form}
          author={{
            id: user.id,
            name: user.name,
            login: user.login,
            avatar: user.avatar,
            isVerified: user.isVerified,
          }}
          onBusy={onBusy}
        />
        <BlockEditor form={form} onBusy={onBusy} />
      </fieldset>
      {invalid && (
        <div className={s.error} role="alert">
          Проверьте заголовок, рубрику и заполнение блоков выбранного формата. Для фото и аудио
          дождитесь загрузки файла.
        </div>
      )}
      {save.isError && (
        <p className={s.error} role="alert">
          {isApiError(save.error)
            ? save.error.message
            : 'Не удалось сохранить материал. Попробуйте ещё раз.'}
        </p>
      )}
      {notice && (
        <p className={s.success} role="status">
          {notice}
        </p>
      )}
      <div className={s.saveBar}>
        <span>
          {busy
            ? 'Дождитесь загрузки файлов или удалите файлы с ошибками'
            : article?.status === 'published'
              ? 'Материал опубликован'
              : 'Черновик виден только вам'}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={busy || save.isPending}
          onClick={() => submit('draft')}
        >
          Сохранить черновик
        </Button>
        <Button
          type="button"
          loading={save.isPending}
          disabled={busy}
          onClick={() => submit('published')}
        >
          Опубликовать
        </Button>
      </div>
    </form>
  );
}
