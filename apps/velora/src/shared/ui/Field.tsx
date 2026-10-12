import { cx } from '@dle/ui';
import { useId, type ComponentProps, type ReactNode } from 'react';
import type { FieldError } from 'react-hook-form';
import s from './Field.module.css';

type FieldProps = {
  label: string;
  error?: FieldError | undefined;
  hint?: ReactNode;
  /** Подпись только для скринридеров (поле с плейсхолдером). */
  hideLabel?: boolean;
  className?: string;
} & (
  ({ as?: 'input' } & ComponentProps<'input'>) | ({ as: 'textarea' } & ComponentProps<'textarea'>)
);

/** Поле формы: подпись капителью сверху, ошибка снизу, связи aria. */
export function Field({ label, error, hint, hideLabel, className, ...rest }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-e` : hint ? `${id}-h` : undefined;
  const common = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  } as const;
  return (
    <div className={cx(s.field, className)}>
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : s.label}>
        {label}
      </label>
      {rest.as === 'textarea' ? (
        <textarea {...common} className={cx(s.input, s.area)} {...omitAs(rest)} />
      ) : (
        <input {...common} className={s.input} {...omitAs(rest)} />
      )}
      {error ? (
        <span id={`${id}-e`} className={s.error} role="alert">
          {error.message}
        </span>
      ) : (
        hint && (
          <span id={`${id}-h`} className={s.hint}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

function omitAs<T extends { as?: unknown }>(props: T): Omit<T, 'as'> {
  const { as: _as, ...rest } = props;
  void _as;
  return rest;
}
