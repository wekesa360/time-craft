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
        <span className="ml-3 text-muted-foreground dark:text-muted-foreground">Loading pricing...</span>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="text-center py-12">
        <div className="text-error dark:text-error-light mb-2">❌ Error loading pricing</div>
        <p className="text-muted-foreground dark:text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-foreground dark:text-white mb-2">
          Student Pricing
        </h2>
        <p className="text-muted-foreground dark:text-muted-foreground">
          Special discounts for verified students
        </p>
      </div>

      {/* Student Status Banner */}
      {isVerifiedStudent ? (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">🎓</span>
            <div className="text-center">
              <div className="font-semibold text-success dark:text-success-light">
                Verified Student Status
              </div>
              <div className="text-sm text-success dark:text-success-light">
                You're eligible for 50% student discount!
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
          <div className="text-center">
            <div className="font-semibold text-primary mb-1">
              🎓 Student? Get 50% Off!
            </div>
            <div className="text-sm text-info dark:text-info-light">
              Verify your student status to unlock special pricing
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Monthly Plan */}
        <div className="bg-white dark:bg-muted rounded-xl border border-gray-200 dark:border-gray-600 p-8 relative">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">
              Monthly Plan
            </h3>
            <p className="text-muted-foreground dark:text-muted-foreground text-sm">
              Perfect for trying out premium features
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Regular Price */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">Regular Price</div>
              <div className={`text-2xl font-bold ${isVerifiedStudent ? 'line-through text-muted-foreground' : 'text-foreground dark:text-white'}`}>
                {formatPrice(pricing.regular.monthly)}/month
              </div>
            </div>

            {/* Student Price */}
            <div className="text-center">
              <div className="text-sm text-success dark:text-success-light mb-1">
                {isVerifiedStudent ? 'Your Student Price' : 'Student Price'}
              </div>
              <div className="text-3xl font-bold text-success dark:text-success-light">
                {formatPrice(pricing.student.monthly)}/month
              </div>
              <div className="text-sm text-success dark:text-success-light mt-1">
                Save {formatPrice(calculateSavings(pricing.regular.monthly, pricing.student.monthly))}/month
              </div>
            </div>

            {/* Discount Badge */}
            <div className="flex justify-center">
              <span className="bg-success-light dark:bg-success/20 text-success dark:text-success-light px-3 py-1 rounded-full text-sm font-medium">
                {pricing.student.discount}% OFF
              </span>
            </div>
          </div>

          <button
            disabled={!isVerifiedStudent}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              isVerifiedStudent
                ? 'bg-success hover:bg-success text-white'
                : 'bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isVerifiedStudent ? 'Choose Monthly Plan' : 'Verify Student Status'}
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="bg-white dark:bg-muted rounded-xl border border-gray-200 dark:border-gray-600 p-8 relative">
          {/* Popular Badge */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>

          <div className="text-center mb-6 mt-4">
            <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">
              Yearly Plan
            </h3>
            <p className="text-muted-foreground dark:text-muted-foreground text-sm">
              Best value for committed students
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Regular Price */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">Regular Price</div>
              <div className={`text-2xl font-bold ${isVerifiedStudent ? 'line-through text-muted-foreground' : 'text-foreground dark:text-white'}`}>
                {formatPrice(pricing.regular.yearly)}/year
              </div>
              <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                ({formatPrice(pricing.regular.yearly / 12)}/month)
              </div>
            </div>

            {/* Student Price */}
            <div className="text-center">
              <div className="text-sm text-success dark:text-success-light mb-1">
                {isVerifiedStudent ? 'Your Student Price' : 'Student Price'}
              </div>
              <div className="text-3xl font-bold text-success dark:text-success-light">
                {formatPrice(pricing.student.yearly)}/year
              </div>
              <div className="text-xs text-success dark:text-success-light">
                ({formatPrice(pricing.student.yearly / 12)}/month)
              </div>
              <div className="text-sm text-success dark:text-success-light mt-1">
                Save {formatPrice(calculateSavings(pricing.regular.yearly, pricing.student.yearly))}/year
              </div>
            </div>

            {/* Discount Badge */}
            <div className="flex justify-center">
              <span className="bg-success-light dark:bg-success/20 text-success dark:text-success-light px-3 py-1 rounded-full text-sm font-medium">
                {pricing.student.discount}% OFF
              </span>
            </div>
          </div>

          <button
            disabled={!isVerifiedStudent}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              isVerifiedStudent
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                : 'bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isVerifiedStudent ? 'Choose Yearly Plan' : 'Verify Student Status'}
          </button>
        </div>
      </div>

      {/* Savings Comparison */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-success dark:text-success-light mb-4 text-center">
          💰 Your Student Savings
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-success dark:text-success-light">
              {formatPrice(calculateSavings(pricing.regular.monthly, pricing.student.monthly) * 12)}
            </div>
            <div className="text-sm text-success dark:text-success-light">
              Annual savings with monthly plan
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success dark:text-success-light">
              {formatPrice(calculateSavings(pricing.regular.yearly, pricing.student.yearly))}
            </div>
            <div className="text-sm text-success dark:text-success-light">
              Annual savings with yearly plan
            </div>
          </div>
        </div>
      </div>

      {/* Features Included */}
      <div className="bg-white dark:bg-muted rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <h3 className="font-semibold text-foreground dark:text-white mb-4 text-center">
          ✨ Premium Features Included
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-success">✅</span>
              <span className="text-muted-foreground dark:text-muted-foreground">Unlimited tasks and projects</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-success">✅</span>
              <span className="text-muted-foreground dark:text-muted-foreground">Advanced health tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-success">✅</span>
              <span className="text-muted-foreground dark:text-muted-foreground">AI-powered insights</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-success">✅</span>
              <span className="text-muted-foreground dark:text-muted-foreground">Focus session templates</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-success">✅</span>
              <span className="text-muted-foreground dark:text-muted-foreground">Voice note processing</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-success">✅</span>
              <span className="text-muted-foreground dark:text-muted-foreground">Social challenges</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-success">✅</span>
              <span className="text-muted-foreground dark:text-muted-foreground">Achievement badges</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-success">✅</span>
              <span className="text-muted-foreground dark:text-muted-foreground">Meeting scheduling</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-success">✅</span>
              <span className="text-muted-foreground dark:text-muted-foreground">Priority support</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-info-light0">🎓</span>
              <span className="text-muted-foreground dark:text-muted-foreground">Student-exclusive features</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 bg-muted dark:bg-muted rounded-lg p-6">
        <h3 className="font-semibold text-foreground dark:text-white mb-4">
          ❓ Frequently Asked Questions
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-medium text-foreground dark:text-white mb-1">
              How long does student verification take?
            </div>
            <div className="text-muted-foreground dark:text-muted-foreground">
              Verification is instant once you enter the correct OTP sent to your student email.
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground dark:text-white mb-1">
              How long does the student discount last?
            </div>
            <div className="text-muted-foreground dark:text-muted-foreground">
              Student status is verified annually. You'll need to re-verify each year to maintain the discount.
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground dark:text-white mb-1">
              Can I switch between monthly and yearly plans?
            </div>
            <div className="text-muted-foreground dark:text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground dark:text-white mb-1">
              What if my student email doesn't work?
            </div>
            <div className="text-muted-foreground dark:text-muted-foreground">
              Contact our support team if you're having trouble with verification. We can help with alternative verification methods.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};