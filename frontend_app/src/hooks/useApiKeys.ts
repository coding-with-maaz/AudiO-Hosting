import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiKeyAPI } from '@/lib/api';

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeyAPI.getAll().then(res => res.data.data.apiKeys),
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; rateLimit?: number; permissions?: any; allowedDomains?: string[] }) =>
      apiKeyAPI.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; rateLimit?: number; isActive?: boolean; permissions?: any; allowedDomains?: string[] } }) =>
      apiKeyAPI.update(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiKeyAPI.delete(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

