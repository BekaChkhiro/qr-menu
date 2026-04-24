'use client';

import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';

export interface TopProductRow {
  id: string;
  rank: number;
  name: { ka: string; en: string | null; ru: string | null };
  category: {
    id: string;
    name: { ka: string; en: string | null; ru: string | null };
  };
  menu: { id: string; name: string };
  price: string;
  currency: string;
  imageUrl: string | null;
  views: number;
}

export interface TopProductsResponse {
  rows: TopProductRow[];
  period: { days: number };
  /** True while the endpoint returns heuristic data (no per-product view tracking yet). */
  heuristic: boolean;
}

export function useTopProducts({
  limit = 5,
  days = 30,
}: { limit?: number; days?: number } = {}) {
  return useQuery<TopProductsResponse, ApiError>({
    queryKey: queryKeys.user.topProducts(limit, days),
    queryFn: () =>
      api.get<TopProductsResponse>(
        `/user/top-products?limit=${limit}&days=${days}`,
      ),
    staleTime: 1000 * 60 * 5,
  });
}
