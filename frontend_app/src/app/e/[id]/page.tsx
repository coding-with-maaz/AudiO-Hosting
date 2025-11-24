'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Music, Copy, Check } from 'lucide-react';
import axios from 'axios';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import { useCloneAudio } from '@/hooks/useAudio';
import { useFolders } from '@/hooks/useFolders';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function EmbedAudioPage() {
  const params = useParams();
  const audioId = params.id as string;
  const [audio, setAudio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [cloned, setCloned] = useState(false);

  const { user } = useAuthStore();
  const cloneAudio = useCloneAudio();
  const { data: foldersData } = useFolders();

  // Get customization options from URL params
  const [shareOptions, setShareOptions] = useState({
    hideTitle: false,
    hideArtist: false,
    hideCover: false,
    autoPlay: false,
    isCompact: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setShareOptions({
        hideTitle: urlParams.get('hideTitle') === 'true',
        hideArtist: urlParams.get('hideArtist') === 'true',
        hideCover: urlParams.get('hideCover') === 'true',
        autoPlay: urlParams.get('autoplay') === 'true',
        isCompact: urlParams.get('compact') === 'true',
      });
    }
  }, []);

  useEffect(() => {
    fetchAudio();
  }, [audioId]);

  const fetchAudio = async () => {
    try {
      // Try to get audio by ID first
      try {
        const response = await axios.get(`${API_URL}/api/audio/${audioId}`);
        if (response.data.success) {
          setAudio(response.data.data.audio);
          setIsLoading(false);
          return;
        }
      } catch (idErr: any) {
        // If 404, try as shareToken via share links endpoint
        if (idErr.response?.status === 404) {
          try {
            const shareResponse = await axios.get(`${API_URL}/api/share/links/${audioId}`);
            if (shareResponse.data.success && shareResponse.data.data.audio) {
              setAudio(shareResponse.data.data.audio);
              setIsLoading(false);
              return;
            }
          } catch (shareErr) {
            setError('Audio not found');
          }
        } else {
          setError('Failed to load audio');
        }
      }
    } catch (err: any) {
      setError('Audio not found');
    } finally {
      setIsLoading(false);
    }
  };

  const getDownloadLink = () => {
    return `${API_URL}/d/${audio?.shareToken || audioId}`;
  };

  const getDirectLink = () => {
    // Use public download route for embed (no auth required)
    return `${API_URL}/d/${audio?.shareToken || audio?.id || audioId}`;
  };

  const handleClone = async () => {
    if (!audio) return;

    // If not logged in, redirect to login
    if (!user) {
      const loginUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      window.location.href = loginUrl;
      return;
    }

    // Check if user is trying to clone their own audio
    if (String(audio.userId) === String(user.id)) {
      alert('This is your own audio. You cannot clone it.');
      return;
    }

    setShowCloneModal(true);
  };

  const confirmClone = async () => {
    if (!audio) return;

    try {
      await cloneAudio.mutateAsync({
        id: audio.id,
        folderId: selectedFolderId || undefined,
      });
      setShowCloneModal(false);
      setSelectedFolderId('');
      setCloned(true);
      setTimeout(() => setCloned(false), 3000);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to clone audio');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-white">Loading audio player...</div>
        </div>
      </div>
    );
  }

  if (error || !audio) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <Music className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-white">
            Audio not found
          </h2>
          <p className="mt-2 text-gray-400">
            The audio file you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  // Check if user can clone this audio
  // Show clone button if audio exists and user doesn't own it
  const isOwnAudio = user && audio && String(audio.userId) === String(user.id);
  const canClone = audio && !isOwnAudio;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Clone Button - Show if audio exists and user doesn't own it */}
        {canClone && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={handleClone}
              disabled={cloneAudio.isPending || cloned}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              {cloned ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Cloned!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  {user ? 'Clone to My Account' : 'Login to Clone'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Custom Audio Player */}
        <AudioPlayer
          src={getDirectLink()}
          title={shareOptions.hideTitle ? undefined : audio.title}
          artist={shareOptions.hideArtist ? undefined : audio.user?.username}
          coverImage={shareOptions.hideCover ? undefined : audio.thumbnail}
          autoPlay={shareOptions.autoPlay}
          showDownload={true}
          showShare={true}
          showFullscreen={true}
          className={`w-full ${shareOptions.isCompact ? 'max-w-2xl' : ''}`}
        />

        {/* Footer */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          Powered by Audio Hosting Platform
        </div>
      </div>

      {/* Clone Modal */}
      {showCloneModal && audio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Clone Audio
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Title:</span> {audio.title}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Owner:</span> {audio.user?.username || 'Unknown'}
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
                  )) || []}
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
  );
}

