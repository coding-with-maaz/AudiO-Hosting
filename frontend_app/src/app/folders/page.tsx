'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFolders, useCreateFolder, useDeleteFolder } from '@/hooks/useFolders';
import { Button } from '@/components/ui/Button';
import { Folder, Plus, Trash2, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/utils/format';
import { useConfirm } from '@/contexts/ConfirmContext';

export default function FoldersPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');

  const { data, isLoading } = useFolders();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const confirm = useConfirm();

  const handleCreate = async () => {
    if (!folderName.trim()) return;

    await createFolder.mutateAsync({
      name: folderName,
      description: folderDescription || null,
    });

    setFolderName('');
    setFolderDescription('');
    setShowCreateModal(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Folder',
      message: 'Are you sure you want to delete this folder? All contents will be moved to trash.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: <Trash2 className="h-6 w-6" />,
    });

    if (confirmed) {
      await deleteFolder.mutateAsync(id);
    }
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
              Folders
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Organize your audio files
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Folder
          </Button>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Create Folder
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="My Music"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <textarea
                    value={folderDescription}
                    onChange={(e) => setFolderDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreate}
                    disabled={!folderName.trim() || createFolder.isPending}
                    isLoading={createFolder.isPending}
                    className="flex-1"
                  >
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFolderName('');
                      setFolderDescription('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Folders Grid */}
        {data?.folders && data.folders.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.folders.map((folder: any) => (
              <div
                key={folder.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <Link href={`/folders/${folder.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                        <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {folder.name}
                        </h3>
                        {folder.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {folder.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                          {folder.audios?.length || 0} audio(s) •{' '}
                          {formatDate(folder.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(folder.id);
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No folders
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create a folder to organize your audio files
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-6"
            >
              Create Folder
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

