/**
 * Role-based Route Guard Component
 * Protects routes based on user roles and permissions
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import type { User } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'premium' | 'enterprise';
  requiredSubscription?: 'premium' | 'enterprise';
  requiresStudentVerification?: boolean;
  fallbackPath?: string;
  showFallback?: boolean;
}

// Helper function to determine if user has admin privileges
const isAdmin = (user: User): boolean => {
  // For now, we'll use email domain or subscription type to determine admin status
  // In a real app, this would be a proper role field
  return user.email.endsWith('@timecraft.com') || 
         user.subscriptionType === 'enterprise';
};

// Helper function to check subscription level
const hasSubscriptionLevel = (user: User, requiredLevel: 'premium' | 'enterprise'): boolean => {
  if (requiredLevel === 'premium') {
    return user.subscriptionType === 'premium' || user.subscriptionType === 'enterprise';
  }
  if (requiredLevel === 'enterprise') {
    return user.subscriptionType === 'enterprise';
  }
  return false;
};

// Helper function to check student verification
const hasStudentVerification = (user: User): boolean => {
  return user.isStudent && user.studentVerificationStatus === 'verified';
};

// Fallback component for unauthorized access
const UnauthorizedFallback: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
      <button
        onClick={() => window.history.back()}
        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  requiredSubscription,
  requiresStudentVerification,
  fallbackPath = '/dashboard',
  showFallback = true,
}) => {
  const { user, isAuthenticated } = useAuthStore();

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role
  if (requiredRole === 'admin' && !isAdmin(user)) {
    if (showFallback) {
      return <UnauthorizedFallback message="You need administrator privileges to access this page." />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check subscription level
  if (requiredSubscription && !hasSubscriptionLevel(user, requiredSubscription)) {
    const subscriptionMessage = requiredSubscription === 'premium' 
      ? "You need a Premium or Enterprise subscription to access this feature."
      : "You need an Enterprise subscription to access this feature.";
    
    if (showFallback) {
      return <UnauthorizedFallback message={subscriptionMessage} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check student verification
  if (requiresStudentVerification && !hasStudentVerification(user)) {
    const studentMessage = user.isStudent 
      ? "Please verify your student status to access student features."
      : "This feature is only available to verified students.";
    
    if (showFallback) {
      return <UnauthorizedFallback message={studentMessage} />;
    }
    return <Navigate to="/student" replace />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Convenience components for specific roles
export const AdminGuard: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath 
}) => (
  <RoleGuard requiredRole="admin" fallbackPath={fallbackPath}>
    {children}
  </RoleGuard>
);

export const PremiumGuard: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath 
}) => (
  <RoleGuard requiredSubscription="premium" fallbackPath={fallbackPath}>
    {children}
  </RoleGuard>
);

export const EnterpriseGuard: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath 
}) => (
  <RoleGuard requiredSubscription="enterprise" fallbackPath={fallbackPath}>
    {children}
  </RoleGuard>
);

export const StudentGuard: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath 
}) => (
  <RoleGuard requiresStudentVerification fallbackPath={fallbackPath}>
    {children}
  </RoleGuard>
);

// Hook to check permissions in components
export const usePermissions = () => {
  const { user } = useAuthStore();

  return {
    isAdmin: user ? isAdmin(user) : false,
    hasPremium: user ? hasSubscriptionLevel(user, 'premium') : false,
    hasEnterprise: user ? hasSubscriptionLevel(user, 'enterprise') : false,
    isVerifiedStudent: user ? hasStudentVerification(user) : false,
    subscriptionType: user?.subscriptionType || 'free',
    canAccessAdmin: user ? isAdmin(user) : false,
    canAccessPremiumFeatures: user ? hasSubscriptionLevel(user, 'premium') : false,
    canAccessEnterpriseFeatures: user ? hasSubscriptionLevel(user, 'enterprise') : false,
  };
};