import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { affiliateAPI } from '@/lib/api';

export function useMyAffiliate() {
  return useQuery({
    queryKey: ['affiliate'],
    queryFn: () => affiliateAPI.getMy().then(res => res.data.data).catch(() => ({ affiliate: null })),
  });
}

export function useAffiliateStats() {
  return useQuery({
    queryKey: ['affiliate-stats'],
    queryFn: () => affiliateAPI.getStats().then(res => res.data.data),
  });
}

export function useCreateAffiliate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => affiliateAPI.create().then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate'] });
    },
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => affiliateAPI.requestPayout(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate'] });
    },
  });
}

