import { useCallback, useEffect, useRef, useState } from 'react';

export interface QueuedUpload<T> {
  key: string;
  file: File;
  /** Локальное превью (object URL) — для картинок. */
  preview: string | null;
  progress: number;
  media: T | null;
  error: string | null;
}

let seq = 0;

/**
 * Очередь загрузок через MediaRepository: прогресс, отмена, порядок.
 * Файлы начинают грузиться сразу после выбора.
 */
export interface UploadQueueOptions {
  max: number;
  accept?: (f: File) => string | null;
}

export function useUploadQueue<T extends { id: string }>(
  media: {
    upload: (
      file: File,
      opts: { signal: AbortSignal; onProgress: (progress: number) => void },
    ) => Promise<T>;
  },
  { max, accept }: UploadQueueOptions,
) {
  const [items, setItems] = useState<QueuedUpload<T>[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const previews = useRef(new Set<string>());
  const queuedKeys = useRef(new Set<string>());

  const patch = (key: string, p: Partial<QueuedUpload<T>>) =>
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...p } : it)));

  const start = useCallback(
    (item: QueuedUpload<T>) => {
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
          patch(item.key, { error: e instanceof Error ? e.message : 'Не удалось загрузить' });
        })
        .finally(() => controllers.current.delete(item.key));
    },
    [media],
  );

  /** Добавляет файлы; возвращает текст ошибки, если что-то не подошло. */
  const add = (files: FileList | File[]): string | null => {
    const list = [...files];
    let error: string | null = null;
    const room = max - queuedKeys.current.size;
    if (list.length > room) error = `Можно прикрепить не больше ${max}`;
    const accepted: QueuedUpload<T>[] = [];
    for (const file of list.slice(0, Math.max(0, room))) {
      const problem = accept?.(file) ?? null;
      if (problem) {
        error = problem;
        continue;
      }
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      if (preview) previews.current.add(preview);
      const key = `u${++seq}`;
      queuedKeys.current.add(key);
      accepted.push({
        key,
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
    queuedKeys.current.delete(key);
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
