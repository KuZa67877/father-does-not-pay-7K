import type {
  CommentSort,
  FeedKind,
  Post,
  PostComment,
  PostInput,
  PostQuery,
} from '@dle/core/velora';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';
import { patchPost, restorePosts, snapshotPosts } from './cache';

const PAGE = 8;

/** Ленты «Для вас / Подписки / Круги» с курсорной пагинацией. */
export function useFeed(kind: FeedKind, category?: string) {
  const { feed } = useRepositories();
  return useInfiniteQuery({
    queryKey: qk.feed(kind, category),
    queryFn: ({ pageParam, signal }) =>
      feed.list(
        { kind, cursor: pageParam, limit: PAGE, ...(category ? { category } : {}) },
        { signal },
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Посты по фильтру: профиль, категория, тег, поиск, сохранённое. */
export function usePostList(query: Omit<PostQuery, 'cursor'>, enabled = true) {
  const { posts } = useRepositories();
  return useInfiniteQuery({
    queryKey: qk.posts.list(query),
    queryFn: ({ pageParam, signal }) =>
      posts.list({ limit: PAGE, ...query, cursor: pageParam }, { signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
}

export function usePost(id: string) {
  const { posts } = useRepositories();
  return useQuery({
    queryKey: qk.posts.detail(id),
    queryFn: ({ signal }) => posts.get(id, { signal }),
    enabled: Boolean(id),
  });
}

export function useComments(postId: string, sort: CommentSort) {
  const { posts } = useRepositories();
  return useQuery({
    queryKey: qk.posts.comments(postId, sort),
    queryFn: ({ signal }) => posts.comments(postId, sort, { signal }),
  });
}

/* ---------- Действия с постом (оптимистично во всех лентах) ---------- */

function optimistic<V>(qc: QueryClient, id: string, fn: (p: Post, v: V) => Post | null) {
  return {
    onMutate: async (value: V) => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      await qc.cancelQueries({ queryKey: qk.posts.all });
      const snapshot = snapshotPosts(qc);
      patchPost(qc, id, (p) => fn(p, value));
      return { snapshot };
    },
    onError: (
      _e: unknown,
      _v: V,
      ctx: { snapshot: ReturnType<typeof snapshotPosts> } | undefined,
    ) => {
      if (ctx) restorePosts(qc, ctx.snapshot);
    },
  };
}

export function useLikePost(id: string) {
  const { posts } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: boolean) => posts.like(id, value),
    ...optimistic<boolean>(qc, id, (p, value) => ({
      ...p,
      isLiked: value,
      likesCount: Math.max(0, p.likesCount + (value ? 1 : -1)),
    })),
    onSuccess: (res) => patchPost(qc, id, (p) => ({ ...p, ...res })),
  });
}

export function useSavePost(id: string) {
  const { posts } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: boolean) => posts.save(id, value),
    ...optimistic<boolean>(qc, id, (p, value) => ({ ...p, isSaved: value })),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.posts.list({ tab: 'saved' }) }),
  });
}

export function usePinPost(id: string) {
  const { posts } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: boolean) => posts.pin(id, value),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feed'] });
      void qc.invalidateQueries({ queryKey: qk.posts.all });
      void qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useRemovePost(id: string) {
  const { posts } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => posts.remove(id),
    ...optimistic<undefined>(qc, id, () => null),
    onSuccess: () => {
      qc.removeQueries({ queryKey: qk.posts.detail(id) });
      void qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useReportPost(id: string) {
  const { posts } = useRepositories();
  return useMutation({ mutationFn: (reason: string) => posts.report(id, reason) });
}

export function useVote(postId: string) {
  const { posts } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (optionIds: string[]) => posts.vote(postId, optionIds),
    ...optimistic<string[]>(qc, postId, (p, ids) =>
      p.poll
        ? {
            ...p,
            poll: {
              ...p.poll,
              votedOptionId: ids[0] ?? null,
              totalVotes: p.poll.totalVotes + 1,
              options: p.poll.options.map((o) =>
                ids.includes(o.id) ? { ...o, votes: o.votes + 1 } : o,
              ),
            },
          }
        : p,
    ),
    onSuccess: (post) => patchPost(qc, postId, () => post),
  });
}

export function useAddComment(postId: string) {
  const { posts } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { text: string; parentId: string | null }) =>
      posts.addComment(postId, input),
    onSuccess: () => {
      patchPost(qc, postId, (p) => ({ ...p, commentsCount: p.commentsCount + 1 }));
      void qc.invalidateQueries({ queryKey: ['posts', 'comments', postId] });
    },
  });
}

export function useCreatePost() {
  const { posts } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) => posts.create(input),
    onSuccess: (post) => {
      qc.setQueryData(qk.posts.detail(post.id), post);
      void qc.invalidateQueries({ queryKey: ['feed'] });
      void qc.invalidateQueries({ queryKey: qk.posts.all });
      void qc.invalidateQueries({ queryKey: ['profile'] });
      if (post.repostOf) {
        const originalId = post.repostOf.id;
        patchPost(qc, originalId, (p) => ({ ...p, repostsCount: p.repostsCount + 1 }));
      }
    },
  });
}

/** «Нравится» на комментарии — оптимистично в дереве обсуждения. */
export function useLikeComment(postId: string) {
  const { posts } = useRepositories();
  const qc = useQueryClient();
  const patchTree = (id: string, fn: (c: PostComment) => PostComment) => {
    const walk = (list: PostComment[]): PostComment[] =>
      list.map((c) => (c.id === id ? fn(c) : { ...c, replies: walk(c.replies) }));
    qc.setQueriesData<PostComment[]>({ queryKey: ['posts', 'comments', postId] }, (d) =>
      d ? walk(d) : d,
    );
  };
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => posts.likeComment(id, value),
    onMutate: ({ id, value }) =>
      patchTree(id, (c) => ({
        ...c,
        isLiked: value,
        likesCount: Math.max(0, c.likesCount + (value ? 1 : -1)),
      })),
    onSuccess: (res, { id }) => patchTree(id, (c) => ({ ...c, ...res })),
    onError: () => void qc.invalidateQueries({ queryKey: ['posts', 'comments', postId] }),
  });
}
