'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiError } from '@/lib/api/client';
import type { UpdatePasswordInput } from '@/lib/validations/user';

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const sessionsQueryKey = ['user', 'sessions'] as const;

export function useSessions() {
  return useQuery<{ sessions: UserSession[] }, ApiError>({
    queryKey: sessionsQueryKey,
    queryFn: async () => api.get<{ sessions: UserSession[] }>('/user/sessions'),
    staleTime: 30 * 1000,
  });
}

export function useUpdatePassword() {
  return useMutation<void, ApiError, UpdatePasswordInput>({
    mutationFn: async (input) => {
      await api.patch('/user/password', input);
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: async (sessionId) => {
      await api.delete(`/user/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
  });
}

export function useDeleteOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError>({
    mutationFn: async () => {
      await api.delete('/user/sessions');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
  });
}

export function useDeleteAccount() {
  return useMutation<void, ApiError>({
    mutationFn: async () => {
      await api.delete('/user/account');
    },
  });
}
