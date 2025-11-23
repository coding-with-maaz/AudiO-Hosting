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
    queryFn: () => affiliateAPI.getStats().then(res => res.data.data).catch(() => ({
      stats: {
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        totalReferrals: 0,
        activeReferrals: 0,
        totalClicks: 0,
        totalSignups: 0,
        conversionRate: 0,
        recentTransactions: []
      },
      affiliate: null
    })),
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

