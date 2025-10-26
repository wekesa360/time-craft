import React from 'react';
import { useTranslation } from 'react-i18next';
import AnalyticsDashboard from '../components/features/analytics/AnalyticsDashboard';
import { PremiumGuard } from '../components/auth/RoleGuard';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  
  return (
    <PremiumGuard fallbackPath="/dashboard">
      <div className="min-h-screen bg-muted dark:bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnalyticsDashboard />
        </div>
      </div>
    </PremiumGuard>
  );
}