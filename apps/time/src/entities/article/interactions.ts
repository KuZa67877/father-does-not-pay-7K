import type { Article, Comment, CommentInput, ReactionType } from '@dle/core/time';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

export function useReaction(article: Article) {
  const { reactions } = useRepositories();
  const qc = useQueryClient();
  const key = qk.articles.detail(article.slug);
  return useMutation({
    mutationFn: (type: ReactionType | null) => reactions.react(article.id, type),
    onMutate: async (type) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Article>(key);
      if (previous) {
        const counts = { ...previous.reactions.counts };
        const mine = previous.reactions.mine;
        if (mine) counts[mine] = Math.max(0, counts[mine] - 1);
        if (type) counts[type] += 1;
        qc.setQueryData<Article>(key, { ...previous, reactions: { counts, mine: type } });
      }
      return { previous };
    },
    onError: (_error, _type, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSuccess: (value) => {
      qc.setQueryData<Article>(key, (a) => a && { ...a, reactions: value });
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.articles.all }),
  });
}

export function useArticleComments(articleId: string) {
  const { comments } = useRepositories();
  return useQuery({
    queryKey: qk.comments(articleId),
    queryFn: ({ signal }) => comments.list(articleId, { signal }),
  });
}

export function useAddArticleComment(articleId: string) {
  const { comments } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CommentInput) => comments.create(articleId, input),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.comments(articleId) }),
        qc.invalidateQueries({ queryKey: qk.articles.all }),
      ]);
    },
  });
}

function patchLike(list: Comment[], id: string, value: boolean): Comment[] {
  return list.map((c) =>
    c.id === id
      ? {
          ...c,
          isLiked: value,
          likesCount: Math.max(0, c.likesCount + Number(value) - Number(c.isLiked)),
        }
      : { ...c, replies: patchLike(c.replies, id, value) },
  );
}

export function useLikeArticleComment(articleId: string) {
  const { comments } = useRepositories();
  const qc = useQueryClient();
  const key = qk.comments(articleId);
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => comments.like(id, value),
    onMutate: async ({ id, value }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Comment[]>(key);
      if (previous) qc.setQueryData(key, patchLike(previous, id, value));
      return { previous };
    },
    onError: (_error, _value, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  });
}
