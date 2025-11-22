export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user' | 'affiliate';
  avatar?: string;
  storageUsed: number;
  storageLimit: number;
  bandwidthUsed: number;
  bandwidthLimit?: number;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Audio {
  id: string;
  userId: string;
  folderId?: string;
  title: string;
  description?: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  duration?: number;
  mimeType: string;
  thumbnail?: string;
  isPublic: boolean;
  isActive: boolean;
  views: number;
  downloads: number;
  likes: number;
  tags: string[];
  metadata: Record<string, any>;
  shareToken?: string;
  password?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  folder?: Folder;
}

export interface Folder {
  id: string;
  userId: string;
  parentFolderId?: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isShared: boolean;
  shareToken?: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
  audios?: Audio[];
  subfolders?: Folder[];
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly' | 'lifetime';
  storageLimit: number;
  bandwidthLimit?: number;
  maxFileSize?: number;
  maxFiles?: number;
  features: Record<string, any>;
  isActive: boolean;
  isPopular: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  plan?: Plan;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
  sortOrder: 'manual' | 'date' | 'title' | 'duration';
  audios?: Audio[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  audioId: string;
  parentId?: string;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  user?: User;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  audioId: string;
  rating: number;
  user?: User;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

