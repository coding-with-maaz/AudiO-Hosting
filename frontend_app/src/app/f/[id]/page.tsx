'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatFileSize, formatDate, formatDuration } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import {
  Folder,
  Music,
  Lock,
  Download,
  Play,
  Share2,
  Calendar,
  HardDrive,
  FileAudio,
  AlertCircle,
  Eye,
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function SharedFolderPage() {
  const params = useParams();
  const router = useRouter();
  const shareToken = params.id as string;
  const [embed] = useState(false); // Can be used for embed mode

  const [folder, setFolder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchSharedFolder();
  }, [shareToken]);

  const fetchSharedFolder = async (providedPassword?: string) => {
    setIsLoading(true);
    setError('');
    setPasswordError('');

    try {
      const url = `${API_URL}/api/f/${shareToken}`;
      const params: any = {};
      if (providedPassword) {
        params.password = providedPassword;
      }
      if (embed) {
        params.embed = 'true';
      }

      const response = await axios.get(url, { params });
      
      if (response.data.success) {
        setFolder(response.data.data.folder);
        setShowPasswordModal(false);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Password required
        setShowPasswordModal(true);
        setPasswordError('Password required or incorrect');
      } else if (err.response?.status === 404) {
        setError('Folder not found or sharing has been disabled');
      } else {
        setError(err.response?.data?.message || 'Failed to load shared folder');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }
    fetchSharedFolder(password);
  };

  const getDownloadLink = (audioId: string) => {
    return `${API_URL}/api/audio/${audioId}/download`;
  };

  const getEmbedLink = (audioId: string) => {
    return `${API_URL}/e/${audioId}`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert(`${type} link copied to clipboard!`);
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`${type} link copied to clipboard!`);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert(`${type} link: ${text}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400">Loading shared folder...</div>
        </div>
      </div>
    );
  }

  if (error && !showPasswordModal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            {error}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The folder you're looking for doesn't exist or sharing has been disabled.
          </p>
        </div>
      </div>
    );
  }

  if (showPasswordModal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              Password Protected Folder
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              This folder is protected. Please enter the password to access it.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Enter password"
                autoFocus
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordError}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Access Folder
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!folder) {
    return null;
  }

  const audios = folder.audios || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
              <Folder className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {folder.name}
              </h1>
              {folder.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {folder.description}
                </p>
              )}
              {folder.user && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Shared by {folder.user.username}
                </p>
              )}
            </div>
            {folder.password && (
              <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-3 py-2 dark:bg-yellow-900/20">
                <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Protected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Folder Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <FileAudio className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Audio Files
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
                  {formatDate(folder.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Shared Folder
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Public Access
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Audios List */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Audio Files ({audios.length})
          </h2>
          {audios.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {audios.map((audio: any) => (
                <div
                  key={audio.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start space-x-4">
                    <Music className="h-10 w-10 text-blue-600" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {audio.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {audio.description || 'No description'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <HardDrive className="mr-1 h-4 w-4" /> {formatFileSize(audio.fileSize)}
                        </span>
                        {audio.duration && (
                          <span className="flex items-center">
                            <Play className="mr-1 h-4 w-4" /> {formatDuration(audio.duration)}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" /> {formatDate(audio.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/audio/${audio.id}`, '_blank')}
                    >
                      <Play className="h-4 w-4" />
                      <span className="ml-2">Play</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getDownloadLink(audio.id), '_blank')}
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-2">Download</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getEmbedLink(audio.id), 'Embed')}
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="ml-2">Embed</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No audio files
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                This folder is empty.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

