import React from 'react';
import { useTranslation } from 'react-i18next';
import AnalyticsDashboard from '../components/features/analytics/AnalyticsDashboard';
import { PremiumGuard } from '../components/auth/RoleGuard';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  
  return (
    <PremiumGuard fallbackPath="/dashboard">
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <AnalyticsDashboard />
        </div>
      </div>
    </PremiumGuard>
  );
}