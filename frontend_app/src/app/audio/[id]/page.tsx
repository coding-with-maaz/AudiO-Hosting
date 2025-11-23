'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAudio } from '@/hooks/useAudio';
import { formatFileSize, formatDate, formatDuration } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import {
  Music,
  Download,
  Share2,
  Copy,
  Check,
  Calendar,
  HardDrive,
  Play,
  Eye,
  Clock,
  User,
  Globe,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { AudioPlayer } from '@/components/audio/AudioPlayer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function AudioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const audioId = params.id as string;
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const { data: audio, isLoading } = useAudio(audioId);

  const getDownloadLink = () => {
    return `${API_URL}/d/${audio?.shareToken || audioId}`;
  };

  const getEmbedLink = () => {
    return `${API_URL}/e/${audio?.shareToken || audioId}`;
  };

  const getDirectLink = () => {
    return `${API_URL}/api/audio/${audioId}/download`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert(`${type} link: ${text}`);
    }
  };

  const handleDownload = () => {
    window.open(getDownloadLink(), '_blank');
  };

  const handleEmbed = () => {
    window.open(getEmbedLink(), '_blank');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading audio...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!audio) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Music className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Audio not found
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The audio file you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => router.push('/my-audios')} className="mt-6">
              Back to My Audios
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start gap-6">
            <div className="rounded-lg bg-blue-100 p-4 dark:bg-blue-900/20">
              <Music className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {audio.title}
              </h1>
              {audio.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {audio.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                {audio.user && (
                  <span className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {audio.user.username}
                  </span>
                )}
                <span className="flex items-center">
                  <HardDrive className="mr-2 h-4 w-4" />
                  {formatFileSize(audio.fileSize)}
                </span>
                {audio.duration && (
                  <span className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {formatDuration(audio.duration)}
                  </span>
                )}
                <span className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  {audio.views || 0} views
                </span>
                <span className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  {audio.downloads || 0} downloads
                </span>
                <span className="flex items-center">
                  {audio.isPublic ? (
                    <Globe className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4 text-yellow-500" />
                  )}
                  {audio.isPublic ? 'Public' : 'Private'}
                </span>
                <span className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatDate(audio.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Audio Player
          </h2>
          <AudioPlayer
            src={getDirectLink()}
            title={audio.title}
            artist={audio.user?.username}
            coverImage={audio.thumbnail}
            autoPlay={false}
            showDownload={false}
            showShare={false}
            showFullscreen={true}
            className="w-full"
          />
        </div>

        {/* Share Links */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Share & Links
          </h2>
          <div className="space-y-4">
            {/* Direct Download Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Direct Download Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getDownloadLink()}
                  className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(getDownloadLink(), 'download')}
                >
                  {copiedLink === 'download' ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            {/* Embed Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Embed Link (Full Screen)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getEmbedLink()}
                  className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(getEmbedLink(), 'embed')}
                >
                  {copiedLink === 'embed' ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleEmbed}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Button>
              </div>
            </div>

            {/* Embed Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Embed Code (iframe)
              </label>
              <textarea
                readOnly
                value={`<iframe src="${getEmbedLink()}" width="100%" height="100" frameborder="0" allow="autoplay"></iframe>`}
                rows={3}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`<iframe src="${getEmbedLink()}" width="100%" height="100" frameborder="0" allow="autoplay"></iframe>`, 'embed-code')}
                className="mt-2"
              >
                {copiedLink === 'embed-code' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Embed Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

