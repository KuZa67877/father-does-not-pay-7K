import { isApiError, LoginInputSchema, RegisterInputSchema, EmailSchema } from '@dle/core';
import { Button, Modal } from '@dle/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState, type ComponentProps } from 'react';
import { useForm, type FieldError } from 'react-hook-form';
import * as z from 'zod/mini';
import { useLogin, usePasswordReset, useRegister } from '@/entities/session';
import { SITE_NAME } from '@/shared/config/env';
import s from './AuthModal.module.css';

export type AuthMode = 'login' | 'register' | 'reset';

const TITLES: Record<AuthMode, string> = {
  login: `Вход в «${SITE_NAME}»`,
  register: 'Регистрация',
  reset: 'Восстановление пароля',
};

export function AuthModal({
  open,
  mode,
  onMode,
  onClose,
}: {
  open: boolean;
  mode: AuthMode;
  onMode: (m: AuthMode) => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={TITLES[mode]} className={s.modal} sheet>
      {mode === 'login' && <LoginForm onDone={onClose} onMode={onMode} />}
      {mode === 'register' && <RegisterForm onDone={onClose} onMode={onMode} />}
      {mode === 'reset' && <ResetForm onMode={onMode} />}
    </Modal>
  );
}

function Field({
  label,
  error,
  ...rest
}: { label: string; error?: FieldError | undefined } & ComponentProps<'input'>) {
  const id = useId();
  return (
    <div className={s.field}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <input
        id={id}
        className={s.input}
        placeholder={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-e` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${id}-e`} className={s.error}>
          {error.message}
        </span>
      )}
    </div>
  );
}

const errorText = (e: unknown) =>
  isApiError(e) ? e.message : 'Не получилось. Проверьте соединение и попробуйте ещё раз.';

function LoginForm({ onDone, onMode }: { onDone: () => void; onMode: (m: AuthMode) => void }) {
  const login = useLogin();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { login: '', password: '' },
  });
  return (
    <>
      <p className={s.lead}>
        Сохраняйте материалы, следите за рубриками и участвуйте в обсуждениях.
      </p>
      <form
        className={s.form}
        noValidate
        onSubmit={handleSubmit((v) => login.mutate(v, { onSuccess: onDone }))}
      >
        {login.isError && (
          <p role="alert" className={s.formError}>
            {errorText(login.error)}
          </p>
        )}
        <Field
          label="Логин или email"
          autoComplete="username"
          error={formState.errors.login}
          {...register('login')}
        />
        <Field
          label="Пароль"
          type="password"
          autoComplete="current-password"
          error={formState.errors.password}
          {...register('password')}
        />
        <label className={s.check}>
          <input type="checkbox" defaultChecked /> Запомнить меня
        </label>
        <Button
          type="submit"
          variant="secondary"
          block
          className={s.submit}
          loading={login.isPending}
        >
          Войти
        </Button>
        <div className={s.links}>
          <button type="button" className={s.linkBtn} onClick={() => onMode('register')}>
            Регистрация
          </button>
          <button type="button" className={s.linkBtn} onClick={() => onMode('reset')}>
            Забыли пароль?
          </button>
        </div>
        <p className={s.fine}>В демо-режиме подойдёт любой логин и пароль от 6 символов.</p>
      </form>
    </>
  );
}

function RegisterForm({ onDone, onMode }: { onDone: () => void; onMode: (m: AuthMode) => void }) {
  const reg = useRegister();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(RegisterInputSchema),
    defaultValues: { name: '', login: '', email: '', password: '' },
  });
  return (
    <form
      className={s.form}
      noValidate
      onSubmit={handleSubmit((v) => reg.mutate(v, { onSuccess: onDone }))}
    >
      {reg.isError && (
        <p role="alert" className={s.formError}>
          {errorText(reg.error)}
        </p>
      )}
      <Field label="Имя" autoComplete="name" error={formState.errors.name} {...register('name')} />
      <Field
        label="Логин"
        autoComplete="username"
        error={formState.errors.login}
        {...register('login')}
      />
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        error={formState.errors.email}
        {...register('email')}
      />
      <Field
        label="Пароль"
        type="password"
        autoComplete="new-password"
        error={formState.errors.password}
        {...register('password')}
      />
      <Button type="submit" variant="secondary" block className={s.submit} loading={reg.isPending}>
        Зарегистрироваться
      </Button>
      <div className={s.links}>
        <button type="button" className={s.linkBtn} onClick={() => onMode('login')}>
          У меня есть аккаунт
        </button>
      </div>
    </form>
  );
}

const ResetSchema = z.object({ email: EmailSchema });

function ResetForm({ onMode }: { onMode: (m: AuthMode) => void }) {
  const reset = usePasswordReset();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(ResetSchema),
    defaultValues: { email: '' },
  });
  if (sentTo) {
    return (
      <div className={s.done} role="status">
        <p>
          Отправили ссылку на <b>{sentTo}</b>. Если письма нет пару минут — проверьте «Спам».
        </p>
        <Button variant="outline" block onClick={() => onMode('login')}>
          Вернуться ко входу
        </Button>
      </div>
    );
  }
  return (
    <form
      className={s.form}
      noValidate
      onSubmit={handleSubmit((v) => reset.mutate(v.email, { onSuccess: () => setSentTo(v.email) }))}
    >
      <p className={s.lead}>Пришлём ссылку для нового пароля.</p>
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        error={formState.errors.email}
        {...register('email')}
      />
      <Button
        type="submit"
        variant="secondary"
        block
        className={s.submit}
        loading={reset.isPending}
      >
        Отправить ссылку
      </Button>
      <div className={s.links}>
        <button type="button" className={s.linkBtn} onClick={() => onMode('login')}>
          Вспомнил пароль
        </button>
      </div>
    </form>
  );
}
