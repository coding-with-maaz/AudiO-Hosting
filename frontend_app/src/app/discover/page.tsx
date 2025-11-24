'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePublicAudios, useCloneAudio } from '@/hooks/useAudio';
import { useFolders } from '@/hooks/useFolders';
import { formatFileSize, formatDate, formatDuration } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Music, Search, Copy, Download, Play, Filter, TrendingUp, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useAuthStore } from '@/store/authStore';

export default function DiscoverPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<any>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  const { user } = useAuthStore();
  const { data, isLoading } = usePublicAudios({ 
    page, 
    limit: 20, 
    search: search || undefined,
    sortBy,
    order 
  });
  const { data: foldersData } = useFolders();
  const cloneAudio = useCloneAudio();
  const { confirm } = useConfirm();

  const handleClone = async (audio: any) => {
    if (!user) {
      alert('Please login to clone audio');
      return;
    }

    setSelectedAudio(audio);
    setShowCloneModal(true);
  };

  const confirmClone = async () => {
    if (!selectedAudio) return;

    try {
      await cloneAudio.mutateAsync({
        id: selectedAudio.id,
        folderId: selectedFolderId || undefined,
      });
      setShowCloneModal(false);
      setSelectedAudio(null);
      setSelectedFolderId('');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to clone audio');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const audios = data?.audios || [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Discover Public Audios
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Browse and clone audio tracks from other users
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, description, or tags..."
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="createdAt">Date</option>
                <option value="views">Views</option>
                <option value="downloads">Downloads</option>
                <option value="likes">Likes</option>
                <option value="title">Title</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setOrder(order === 'DESC' ? 'ASC' : 'DESC');
                  setPage(1);
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                {order === 'DESC' ? '↓' : '↑'}
              </button>
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Audio Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        ) : audios.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {audios.map((audio: any) => (
                <div
                  key={audio.id}
                  className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                        <Music className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                          {audio.title}
                        </h3>
                        {audio.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                            {audio.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {audio.user?.username || 'Unknown'}
                          </span>
                          {audio.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(audio.duration)}
                            </span>
                          )}
                          <span>{formatFileSize(audio.fileSize)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            {audio.views || 0} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {audio.downloads || 0} downloads
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(audio.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Link href={`/audio/${audio.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Play className="mr-2 h-4 w-4" />
                        Play
                      </Button>
                    </Link>
                    {user && (
                      <Button
                        onClick={() => handleClone(audio)}
                        disabled={cloneAudio.isPending}
                        className="flex-1"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Clone
                      </Button>
                    )}
                  </div>

                  {/* Tags */}
                  {audio.tags && audio.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {audio.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {audio.tags.length > 3 && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          +{audio.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <Music className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No public audios found
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {search
                ? 'Try adjusting your search terms'
                : 'Be the first to share your audio publicly!'}
            </p>
          </div>
        )}

        {/* Clone Modal */}
        {showCloneModal && selectedAudio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Clone Audio
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Title:</span> {selectedAudio.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Size:</span> {formatFileSize(selectedAudio.fileSize)}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Owner:</span> {selectedAudio.user?.username || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Save to Folder (Optional)
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Root (No Folder)</option>
                    {foldersData?.folders?.map((folder: any) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={confirmClone}
                    disabled={cloneAudio.isPending}
                    isLoading={cloneAudio.isPending}
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Clone Audio
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCloneModal(false);
                      setSelectedAudio(null);
                      setSelectedFolderId('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

