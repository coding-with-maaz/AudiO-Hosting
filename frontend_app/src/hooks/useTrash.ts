import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trashAPI } from '@/lib/api';

export function useTrash(type?: string) {
  return useQuery({
    queryKey: ['trash', type],
    queryFn: () => trashAPI.getTrash(type).then(res => res.data.data),
  });
}

export function useRestoreFromTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trashAPI.restore(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['audios'] });
      queryClient.invalidateQueries({ queryKey: ['my-audios'] });
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (type?: string) => trashAPI.empty(type).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['audios'] });
      queryClient.invalidateQueries({ queryKey: ['my-audios'] });
    },
  });
}

