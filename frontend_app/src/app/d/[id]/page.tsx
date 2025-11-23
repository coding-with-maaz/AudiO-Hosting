'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Download, Music, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function DownloadAudioPage() {
  const params = useParams();
  const router = useRouter();
  const audioId = params.id as string;
  const [isDownloading, setIsDownloading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    initiateDownload();
  }, [audioId]);

  const initiateDownload = () => {
    try {
      // Redirect to backend download endpoint
      const downloadUrl = `${API_URL}/d/${audioId}`;
      window.location.href = downloadUrl;
      
      // Set timeout to show success message
      setTimeout(() => {
        setIsDownloading(false);
      }, 3000);
    } catch (err: any) {
      console.error('Download error:', err);
      setError('Failed to download audio file');
      setIsDownloading(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            Download Failed
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
          <Download className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-bounce" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isDownloading ? 'Downloading...' : 'Download Started'}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {isDownloading
            ? 'Your download should start shortly.'
            : 'If download did not start, click the button below.'}
        </p>
        {!isDownloading && (
          <div className="mt-6">
            <a
              href={`${API_URL}/d/${audioId}`}
              download
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download Again
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

