import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {t('legal.privacyPolicy.title')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('legal.privacyPolicy.subtitle')}
        </p>
        <div className="text-sm text-muted-foreground mt-4">
          {t('legal.privacyPolicy.lastUpdated')}: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none dark:prose-invert">
        
        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.privacyPolicy.overview.title')}
          </h2>
          <div className="border rounded-lg p-6">
            <p className="text-foreground mb-4">
              Ploracs ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our wellness and productivity platform.
            </p>
            <p className="text-foreground">
              By using our service, you agree to the collection and use of information in accordance with this Privacy Policy. This policy complies with the General Data Protection Regulation (GDPR) and German data protection laws.
            </p>
          </div>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.privacyPolicy.informationWeCollect.title')}
          </h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-primary pl-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('legal.privacyPolicy.informationWeCollect.personalInfo.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2">
                {(t('legal.privacyPolicy.informationWeCollect.personalInfo.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('legal.privacyPolicy.informationWeCollect.usageData.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2">
                {(t('legal.privacyPolicy.informationWeCollect.usageData.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('legal.privacyPolicy.informationWeCollect.autoCollected.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2">
                {(t('legal.privacyPolicy.informationWeCollect.autoCollected.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.privacyPolicy.howWeUseInfo.title')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t('legal.privacyPolicy.howWeUseInfo.serviceProvision.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {(t('legal.privacyPolicy.howWeUseInfo.serviceProvision.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t('legal.privacyPolicy.howWeUseInfo.communication.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {(t('legal.privacyPolicy.howWeUseInfo.communication.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t('legal.privacyPolicy.howWeUseInfo.improvement.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {(t('legal.privacyPolicy.howWeUseInfo.improvement.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t('legal.privacyPolicy.howWeUseInfo.legal.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {(t('legal.privacyPolicy.howWeUseInfo.legal.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.privacyPolicy.dataProtection.title')}
          </h2>
          
          <div className="rounded-lg p-6 border">
            <p className="text-foreground mb-4">
              {t('legal.privacyPolicy.dataProtection.content')}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-muted-foreground space-y-2">
                {(t('legal.privacyPolicy.dataProtection.measures', { returnObjects: true }) as string[]).slice(0, 4).map((measure: string, index: number) => (
                  <li key={index}>• {measure}</li>
                ))}
              </ul>
              <ul className="text-muted-foreground space-y-2">
                {(t('legal.privacyPolicy.dataProtection.measures', { returnObjects: true }) as string[]).slice(4).map((measure: string, index: number) => (
                  <li key={index + 4}>• {measure}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.privacyPolicy.yourRights.title')}
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 rounded-lg border">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {t('legal.privacyPolicy.yourRights.access.title')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('legal.privacyPolicy.yourRights.access.description')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-lg border">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {t('legal.privacyPolicy.yourRights.correction.title')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('legal.privacyPolicy.yourRights.correction.description')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-lg border">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {t('legal.privacyPolicy.yourRights.deletion.title')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('legal.privacyPolicy.yourRights.deletion.description')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-lg border">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {t('legal.privacyPolicy.yourRights.optOut.title')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('legal.privacyPolicy.yourRights.optOut.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.privacyPolicy.dataRetention.title')}
          </h2>
          
          <div className="border rounded-lg p-6">
            <p className="text-foreground mb-4">
              {t('legal.privacyPolicy.dataRetention.content')}
            </p>
            <ul className="text-muted-foreground space-y-2">
              {(t('legal.privacyPolicy.dataRetention.periods', { returnObjects: true }) as string[]).map((period: string, index: number) => (
                <li key={index}>• <strong>{period.split(':')[0]}:</strong>{period.split(':').slice(1).join(':')}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.privacyPolicy.contact.title')}
          </h2>
          
          <div className="rounded-lg p-6 border">
            <p className="text-foreground mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact Ploracs:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-foreground">
                  <strong>Email:</strong> privacy@ploracs.de
                </p>
                <p className="text-foreground">
                  <strong>Address:</strong><br />
                  Ploracs<br />
                  Musterstraße 123<br />
                  10115 Berlin, Germany
                </p>
              </div>
              <div>
                <p className="text-foreground">
                  <strong>Response Time:</strong> We will respond to your privacy requests within 30 days
                </p>
                <p className="text-foreground">
                  <strong>Data Protection Officer:</strong> dpo@ploracs.de
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Changes to Policy */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.privacyPolicy.changes.title')}
          </h2>
          
          <div className="border rounded-lg p-6">
            <p className="text-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </div>
        </section>

      </div>

      {/* Back to Sign Up Button */}
      <div className="text-center mt-12 pb-8">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign Up
        </Link>
      </div>
    </div>
  );
}