import { isApiError } from '@dle/core';
import { ReaderSubmissionInputSchema, type ReaderSubmissionInput } from '@dle/core/time';
import { Button } from '@dle/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { useMe } from '@/entities/session';
import { useRepositories } from '@/shared/api/di';
import { MediaPicker } from '@/shared/ui/MediaPicker';
import s from './submission.module.css';

export function ReaderSubmission({ articleId }: { articleId: string }) {
  const { submissions } = useRepositories();
  const { data: me } = useMe();
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const send = useMutation({
    mutationFn: (input: ReaderSubmissionInput) => submissions.send(input),
  });
  const form = useForm<z.input<typeof ReaderSubmissionInputSchema>, unknown, ReaderSubmissionInput>(
    {
      resolver: zodResolver(ReaderSubmissionInputSchema),
      defaultValues: { articleId, name: me?.name ?? '', contact: '', message: '', mediaIds: [] },
    },
  );
  if (send.isSuccess)
    return (
      <section className={s.box} aria-label="Материал отправлен">
        <h2>Спасибо за материал</h2>
        <p role="status">
          Редакция получила файлы и свяжется с вами, если понадобятся подробности.
        </p>
      </section>
    );
  return (
    <section className={s.box} aria-labelledby="submission-title">
      <h2 id="submission-title">Были на месте? Пришлите фото или видео</h2>
      <p>Лучшие материалы читателей мы публикуем с указанием автора.</p>
      <form
        onSubmit={form.handleSubmit(
          (input) => {
            if (!busy && !send.isPending) send.mutate(input);
          },
          () => setInvalid(true),
        )}
        noValidate
      >
        <MediaPicker
          label="Фото и видео для редакции"
          max={10}
          accept="image/*,video/*"
          onChange={(media) =>
            form.setValue(
              'mediaIds',
              media.map((m) => m.id),
            )
          }
          onBusy={setBusy}
        />
        <div className={s.row}>
          <label>
            Как к вам обращаться
            <input autoComplete="name" {...form.register('name')} />
          </label>
          <label>
            Email или телефон
            <input autoComplete="email" {...form.register('contact')} />
          </label>
        </div>
        <label>
          Где и когда снято?
          <textarea rows={2} maxLength={1000} {...form.register('message')} />
        </label>
        <label className={s.consent}>
          <input type="checkbox" {...form.register('consent')} />Я автор материалов и разрешаю
          публикацию
        </label>
        {invalid && (
          <p className={s.error} role="alert">
            Укажите имя и контакт, прикрепите файл и подтвердите согласие на публикацию.
          </p>
        )}
        {send.isError && (
          <p className={s.error} role="alert">
            {isApiError(send.error)
              ? send.error.message
              : 'Не удалось отправить материал. Попробуйте ещё раз.'}
          </p>
        )}
        <Button type="submit" disabled={busy} loading={send.isPending}>
          Отправить в редакцию
        </Button>
      </form>
    </section>
  );
}
