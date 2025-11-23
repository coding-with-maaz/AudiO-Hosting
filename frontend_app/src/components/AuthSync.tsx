'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Component to sync authentication token from localStorage to cookies
 * This ensures the middleware can access the token for route protection
 */
export function AuthSync() {
  const { token } = useAuthStore();

  useEffect(() => {
    // Sync token from localStorage to cookie if it exists
    // This handles cases where user refreshes the page and token exists in localStorage
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token');
      if (localToken && localToken !== token) {
        // Token exists in localStorage but not in store, sync it
        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        document.cookie = `token=${localToken};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
      } else if (token) {
        // Token exists in store, sync to cookie
        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        document.cookie = `token=${token};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
      }
    }
  }, [token]);

  return null;
}

