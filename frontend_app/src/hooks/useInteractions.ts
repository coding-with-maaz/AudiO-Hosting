import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interactionAPI } from '@/lib/api';

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => interactionAPI.getFavorites().then(res => res.data.data),
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (audioId: string) =>
      interactionAPI.addFavorite(audioId).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (audioId: string) =>
      interactionAPI.removeFavorite(audioId).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useComments(audioId: string, params?: any) {
  return useQuery({
    queryKey: ['comments', audioId, params],
    queryFn: () => interactionAPI.getComments(audioId, params).then(res => res.data.data),
    enabled: !!audioId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ audioId, data }: { audioId: string; data: any }) =>
      interactionAPI.addComment(audioId, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.audioId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      interactionAPI.updateComment(id, content).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => interactionAPI.deleteComment(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useRatings(audioId: string) {
  return useQuery({
    queryKey: ['ratings', audioId],
    queryFn: () => interactionAPI.getRatings(audioId).then(res => res.data.data),
    enabled: !!audioId,
  });
}

export function useAddRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ audioId, rating }: { audioId: string; rating: number }) =>
      interactionAPI.addRating(audioId, rating).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ratings', variables.audioId] });
    },
  });
}

