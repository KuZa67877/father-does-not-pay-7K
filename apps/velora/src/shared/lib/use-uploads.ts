import { isApiError, type Media } from '@dle/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRepositories } from '@/shared/api/di';

export interface UploadItem {
  key: string;
  file: File;
  /** Локальное превью (object URL) — для картинок. */
  preview: string | null;
  progress: number;
  media: Media | null;
  error: string | null;
}

let seq = 0;

/**
 * Очередь загрузок через MediaRepository: прогресс, отмена, порядок.
 * Файлы начинают грузиться сразу после выбора.
 */
export function useUploads({ max, accept }: { max: number; accept?: (f: File) => string | null }) {
  const { media } = useRepositories();
  const [items, setItems] = useState<UploadItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const previews = useRef(new Set<string>());

  const patch = (key: string, p: Partial<UploadItem>) =>
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...p } : it)));

  const start = useCallback(
    (item: UploadItem) => {
      const ctrl = new AbortController();
      controllers.current.set(item.key, ctrl);
      media
        .upload(item.file, {
          signal: ctrl.signal,
          onProgress: (progress) => patch(item.key, { progress }),
        })
        .then((m) => patch(item.key, { media: m, progress: 1 }))
        .catch((e: unknown) => {
          if (ctrl.signal.aborted) return;
          patch(item.key, { error: isApiError(e) ? e.message : 'Не удалось загрузить' });
        })
        .finally(() => controllers.current.delete(item.key));
    },
    [media],
  );

  /** Добавляет файлы; возвращает текст ошибки, если что-то не подошло. */
  const add = (files: FileList | File[]): string | null => {
    const list = [...files];
    let error: string | null = null;
    const room = max - items.length;
    if (list.length > room) error = `Можно прикрепить не больше ${max}`;
    const accepted: UploadItem[] = [];
    for (const file of list.slice(0, Math.max(0, room))) {
      const problem = accept?.(file) ?? null;
      if (problem) {
        error = problem;
        continue;
      }
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      if (preview) previews.current.add(preview);
      accepted.push({
        key: `u${++seq}`,
        file,
        preview,
        progress: 0,
        media: null,
        error: null,
      });
    }
    setItems((prev) => [...prev, ...accepted]);
    accepted.forEach(start);
    return error;
  };

  const remove = (key: string) => {
    controllers.current.get(key)?.abort();
    setItems((list) => {
      const it = list.find((x) => x.key === key);
      if (it?.preview) {
        URL.revokeObjectURL(it.preview);
        previews.current.delete(it.preview);
      }
      return list.filter((x) => x.key !== key);
    });
  };

  const retry = (key: string) => {
    const it = items.find((x) => x.key === key);
    if (!it) return;
    patch(key, { error: null, progress: 0 });
    start({ ...it, error: null, progress: 0 });
  };

  /** Переставляет элемент from → to (перетаскивание или стрелки). */
  const move = (from: number, to: number) =>
    setItems((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [it] = next.splice(from, 1);
      if (it) next.splice(to, 0, it);
      return next;
    });

  useEffect(() => {
    const ctrls = controllers.current;
    const urls = previews.current;
    return () => {
      ctrls.forEach((c) => c.abort());
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const pending = items.some((it) => !it.media && !it.error);
  const failed = items.some((it) => it.error);
  return {
    items,
    add,
    remove,
    retry,
    move,
    pending,
    failed,
    ids: items.flatMap((it) => (it.media ? [it.media.id] : [])),
  };
}
