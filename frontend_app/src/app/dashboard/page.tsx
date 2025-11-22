'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMyAudios } from '@/hooks/useAudio';
import { useFolders } from '@/hooks/useFolders';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useFavorites } from '@/hooks/useInteractions';
import { useAuthStore } from '@/store/authStore';
import { formatFileSize } from '@/utils/format';
import { Music, Folder, ListMusic, Heart, Upload, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: audiosData } = useMyAudios({ limit: 5 });
  const { data: foldersData } = useFolders();
  const { data: playlistsData } = usePlaylists();
  const { data: favoritesData } = useFavorites();

  const stats = [
    {
      name: 'Total Audios',
      value: audiosData?.pagination?.total || 0,
      icon: Music,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/my-audios',
    },
    {
      name: 'Folders',
      value: foldersData?.folders?.length || 0,
      icon: Folder,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/folders',
    },
    {
      name: 'Playlists',
      value: playlistsData?.playlists?.length || 0,
      icon: ListMusic,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/playlists',
    },
    {
      name: 'Favorites',
      value: favoritesData?.favorites?.length || 0,
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      href: '/favorites',
    },
  ];

  const storageUsed = user?.storageUsed || 0;
  const storageLimit = user?.storageLimit || 1;
  const storagePercent = (storageUsed / storageLimit) * 100;
  const bandwidthUsed = user?.bandwidthUsed || 0;
  const bandwidthLimit = user?.bandwidthLimit || null;
  const bandwidthPercent = bandwidthLimit ? (bandwidthUsed / bandwidthLimit) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.username}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your audio files and content
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.name} href={stat.href}>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.name}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Storage & Bandwidth */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Storage Usage
            </h3>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Used</span>
                <span>
                  {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${Math.min(storagePercent, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {storagePercent.toFixed(1)}% used
              </p>
            </div>
          </div>

          {bandwidthLimit && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bandwidth Usage
              </h3>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Used</span>
                  <span>
                    {formatFileSize(bandwidthUsed)} / {formatFileSize(bandwidthLimit)}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{ width: `${Math.min(bandwidthPercent, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {bandwidthPercent.toFixed(1)}% used
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/upload">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Audio
              </Button>
            </Link>
            <Link href="/folders">
              <Button variant="outline">
                <Folder className="mr-2 h-4 w-4" />
                Create Folder
              </Button>
            </Link>
            <Link href="/playlists">
              <Button variant="outline">
                <ListMusic className="mr-2 h-4 w-4" />
                Create Playlist
              </Button>
            </Link>
            <Link href="/plans">
              <Button variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Audios */}
        {audiosData?.audios && audiosData.audios.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Audios
              </h3>
              <Link href="/my-audios">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {audiosData.audios.slice(0, 5).map((audio: any) => (
                <Link
                  key={audio.id}
                  href={`/audio/${audio.id}`}
                  className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <Music className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {audio.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(audio.fileSize)} • {audio.views} views
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

