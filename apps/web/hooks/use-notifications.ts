'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type ApiError } from '@/lib/api/client';
import type { UpdateNotificationsInput } from '@/lib/validations/notifications';

export interface NotificationPreferences {
  id: string;
  userId: string;
  email: string;
  menuEditEmail: boolean;
  menuEditPush: boolean;
  outOfStockEmail: boolean;
  outOfStockPush: boolean;
  weeklyDigestEmail: boolean;
  weeklyDigestPush: boolean;
  invoiceReadyEmail: boolean;
  invoiceReadyPush: boolean;
  paymentFailedEmail: boolean;
  paymentFailedPush: boolean;
  newSignInEmail: boolean;
  newSignInPush: boolean;
  createdAt: string;
  updatedAt: string;
}

const notificationsQueryKey = ['user', 'notifications'] as const;

export function useNotifications() {
  return useQuery<NotificationPreferences, ApiError>({
    queryKey: notificationsQueryKey,
    queryFn: async () => {
      const data = await api.get<{ preferences: NotificationPreferences }>(
        '/user/notifications'
      );
      return data.preferences;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateNotifications() {
  const queryClient = useQueryClient();

  return useMutation<NotificationPreferences, ApiError, UpdateNotificationsInput>({
    mutationFn: async (input) => {
      const data = await api.patch<{ preferences: NotificationPreferences }>(
        '/user/notifications',
        input
      );
      return data.preferences;
    },
    onSuccess: (prefs) => {
      queryClient.setQueryData(notificationsQueryKey, prefs);
    },
  });
}
