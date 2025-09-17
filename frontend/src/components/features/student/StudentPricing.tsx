import React from 'react';
import { useStudentPricingQuery } from '../../../hooks/queries/useStudentQueries';
import { useAuthStore } from '../../../stores/auth';

export const StudentPricing: React.FC = () => {
  const { user } = useAuthStore();
  const { data: pricing, isLoading } = useStudentPricingQuery();

  const isVerifiedStudent = user?.studentVerificationStatus === 'verified';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const calculateSavings = (regular: number, student: number) => {
    return regular - student;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading pricing...</span>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-2">❌ Error loading pricing</div>
        <p className="text-gray-600 dark:text-gray-300">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Student Pricing
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Special discounts for verified students
        </p>
      </div>

      {/* Student Status Banner */}
      {isVerifiedStudent ? (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">🎓</span>
            <div className="text-center">
              <div className="font-semibold text-green-900 dark:text-green-100">
                Verified Student Status
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">
                You're eligible for 50% student discount!
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <div className="text-center">
            <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              🎓 Student? Get 50% Off!
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Verify your student status to unlock special pricing
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Monthly Plan */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-8 relative">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Monthly Plan
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Perfect for trying out premium features
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Regular Price */}
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Regular Price</div>
              <div className={`text-2xl font-bold ${isVerifiedStudent ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                {formatPrice(pricing.regular.monthly)}/month
              </div>
            </div>

            {/* Student Price */}
            <div className="text-center">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">
                {isVerifiedStudent ? 'Your Student Price' : 'Student Price'}
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(pricing.student.monthly)}/month
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                Save {formatPrice(calculateSavings(pricing.regular.monthly, pricing.student.monthly))}/month
              </div>
            </div>

            {/* Discount Badge */}
            <div className="flex justify-center">
              <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                {pricing.student.discount}% OFF
              </span>
            </div>
          </div>

          <button
            disabled={!isVerifiedStudent}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              isVerifiedStudent
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {isVerifiedStudent ? 'Choose Monthly Plan' : 'Verify Student Status'}
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-8 relative">
          {/* Popular Badge */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>

          <div className="text-center mb-6 mt-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Yearly Plan
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Best value for committed students
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Regular Price */}
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Regular Price</div>
              <div className={`text-2xl font-bold ${isVerifiedStudent ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                {formatPrice(pricing.regular.yearly)}/year
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ({formatPrice(pricing.regular.yearly / 12)}/month)
              </div>
            </div>

            {/* Student Price */}
            <div className="text-center">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">
                {isVerifiedStudent ? 'Your Student Price' : 'Student Price'}
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(pricing.student.yearly)}/year
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                ({formatPrice(pricing.student.yearly / 12)}/month)
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                Save {formatPrice(calculateSavings(pricing.regular.yearly, pricing.student.yearly))}/year
              </div>
            </div>

            {/* Discount Badge */}
            <div className="flex justify-center">
              <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                {pricing.student.discount}% OFF
              </span>
            </div>
          </div>

          <button
            disabled={!isVerifiedStudent}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              isVerifiedStudent
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {isVerifiedStudent ? 'Choose Yearly Plan' : 'Verify Student Status'}
          </button>
        </div>
      </div>

      {/* Savings Comparison */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4 text-center">
          💰 Your Student Savings
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatPrice(calculateSavings(pricing.regular.monthly, pricing.student.monthly) * 12)}
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">
              Annual savings with monthly plan
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatPrice(calculateSavings(pricing.regular.yearly, pricing.student.yearly))}
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">
              Annual savings with yearly plan
            </div>
          </div>
        </div>
      </div>

      {/* Features Included */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
          ✨ Premium Features Included
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">Unlimited tasks and projects</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">Advanced health tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">AI-powered insights</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">Focus session templates</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">Voice note processing</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">Social challenges</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">Achievement badges</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">Meeting scheduling</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">Priority support</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-500">🎓</span>
              <span className="text-gray-700 dark:text-gray-300">Student-exclusive features</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          ❓ Frequently Asked Questions
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              How long does student verification take?
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              Verification is instant once you enter the correct OTP sent to your student email.
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              How long does the student discount last?
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              Student status is verified annually. You'll need to re-verify each year to maintain the discount.
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              Can I switch between monthly and yearly plans?
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              What if my student email doesn't work?
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              Contact our support team if you're having trouble with verification. We can help with alternative verification methods.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};