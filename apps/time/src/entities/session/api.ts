import type { LoginInput, RegisterInput } from '@dle/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

export function useMe() {
  const { auth } = useRepositories();
  return useQuery({
    queryKey: qk.me,
    queryFn: ({ signal }) => auth.me({ signal }),
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const { auth } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => auth.login(input),
    onSuccess: (session) => {
      qc.setQueryData(qk.me, session.user);
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
    },
  });
}

export function useRegister() {
  const { auth } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => auth.register(input),
    onSuccess: (session) => {
      qc.setQueryData(qk.me, session.user);
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
    },
  });
}

export function useLogout() {
  const { auth } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => auth.logout(),
    onSuccess: () => {
      qc.setQueryData(qk.me, null);
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
    },
  });
}

export function usePasswordReset() {
  const { auth } = useRepositories();
  return useMutation({ mutationFn: (email: string) => auth.requestPasswordReset(email) });
}
