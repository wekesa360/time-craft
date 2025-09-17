import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Scale, Users, AlertTriangle, CreditCard, Shield } from 'lucide-react';

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-6">
          <FileText className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('legal.termsOfService.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('legal.termsOfService.subtitle')}
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          {t('legal.termsOfService.lastUpdated')}: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none dark:prose-invert">
        
        {/* Acceptance of Terms */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Scale className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.termsOfService.acceptance.title')}
            </h2>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('legal.termsOfService.acceptance.content')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.termsOfService.acceptance.governance')}
            </p>
          </div>
        </section>

        {/* Service Description */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.termsOfService.serviceDescription.title')}
            </h2>
          </div>
          
          <div className="space-y-6">
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.termsOfService.serviceDescription.intro')}
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {t('legal.termsOfService.serviceDescription.productivity.title')}
                </h3>
                <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                  {t('legal.termsOfService.serviceDescription.productivity.items', { returnObjects: true }).map((item: string, index: number) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {t('legal.termsOfService.serviceDescription.wellness.title')}
                </h3>
                <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                  {t('legal.termsOfService.serviceDescription.wellness.items', { returnObjects: true }).map((item: string, index: number) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* User Accounts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('legal.termsOfService.userAccounts.title')}
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-primary-200 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.termsOfService.userAccounts.creation.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                {t('legal.termsOfService.userAccounts.creation.items', { returnObjects: true }).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="border-l-4 border-primary-200 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.termsOfService.userAccounts.responsibilities.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                {t('legal.termsOfService.userAccounts.responsibilities.items', { returnObjects: true }).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Acceptable Use */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <AlertTriangle className="w-6 h-6 text-amber-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.termsOfService.acceptableUse.title')}
            </h2>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 mb-6">
            <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
              {t('legal.termsOfService.acceptableUse.warning')}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-amber-700 dark:text-amber-300 space-y-2 text-sm">
                {t('legal.termsOfService.acceptableUse.prohibited', { returnObjects: true }).slice(0, 5).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
              <ul className="text-amber-700 dark:text-amber-300 space-y-2 text-sm">
                {t('legal.termsOfService.acceptableUse.prohibited', { returnObjects: true }).slice(5).map((item: string, index: number) => (
                  <li key={index + 5}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Payment Terms */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <CreditCard className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.termsOfService.paymentTerms.title')}
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.termsOfService.paymentTerms.subscriptionPlans.title')}
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.free.title')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.free.features')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.free.storage')}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.pro.title')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.pro.features')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.pro.storage')}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.student.title')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.student.features')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.student.storage')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.termsOfService.paymentTerms.terms.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                {t('legal.termsOfService.paymentTerms.terms.items', { returnObjects: true }).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
              {t('legal.termsOfService.dataPrivacy.title')}
            </h2>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('legal.termsOfService.dataPrivacy.content')}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                {t('legal.termsOfService.dataPrivacy.principles', { returnObjects: true }).slice(0, 3).map((principle: string, index: number) => (
                  <li key={index}>• {principle}</li>
                ))}
              </ul>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                {t('legal.termsOfService.dataPrivacy.principles', { returnObjects: true }).slice(3).map((principle: string, index: number) => (
                  <li key={index + 3}>• {principle}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('legal.termsOfService.intellectualProperty.title')}
          </h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.termsOfService.intellectualProperty.ourRights.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {t('legal.termsOfService.intellectualProperty.ourRights.content')}
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.termsOfService.intellectualProperty.yourRights.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {t('legal.termsOfService.intellectualProperty.yourRights.content')}
              </p>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('legal.termsOfService.limitationOfLiability.title')}
          </h2>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200 font-medium mb-4">
              {t('legal.termsOfService.limitationOfLiability.warning')}
            </p>
            <div className="text-red-700 dark:text-red-300 space-y-3 text-sm">
              {t('legal.termsOfService.limitationOfLiability.content', { returnObjects: true }).map((content: string, index: number) => (
                <p key={index}>{content}</p>
              ))}
            </div>
          </div>
        </section>

        {/* Termination */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('legal.termsOfService.termination.title')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.termsOfService.termination.byYou.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                {t('legal.termsOfService.termination.byYou.items', { returnObjects: true }).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('legal.termsOfService.termination.byUs.title')}
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                {t('legal.termsOfService.termination.byUs.items', { returnObjects: true }).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Changes to Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('legal.termsOfService.changes.title')}
          </h2>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.termsOfService.changes.content')}
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('legal.termsOfService.contact.title')}
          </h2>
          
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('legal.termsOfService.contact.content')}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{t('legal.termsOfService.contact.email')}:</strong> legal@timecraft.app
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{t('legal.termsOfService.contact.support')}:</strong> support@timecraft.app
                </p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{t('legal.termsOfService.contact.address')}:</strong><br />
                  {t('legal.termsOfService.contact.addressDetails').split('\n').map((line: string, index: number) => (
                    <span key={index}>{line}{index < 2 ? <br /> : ''}</span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('legal.termsOfService.governingLaw.title')}
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.termsOfService.governingLaw.content')}
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}