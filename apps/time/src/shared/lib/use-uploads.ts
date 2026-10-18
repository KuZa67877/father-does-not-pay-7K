import { useUploadQueue, type UploadQueueOptions } from '@dle/ui';
import { useRepositories } from '@/shared/api/di';

export function useUploads(options: UploadQueueOptions) {
  const { media } = useRepositories();
  return useUploadQueue(media, options);
}
