import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authAPI.login(data).then(res => res.data),
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token);
        router.push('/dashboard');
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      throw error;
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: {
      username: string;
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => authAPI.register(data).then(res => res.data),
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token);
        router.push('/dashboard');
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      throw error;
    },
  });
}

export function useProfile() {
  const { user, setAuth, updateUser } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authAPI.getProfile().then(res => res.data.data.user),
    enabled: !!user,
  });

  return { profile: data || user, isLoading };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: any) => authAPI.updateProfile(data).then(res => res.data),
    onSuccess: (data) => {
      if (data.success && data.data) {
        updateUser(data.data.user);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authAPI.changePassword(data).then(res => res.data),
  });
}

