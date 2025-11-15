import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {t('legal.termsOfService.title')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('legal.termsOfService.subtitle')}
        </p>
        <div className="text-sm text-muted-foreground mt-4">
          {t('legal.termsOfService.lastUpdated')}: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none dark:prose-invert">
        
        {/* Acceptance of Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.acceptance.title')}
          </h2>
          <div className="border border-border rounded-lg p-6">
            <p className="text-foreground mb-4">
              By accessing and using our wellness and productivity platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
            <p className="text-foreground">
              These Terms of Service are governed by Ploracs, a company registered in Germany, and are subject to German law and the jurisdiction of German courts.
            </p>
          </div>
        </section>

        {/* Service Description */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.serviceDescription.title')}
          </h2>
          
          <div className="space-y-6">
            <p className="text-foreground">
              Ploracs provides a comprehensive wellness and productivity platform that combines time management, health tracking, and personal development tools to help users achieve their goals and maintain a balanced lifestyle.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-lg p-6 border">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('legal.termsOfService.serviceDescription.productivity.title')}
                </h3>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  {(t('legal.termsOfService.serviceDescription.productivity.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg p-6 border">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('legal.termsOfService.serviceDescription.wellness.title')}
                </h3>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  {(t('legal.termsOfService.serviceDescription.wellness.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* User Accounts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.userAccounts.title')}
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('legal.termsOfService.userAccounts.creation.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2">
                {(t('legal.termsOfService.userAccounts.creation.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('legal.termsOfService.userAccounts.responsibilities.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2">
                {(t('legal.termsOfService.userAccounts.responsibilities.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Acceptable Use */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.acceptableUse.title')}
          </h2>
          
          <div className="rounded-lg p-6 mb-6 border border-amber-200">
            <p className="text-foreground font-medium mb-2">
              {t('legal.termsOfService.acceptableUse.warning')}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-muted-foreground space-y-2 text-sm">
                {(t('legal.termsOfService.acceptableUse.prohibited', { returnObjects: true }) as string[]).slice(0, 5).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {(t('legal.termsOfService.acceptableUse.prohibited', { returnObjects: true }) as string[]).slice(5).map((item: string, index: number) => (
                  <li key={index + 5}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Payment Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.paymentTerms.title')}
          </h2>
          
          <div className="space-y-6">
            <div className="rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {t('legal.termsOfService.paymentTerms.subscriptionPlans.title')}
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.free.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.free.features')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.free.storage')}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.pro.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.pro.features')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.pro.storage')}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.student.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.student.features')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('legal.termsOfService.paymentTerms.subscriptionPlans.student.storage')}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {t('legal.termsOfService.paymentTerms.terms.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2">
                {(t('legal.termsOfService.paymentTerms.terms.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.dataPrivacy.title')}
          </h2>
          
          <div className="border border-border rounded-lg p-6">
            <p className="text-foreground mb-4">
              {t('legal.termsOfService.dataPrivacy.content')}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-muted-foreground space-y-2">
                {(t('legal.termsOfService.dataPrivacy.principles', { returnObjects: true }) as string[]).slice(0, 3).map((principle: string, index: number) => (
                  <li key={index}>• {principle}</li>
                ))}
              </ul>
              <ul className="text-muted-foreground space-y-2">
                {(t('legal.termsOfService.dataPrivacy.principles', { returnObjects: true }) as string[]).slice(3).map((principle: string, index: number) => (
                  <li key={index + 3}>• {principle}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.intellectualProperty.title')}
          </h2>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t('legal.termsOfService.intellectualProperty.ourRights.title')}
              </h3>
              <p className="text-foreground">
                {t('legal.termsOfService.intellectualProperty.ourRights.content')}
              </p>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t('legal.termsOfService.intellectualProperty.yourRights.title')}
              </h3>
              <p className="text-foreground">
                {t('legal.termsOfService.intellectualProperty.yourRights.content')}
              </p>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.limitationOfLiability.title')}
          </h2>
          
          <div className="rounded-lg p-6 border border-red-200">
            <p className="text-foreground font-medium mb-4">
              {t('legal.termsOfService.limitationOfLiability.warning')}
            </p>
            <div className="text-muted-foreground space-y-3 text-sm">
              {(t('legal.termsOfService.limitationOfLiability.content', { returnObjects: true }) as string[]).map((content: string, index: number) => (
                <p key={index}>{content}</p>
              ))}
            </div>
          </div>
        </section>

        {/* Termination */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.termination.title')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t('legal.termsOfService.termination.byYou.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {(t('legal.termsOfService.termination.byYou.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t('legal.termsOfService.termination.byUs.title')}
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {(t('legal.termsOfService.termination.byUs.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Changes to Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.changes.title')}
          </h2>
          
          <div className="border rounded-lg p-6">
            <p className="text-foreground">
              {t('legal.termsOfService.changes.content')}
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.contact.title')}
          </h2>
          
          <div className="rounded-lg p-6 border">
            <p className="text-foreground mb-4">
              If you have any questions about these Terms of Service, please contact Ploracs using the information below:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-foreground">
                  <strong>Email:</strong> legal@ploracs.de
                </p>
                <p className="text-foreground">
                  <strong>Support:</strong> support@ploracs.de
                </p>
              </div>
              <div>
                <p className="text-foreground">
                  <strong>Address:</strong><br />
                  Ploracs<br />
                  Musterstraße 123<br />
                  10115 Berlin, Germany
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('legal.termsOfService.governingLaw.title')}
          </h2>
          
          <div className="border rounded-lg p-6">
            <p className="text-foreground">
              These Terms of Service are governed by and construed in accordance with the laws of Germany. Any disputes arising from these terms will be subject to the exclusive jurisdiction of the courts in Berlin, Germany.
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