'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type ApiError } from '@/lib/api/client';
import type { UpdateBusinessInput } from '@/lib/validations/business';

export interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessInfo {
  id: string;
  userId: string;
  logoUrl: string | null;
  businessName: string | null;
  tagline: string | null;
  cuisines: string[];
  priceRange: number | null;
  taxId: string | null;
  businessType: string | null;
  description: string | null;
  streetAddress: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  openingHours: OpeningHour[] | null;
}

const businessQueryKey = ['user', 'business'] as const;

export function useBusiness() {
  return useQuery<BusinessInfo, ApiError>({
    queryKey: businessQueryKey,
    queryFn: async () => {
      const data = await api.get<{ business: BusinessInfo }>('/user/business');
      return data.business;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation<BusinessInfo, ApiError, UpdateBusinessInput>({
    mutationFn: async (input) => {
      const data = await api.patch<{ business: BusinessInfo }>('/user/business', input);
      return data.business;
    },
    onSuccess: (business) => {
      queryClient.setQueryData(businessQueryKey, business);
    },
  });
}
