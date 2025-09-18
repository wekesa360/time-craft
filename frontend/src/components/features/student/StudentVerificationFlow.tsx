import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  useStudentVerificationStatusQuery, 
  useSendStudentOTPMutation, 
  useVerifyStudentOTPMutation 
} from '../../../hooks/queries/useStudentQueries';
import { useAuthStore } from '../../../stores/auth';
import { useAccessibilityContext } from '../../accessibility/AccessibilityProvider';

interface StudentVerificationFlowProps {
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const StudentVerificationFlow: React.FC<StudentVerificationFlowProps> = ({
  onComplete,
  onCancel,
  className = '',
}) => {
  const { t } = useTranslation();
  const { announce } = useAccessibilityContext();
  const { user, updateProfile } = useAuthStore();
  const { data: verification, isLoading } = useStudentVerificationStatusQuery();
  const sendOTPMutation = useSendStudentOTPMutation();
  const verifyOTPMutation = useVerifyStudentOTPMutation();

  const [studentEmail, setStudentEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'verified' | 'error'>('email');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Educational domain patterns
  const educationalDomains = [
    '.edu', '.ac.', '.university', '.college', '.school', '.institute',
    '.ac.uk', '.ac.ca', '.ac.au', '.edu.au', '.edu.uk', '.edu.ca',
    '.university', '.college', '.school', '.institute', '.academy'
  ];

  useEffect(() => {
    if (user?.studentVerificationStatus === 'verified') {
      setStep('verified');
      announce(t('student.verification.complete'));
    } else if (verification?.otpSentAt) {
      setStep('otp');
      const expiresAt = verification.otpSentAt + (10 * 60 * 1000);
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeRemaining(Math.floor(remaining / 1000));
    }
  }, [user, verification, announce, t]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setStep('email');
            setError(t('student.verification.otpExpired'));
            announce(t('student.verification.otpExpired'));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, announce, t]);

  const isEducationalEmail = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    
    return educationalDomains.some(eduDomain => 
      domain.includes(eduDomain) || domain.endsWith(eduDomain)
    );
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return t('student.verification.emailRequired');
    if (!email.includes('@')) return t('student.verification.invalidEmail');
    if (!isEducationalEmail(email)) return t('student.verification.nonEducationalEmail');
    return null;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const emailError = validateEmail(studentEmail);
    if (emailError) {
      setError(emailError);
      announce(emailError);
      return;
    }

    try {
      const result = await sendOTPMutation.mutateAsync(studentEmail);
      setStep('otp');
      setAttempts(0);
      const remaining = Math.floor((result.expiresAt - Date.now()) / 1000);
      setTimeRemaining(remaining);
      announce(t('student.verification.otpSent'));
    } catch (error: any) {
      const message = error.response?.data?.message || t('student.verification.sendError');
      setError(message);
      announce(message);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (otp.length !== 6) {
      setError(t('student.verification.invalidOtpLength'));
      announce(t('student.verification.invalidOtpLength'));
      return;
    }

    try {
      await verifyOTPMutation.mutateAsync(otp);
      setStep('verified');
      setOtp('');
      setAttempts(0);
      
      // Update user in store
      if (user) {
        updateProfile({ ...user, studentVerificationStatus: 'verified' });
      }
      
      announce(t('student.verification.success'));
      onComplete?.();
    } catch (error: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setError(t('student.verification.maxAttemptsReached'));
        setStep('error');
        announce(t('student.verification.maxAttemptsReached'));
      } else {
        const message = error.response?.data?.message || t('student.verification.verifyError');
        setError(message);
        announce(message);
      }
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setOtp('');
    setAttempts(0);
    
    try {
      const result = await sendOTPMutation.mutateAsync(studentEmail);
      const remaining = Math.floor((result.expiresAt - Date.now()) / 1000);
      setTimeRemaining(remaining);
      announce(t('student.verification.otpResent'));
    } catch (error: any) {
      const message = error.response?.data?.message || t('student.verification.resendError');
      setError(message);
      announce(message);
    }
  };

  const handleStartOver = () => {
    setStep('email');
    setStudentEmail('');
    setOtp('');
    setError(null);
    setAttempts(0);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t('student.verification.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[
            { step: 'email', label: t('student.verification.steps.email'), icon: '📧' },
            { step: 'otp', label: t('student.verification.steps.otp'), icon: '🔐' },
            { step: 'verified', label: t('student.verification.steps.verified'), icon: '✅' },
          ].map(({ step: stepKey, label, icon }, index) => (
            <div key={stepKey} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === stepKey
                  ? 'bg-blue-600 text-white'
                  : ['email', 'otp', 'verified'].indexOf(step) > index
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {['email', 'otp', 'verified'].indexOf(step) > index ? '✓' : icon}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === stepKey
                  ? 'text-blue-600 dark:text-blue-400'
                  : ['email', 'otp', 'verified'].indexOf(step) > index
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {label}
              </span>
              {index < 2 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  ['email', 'otp', 'verified'].indexOf(step) > index
                    ? 'bg-green-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Email Input */}
      {step === 'email' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('student.verification.enterEmail')}
          </h3>
          
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('student.verification.studentEmail')}
              </label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="your.name@university.edu"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                aria-describedby="email-help"
              />
              <p id="email-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('student.verification.emailHelp')}
              </p>
            </div>

            {studentEmail && !isEducationalEmail(studentEmail) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ {t('student.verification.nonEducationalWarning')}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={sendOTPMutation.isPending || !studentEmail || !isEducationalEmail(studentEmail)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {sendOTPMutation.isPending ? t('student.verification.sending') : t('student.verification.sendOtp')}
              </button>
              
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 'otp' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('student.verification.enterOtp')}
          </h3>
          
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {t('student.verification.otpSentTo')}
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {studentEmail}
            </p>
            {timeRemaining > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('student.verification.expiresIn', { time: formatTime(timeRemaining) })}
              </p>
            )}
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('student.verification.verificationCode')}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
                required
                autoComplete="one-time-code"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={verifyOTPMutation.isPending || otp.length !== 6}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {verifyOTPMutation.isPending ? t('student.verification.verifying') : t('student.verification.verifyCode')}
              </button>
              
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={sendOTPMutation.isPending || timeRemaining > 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {sendOTPMutation.isPending ? t('student.verification.resending') : t('student.verification.resend')}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleStartOver}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
            >
              {t('student.verification.changeEmail')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 'verified' && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
            {t('student.verification.successTitle')}
          </h3>
          <p className="text-green-800 dark:text-green-200 mb-4">
            {t('student.verification.successMessage')}
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 inline-block">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              {t('student.verification.yourDiscount')}
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">50% OFF</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {step === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
            {t('student.verification.errorTitle')}
          </h3>
          <p className="text-red-800 dark:text-red-200 mb-4">
            {t('student.verification.errorMessage')}
          </p>
          <button
            onClick={handleStartOver}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('student.verification.tryAgain')}
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentVerificationFlow;
