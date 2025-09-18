import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Eye, UserCheck, Server, Clock } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-6">
          <Shield className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('legal.privacyPolicy.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('legal.privacyPolicy.subtitle')}
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          {t('legal.privacyPolicy.lastUpdated')}: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none dark:prose-invert">
        
        {/* Overview */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Eye className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.privacyPolicy.overview.title')}
            </h2>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('legal.privacyPolicy.overview.content')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.privacyPolicy.overview.agreement')}
            </p>
          </div>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <UserCheck className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.privacyPolicy.informationWeCollect.title')}
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="border-l-4 border-primary-200 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.privacyPolicy.informationWeCollect.personalInfo.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                {(t('legal.privacyPolicy.informationWeCollect.personalInfo.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="border-l-4 border-primary-200 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.privacyPolicy.informationWeCollect.usageData.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                {(t('legal.privacyPolicy.informationWeCollect.usageData.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="border-l-4 border-primary-200 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.privacyPolicy.informationWeCollect.autoCollected.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                {(t('legal.privacyPolicy.informationWeCollect.autoCollected.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Server className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.privacyPolicy.howWeUseInfo.title')}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.privacyPolicy.howWeUseInfo.serviceProvision.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                {(t('legal.privacyPolicy.howWeUseInfo.serviceProvision.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.privacyPolicy.howWeUseInfo.communication.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                {(t('legal.privacyPolicy.howWeUseInfo.communication.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.privacyPolicy.howWeUseInfo.improvement.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                {(t('legal.privacyPolicy.howWeUseInfo.improvement.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.privacyPolicy.howWeUseInfo.legal.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                {(t('legal.privacyPolicy.howWeUseInfo.legal.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Lock className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.privacyPolicy.dataProtection.title')}
            </h2>
          </div>
          
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('legal.privacyPolicy.dataProtection.content')}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                {(t('legal.privacyPolicy.dataProtection.measures', { returnObjects: true }) as string[]).slice(0, 4).map((measure: string, index: number) => (
                  <li key={index}>• {measure}</li>
                ))}
              </ul>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                {(t('legal.privacyPolicy.dataProtection.measures', { returnObjects: true }) as string[]).slice(4).map((measure: string, index: number) => (
                  <li key={index + 4}>• {measure}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <UserCheck className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.privacyPolicy.yourRights.title')}
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('legal.privacyPolicy.yourRights.access.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {t('legal.privacyPolicy.yourRights.access.description')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('legal.privacyPolicy.yourRights.correction.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {t('legal.privacyPolicy.yourRights.correction.description')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('legal.privacyPolicy.yourRights.deletion.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {t('legal.privacyPolicy.yourRights.deletion.description')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('legal.privacyPolicy.yourRights.optOut.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {t('legal.privacyPolicy.yourRights.optOut.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Clock className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.privacyPolicy.dataRetention.title')}
            </h2>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('legal.privacyPolicy.dataRetention.content')}
            </p>
            <ul className="text-gray-700 dark:text-gray-300 space-y-2">
              {(t('legal.privacyPolicy.dataRetention.periods', { returnObjects: true }) as string[]).map((period: string, index: number) => (
                <li key={index}>• <strong>{period.split(':')[0]}:</strong>{period.split(':').slice(1).join(':')}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('legal.privacyPolicy.contact.title')}
          </h2>
          
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('legal.privacyPolicy.contact.content')}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{t('legal.privacyPolicy.contact.email')}:</strong> privacy@timecraft.app
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{t('legal.privacyPolicy.contact.address')}:</strong><br />
                  {t('legal.privacyPolicy.contact.addressDetails').split('\n').map((line: string, index: number) => (
                    <span key={index}>{line}{index < 2 ? <br /> : ''}</span>
                  ))}
                </p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{t('legal.privacyPolicy.contact.responseTime')}:</strong> {t('legal.privacyPolicy.contact.responseTimeDetails')}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{t('legal.privacyPolicy.contact.dataProtectionOfficer')}:</strong> {t('legal.privacyPolicy.contact.dataProtectionOfficerDetails')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Changes to Policy */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('legal.privacyPolicy.changes.title')}
          </h2>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.privacyPolicy.changes.content')}
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}