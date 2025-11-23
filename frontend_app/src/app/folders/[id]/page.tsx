'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  useFolder, 
  useUpdateFolder, 
  useDeleteFolder,
  useEnableFolderSharing,
  useDisableFolderSharing
} from '@/hooks/useFolders';
import { useMyAudios } from '@/hooks/useAudio';
import { formatFileSize, formatDate, formatDuration } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import {
  Folder,
  ArrowLeft,
  Edit,
  Trash2,
  Share2,
  Download,
  Music,
  Calendar,
  HardDrive,
  FileAudio,
  Lock,
  Unlock,
  Copy,
  Check,
  ExternalLink,
  MoreVertical,
  Play,
} from 'lucide-react';
import Link from 'next/link';

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: folder, isLoading: folderLoading, refetch: refetchFolder } = useFolder(folderId);
  const { data: audiosData, isLoading: audiosLoading } = useMyAudios({ folderId });
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const enableSharing = useEnableFolderSharing();
  const disableSharing = useDisableFolderSharing();

  const audios = audiosData?.audios || [];

  // Initialize edit form when folder loads
  useEffect(() => {
    if (folder && showEditModal) {
      setEditName(folder.name || '');
      setEditDescription(folder.description || '');
    }
  }, [folder, showEditModal]);

  const handleUpdate = async () => {
    if (!editName.trim()) return;
    try {
      await updateFolder.mutateAsync({
        id: folderId,
        data: {
          name: editName,
          description: editDescription || null,
        },
      });
      setShowEditModal(false);
      setEditName('');
      setEditDescription('');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to update folder');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this folder? All audios will be moved to root.')) {
      try {
        await deleteFolder.mutateAsync(folderId);
        router.push('/folders');
      } catch (error: any) {
        alert(error?.response?.data?.message || 'Failed to delete folder');
      }
    }
  };

  const handleEnableSharing = async () => {
    try {
      const result = await enableSharing.mutateAsync({
        id: folderId,
        password: sharePassword || undefined,
      });
      setShowShareModal(false);
      setSharePassword('');
      refetchFolder();
      // Show success message with share link
      if (result?.data?.shareLink) {
        alert(`Sharing enabled! Share link: ${result.data.shareLink}`);
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to enable sharing');
    }
  };

  const handleDisableSharing = async () => {
    if (confirm('Are you sure you want to disable sharing?')) {
      try {
        await disableSharing.mutateAsync(folderId);
        refetchFolder();
      } catch (error: any) {
        alert(error?.response?.data?.message || 'Failed to disable sharing');
      }
    }
  };

  const getShareLink = () => {
    if (!folder?.shareToken) return '';
    return `${window.location.origin}/f/${folder.shareToken}`;
  };

  const copyShareLink = async () => {
    const link = getShareLink();
    if (link) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(link);
        } else {
          // Fallback for browsers that don't support clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = link;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
        // Fallback: show link in alert
        alert(`Share link: ${link}`);
      }
    }
  };

  const getDownloadLink = (audioId: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/audio/${audioId}/download`;
  };

  const getEmbedLink = (audioId: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/e/${audioId}`;
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

  if (folderLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading folder...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!folder) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Folder not found
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The folder you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/folders" className="mt-6 inline-block">
              <Button>Back to Folders</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/folders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                <Folder className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {folder.name}
                </h1>
                {folder.description && (
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {folder.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(folder.name || '');
                setEditDescription(folder.description || '');
                setShowEditModal(true);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 className="mr-2 h-4 w-4" />
              {folder.isShared ? 'Share Settings' : 'Share'}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Folder Info */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              {folder.isShared ? (
                <Unlock className="h-5 w-5 text-green-600" />
              ) : (
                <Lock className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {folder.isShared ? 'Shared' : 'Private'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Share Link (if shared) */}
        {folder.isShared && folder.shareToken && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Public Share Link
                </p>
                <p className="mt-1 text-sm text-green-800 dark:text-green-200 break-all">
                  {getShareLink()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyShareLink}
              >
                {copiedLink ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Audios List */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Audio Files ({audios.length})
          </h2>
          {audiosLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 dark:text-gray-400">Loading audios...</div>
            </div>
          ) : audios.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {audios.map((audio: any) => (
                <div
                  key={audio.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start space-x-4">
                    <Music className="h-10 w-10 text-blue-600" />
                    <div className="flex-1">
                      <Link href={`/audio/${audio.id}`} className="group">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {audio.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {audio.description || 'No description'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <HardDrive className="mr-1 h-4 w-4" /> {formatFileSize(audio.fileSize)}
                        </span>
                        <span className="flex items-center">
                          <Play className="mr-1 h-4 w-4" /> {formatDuration(audio.duration)}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" /> {formatDate(audio.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/audio/${audio.id}`}>
                        <Play className="h-4 w-4" />
                        <span className="ml-2">Play</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getDownloadLink(audio.id), '_blank')}
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-2">Download</span>
                    </Button>
                    <Button
                      variant="ghost"
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
                This folder is empty. Upload some audio files to get started.
              </p>
              <Link href="/upload" className="mt-6 inline-block">
                <Button>Upload Audio</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Edit Folder
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="My Music"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleUpdate}
                    disabled={!editName.trim() || updateFolder.isPending}
                    isLoading={updateFolder.isPending}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditName('');
                      setEditDescription('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                {folder.isShared ? 'Share Settings' : 'Enable Sharing'}
              </h2>
              {folder.isShared ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Sharing is enabled
                    </p>
                    {folder.shareToken && (
                      <div className="mt-2">
                        <p className="text-xs text-green-800 dark:text-green-200">Share Link:</p>
                        <p className="mt-1 break-all text-sm text-green-900 dark:text-green-100">
                          {getShareLink()}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyShareLink}
                          className="mt-2"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Link
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="danger"
                    onClick={handleDisableSharing}
                    disabled={disableSharing.isPending}
                    isLoading={disableSharing.isPending}
                    className="w-full"
                  >
                    Disable Sharing
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowShareModal(false)}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={sharePassword}
                      onChange={(e) => setSharePassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Leave empty for no password"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Optional: Add a password to protect the shared folder
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleEnableSharing}
                      disabled={enableSharing.isPending}
                      isLoading={enableSharing.isPending}
                      className="flex-1"
                    >
                      Enable Sharing
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowShareModal(false);
                        setSharePassword('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

