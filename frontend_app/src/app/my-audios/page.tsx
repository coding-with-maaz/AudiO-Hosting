'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMyAudios, useDeleteAudio } from '@/hooks/useAudio';
import { formatFileSize, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Music, Trash2, Edit, Download, Share2, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useConfirm } from '@/contexts/ConfirmContext';

export default function MyAudiosPage() {
  const [page, setPage] = useState(1);
  const [selectedAudios, setSelectedAudios] = useState<string[]>([]);
  const { data, isLoading } = useMyAudios({ page, limit: 20 });
  const deleteAudio = useDeleteAudio();
  const { confirm } = useConfirm();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Audio',
      message: 'Are you sure you want to delete this audio? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: <Trash2 className="h-6 w-6" />,
    });

    if (confirmed) {
      await deleteAudio.mutateAsync({ id });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAudios.length === 0) return;
    
    const confirmed = await confirm({
      title: 'Delete Multiple Audios',
      message: `Are you sure you want to delete ${selectedAudios.length} audio file(s)? This action cannot be undone.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      type: 'danger',
      icon: <Trash2 className="h-6 w-6" />,
    });

    if (confirmed) {
      for (const id of selectedAudios) {
        await deleteAudio.mutateAsync({ id });
      }
      setSelectedAudios([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedAudios((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Audios
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your audio files
            </p>
          </div>
          <Link href="/upload">
            <Button>Upload Audio</Button>
          </Link>
        </div>

        {selectedAudios.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedAudios.length} audio(s) selected
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="danger" onClick={handleBulkDelete}>
                  Delete Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedAudios([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {data?.audios && data.audios.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedAudios.length === data.audios.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAudios(data.audios.map((a: any) => a.id));
                          } else {
                            setSelectedAudios([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {data.audios.map((audio: any) => (
                    <tr
                      key={audio.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedAudios.includes(audio.id)}
                          onChange={() => toggleSelect(audio.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/audio/${audio.id}`}
                          className="flex items-center space-x-3"
                        >
                          <Music className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {audio.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {audio.description || 'No description'}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(audio.fileSize)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {audio.views}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(audio.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/audio/${audio.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(audio.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of{' '}
                  {data.pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <Music className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No audio files
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Get started by uploading your first audio file
            </p>
            <Link href="/upload" className="mt-6 inline-block">
              <Button>Upload Audio</Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

