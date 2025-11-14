import React, { useState } from 'react';
import { StudentVerification } from '../components/features/student/StudentVerification';
import { StudentPricing } from '../components/features/student/StudentPricing';
import { useAuthStore } from '../stores/auth';

type ViewMode = 'verification' | 'pricing';

const StudentPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeView, setActiveView] = useState<ViewMode>(
    user?.studentVerificationStatus === 'verified' ? 'pricing' : 'verification'
  );

  const views = [
    { id: 'verification' as const, label: 'Verification', icon: '🎓' },
    { id: 'pricing' as const, label: 'Pricing', icon: '💰' },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'verification':
        return <StudentVerification />;
      case 'pricing':
        return <StudentPricing />;
      default:
        return <StudentVerification />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Student Portal
          </h1>
          <p className="text-muted-foreground">
            Verify your student status and access exclusive student pricing
          </p>
        </div>

        {/* Student Status Overview */}
        {user && (
          <div className="bg-white dark:bg-muted rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-white">
                    {user.studentVerificationStatus === 'verified' ? '🎓' : '👤'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground dark:text-white">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.studentVerificationStatus === 'verified'
                        ? 'bg-success-light text-success dark:bg-success/20 dark:text-success-light'
                        : user.studentVerificationStatus === 'pending'
                        ? 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning-light'
                        : user.studentVerificationStatus === 'rejected'
                        ? 'bg-error-light text-error dark:bg-error/20 dark:text-error-light'
                        : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'
                    }`}>
                      {user.studentVerificationStatus === 'verified' && '✅ Verified Student'}
                      {user.studentVerificationStatus === 'pending' && '⏳ Verification Pending'}
                      {user.studentVerificationStatus === 'rejected' && '❌ Verification Rejected'}
                      {user.studentVerificationStatus === 'none' && '📧 Not Verified'}
                    </span>
                    {user.studentVerificationStatus === 'verified' && (
                      <span className="px-2 py-1 bg-info-light text-info dark:bg-info/20 dark:text-info-light rounded-full text-xs font-medium">
                        50% Discount Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {user.studentVerificationStatus === 'verified' && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-success dark:text-success-light">
                    50% OFF
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Student Discount
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === view.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card text-muted-foreground hover:bg-primary/5 hover:border-primary/20'
              }`}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        {/* Active View Content */}
        <div className="bg-white dark:bg-muted rounded-xl shadow-lg p-6">
          {renderActiveView()}
        </div>

        {/* Benefits Overview */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-muted rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-foreground dark:text-white mb-2">
              50% Discount
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Save hundreds of dollars on premium features with verified student status
            </p>
          </div>

          <div className="bg-white dark:bg-muted rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="font-semibold text-foreground dark:text-white mb-2">
              Study Features
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Access study-focused templates, academic tracking, and productivity tools
            </p>
          </div>

          <div className="bg-white dark:bg-muted rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-semibold text-foreground dark:text-white mb-2">
              Student Community
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Connect with other verified students and join academic challenges
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;