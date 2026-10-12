import { EmailSchema, isApiError } from '@dle/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { MailCheck, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRepositories } from '@/shared/api/di';
import s from './Newsletter.module.css';

const Schema = z.object({ email: EmailSchema });

/** Подписка на утреннюю рассылку «08:00. Пять новостей». */
export function Newsletter() {
  const { newsletter } = useRepositories();
  const sub = useMutation({ mutationFn: (email: string) => newsletter.subscribe(email) });
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(Schema),
    defaultValues: { email: '' },
  });
  const fieldError = formState.errors.email?.message;
  const serverError = sub.isError
    ? isApiError(sub.error)
      ? sub.error.message
      : 'Не получилось подписаться. Попробуйте ещё раз.'
    : null;

  return (
    <section className="container" style={{ paddingBottom: 80 }} aria-labelledby="h-news">
      <div className={s.box}>
        <div className={s.text}>
          <span className={s.label}>
            <Mail size={14} aria-hidden /> Утренняя рассылка
          </span>
          <h2 id="h-news" className={s.title}>
            08:00. Пять новостей. Не больше.
          </h2>
          <p className={s.note}>Письмо приходит раз в день. Отписаться — одной ссылкой.</p>
        </div>
        {sub.isSuccess ? (
          <p className={s.ok} role="status">
            <MailCheck size={20} aria-hidden />
            {sub.data.status === 'already_subscribed' ? (
              <span>
                Адрес <b>{sub.data.email}</b> уже подписан. Ждите письмо завтра в 08:00.
              </span>
            ) : (
              <span>
                Проверьте почту: отправили письмо на <b>{sub.data.email}</b>. Нажмите ссылку в нём,
                чтобы подтвердить подписку.
              </span>
            )}
          </p>
        ) : (
          <form className={s.form} noValidate onSubmit={handleSubmit((v) => sub.mutate(v.email))}>
            <label htmlFor="news-email" className="visually-hidden">
              Электронная почта
            </label>
            <input
              id="news-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Электронная почта"
              className={s.input}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError || serverError ? 'news-msg' : undefined}
              {...register('email')}
            />
            <button type="submit" className={s.submit} disabled={sub.isPending}>
              {sub.isPending ? 'Подписываем…' : 'Подписаться'}
            </button>
            {(fieldError || serverError) && (
              <span id="news-msg" role="alert" className={`${s.msg} ${s.error}`}>
                {fieldError ?? serverError}
              </span>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
