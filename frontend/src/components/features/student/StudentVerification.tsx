import React, { useState, useEffect } from 'react';
import { 
  useStudentVerificationStatusQuery, 
  useSendStudentOTPMutation, 
  useVerifyStudentOTPMutation 
} from '../../../hooks/queries/useStudentQueries';
import { useAuthStore } from '../../../stores/auth';

export const StudentVerification: React.FC = () => {
  const { user } = useAuthStore();
  const { data: verification, isLoading } = useStudentVerificationStatusQuery();
  const sendOTPMutation = useSendStudentOTPMutation();
  const verifyOTPMutation = useVerifyStudentOTPMutation();

  const [studentEmail, setStudentEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'verified'>('email');
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (user?.studentVerificationStatus === 'verified') {
      setStep('verified');
    } else if (verification?.otpSentAt) {
      setStep('otp');
      // Calculate time remaining (OTP expires in 10 minutes)
      const expiresAt = verification.otpSentAt + (10 * 60 * 1000);
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeRemaining(Math.floor(remaining / 1000));
    }
  }, [user, verification]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setStep('email');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail) return;

    try {
      const result = await sendOTPMutation.mutateAsync(studentEmail);
      setStep('otp');
      const remaining = Math.floor((result.expiresAt - Date.now()) / 1000);
      setTimeRemaining(remaining);
    } catch (error) {
      console.error('Error sending OTP:', error);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    try {
      await verifyOTPMutation.mutateAsync(otp);
      setStep('verified');
      setOtp('');
    } catch (error) {
      console.error('Error verifying OTP:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return '✅';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '❌';
      default:
        return '📧';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'rejected':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const isEducationalEmail = (email: string) => {
    const educationalDomains = ['.edu', '.ac.', '.university', '.college', '.school'];
    return educationalDomains.some(domain => email.toLowerCase().includes(domain));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading verification status...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Student Verification
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Verify your student status to get 50% off premium features
        </p>
      </div>

      {/* Current Status */}
      {user?.studentVerificationStatus !== 'none' && (
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Verification Status
          </h3>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">
              {getStatusIcon(user.studentVerificationStatus)}
            </span>
            <div>
              <div className={`font-medium ${getStatusColor(user.studentVerificationStatus)}`}>
                {user.studentVerificationStatus === 'verified' && 'Verified Student'}
                {user.studentVerificationStatus === 'pending' && 'Verification Pending'}
                {user.studentVerificationStatus === 'rejected' && 'Verification Rejected'}
              </div>
              {verification?.studentEmail && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {verification.studentEmail}
                </div>
              )}
            </div>
          </div>

          {user.studentVerificationStatus === 'verified' && verification?.verifiedAt && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Verified on {new Date(verification.verifiedAt).toLocaleDateString()}
            </div>
          )}

          {user.studentVerificationStatus === 'rejected' && verification?.rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-3">
              <div className="text-sm text-red-800 dark:text-red-200">
                <strong>Rejection Reason:</strong> {verification.rejectionReason}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Process */}
      {step !== 'verified' && (
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          {step === 'email' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📧 Enter Student Email
              </h3>
              
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Student Email Address
                  </label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="your.name@university.edu"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Must be a valid educational email address (.edu, .ac.uk, etc.)
                  </p>
                </div>

                {studentEmail && !isEducationalEmail(studentEmail) && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ This doesn't appear to be an educational email address. Please use your official student email.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sendOTPMutation.isPending || !studentEmail || !isEducationalEmail(studentEmail)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {sendOTPMutation.isPending ? 'Sending...' : '📤 Send Verification Code'}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🔐 Enter Verification Code
              </h3>
              
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  We've sent a 6-digit verification code to:
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {studentEmail}
                </p>
                {timeRemaining > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Code expires in {formatTime(timeRemaining)}
                  </p>
                )}
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg font-mono"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={verifyOTPMutation.isPending || otp.length !== 6}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {verifyOTPMutation.isPending ? 'Verifying...' : '✅ Verify Code'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setTimeRemaining(0);
                    }}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Change Email
                  </button>
                </div>
              </form>

              {timeRemaining === 0 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setStep('email')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                  >
                    Code expired? Send a new one
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Success State */}
      {step === 'verified' && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
              Student Verification Complete!
            </h3>
            <p className="text-green-800 dark:text-green-200 mb-4">
              You now have access to student pricing with 50% off all premium features.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 inline-block">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Your student discount:</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">50% OFF</div>
            </div>
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          🎯 Student Benefits
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li className="flex items-center gap-2">
            <span>💰</span>
            <span>50% discount on all premium plans</span>
          </li>
          <li className="flex items-center gap-2">
            <span>📚</span>
            <span>Access to study-focused features and templates</span>
          </li>
          <li className="flex items-center gap-2">
            <span>🏆</span>
            <span>Exclusive student achievement badges</span>
          </li>
          <li className="flex items-center gap-2">
            <span>👥</span>
            <span>Connect with other verified students</span>
          </li>
          <li className="flex items-center gap-2">
            <span>📊</span>
            <span>Academic performance tracking and insights</span>
          </li>
        </ul>
      </div>

      {/* Requirements */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          📋 Verification Requirements
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Must use an official educational email address (.edu, .ac.uk, etc.)</li>
          <li>• Email must be currently active and accessible</li>
          <li>• Verification code expires in 10 minutes</li>
          <li>• Student status is verified annually</li>
          <li>• Discount applies to new subscriptions and renewals</li>
        </ul>
      </div>
    </div>
  );
};