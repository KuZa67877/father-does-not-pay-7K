import type { Media } from '@dle/core';
import { useUploadQueue, type QueuedUpload, type UploadQueueOptions } from '@dle/ui';
import { useRepositories } from '@/shared/api/di';

export type UploadItem = QueuedUpload<Media>;

export function useUploads(options: UploadQueueOptions) {
  const { media } = useRepositories();
  return useUploadQueue(media, options);
}
