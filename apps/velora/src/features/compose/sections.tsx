import { POST_LIMITS } from '@dle/core/velora';
import { cx } from '@dle/ui';
import { ArrowLeft, ArrowRight, FileText, Plus, RotateCw, Trash2, X } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import type { FieldErrors, UseFieldArrayReturn, UseFormRegister } from 'react-hook-form';
import type { useUploads } from '@/shared/lib/use-uploads';
import type { ComposeValues } from './ComposeModal';
import s from './compose.module.css';

type Uploads = ReturnType<typeof useUploads>;

function SectionFrame({
  title,
  aside,
  onClose,
  children,
}: {
  title: string;
  aside?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <section className={s.section} aria-label={title}>
      <div className={s.secHead}>
        <span className={s.secLabel}>{title}</span>
        {aside}
        <button
          type="button"
          className={s.secClose}
          onClick={onClose}
          aria-label={`Убрать: ${title}`}
        >
          <X size={15} aria-hidden />
        </button>
      </div>
      {children}
    </section>
  );
}

const pct = (p: number) => `${Math.round(p * 100)}%`;

/* ---------- Фото: до 4, перетаскивание для порядка ---------- */

export function PhotosSection({
  uploads,
  onError,
  onClose,
}: {
  uploads: Uploads;
  onError: (e: string | null) => void;
  onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const { items } = uploads;
  return (
    <SectionFrame
      title="Фото"
      aside={
        <span className={s.secCount}>
          {items.length} из {POST_LIMITS.photos} · перетащите, чтобы поменять порядок
        </span>
      }
      onClose={onClose}
    >
      <ul className={s.thumbs}>
        {items.map((it, i) => (
          <li
            key={it.key}
            className={cx(s.thumb, dragFrom === i && s.dragging)}
            draggable
            onDragStart={(e) => {
              setDragFrom(i);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', String(i));
            }}
            onDragOver={(e) => {
              if (dragFrom !== null) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (dragFrom !== null) uploads.move(dragFrom, i);
              setDragFrom(null);
            }}
            onDragEnd={() => setDragFrom(null)}
          >
            {it.preview && <img src={it.preview} alt={`Фото ${i + 1}`} />}
            {i === 0 && <span className={s.cover}>Обложка</span>}
            {!it.media && !it.error && (
              <span className={s.progress} aria-label={`Загрузка ${pct(it.progress)}`}>
                <span style={{ width: pct(it.progress) }} />
              </span>
            )}
            {it.error && (
              <button type="button" className={s.failed} onClick={() => uploads.retry(it.key)}>
                <RotateCw size={16} aria-hidden /> Повторить
              </button>
            )}
            <span className={s.thumbTools}>
              <button
                type="button"
                onClick={() => uploads.move(i, i - 1)}
                disabled={i === 0}
                aria-label={`Фото ${i + 1}: левее`}
              >
                <ArrowLeft size={13} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => uploads.move(i, i + 1)}
                disabled={i === items.length - 1}
                aria-label={`Фото ${i + 1}: правее`}
              >
                <ArrowRight size={13} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => uploads.remove(it.key)}
                aria-label={`Удалить фото ${i + 1}`}
              >
                <Trash2 size={13} aria-hidden />
              </button>
            </span>
          </li>
        ))}
        {items.length < POST_LIMITS.photos && (
          <li>
            <button type="button" className={s.addThumb} onClick={() => input.current?.click()}>
              <Plus size={20} aria-hidden />
              <span>Добавить</span>
            </button>
          </li>
        )}
      </ul>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) onError(uploads.add(e.target.files));
          e.target.value = '';
        }}
      />
      {items.length === 0 && (
        <p className={s.hint}>Перетащите фото в окно или нажмите «Добавить». До 10 МБ каждое.</p>
      )}
    </SectionFrame>
  );
}

/* ---------- Файлы: до 5 ---------- */

const size = (b: number) =>
  b < 1024 * 1024
    ? `${Math.max(1, Math.round(b / 1024))} КБ`
    : `${(b / 1048576).toFixed(1).replace('.', ',')} МБ`;

export function FilesSection({
  uploads,
  onError,
  onClose,
}: {
  uploads: Uploads;
  onError: (e: string | null) => void;
  onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { items } = uploads;
  return (
    <SectionFrame
      title="Файлы"
      aside={
        <span className={s.secCount}>
          {items.length} из {POST_LIMITS.files}
        </span>
      }
      onClose={onClose}
    >
      {items.length > 0 && (
        <ul className={s.fileList}>
          {items.map((it) => (
            <li key={it.key} className={s.fileItem}>
              <FileText size={18} aria-hidden className={s.fileIcon} />
              <span className={s.fileName}>{it.file.name}</span>
              <span className={s.fileSize}>
                {it.error ? (
                  <button type="button" className={s.linkBtn} onClick={() => uploads.retry(it.key)}>
                    повторить
                  </button>
                ) : it.media ? (
                  size(it.file.size)
                ) : (
                  pct(it.progress)
                )}
              </span>
              <button
                type="button"
                className={s.iconBtn}
                onClick={() => uploads.remove(it.key)}
                aria-label={`Удалить ${it.file.name}`}
              >
                <X size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length < POST_LIMITS.files && (
        <button type="button" className={s.addRow} onClick={() => input.current?.click()}>
          <Plus size={16} aria-hidden /> Прикрепить файл
        </button>
      )}
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) onError(uploads.add(e.target.files));
          e.target.value = '';
        }}
      />
    </SectionFrame>
  );
}

/* ---------- Опрос ---------- */

export function PollSection({
  register,
  fields,
  errors,
  onClose,
}: {
  register: UseFormRegister<ComposeValues>;
  fields: UseFieldArrayReturn<ComposeValues, 'pollOptions'>;
  errors: FieldErrors<ComposeValues>;
  onClose: () => void;
}) {
  return (
    <SectionFrame title="Опрос" onClose={onClose}>
      <input
        className={cx(s.input, errors.pollQuestion && s.invalid)}
        placeholder="Вопрос"
        aria-label="Вопрос опроса"
        maxLength={140}
        {...register('pollQuestion')}
      />
      {errors.pollQuestion && (
        <p className={s.error} role="alert">
          {errors.pollQuestion.message}
        </p>
      )}
      <ol className={s.options}>
        {fields.fields.map((f, i) => (
          <li key={f.id} className={s.option}>
            <input
              className={cx(s.input, errors.pollOptions?.[i]?.value && s.invalid)}
              placeholder={`Вариант ${i + 1}`}
              aria-label={`Вариант ${i + 1}`}
              maxLength={80}
              {...register(`pollOptions.${i}.value`)}
            />
            {fields.fields.length > POST_LIMITS.pollOptionsMin && (
              <button
                type="button"
                className={s.iconBtn}
                onClick={() => fields.remove(i)}
                aria-label={`Удалить вариант ${i + 1}`}
              >
                <X size={15} aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ol>
      {errors.pollOptions && (
        <p className={s.error} role="alert">
          {errors.pollOptions.message ??
            errors.pollOptions.root?.message ??
            'Заполните все варианты'}
        </p>
      )}
      <div className={s.pollFoot}>
        {fields.fields.length < POST_LIMITS.pollOptionsMax && (
          <button type="button" className={s.addRow} onClick={() => fields.append({ value: '' })}>
            <Plus size={16} aria-hidden /> Вариант
          </button>
        )}
        <label className={s.check}>
          <input type="checkbox" {...register('pollMultiple')} /> Несколько ответов
        </label>
      </div>
    </SectionFrame>
  );
}
