'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Music, Download, Share2 } from 'lucide-react';
import axios from 'axios';

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
            // Try direct backend embed endpoint which might return HTML
            // For now, set error
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
    return `${API_URL}/api/audio/${audio?.id || audioId}/download`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
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
        {/* Audio Info */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <Music className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{audio.title}</h1>
          {audio.description && (
            <p className="text-gray-400">{audio.description}</p>
          )}
        </div>

        {/* Audio Player */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
          <audio
            controls
            autoPlay
            className="w-full"
            src={getDirectLink()}
            preload="auto"
            style={{
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
            }}
          >
            Your browser does not support the audio element.
          </audio>

          {/* Actions */}
          <div className="mt-6 flex justify-center gap-4">
            <a
              href={getDownloadLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
            <button
              onClick={() => {
                const embedLink = window.location.href;
                navigator.clipboard?.writeText(embedLink).catch(() => {
                  alert(`Embed link: ${embedLink}`);
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Copy Link
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          Powered by Audio Hosting Platform
        </div>
      </div>
    </div>
  );
}

