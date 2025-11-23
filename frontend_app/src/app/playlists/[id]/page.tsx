'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  usePlaylist, 
  useUpdatePlaylist, 
  useDeletePlaylist,
  useRemoveFromPlaylist,
  useAddToPlaylist
} from '@/hooks/usePlaylists';
import { useMyAudios } from '@/hooks/useAudio';
import { formatFileSize, formatDate, formatDuration } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import {
  ListMusic,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Music,
  Calendar,
  User,
  Globe,
  Lock,
  Play,
  Download,
  Share2,
  X,
  GripVertical,
  Search,
  CheckCircle2,
  Clock,
  HardDrive,
} from 'lucide-react';
import { useConfirm } from '@/contexts/ConfirmContext';
import Link from 'next/link';
import { AudioPlayer } from '@/components/audio/AudioPlayer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [selectedAudios, setSelectedAudios] = useState<string[]>([]);
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: playlist, isLoading: playlistLoading, refetch: refetchPlaylist } = usePlaylist(playlistId);
  const { data: allAudiosData } = useMyAudios();
  const updatePlaylist = useUpdatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const removeFromPlaylist = useRemoveFromPlaylist();
  const addToPlaylist = useAddToPlaylist();

  const audios = playlist?.audios || [];
  const allAudios = allAudiosData?.audios || [];

  // Initialize edit form when playlist loads
  useEffect(() => {
    if (playlist && showEditModal) {
      setEditName(playlist.name || '');
      setEditDescription(playlist.description || '');
      setEditIsPublic(playlist.isPublic || false);
    }
  }, [playlist, showEditModal]);

  const handleUpdate = async () => {
    if (!editName.trim()) return;
    try {
      await updatePlaylist.mutateAsync({
        id: playlistId,
        data: {
          name: editName,
          description: editDescription || null,
          isPublic: editIsPublic,
        },
      });
      setShowEditModal(false);
      setEditName('');
      setEditDescription('');
      setEditIsPublic(false);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to update playlist');
    }
  };

  const { confirm } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Playlist',
      message: 'Are you sure you want to delete this playlist? All tracks will be removed. This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: <Trash2 className="h-6 w-6" />,
    });

    if (confirmed) {
      try {
        await deletePlaylist.mutateAsync(playlistId);
        router.push('/playlists');
      } catch (error: any) {
        alert(error?.response?.data?.message || 'Failed to delete playlist');
      }
    }
  };

  const handleAddAudios = async () => {
    if (selectedAudios.length === 0) {
      alert('Please select at least one audio to add');
      return;
    }
    try {
      const result = await addToPlaylist.mutateAsync({
        id: playlistId,
        audioIds: selectedAudios,
      });
      
      // Close modal and reset
      setShowAddModal(false);
      setSelectedAudios([]);
      setSearchQuery('');
      
      // Force refetch playlist data
      setTimeout(async () => {
        await refetchPlaylist();
      }, 500);
      
      // Show success message
      if (result?.message) {
        alert(result.message);
      }
    } catch (error: any) {
      console.error('Add to playlist error:', error);
      alert(error?.response?.data?.message || 'Failed to add audios to playlist');
    }
  };

  const handleRemoveAudio = async (audioId: string) => {
    const confirmed = await confirm({
      title: 'Remove Track',
      message: 'Are you sure you want to remove this track from the playlist?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'warning',
      icon: <X className="h-6 w-6" />,
    });

    if (confirmed) {
      try {
        await removeFromPlaylist.mutateAsync({
          id: playlistId,
          audioId,
        });
        refetchPlaylist();
      } catch (error: any) {
        alert(error?.response?.data?.message || 'Failed to remove audio');
      }
    }
  };

  const toggleSelectAudio = (audioId: string) => {
    setSelectedAudios((prev) =>
      prev.includes(audioId) ? prev.filter((id) => id !== audioId) : [...prev, audioId]
    );
  };

  const getDownloadLink = (audioId: string) => {
    return `${API_URL}/d/${audioId}`;
  };

  const getDirectLink = (audioId: string) => {
    return `${API_URL}/api/audio/${audioId}/download`;
  };

  const handlePlayAudio = (audioId: string) => {
    setCurrentPlayingAudio(audioId);
  };

  if (playlistLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading playlist...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!playlist) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ListMusic className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Playlist not found
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The playlist you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/playlists" className="mt-6 inline-block">
              <Button>Back to Playlists</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Filter out audios already in playlist and apply search filter
  const availableAudios = allAudios
    .filter((audio: any) => !audios.some((playlistAudio: any) => playlistAudio.id === audio.id))
    .filter((audio: any) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        audio.title?.toLowerCase().includes(query) ||
        audio.description?.toLowerCase().includes(query) ||
        audio.user?.username?.toLowerCase().includes(query)
      );
    });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/playlists">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
                <ListMusic className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {playlist.name}
                </h1>
                {playlist.description && (
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {playlist.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Tracks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(playlist.name || '');
                setEditDescription(playlist.description || '');
                setEditIsPublic(playlist.isPublic || false);
                setShowEditModal(true);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Playlist Info */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tracks
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {audios.length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Created
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDate(playlist.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              {playlist.isPublic ? (
                <Globe className="h-5 w-5 text-green-600" />
              ) : (
                <Lock className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {playlist.isPublic ? 'Public' : 'Private'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Playing Audio */}
        {currentPlayingAudio && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Now Playing
              </h3>
              <button
                onClick={() => setCurrentPlayingAudio(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {(() => {
              const playingAudio = audios.find((a: any) => a.id === currentPlayingAudio);
              if (!playingAudio) return null;
              return (
                <AudioPlayer
                  src={getDirectLink(playingAudio.id)}
                  title={playingAudio.title}
                  artist={playingAudio.user?.username}
                  coverImage={playingAudio.thumbnail}
                  autoPlay={true}
                  showDownload={false}
                  showShare={false}
                  showFullscreen={false}
                  className="w-full"
                />
              );
            })()}
          </div>
        )}

        {/* Tracks List */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Tracks ({audios.length})
          </h2>
          {audios.length > 0 ? (
            <div className="space-y-2">
              {audios.map((audio: any, index: number) => (
                <div
                  key={audio.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                      {index + 1}
                    </span>
                    <Music className="h-5 w-5 text-purple-600" />
                    <div className="flex-1">
                      <Link href={`/audio/${audio.id}`} className="group">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                          {audio.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {audio.user?.username || 'Unknown'} • {formatFileSize(audio.fileSize)}
                        {audio.duration && ` • ${formatDuration(audio.duration)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlayAudio(audio.id)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getDownloadLink(audio.id), '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAudio(audio.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No tracks
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                This playlist is empty. Add some tracks to get started.
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="mt-6"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tracks
              </Button>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Edit Playlist
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Playlist Name *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="My Playlist"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editIsPublic}
                      onChange={(e) => setEditIsPublic(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Make playlist public
                    </span>
                  </label>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleUpdate}
                    disabled={!editName.trim() || updatePlaylist.isPending}
                    isLoading={updatePlaylist.isPending}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditName('');
                      setEditDescription('');
                      setEditIsPublic(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Tracks Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-800 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Add Tracks to Playlist
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Select audio files to add to "{playlist.name}"
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedAudios([]);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, description, or artist..."
                    className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
                {selectedAudios.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{selectedAudios.length} track{selectedAudios.length !== 1 ? 's' : ''} selected</span>
                  </div>
                )}
              </div>

              {/* Tracks List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {availableAudios.length > 0 ? (
                  <div className="space-y-2">
                    {availableAudios.map((audio: any) => (
                      <div
                        key={audio.id}
                        className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                          selectedAudios.includes(audio.id)
                            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedAudios.includes(audio.id)}
                            onChange={() => toggleSelectAudio(audio.id)}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                            <Music className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {audio.title}
                            </h4>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                              {audio.user?.username && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {audio.user.username}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {formatFileSize(audio.fileSize)}
                              </span>
                              {audio.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(audio.duration)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(audio.createdAt)}
                              </span>
                            </div>
                            {audio.description && (
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                {audio.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/audio/${audio.id}`}>
                            <Button variant="ghost" size="sm">
                              <Play className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                      No tracks found
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      No audio files match your search query "{searchQuery}"
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                      className="mt-4"
                    >
                      Clear Search
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Music className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                      No available tracks
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      All your audio files are already in this playlist.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {availableAudios.length} track{availableAudios.length !== 1 ? 's' : ''} available
                  {searchQuery && ` matching "${searchQuery}"`}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedAudios([]);
                      setSearchQuery('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddAudios}
                    disabled={selectedAudios.length === 0 || addToPlaylist.isPending}
                    isLoading={addToPlaylist.isPending}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add {selectedAudios.length > 0 ? `${selectedAudios.length} ` : ''}Track{selectedAudios.length !== 1 ? 's' : ''}
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

