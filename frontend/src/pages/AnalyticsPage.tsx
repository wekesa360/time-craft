import { useTranslation } from 'react-i18next';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="card">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {t('navigation.analytics')}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Analytics dashboard coming soon...
      </p>
    </div>
  );
}