import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cx } from '../cx';
import { IconButton } from './Button';
import s from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Скрыть заголовок визуально (остаётся для скринридеров). */
  hideTitle?: boolean;
  children: ReactNode;
  className?: string;
  /** На телефоне — как нижний лист. */
  sheet?: boolean;
  /** Закрывать по клику на фон. */
  dismissible?: boolean;
}

/**
 * Модальное окно на нативном <dialog>: фокус-ловушка, Esc и inert-фон — от браузера,
 * aria-labelledby связывает заголовок. Фокус возвращается на открывший элемент.
 */
export function Modal({ open, onClose, title, hideTitle, children, className, sheet, dismissible = true }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onDialogClose = () => {
      document.documentElement.style.overflow = '';
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
      if (open) onClose();
    };
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener('close', onDialogClose);
    dialog.addEventListener('cancel', onCancel);
    return () => {
      dialog.removeEventListener('close', onDialogClose);
      dialog.removeEventListener('cancel', onCancel);
    };
  }, [open, onClose]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- клик по фону дублирует Esc
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cx(s.dialog, sheet && s.sheet, className)}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <>
          <div className={s.head}>
            <h2 id={titleId} className={cx(s.title, hideTitle && 'visually-hidden')}>
              {title}
            </h2>
            <IconButton label="Закрыть" plain onClick={onClose}>
              <X size={20} />
            </IconButton>
          </div>
          <div className={s.body}>{children}</div>
        </>
      )}
    </dialog>
  );
}
