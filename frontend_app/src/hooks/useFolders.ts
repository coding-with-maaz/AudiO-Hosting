import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { folderAPI } from '@/lib/api';

export function useFolders(params?: any) {
  return useQuery({
    queryKey: ['folders', params],
    queryFn: () => folderAPI.getAll(params).then(res => res.data.data),
  });
}

export function useFolder(id: string) {
  return useQuery({
    queryKey: ['folder', id],
    queryFn: () => folderAPI.getById(id).then(res => res.data.data.folder),
    enabled: !!id,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => folderAPI.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      folderAPI.update(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['folder', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => folderAPI.delete(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['my-audios'] });
    },
  });
}

export function useEnableFolderSharing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, password }: { id: string; password?: string }) =>
      folderAPI.enableSharing(id, password).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['folder', variables.id] });
    },
  });
}

export function useDisableFolderSharing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => folderAPI.disableSharing(id).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['folder', variables.id] });
    },
  });
}

