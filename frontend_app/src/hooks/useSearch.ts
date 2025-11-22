import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '@/lib/api';

export function useSearch(params: any) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => searchAPI.search(params).then(res => res.data.data),
    enabled: !!params.q || Object.keys(params).length > 0,
  });
}

export function useSearchFilters(params?: any) {
  return useQuery({
    queryKey: ['search-filters', params],
    queryFn: () => searchAPI.getFilters(params).then(res => res.data.data),
  });
}

