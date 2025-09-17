import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {t('auth.resetPassword')}
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Password reset form coming soon...
      </p>
    </div>
  );
}