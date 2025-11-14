import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CheckCircleIcon } from 'react-native-heroicons/outline';
import { useAuthStore } from '../../stores/auth';
import { showToast } from '../../lib/toast';
import { useAppTheme } from '../../constants/dynamicTheme';
import { useI18n } from '../../lib/i18n';

interface OTPLoginProps {
  onSuccess: (user: any, tokens: any) => void;
  onBack: () => void;
}

export default function OTPLogin({ onSuccess, onBack }: OTPLoginProps) {
  const { sendOTP, verifyOTP, isLoading } = useAuthStore();
  const theme = useAppTheme();
  const { t } = useI18n();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [otpId, setOtpId] = useState('');

  // Timer for OTP expiration
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setStep('email');
            setOtpCode(['', '', '', '', '', '']);
            showToast.warning(t('resend_code'), t('code_expires_in'));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    const fullCode = otpCode.join('');
    if (fullCode.length === 6) {
      handleVerifyOTP();
    }
  }, [otpCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      showToast.error(t('enter_your_email'), t('email_address_label'));
      return;
    }

    try {
      const data = await sendOTP(email);

      if (data.success) {
        setOtpId(data.data.otpId);
        setStep('otp');
        setTimeRemaining(Math.floor((data.data.expiresAt - Date.now()) / 1000));
        showToast.success(t('send_code'), t('success'));
      } else {
        showToast.error(data.error || t('send_code'), t('error'));
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      const errorMessage = error instanceof Error ? error.message : t('send_code');
      showToast.error(errorMessage, t('error'));
    }
  };

  const handleVerifyOTP = async () => {
    const fullCode = otpCode.join('');
    if (fullCode.length !== 6) {
      return;
    }

    try {
      const data = await verifyOTP(email, fullCode);

      if (data.success) {
        showToast.success(t('sign_in'), t('success'));
        onSuccess(data.data.user, {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken
        });
      } else {
        showToast.error(data.error || t('error'), t('error'));
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      const errorMessage = error instanceof Error ? error.message : t('verifying');
      showToast.error(errorMessage, t('error'));
    }
  };

  const handleResendOTP = async () => {
    if (timeRemaining > 0) {
      showToast.info(`Please wait ${formatTime(timeRemaining)} before requesting a new code`, 'Please Wait');
      return;
    }
    await handleSendOTP();
  };

  const handleDigitChange = (index: number, value: string) => {
    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);

    // Auto-focus next input
    if (value && index < 5) {
      // Focus next input (this is a simplified version for React Native)
      // In a real implementation, you'd use refs to focus the next TextInput
    }
  };

  return (
    <View className="space-y-6">
      {/* Email Step */}
      {step === 'email' && (
        <View>
          <View className="mb-8">
            <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.foreground }}>
              {t('email_address_label')}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              className="w-full px-4 py-3"
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
                color: theme.colors.foreground,
                backgroundColor: theme.colors.card
              }}
              placeholder={t('enter_your_email')}
              placeholderTextColor={theme.colors.mutedAlt}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="mb-6">
            <TouchableOpacity
              onPress={handleSendOTP}
              disabled={isLoading || !email}
              className="w-full flex-row items-center justify-center gap-2 px-6 py-4 shadow-sm"
              style={{ 
                backgroundColor: (isLoading || !email) ? theme.colors.primaryLight : theme.colors.primary,
                borderRadius: 20
              }}
            >
              {isLoading && <ActivityIndicator size="small" color={theme.colors.primaryForeground} />}
              <Text className="text-white font-medium">
                {isLoading ? t('sending') : t('send_code')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <TouchableOpacity onPress={onBack} className="py-3">
              <Text className="text-sm text-center" style={{ color: theme.colors.muted }}>
                {t('back_to_other_options')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* OTP Step */}
      {step === 'otp' && (
        <View className="space-y-4">
          <View>
            <View className="flex-row justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  value={otpCode[index]}
                  onChangeText={(value) => handleDigitChange(index, value.replace(/\D/g, ''))}
                  className="w-12 h-12 text-center text-2xl font-mono"
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    color: theme.colors.foreground,
                    backgroundColor: theme.colors.card
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  autoFocus={index === 0}
                />
              ))}
            </View>
            <Text className="text-xs text-center mt-2" style={{ color: theme.colors.muted }}>
              {t('paste_entire_code_hint')}
            </Text>
          </View>

          {/* Timer */}
          {timeRemaining > 0 && (
            <View className="flex-row items-center justify-center">
              <Text className="text-sm" style={{ color: theme.colors.muted }}>
                {t('code_expires_in')} {formatTime(timeRemaining)}
              </Text>
            </View>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <View className="flex-row items-center justify-center gap-2">
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text className="text-sm" style={{ color: theme.colors.muted }}>
                {t('verifying')}
              </Text>
            </View>
          )}

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={timeRemaining > 0}
              className="flex-1 px-4 py-3"
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
                opacity: timeRemaining > 0 ? 0.5 : 1,
                backgroundColor: theme.colors.card
              }}
            >
              <Text className="text-center" style={{ color: theme.colors.foreground }}>
                {t('resend_code')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setStep('email');
                setOtpCode(['', '', '', '', '', '']);
                setTimeRemaining(0);
              }}
              className="flex-1 px-4 py-3"
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card
              }}
            >
              <Text className="text-center" style={{ color: theme.colors.foreground }}>
                {t('change_email')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mt-4">
            <TouchableOpacity onPress={onBack} className="py-3">
              <Text className="text-sm text-center" style={{ color: theme.colors.muted }}>
                {t('back_to_other_options')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Help Text */}
      <View className="items-center">
        <Text className="text-sm text-center" style={{ color: theme.colors.muted }}>
          {t('didnt_receive_code')}
        </Text>
      </View>
    </View>
  );
}