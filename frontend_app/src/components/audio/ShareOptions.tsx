'use client';

import { useState } from 'react';
import { Copy, Check, Eye, EyeOff, Music, User, Image, Play, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ShareOptionsProps {
  embedUrl: string;
  audioTitle: string;
  audioArtist?: string;
  hasCoverImage?: boolean;
}

export function ShareOptions({ embedUrl, audioTitle, audioArtist, hasCoverImage }: ShareOptionsProps) {
  const [showTitle, setShowTitle] = useState(true);
  const [showArtist, setShowArtist] = useState(true);
  const [showCover, setShowCover] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playerSize, setPlayerSize] = useState<'compact' | 'full'>('full');
  const [copied, setCopied] = useState(false);

  const buildEmbedUrl = () => {
    const params = new URLSearchParams();
    if (!showTitle) params.set('hideTitle', 'true');
    if (!showArtist) params.set('hideArtist', 'true');
    if (!showCover) params.set('hideCover', 'true');
    if (autoPlay) params.set('autoplay', 'true');
    if (playerSize === 'compact') params.set('compact', 'true');
    
    return `${embedUrl}${params.toString() ? '?' + params.toString() : ''}`;
  };

  const getEmbedCode = () => {
    const height = playerSize === 'compact' ? '300' : '500';
    return `<iframe src="${buildEmbedUrl()}" width="100%" height="${height}" frameborder="0" allow="autoplay; fullscreen" style="border-radius: 12px;"></iframe>`;
  };

  const copyToClipboard = async (text: string) => {
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Customization Options */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Customize Player
        </h3>
        
        <div className="space-y-4">
          {/* Show Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-gray-400" />
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Title
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Display audio title in player
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTitle(!showTitle)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showTitle ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showTitle ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Show Artist */}
          {audioArtist && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show Artist
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Display artist name in player
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArtist(!showArtist)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showArtist ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showArtist ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Show Cover Image */}
          {hasCoverImage && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image className="h-5 w-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show Cover Image
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Display cover image in player
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCover(!showCover)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showCover ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showCover ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Auto-play */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-gray-400" />
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-play
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically start playback
                </p>
              </div>
            </div>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoPlay ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoPlay ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Player Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {playerSize === 'full' ? (
                <Maximize2 className="h-5 w-5 text-gray-400" />
              ) : (
                <Minimize2 className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Player Size
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Choose player display size
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPlayerSize('compact')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  playerSize === 'compact'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Compact
              </button>
              <button
                onClick={() => setPlayerSize('full')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  playerSize === 'full'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Full
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Links */}
      <div className="space-y-4">
        {/* Embed URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Customized Embed URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={buildEmbedUrl()}
              className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(buildEmbedUrl())}
            >
              {copied ? (
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
          </div>
        </div>

        {/* Embed Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Embed Code (iframe)
          </label>
          <textarea
            readOnly
            value={getEmbedCode()}
            rows={4}
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Height: {playerSize === 'compact' ? '300px' : '500px'} (recommended)
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(getEmbedCode())}
            className="mt-2"
          >
            {copied ? (
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
  );
}

