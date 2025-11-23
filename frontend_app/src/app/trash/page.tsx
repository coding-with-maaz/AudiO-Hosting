'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTrash, useRestoreFromTrash, useEmptyTrash } from '@/hooks/useTrash';
import { formatFileSize, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Trash2, RotateCcw, Music, Folder, AlertTriangle, X, Check } from 'lucide-react';

export default function TrashPage() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showEmptyModal, setShowEmptyModal] = useState(false);

  const { data, isLoading, refetch } = useTrash(selectedType === 'all' ? undefined : selectedType);
  const restoreFromTrash = useRestoreFromTrash();
  const emptyTrash = useEmptyTrash();

  // Backend returns { audios: [] } or { folders: [] } based on type
  const audios = data?.audios || [];
  const folders = data?.folders || [];
  const trashItems = [...audios.map((a: any) => ({ ...a, type: 'audio' })), ...folders.map((f: any) => ({ ...f, type: 'folder' }))];

  const handleRestore = async (id: string) => {
    if (confirm('Restore this item from trash?')) {
      try {
        await restoreFromTrash.mutateAsync(id);
        setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
      } catch (error: any) {
        alert(error?.response?.data?.message || 'Failed to restore item');
      }
    }
  };

  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) return;
    if (confirm(`Restore ${selectedItems.length} item(s) from trash?`)) {
      try {
        for (const id of selectedItems) {
          await restoreFromTrash.mutateAsync(id);
        }
        setSelectedItems([]);
      } catch (error: any) {
        alert('Failed to restore some items. Please try again.');
      }
    }
  };

  const handleEmptyTrash = async () => {
    const typeParam = selectedType === 'all' ? undefined : selectedType;
    const typeLabel = selectedType === 'all' ? 'all items' : `${selectedType}s`;
    
    if (confirm(`Permanently delete ${typeLabel}? This action cannot be undone.`)) {
      try {
        await emptyTrash.mutateAsync(typeParam);
        setShowEmptyModal(false);
        setSelectedItems([]);
      } catch (error: any) {
        alert(error?.response?.data?.message || 'Failed to empty trash');
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === trashItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(trashItems.map((item: any) => item.id));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading trash...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trash2 className="h-8 w-8 text-red-600" />
              Trash
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Restore deleted items or permanently delete them
            </p>
          </div>
          {trashItems.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmptyModal(true)}
                disabled={emptyTrash.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Empty Trash
              </Button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedItems([]);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedType === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            All ({trashItems.length})
          </button>
          <button
            onClick={() => {
              setSelectedType('audio');
              setSelectedItems([]);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedType === 'audio'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Audios ({audios.length})
          </button>
          <button
            onClick={() => {
              setSelectedType('folder');
              setSelectedItems([]);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedType === 'folder'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Folders ({folders.length})
          </button>
        </div>

        {/* Selected Items Bar */}
        {selectedItems.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={handleBulkRestore}>
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Restore Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedItems([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Trash Items */}
        {trashItems.length > 0 ? (
          <>
            {/* Audios Section */}
            {selectedType === 'all' || selectedType === 'audio' ? (
              audios.length > 0 && (
                <div>
                  {selectedType === 'all' && (
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                      Deleted Audios
                    </h2>
                  )}
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={
                                audios.length > 0 &&
                                audios.every((item: any) => selectedItems.includes(item.id))
                              }
                              onChange={toggleSelectAll}
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
                            Deleted Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {audios.map((audio: any) => (
                          <tr
                            key={audio.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(audio.id)}
                                onChange={() => toggleSelect(audio.id)}
                                className="rounded border-gray-300"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <Music className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {audio.title || audio.originalFilename || 'Untitled'}
                                  </p>
                                  {audio.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {audio.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {formatFileSize(audio.fileSize || 0)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(audio.deletedAt || audio.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(audio.id)}
                                disabled={restoreFromTrash.isPending}
                              >
                                <RotateCcw className="mr-1 h-4 w-4" />
                                Restore
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : null}

            {/* Folders Section */}
            {selectedType === 'all' || selectedType === 'folder' ? (
              folders.length > 0 && (
                <div>
                  {selectedType === 'all' && (
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                      Deleted Folders
                    </h2>
                  )}
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={
                                folders.length > 0 &&
                                folders.every((item: any) => selectedItems.includes(item.id))
                              }
                              onChange={toggleSelectAll}
                              className="rounded border-gray-300"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Deleted Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {folders.map((folder: any) => (
                          <tr
                            key={folder.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(folder.id)}
                                onChange={() => toggleSelect(folder.id)}
                                className="rounded border-gray-300"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <Folder className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {folder.name}
                                  </p>
                                  {folder.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {folder.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {folder.audioCount || 0} audio(s)
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(folder.deletedAt || folder.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(folder.id)}
                                disabled={restoreFromTrash.isPending}
                              >
                                <RotateCcw className="mr-1 h-4 w-4" />
                                Restore
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : null}

            {/* Warning Box */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Items in trash are automatically deleted after 30 days
                  </h3>
                  <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                    Restore items you want to keep before they are permanently deleted. Emptying trash will
                    permanently delete all items immediately.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <Trash2 className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Trash is empty</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Deleted items will appear here. You can restore them or empty the trash.
            </p>
          </div>
        )}

        {/* Empty Trash Modal */}
        {showEmptyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/20">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Empty Trash
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
                Are you sure you want to permanently delete{' '}
                {selectedType === 'all'
                  ? 'all items'
                  : selectedType === 'audio'
                  ? 'all audios'
                  : 'all folders'}{' '}
                in trash? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEmptyModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleEmptyTrash}
                  disabled={emptyTrash.isPending}
                  isLoading={emptyTrash.isPending}
                >
                  Empty Trash
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

