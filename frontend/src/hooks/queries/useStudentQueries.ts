// React Query hooks for student verification
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { StudentVerification, StudentPricing } from '../../types';
import { toast } from 'react-hot-toast';

// Query keys
export const studentKeys = {
  all: ['student'] as const,
  pricing: () => [...studentKeys.all, 'pricing'] as const,
  verification: () => [...studentKeys.all, 'verification'] as const,
  status: () => [...studentKeys.verification(), 'status'] as const,
};

// Student pricing query
export const useStudentPricingQuery = () => {
  return useQuery({
    queryKey: studentKeys.pricing(),
    queryFn: () => apiClient.getStudentPricing(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Student verification status query
export const useStudentVerificationStatusQuery = () => {
  return useQuery({
    queryKey: studentKeys.status(),
    queryFn: () => apiClient.getStudentVerificationStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Send student verification OTP mutation
export const useSendStudentOTPMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentEmail: string) => apiClient.sendStudentVerificationOTP(studentEmail),
    onSuccess: () => {
      toast.success('📧 Verification code sent to your student email!');
      queryClient.invalidateQueries({ queryKey: studentKeys.status() });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to send verification code';
      toast.error(message);
    },
  });
};

// Verify student OTP mutation
export const useVerifyStudentOTPMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (otp: string) => apiClient.verifyStudentOTP(otp),
    onSuccess: () => {
      toast.success('🎓 Student verification successful! You now have access to student pricing.');
      queryClient.invalidateQueries({ queryKey: studentKeys.status() });
      queryClient.invalidateQueries({ queryKey: ['auth'] }); // Refresh user data
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Invalid verification code';
      toast.error(message);
    },
  });
};