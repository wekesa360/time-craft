/**
 * Subscription-based Feature Guard Component
 * Shows upgrade prompts for premium features
 */

import React from 'react';
import { useAuthStore } from '../../stores/auth';
import { usePermissions } from './RoleGuard';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPlan: 'premium' | 'enterprise';
  feature: string;
  showUpgradePrompt?: boolean;
  fallbackComponent?: React.ReactNode;
}

// Upgrade prompt component
const UpgradePrompt: React.FC<{ 
  requiredPlan: 'premium' | 'enterprise'; 
  feature: string;
  currentPlan: string;
}> = ({ requiredPlan, feature, currentPlan }) => {
  const handleUpgrade = () => {
    // Navigate to subscription page or open upgrade modal
    window.location.href = '/settings?tab=subscription';
  };

  const planName = requiredPlan === 'premium' ? 'Premium' : 'Enterprise';
  const currentPlanName = currentPlan === 'free' ? 'Free' : 
                         currentPlan === 'premium' ? 'Premium' : 'Enterprise';

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-6 border border-primary-200 dark:border-primary-700">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
            Upgrade to {planName}
          </h3>
          <p className="text-muted-foreground dark:text-muted-foreground mb-4">
            {feature} is available with {planName} subscription. 
            You're currently on the {currentPlanName} plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUpgrade}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Upgrade to {planName}
            </button>
            <button
              onClick={() => window.history.back()}
              className="bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-muted-foreground dark:text-muted-foreground font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
      
      {/* Feature benefits */}
      <div className="mt-6 pt-6 border-t border-primary-200 dark:border-primary-700">
        <h4 className="text-sm font-medium text-foreground dark:text-white mb-3">
          {planName} includes:
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground">
          {requiredPlan === 'premium' ? (
            <>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Advanced analytics and insights
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Unlimited tasks and projects
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Priority support
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Advanced integrations
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Everything in Premium
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Team collaboration features
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Admin dashboard and controls
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Custom integrations and API access
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  requiredPlan,
  feature,
  showUpgradePrompt = true,
  fallbackComponent,
}) => {
  const { user } = useAuthStore();
  const permissions = usePermissions();

  // If not authenticated, don't render anything
  if (!user) {
    return null;
  }

  // Check if user has required subscription
  const hasAccess = requiredPlan === 'premium' 
    ? permissions.hasPremium 
    : permissions.hasEnterprise;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Show upgrade prompt if enabled
  if (showUpgradePrompt) {
    return (
      <UpgradePrompt 
        requiredPlan={requiredPlan}
        feature={feature}
        currentPlan={user.subscriptionType}
      />
    );
  }

  // Don't render anything if no upgrade prompt
  return null;
};

// Convenience components for specific subscription levels
export const PremiumFeature: React.FC<{
  children: React.ReactNode;
  feature: string;
  showUpgradePrompt?: boolean;
}> = ({ children, feature, showUpgradePrompt = true }) => (
  <SubscriptionGuard 
    requiredPlan="premium" 
    feature={feature}
    showUpgradePrompt={showUpgradePrompt}
  >
    {children}
  </SubscriptionGuard>
);

export const EnterpriseFeature: React.FC<{
  children: React.ReactNode;
  feature: string;
  showUpgradePrompt?: boolean;
}> = ({ children, feature, showUpgradePrompt = true }) => (
  <SubscriptionGuard 
    requiredPlan="enterprise" 
    feature={feature}
    showUpgradePrompt={showUpgradePrompt}
  >
    {children}
  </SubscriptionGuard>
);

// Hook to check feature access
export const useFeatureAccess = () => {
  const permissions = usePermissions();

  return {
    canAccessPremiumFeatures: permissions.hasPremium,
    canAccessEnterpriseFeatures: permissions.hasEnterprise,
    checkFeatureAccess: (requiredPlan: 'premium' | 'enterprise') => {
      return requiredPlan === 'premium' ? permissions.hasPremium : permissions.hasEnterprise;
    },
  };
};