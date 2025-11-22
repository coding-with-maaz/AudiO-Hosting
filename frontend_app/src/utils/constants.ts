export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'title', label: 'Title' },
  { value: 'fileSize', label: 'File Size' },
  { value: 'views', label: 'Views' },
  { value: 'downloads', label: 'Downloads' },
] as const;

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  upload: '/upload',
  myAudios: '/my-audios',
  folders: '/folders',
  playlists: '/playlists',
  favorites: '/favorites',
  trash: '/trash',
  plans: '/plans',
  affiliate: '/affiliate',
  analytics: '/analytics',
  settings: '/settings',
  apiKeys: '/api-keys',
} as const;

