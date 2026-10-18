import type { Media } from '@dle/core';
import { useEffect, useRef, useState } from 'react';
import { useUploads } from '@/shared/lib/use-uploads';
import s from './media-picker.module.css';

/** Выбор медиа с загрузкой, повтором и отменой; существующие файлы сохраняются при редактировании. */
export function MediaPicker({
  label,
  initial = [],
  onChange,
  onBusy,
  accept = 'image/*',
  max = 1,
}: {
  label: string;
  initial?: (Omit<Media, 'alt'> & { alt?: string })[];
  onChange: (media: Media[]) => void;
  onBusy: (busy: boolean) => void;
  accept?: string;
  max?: number;
}) {
  const [kept, setKept] = useState<Media[]>(() =>
    initial.map((media) => ({ ...media, alt: media.alt ?? '' })),
  );
  const [error, setError] = useState('');
  const upload = useUploads({
    max: Math.max(0, max - kept.length),
    accept: (file) => {
      const types = accept.split(',').map((s) => s.trim());
      if (
        !types.some((t) =>
          t.endsWith('/*') ? file.type.startsWith(t.slice(0, -1)) : file.type === t,
        )
      )
        return 'Выберите файл подходящего типа';
      return file.size > 20 * 1024 * 1024 ? 'Файл должен быть меньше 20 МБ' : null;
    },
  });
  const changed = useRef(onChange);
  const busy = useRef(onBusy);
  changed.current = onChange;
  busy.current = onBusy;
  useEffect(() => {
    changed.current([...kept, ...upload.items.flatMap((i) => (i.media ? [i.media] : []))]);
  }, [kept, upload.items]);
  useEffect(() => {
    busy.current(upload.pending || upload.failed);
  }, [upload.pending, upload.failed]);
  useEffect(() => () => busy.current(false), []);
  const add = (files: FileList | File[]) => setError(upload.add(files) ?? '');
  const existing = kept.map((media) => ({
    key: media.id,
    name: media.name ?? media.alt ?? 'Файл',
    url: media.type === 'image' ? media.url : null,
    remove: () => setKept((list) => list.filter((m) => m.id !== media.id)),
  }));
  return (
    <fieldset className={s.wrap}>
      <legend>{label}</legend>
      <label
        className={s.drop}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
      >
        <span>Перетащите файлы сюда или выберите с устройства</span>
        <small>До {max} файлов, каждый — до 20 МБ</small>
        <input
          type="file"
          accept={accept}
          multiple={max > 1}
          aria-label={label}
          disabled={kept.length + upload.items.length >= max}
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      <ul className={s.list}>
        {existing.map((i) => (
          <li key={i.key}>
            {i.url && <img src={i.url} alt="" />}
            <span>{i.name}</span>
            <button type="button" onClick={i.remove}>
              Убрать
            </button>
          </li>
        ))}
        {upload.items.map((i, index) => (
          <li key={i.key}>
            {i.preview && <img src={i.preview} alt="" />}
            <span>{i.file.name}</span>
            {!i.media && !i.error && (
              <progress value={i.progress} max={1} aria-label={`Загрузка ${i.file.name}`} />
            )}
            {i.error && (
              <span className={s.error} role="alert">
                {i.error}{' '}
                <button type="button" onClick={() => upload.retry(i.key)}>
                  Повторить
                </button>
              </span>
            )}
            {max > 1 && (
              <>
                <button
                  type="button"
                  aria-label={`Поднять файл ${i.file.name}`}
                  disabled={index === 0}
                  onClick={() => upload.move(index, index - 1)}
                >
                  Выше
                </button>
                <button
                  type="button"
                  aria-label={`Опустить файл ${i.file.name}`}
                  disabled={index === upload.items.length - 1}
                  onClick={() => upload.move(index, index + 1)}
                >
                  Ниже
                </button>
              </>
            )}
            <button type="button" onClick={() => upload.remove(i.key)}>
              Убрать
            </button>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
