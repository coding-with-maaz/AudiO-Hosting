import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { planAPI, subscriptionAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => planAPI.getAll().then(res => res.data.data.plans),
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: () => planAPI.getById(id).then(res => res.data.data.plan),
    enabled: !!id,
  });
}

export function useMySubscriptions() {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionAPI.getMy().then(res => res.data.data),
  });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (planId: string) =>
      subscriptionAPI.subscribe(planId).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      // Update user storage limit if provided
      if (data?.data?.subscription?.plan?.storageLimit) {
        updateUser({ storageLimit: data.data.subscription.plan.storageLimit });
      }
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      subscriptionAPI.cancel(id, reason).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

