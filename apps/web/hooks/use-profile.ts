'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type ApiError } from '@/lib/api/client';
import type { UpdateProfileInput } from '@/lib/validations/user';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  timezone: string | null;
  dateFormat: string | null;
  currency: string | null;
  priceFormat: string | null;
  image: string | null;
  plan: 'FREE' | 'STARTER' | 'PRO';
  hasPassword: boolean;
}

const profileQueryKey = ['user', 'profile'] as const;

export function useProfile() {
  return useQuery<UserProfile, ApiError>({
    queryKey: profileQueryKey,
    queryFn: async () => {
      const data = await api.get<{ user: UserProfile }>('/user/profile');
      return data.user;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, ApiError, UpdateProfileInput>({
    mutationFn: async (input) => {
      const data = await api.patch<{ user: UserProfile }>('/user/profile', input);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(profileQueryKey, user);
    },
  });
}
