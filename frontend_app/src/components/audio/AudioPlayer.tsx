'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Share2,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  Settings,
  Repeat,
  Shuffle,
} from 'lucide-react';
import { formatDuration } from '@/utils/format';

interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  coverImage?: string;
  autoPlay?: boolean;
  showDownload?: boolean;
  showShare?: boolean;
  showFullscreen?: boolean;
  className?: string;
}

export function AudioPlayer({
  src,
  title = 'Audio Track',
  artist,
  coverImage,
  autoPlay = false,
  showDownload = true,
  showShare = true,
  showFullscreen = true,
  className = '',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');
  const [shuffle, setShuffle] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeat === 'all') {
        audio.currentTime = 0;
        audio.play();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    if (autoPlay) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [autoPlay, repeat]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleProgressClick(e);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = '';
    link.click();
  };

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: artist ? `${title} by ${artist}` : title,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl overflow-hidden ${className}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-64 bg-gray-700 overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
            {artist && <p className="text-gray-300">{artist}</p>}
          </div>
        </div>
      )}

      {/* Player Controls */}
      <div className="p-6">
        {/* Title (if no cover) */}
        {!coverImage && (
          <div className="mb-4 text-center">
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            {artist && <p className="text-gray-400">{artist}</p>}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div
            ref={progressRef}
            className="relative h-2 bg-gray-700 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
            onMouseMove={handleProgressDrag}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercent}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => setShuffle(!shuffle)}
            className={`p-2 rounded-full transition-colors ${
              shuffle ? 'text-blue-400 bg-blue-400/20' : 'text-gray-400 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="h-5 w-5" />
          </button>

          <button
            onClick={() => seek(-10)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Rewind 10s"
          >
            <SkipBack className="h-6 w-6" />
          </button>

          <button
            onClick={togglePlay}
            className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </button>

          <button
            onClick={() => seek(10)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Forward 10s"
          >
            <SkipForward className="h-6 w-6" />
          </button>

          <button
            onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
            className={`p-2 rounded-full transition-colors ${
              repeat !== 'off' ? 'text-blue-400 bg-blue-400/20' : 'text-gray-400 hover:text-white'
            }`}
            title={`Repeat: ${repeat}`}
          >
            <Repeat className="h-5 w-5" />
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between">
          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs text-gray-400 w-8">{Math.round(volume * 100)}%</span>
          </div>

          {/* Settings & Actions */}
          <div className="flex items-center gap-2">
            {showDownload && (
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
            )}

            {showShare && (
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
            )}

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-xl p-3 min-w-[200px] z-10">
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-2">Playback Speed</label>
                    <select
                      value={playbackRate}
                      onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                      className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                  </div>
                  <div className="text-xs text-gray-400">
                    <p className="mb-1">Keyboard Shortcuts:</p>
                    <p>Space: Play/Pause</p>
                    <p>← →: Seek</p>
                    <p>↑ ↓: Volume</p>
                    <p>M: Mute</p>
                  </div>
                </div>
              )}
            </div>

            {showFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

