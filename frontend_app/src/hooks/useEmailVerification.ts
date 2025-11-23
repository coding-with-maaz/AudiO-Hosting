import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emailAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (otp: string) => emailAPI.verifyEmail(otp).then(res => res.data),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        updateUser({ isEmailVerified: true });
      }
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => emailAPI.resendVerification().then(res => res.data),
  });
}

