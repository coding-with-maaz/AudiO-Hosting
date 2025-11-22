import { create } from 'zustand';

interface Audio {
  id: string;
  title: string;
  description?: string;
  filename: string;
  fileSize: number;
  duration?: number;
  mimeType: string;
  views: number;
  downloads: number;
  likes: number;
  isPublic: boolean;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface AudioState {
  selectedAudio: Audio | null;
  uploadProgress: number;
  isUploading: boolean;
  setSelectedAudio: (audio: Audio | null) => void;
  setUploadProgress: (progress: number) => void;
  setIsUploading: (isUploading: boolean) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  selectedAudio: null,
  uploadProgress: 0,
  isUploading: false,
  setSelectedAudio: (audio) => set({ selectedAudio: audio }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setIsUploading: (isUploading) => set({ isUploading }),
}));

