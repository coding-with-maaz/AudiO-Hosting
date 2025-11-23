'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import axios from 'axios';
import { AudioPlayer } from '@/components/audio/AudioPlayer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function EmbedAudioPage() {
  const params = useParams();
  const audioId = params.id as string;
  const [audio, setAudio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Custom Audio Player */}
        <AudioPlayer
          src={getDirectLink()}
          title={audio.title}
          artist={audio.user?.username}
          coverImage={audio.thumbnail}
          autoPlay={true}
          showDownload={true}
          showShare={true}
          showFullscreen={true}
          className="w-full"
        />

        {/* Footer */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          Powered by Audio Hosting Platform
        </div>
      </div>
    </div>
  );
}

