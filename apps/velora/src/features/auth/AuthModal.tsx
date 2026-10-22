import { EmailSchema, isApiError, LoginInputSchema, RegisterInputSchema } from '@dle/core';
import { Button, Modal } from '@dle/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import * as z from 'zod/mini';
import { useLogin, usePasswordReset, useRegister } from '@/entities/session';
import { routes } from '@/shared/lib/routes';
import type { AuthMode } from '@/shared/model/ui-context';
import { Field } from '@/shared/ui/Field';
import s from './AuthModal.module.css';

const TITLES: Record<AuthMode, string> = {
  login: 'Вход',
  register: 'Создать профиль',
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

const errorText = (e: unknown) =>
  isApiError(e) ? e.message : 'Не получилось. Проверьте соединение и попробуйте ещё раз.';

function LoginForm({ onDone, onMode }: { onDone: () => void; onMode: (m: AuthMode) => void }) {
  const login = useLogin();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { login: '', password: '' },
  });
  return (
    <form
      className={s.form}
      noValidate
      onSubmit={handleSubmit((v) => login.mutate(v, { onSuccess: onDone }))}
    >
      <p className={s.lead}>Подписывайтесь на людей, делитесь постами и историями, обсуждайте.</p>
      {login.isError && (
        <p role="alert" className={s.formError}>
          {errorText(login.error)}
        </p>
      )}
      <Field
        label="Логин"
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
        <input type="checkbox" /> Чужой компьютер — не запоминать
      </label>
      <Button type="submit" block className={s.submit} loading={login.isPending}>
        Войти
      </Button>
      <div className={s.links}>
        <button type="button" className={s.linkBtn} onClick={() => onMode('register')}>
          Создать профиль
        </button>
        <button type="button" className={s.linkBtn} onClick={() => onMode('reset')}>
          Забыли пароль?
        </button>
      </div>
      <p className={s.fine}>
        Входя, вы принимаете{' '}
        <Link to={routes.rules()} onClick={onDone}>
          правила сайта
        </Link>
        . В демо подойдёт любой логин и пароль от 6 символов.
      </p>
    </form>
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
        hint="Латиница, цифры и _ — будет в адресе профиля"
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
      <Button type="submit" block className={s.submit} loading={reg.isPending}>
        Создать профиль
      </Button>
      <div className={s.links}>
        <button type="button" className={s.linkBtn} onClick={() => onMode('login')}>
          У меня уже есть профиль
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
  if (sentTo)
    return (
      <div className={s.form} role="status">
        <p className={s.lead}>
          Отправили ссылку на <b>{sentTo}</b>. Если письма нет пару минут — загляните в «Спам».
        </p>
        <Button variant="outline" block onClick={() => onMode('login')}>
          Вернуться ко входу
        </Button>
      </div>
    );
  return (
    <form
      className={s.form}
      noValidate
      onSubmit={handleSubmit((v) => reset.mutate(v.email, { onSuccess: () => setSentTo(v.email) }))}
    >
      <p className={s.lead}>Пришлём ссылку, по которой можно задать новый пароль.</p>
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        error={formState.errors.email}
        {...register('email')}
      />
      <Button type="submit" block className={s.submit} loading={reset.isPending}>
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
