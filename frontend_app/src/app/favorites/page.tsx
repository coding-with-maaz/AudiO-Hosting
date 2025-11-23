'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFavorites, useRemoveFavorite } from '@/hooks/useInteractions';
import { formatFileSize, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Heart, Music, Trash2, Play, Download, Share2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function FavoritesPage() {
  const [page, setPage] = useState(1);
  const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]);
  const { data, isLoading, refetch } = useFavorites();
  const removeFavorite = useRemoveFavorite();

  const handleRemoveFavorite = async (audioId: string) => {
    if (confirm('Remove this audio from favorites?')) {
      try {
        await removeFavorite.mutateAsync(audioId);
        setSelectedFavorites((prev) => prev.filter((id) => id !== audioId));
      } catch (error) {
        console.error('Failed to remove favorite:', error);
      }
    }
  };

  const handleBulkRemove = async () => {
    if (selectedFavorites.length === 0) return;
    if (confirm(`Remove ${selectedFavorites.length} audio(s) from favorites?`)) {
      try {
        for (const audioId of selectedFavorites) {
          await removeFavorite.mutateAsync(audioId);
        }
        setSelectedFavorites([]);
      } catch (error) {
        console.error('Failed to remove favorites:', error);
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedFavorites((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading favorites...</div>
        </div>
      </DashboardLayout>
    );
  }

  const favorites = data?.favorites || data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              My Favorites
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {favorites.length > 0 
                ? `${favorites.length} favorite audio${favorites.length !== 1 ? 's' : ''}`
                : 'Your favorite audio files'}
            </p>
          </div>
        </div>

        {selectedFavorites.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedFavorites.length} audio(s) selected
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="danger" onClick={handleBulkRemove}>
                  Remove Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFavorites([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {favorites.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite: any) => {
              const audio = favorite.audio || favorite;
              return (
                <div
                  key={audio.id}
                  className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  {/* Checkbox overlay */}
                  <div className="absolute left-2 top-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedFavorites.includes(audio.id)}
                      onChange={() => toggleSelect(audio.id)}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Audio Info */}
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                            {audio.title || audio.originalFilename || 'Untitled'}
                          </h3>
                          {audio.user && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              by {audio.user.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {audio.description && (
                      <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {audio.description}
                      </p>
                    )}

                    {/* Audio Stats */}
                    <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Size:</span> {formatFileSize(audio.fileSize)}
                      </div>
                      <div>
                        <span className="font-medium">Views:</span> {audio.views || 0}
                      </div>
                      {audio.duration && (
                        <div>
                          <span className="font-medium">Duration:</span>{' '}
                          {Math.floor(audio.duration / 60)}:
                          {String(Math.floor(audio.duration % 60)).padStart(2, '0')}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Added:</span>{' '}
                        {formatDate(favorite.createdAt || audio.createdAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/audio/${audio.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
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
                        onClick={() => {
                          copyToClipboard(getEmbedLink(audio.id));
                        }}
                        title="Copy embed link"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFavorite(audio.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Favorite indicator */}
                  <div className="absolute right-2 top-2">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <Heart className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No favorites yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Start adding audio files to your favorites to access them quickly
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link href="/my-audios">
                <Button variant="outline">Browse My Audios</Button>
              </Link>
              <Link href="/search">
                <Button>Search Audios</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

