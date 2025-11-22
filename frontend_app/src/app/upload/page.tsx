'use client';

import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUploadAudio, useBulkUpload } from '@/hooks/useAudio';
import { useFolders } from '@/hooks/useFolders';
import { Button } from '@/components/ui/Button';
import { Upload, FileAudio, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: foldersData } = useFolders();
  const uploadSingle = useUploadAudio();
  const uploadBulk = useBulkUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      if (files.length === 1) {
        // Single file upload
        const formData = new FormData();
        formData.append('audio', files[0]);
        if (title) formData.append('title', title);
        if (description) formData.append('description', description);
        if (folderId) formData.append('folderId', folderId);
        formData.append('isPublic', isPublic.toString());

        await uploadSingle.mutateAsync(formData);
      } else {
        // Bulk upload
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('audio', file);
        });
        if (folderId) formData.append('folderId', folderId);
        formData.append('isPublic', isPublic.toString());

        await uploadBulk.mutateAsync(formData);
      }

      // Reset form
      setFiles([]);
      setTitle('');
      setDescription('');
      setFolderId('');
      router.push('/my-audios');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Upload Audio
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload single or multiple audio files
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Audio Files
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-blue-500 dark:border-gray-600"
            >
              <Upload className="h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                MP3, WAV, OGG, AAC, FLAC (Max 100MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected Files ({files.length})
              </p>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <FileAudio className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form Fields (only for single file) */}
          {files.length === 1 && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={files[0]?.name || 'Audio title'}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Folder Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Folder (Optional)
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">No folder</option>
              {foldersData?.folders?.map((folder: any) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Setting */}
          <div className="mb-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Make this audio public
              </span>
            </label>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploadSingle.isPending || uploadBulk.isPending}
            isLoading={uploadSingle.isPending || uploadBulk.isPending}
            className="w-full"
          >
            Upload {files.length > 1 ? `${files.length} Files` : 'Audio'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

