'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearch } from '@/hooks/useSearch';
import { formatFileSize, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Search, Music, Filter, X, Play, Download, Share2, Heart, Star, Calendar, FileAudio } from 'lucide-react';
import Link from 'next/link';
import { useAddFavorite } from '@/hooks/useInteractions';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState({
    sortBy: 'relevance',
    order: 'desc',
    minSize: '',
    maxSize: '',
    dateFrom: '',
    dateTo: '',
    isPublic: '',
    mimeType: '',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const addFavorite = useAddFavorite();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchParams = {
    q: debouncedQuery,
    page,
    limit: 20,
    sortBy: filters.sortBy === 'relevance' ? 'createdAt' : filters.sortBy,
    sortOrder: filters.order.toUpperCase(),
    ...(filters.minSize && { minSize: String(parseInt(filters.minSize) * 1024 * 1024) }), // Convert MB to bytes
    ...(filters.maxSize && { maxSize: String(parseInt(filters.maxSize) * 1024 * 1024) }), // Convert MB to bytes
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
    ...(filters.isPublic !== '' && { isPublic: filters.isPublic }),
    ...(filters.mimeType && { mimeType: filters.mimeType }),
  };

  const { data, isLoading, refetch } = useSearch(searchParams);

  const handleAddFavorite = async (audioId: string) => {
    try {
      await addFavorite.mutateAsync(audioId);
    } catch (error: any) {
      if (error?.response?.data?.message?.includes('already')) {
        alert('Audio is already in your favorites');
      } else {
        console.error('Failed to add favorite:', error);
      }
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      sortBy: 'relevance',
      order: 'desc',
      minSize: '',
      maxSize: '',
      dateFrom: '',
      dateTo: '',
      isPublic: '',
      mimeType: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== '' && value !== 'relevance' && value !== 'desc'
  );

  const getDownloadLink = (audioId: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/audio/${audioId}/download`;
  };

  const getEmbedLink = (audioId: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/e/${audioId}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const audios = data?.audios || [];
  const pagination = data?.pagination || { total: 0, pages: 1, currentPage: 1 };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Search className="h-8 w-8" />
            Search Audios
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Find audio files by title, description, tags, or metadata
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for audio files..."
                className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                  {Object.values(filters).filter((v) => v !== '' && v !== 'relevance' && v !== 'desc').length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="size">File Size</option>
                  <option value="views">Views</option>
                  <option value="duration">Duration</option>
                </select>
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order
                </label>
                <select
                  value={filters.order}
                  onChange={(e) => handleFilterChange('order', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              {/* Public/Private */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Visibility
                </label>
                <select
                  value={filters.isPublic}
                  onChange={(e) => handleFilterChange('isPublic', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All</option>
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
              </div>

              {/* File Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  File Type
                </label>
                <select
                  value={filters.mimeType}
                  onChange={(e) => handleFilterChange('mimeType', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="audio/mpeg">MP3</option>
                  <option value="audio/wav">WAV</option>
                  <option value="audio/ogg">OGG</option>
                  <option value="audio/aac">AAC</option>
                  <option value="audio/flac">FLAC</option>
                </select>
              </div>

              {/* Min Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Min Size (MB)
                </label>
                <input
                  type="number"
                  value={filters.minSize}
                  onChange={(e) => handleFilterChange('minSize', e.target.value)}
                  placeholder="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Max Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Size (MB)
                </label>
                <input
                  type="number"
                  value={filters.maxSize}
                  onChange={(e) => handleFilterChange('maxSize', e.target.value)}
                  placeholder="100"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Searching...</div>
          </div>
        ) : debouncedQuery || hasActiveFilters ? (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {pagination.total > 0
                  ? `Found ${pagination.total} result${pagination.total !== 1 ? 's' : ''}`
                  : 'No results found'}
              </p>
            </div>

            {/* Results List */}
            {audios.length > 0 ? (
              <>
                <div className="space-y-4">
                  {audios.map((audio: any) => (
                    <div
                      key={audio.id}
                      className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start gap-4">
                        {/* Audio Icon */}
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                          <Music className="h-8 w-8 text-white" />
                        </div>

                        {/* Audio Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <Link href={`/audio/${audio.id}`}>
                                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                                  {audio.title || audio.originalFilename || 'Untitled'}
                                </h3>
                              </Link>
                              {audio.description && (
                                <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                  {audio.description}
                                </p>
                              )}
                              {audio.user && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  by {audio.user.username}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Audio Stats */}
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <FileAudio className="h-4 w-4" />
                              <span>{formatFileSize(audio.fileSize)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Play className="h-4 w-4" />
                              <span>{audio.views || 0} views</span>
                            </div>
                            {audio.duration && (
                              <div className="flex items-center gap-1">
                                <Music className="h-4 w-4" />
                                <span>
                                  {Math.floor(audio.duration / 60)}:
                                  {String(Math.floor(audio.duration % 60)).padStart(2, '0')}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(audio.createdAt)}</span>
                            </div>
                            {audio.isPublic ? (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                Public
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Private
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link href={`/audio/${audio.id}`}>
                              <Button variant="outline" size="sm">
                                <Play className="mr-1 h-4 w-4" />
                                Play
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(getDownloadLink(audio.id), '_blank');
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(getEmbedLink(audio.id))}
                              title="Copy embed link"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddFavorite(audio.id)}
                              title="Add to favorites"
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          let pageNum;
                          if (pagination.pages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= pagination.pages - 2) {
                            pageNum = pagination.pages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <Search className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No results found
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Try adjusting your search query or filters
                </p>
                <Button variant="outline" className="mt-6" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <Search className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Start searching
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter a search query above to find audio files
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

