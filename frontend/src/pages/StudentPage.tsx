import React, { useState } from 'react';
import { StudentVerification } from '../components/features/student/StudentVerification';
import { StudentPricing } from '../components/features/student/StudentPricing';
import { useAuthStore } from '../stores/auth';

type ViewMode = 'verification' | 'pricing';

export const StudentPage: React.FC = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Student Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Verify your student status and access exclusive student pricing
          </p>
        </div>

        {/* Student Status Overview */}
        {user && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-white">
                    {user.studentVerificationStatus === 'verified' ? '🎓' : '👤'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.studentVerificationStatus === 'verified'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : user.studentVerificationStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                        : user.studentVerificationStatus === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {user.studentVerificationStatus === 'verified' && '✅ Verified Student'}
                      {user.studentVerificationStatus === 'pending' && '⏳ Verification Pending'}
                      {user.studentVerificationStatus === 'rejected' && '❌ Verification Rejected'}
                      {user.studentVerificationStatus === 'none' && '📧 Not Verified'}
                    </span>
                    {user.studentVerificationStatus === 'verified' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full text-xs font-medium">
                        50% Discount Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {user.studentVerificationStatus === 'verified' && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    50% OFF
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
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
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        {/* Active View Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {renderActiveView()}
        </div>

        {/* Benefits Overview */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              50% Discount
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Save hundreds of dollars on premium features with verified student status
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Study Features
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Access study-focused templates, academic tracking, and productivity tools
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Student Community
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Connect with other verified students and join academic challenges
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};