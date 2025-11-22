import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { audioAPI, bulkAPI, shareAPI } from '@/lib/api';
import { useAudioStore } from '@/store/audioStore';

export function useAudios(params?: any) {
  return useQuery({
    queryKey: ['audios', params],
    queryFn: () => audioAPI.getAll(params).then(res => res.data.data),
  });
}

export function useMyAudios(params?: any) {
  return useQuery({
    queryKey: ['my-audios', params],
    queryFn: () => audioAPI.getMyAudios(params).then(res => res.data.data),
  });
}

export function useAudio(id: string) {
  return useQuery({
    queryKey: ['audio', id],
    queryFn: () => audioAPI.getById(id).then(res => res.data.data.audio),
    enabled: !!id,
  });
}

export function useUploadAudio() {
  const queryClient = useQueryClient();
  const { setUploadProgress, setIsUploading } = useAudioStore();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      return audioAPI.upload(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-audios'] });
      queryClient.invalidateQueries({ queryKey: ['audios'] });
      setIsUploading(false);
    },
    onError: () => {
      setIsUploading(false);
    },
  });
}

export function useUpdateAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      audioAPI.update(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audio', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['my-audios'] });
    },
  });
}

export function useDeleteAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent?: boolean }) =>
      audioAPI.delete(id, permanent).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-audios'] });
      queryClient.invalidateQueries({ queryKey: ['audios'] });
    },
  });
}

export function useRenameAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      audioAPI.rename(id, title).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audio', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['my-audios'] });
    },
  });
}

export function useShareLinks(id: string) {
  return useQuery({
    queryKey: ['share-links', id],
    queryFn: () => shareAPI.getLinks(id).then(res => res.data.data),
    enabled: !!id,
  });
}

export function useBulkUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      bulkAPI.upload(formData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-audios'] });
    },
  });
}

export function useBulkDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (audioIds: string[]) =>
      bulkAPI.delete(audioIds).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-audios'] });
    },
  });
}

export function useBulkMove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ audioIds, folderId }: { audioIds: string[]; folderId: string | null }) =>
      bulkAPI.move(audioIds, folderId).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-audios'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

