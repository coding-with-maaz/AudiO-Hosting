'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePlaylists, useCreatePlaylist, useDeletePlaylist } from '@/hooks/usePlaylists';
import { Button } from '@/components/ui/Button';
import { ListMusic, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/utils/format';
import { useConfirm } from '@/contexts/ConfirmContext';

export default function PlaylistsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const { data, isLoading } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const confirm = useConfirm();

  const handleCreate = async () => {
    if (!playlistName.trim()) return;

    await createPlaylist.mutateAsync({
      name: playlistName,
      description: playlistDescription || null,
      isPublic,
    });

    setPlaylistName('');
    setPlaylistDescription('');
    setIsPublic(false);
    setShowCreateModal(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Playlist',
      message: 'Are you sure you want to delete this playlist? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: <Trash2 className="h-6 w-6" />,
    });

    if (confirmed) {
      await deletePlaylist.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Playlists
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create and manage your playlists
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Playlist
          </Button>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Create Playlist
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Playlist Name
                  </label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="My Favorite Tracks"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <textarea
                    value={playlistDescription}
                    onChange={(e) => setPlaylistDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Make playlist public
                    </span>
                  </label>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreate}
                    disabled={!playlistName.trim() || createPlaylist.isPending}
                    isLoading={createPlaylist.isPending}
                    className="flex-1"
                  >
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setPlaylistName('');
                      setPlaylistDescription('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Playlists Grid */}
        {data?.playlists && data.playlists.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.playlists.map((playlist: any) => (
              <div
                key={playlist.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <Link href={`/playlists/${playlist.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
                        <ListMusic className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {playlist.name}
                          </h3>
                          {playlist.isPublic && (
                            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Public
                            </span>
                          )}
                        </div>
                        {playlist.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {playlist.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                          {playlist.audios?.length || 0} track(s) •{' '}
                          {formatDate(playlist.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(playlist.id);
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <ListMusic className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No playlists
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create a playlist to organize your favorite tracks
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-6"
            >
              Create Playlist
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

