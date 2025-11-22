import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      const errorInfo: Record<string, any> = {};
      
      // Only add properties that actually have values
      if (error?.config?.url) errorInfo.url = error.config.url;
      if (error?.config?.method) errorInfo.method = error.config.method;
      if (error?.config?.baseURL) errorInfo.baseURL = error.config.baseURL;
      if (error?.response?.status) errorInfo.status = error.response.status;
      if (error?.response?.statusText) errorInfo.statusText = error.response.statusText;
      if (error?.response?.data) errorInfo.data = error.response.data;
      if (error?.message) errorInfo.message = error.message;
      if (error?.code) errorInfo.code = error.code;
      
      // Log error information
      if (Object.keys(errorInfo).length > 0) {
        console.error('API Error:', errorInfo);
      } else if (error) {
        // If error exists but has no structured info, log it directly
        console.error('API Error: Unknown error structure', error);
      } else {
        console.error('API Error: No error object provided');
      }
    }

    if (error?.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data),
};

export const audioAPI = {
  upload: (formData: FormData) => api.post('/audio/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params?: any) => api.get('/audio', { params }),
  getById: (id: string) => api.get(`/audio/${id}`),
  getMyAudios: (params?: any) => api.get('/audio/my/list', { params }),
  update: (id: string, data: any) => api.put(`/audio/${id}`, data),
  rename: (id: string, title: string) => api.put(`/audio/${id}/rename`, { title }),
  delete: (id: string, permanent?: boolean) => 
    api.delete(`/audio/${id}${permanent ? '?permanent=true' : ''}`),
  download: (id: string) => api.get(`/audio/${id}/download`, { responseType: 'blob' }),
};

export const bulkAPI = {
  upload: (formData: FormData) => api.post('/bulk/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (audioIds: string[]) => api.post('/bulk/delete', { audioIds }),
  move: (audioIds: string[], folderId: string | null) => 
    api.post('/bulk/move', { audioIds, folderId }),
  update: (audioIds: string[], updates: any) => 
    api.post('/bulk/update', { audioIds, updates }),
};

export const folderAPI = {
  create: (data: any) => api.post('/folders', data),
  getAll: (params?: any) => api.get('/folders', { params }),
  getById: (id: string) => api.get(`/folders/${id}`),
  update: (id: string, data: any) => api.put(`/folders/${id}`, data),
  rename: (id: string, name: string) => api.put(`/folders/${id}/rename`, { name }),
  delete: (id: string) => api.delete(`/folders/${id}`),
  enableSharing: (id: string, password?: string) => 
    api.post(`/folders/${id}/enable-sharing`, { password }),
  disableSharing: (id: string) => api.post(`/folders/${id}/disable-sharing`),
  export: (id: string) => api.get(`/folders/${id}/export`, { responseType: 'blob' }),
};

export const playlistAPI = {
  create: (data: any) => api.post('/playlists', data),
  getAll: (params?: any) => api.get('/playlists', { params }),
  getById: (id: string) => api.get(`/playlists/${id}`),
  update: (id: string, data: any) => api.put(`/playlists/${id}`, data),
  delete: (id: string) => api.delete(`/playlists/${id}`),
  addAudios: (id: string, audioIds: string[]) => 
    api.post(`/playlists/${id}/audios`, { audioIds }),
  removeAudio: (id: string, audioId: string) => 
    api.delete(`/playlists/${id}/audios/${audioId}`),
  updateOrder: (id: string, audioOrders: any[]) => 
    api.put(`/playlists/${id}/order`, { audioOrders }),
};

export const searchAPI = {
  search: (params: any) => api.get('/search/audios', { params }),
  getFilters: (params?: any) => api.get('/search/filters', { params }),
};

export const shareAPI = {
  getLinks: (id: string) => api.get(`/share/links/${id}`),
};

export const planAPI = {
  getAll: () => api.get('/plans'),
  getById: (id: string) => api.get(`/plans/${id}`),
};

export const subscriptionAPI = {
  subscribe: (planId: string) => api.post('/subscriptions/subscribe', { planId }),
  getMy: () => api.get('/subscriptions/my'),
  cancel: (id: string, reason?: string) => 
    api.put(`/subscriptions/${id}/cancel`, { reason }),
  completePayment: (data: any) => api.post('/subscriptions/complete-payment', data),
};

export const affiliateAPI = {
  create: () => api.post('/affiliate/create'),
  getMy: () => api.get('/affiliate/my'),
  getStats: () => api.get('/affiliate/my/stats'),
  requestPayout: (data: any) => api.post('/affiliate/payout', data),
};

export const interactionAPI = {
  addFavorite: (audioId: string) => api.post(`/interactions/favorites/${audioId}`),
  removeFavorite: (audioId: string) => api.delete(`/interactions/favorites/${audioId}`),
  getFavorites: () => api.get('/interactions/favorites'),
  addComment: (audioId: string, data: any) => 
    api.post(`/interactions/comments/${audioId}`, data),
  getComments: (audioId: string, params?: any) => 
    api.get(`/interactions/comments/${audioId}`, { params }),
  updateComment: (id: string, content: string) => 
    api.put(`/interactions/comments/${id}`, { content }),
  deleteComment: (id: string) => api.delete(`/interactions/comments/${id}`),
  addRating: (audioId: string, rating: number) => 
    api.post(`/interactions/ratings/${audioId}`, { rating }),
  getRatings: (audioId: string) => api.get(`/interactions/ratings/${audioId}`),
};

export const trashAPI = {
  getTrash: (type?: string) => api.get('/trash', { params: { type } }),
  restore: (id: string) => api.post(`/trash/restore/${id}`),
  empty: (type?: string) => api.delete(`/trash/empty`, { params: { type } }),
};

export const remoteUploadAPI = {
  uploadFromUrl: (data: any) => api.post('/remote-upload/from-url', data),
};

export const encodingAPI = {
  getFormats: () => api.get('/encoding/formats'),
  encode: (id: string, data: any) => api.post(`/encoding/encode/${id}`, data),
  extractMetadata: (id: string) => api.post(`/encoding/extract-metadata/${id}`),
};

export const analyticsAPI = {
  getAudioAnalytics: (audioId: string, params?: any) => 
    api.get(`/analytics/audio/${audioId}`, { params }),
  getUserAnalytics: (params?: any) => api.get('/analytics/my', { params }),
  exportCSV: (params?: any) => api.get('/analytics/export/csv', { 
    params,
    responseType: 'blob',
  }),
  exportPDF: (params?: any) => api.get('/analytics/export/pdf', {
    params,
    responseType: 'blob',
  }),
};

export const apiKeyAPI = {
  create: (data: any) => api.post('/api-keys', data),
  getAll: () => api.get('/api-keys'),
  update: (id: string, data: any) => api.put(`/api-keys/${id}`, data),
  delete: (id: string) => api.delete(`/api-keys/${id}`),
};

export const webhookAPI = {
  create: (data: any) => api.post('/webhooks', data),
  getAll: () => api.get('/webhooks'),
  delete: (id: string) => api.delete(`/webhooks/${id}`),
};

export const paymentAPI = {
  createIntent: (data: any) => api.post('/payments/create-intent', data),
  createPayPalOrder: (data: any) => api.post('/payments/paypal-order', data),
};

