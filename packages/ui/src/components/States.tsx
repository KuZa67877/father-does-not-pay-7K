import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Button } from './Button';
import s from './States.module.css';

export function EmptyState({
  title,
  text,
  action,
  icon,
  compact,
  className,
}: {
  title: string;
  text?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cx(s.state, compact && s.compact, className)}>
      {icon}
      <p className={s.title}>{title}</p>
      {text && <p className={s.text}>{text}</p>}
      {action}
    </div>
  );
}

/** Ошибка загрузки блока с кнопкой «Повторить». */
export function ErrorState({
  title = 'Не удалось загрузить',
  error,
  onRetry,
  compact,
  className,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const message = error instanceof Error ? error.message : undefined;
  return (
    <div role="alert" className={cx(s.state, compact && s.compact, className)}>
      <p className={s.title}>{title}</p>
      {message && <p className={s.text}>{message}</p>}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          icon={<RotateCcw size={14} aria-hidden />}
          onClick={onRetry}
        >
          Повторить
        </Button>
      )}
    </div>
  );
}
