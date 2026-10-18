import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useUploadQueue } from '../hooks/use-upload-queue';
beforeEach(() =>
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    }),
  ),
);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('учитывает пакетные добавления и замену, отменяет запросы и освобождает превью', async () => {
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
  const signals: AbortSignal[] = [];
  const media = {
    upload: vi.fn((_file: File, opts: { signal: AbortSignal }) => {
      signals.push(opts.signal);
      return new Promise<{ id: string }>(() => {});
    }),
  };
  const file = new File(['x'], 'image.jpg', { type: 'image/jpeg' });
  const { result, unmount } = renderHook(() => useUploadQueue(media, { max: 1 }));
  act(() => {
    expect(result.current.add([file])).toBeNull();
    expect(result.current.add([file])).toContain('не больше 1');
  });
  expect(result.current.items).toHaveLength(1);
  const first = result.current.items[0];
  if (!first) throw new Error('Нет загрузки');
  act(() => {
    result.current.remove(first.key);
    result.current.add([file]);
  });
  expect(result.current.items).toHaveLength(1);
  expect(signals[0]?.aborted).toBe(true);
  unmount();
  expect(signals[1]?.aborted).toBe(true);
  expect(revoke).toHaveBeenCalledWith('blob:preview');
});

it('повторяет неудачную загрузку и сохраняет порядок выбранных файлов', async () => {
  const media = {
    upload: vi
      .fn()
      .mockRejectedValueOnce(new Error('Нет сети'))
      .mockResolvedValue({ id: 'uploaded' }),
  };
  const { result } = renderHook(() => useUploadQueue<{ id: string }>(media, { max: 2 }));
  act(() => {
    result.current.add([new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]);
  });
  await waitFor(() => expect(result.current.failed).toBe(true));
  const failed = result.current.items[0];
  if (!failed) throw new Error('Нет загрузки');
  act(() => {
    result.current.move(0, 1);
    result.current.retry(failed.key);
  });
  await waitFor(() => expect(result.current.pending || result.current.failed).toBe(false));
  expect(result.current.items.map((i) => i.file.name)).toEqual(['b.txt', 'a.txt']);
  expect(result.current.ids).toHaveLength(2);
});
