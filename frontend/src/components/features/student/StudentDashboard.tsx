import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Trophy, 
  Calendar, 
  Target,
  TrendingUp,
  Clock,
  Award,
  BarChart3,
  Brain,
  Zap
} from 'lucide-react';
import { apiClient } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth';

interface StudentStats {
  totalStudyTime: number;
  completedTasks: number;
  achievements: number;
  studyStreak: number;
  focusSessions: number;
  healthScore: number;
  socialConnections: number;
  upcomingDeadlines: number;
}

interface StudyGoal {
  id: string;
  title: string;
  description: string;
  targetDate: number;
  progress: number;
  category: 'academic' | 'personal' | 'project';
  priority: 'low' | 'medium' | 'high';
}

interface StudySession {
  id: string;
  subject: string;
  duration: number;
  startTime: number;
  endTime: number;
  productivity: number;
  notes?: string;
}

export const StudentDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester'>('week');

  // Fetch student statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['student', 'stats', selectedPeriod],
    queryFn: () => apiClient.getStudentStats(selectedPeriod),
    enabled: user?.studentVerificationStatus === 'verified',
  });

  // Fetch study goals
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['student', 'goals'],
    queryFn: () => apiClient.getStudentGoals(),
    enabled: user?.studentVerificationStatus === 'verified',
  });

  // Fetch recent study sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['student', 'sessions', selectedPeriod],
    queryFn: () => apiClient.getStudentSessions(selectedPeriod),
    enabled: user?.studentVerificationStatus === 'verified',
  });

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'text-error dark:text-error-light';
      case 'medium': return 'text-warning dark:text-warning-light';
      case 'low': return 'text-success dark:text-success-light';
      default: return 'text-muted-foreground dark:text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string): React.ReactNode => {
    switch (category) {
      case 'academic': return <BookOpen className="w-4 h-4" />;
      case 'personal': return <Target className="w-4 h-4" />;
      case 'project': return <Award className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (!user || user.studentVerificationStatus !== 'verified') {
    return (
      <div className="text-center py-12">
        <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
          {t('student.dashboard.verificationRequired')}
        </h3>
        <p className="text-muted-foreground dark:text-muted-foreground">
          {t('student.dashboard.verificationMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {t('student.dashboard.welcome', { name: user.firstName })}
            </h1>
            <p className="text-info-light">
              {t('student.dashboard.subtitle')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">50%</div>
            <div className="text-info-light text-sm">
              {t('student.dashboard.discount')}
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-2">
        {[
          { key: 'week', label: t('student.dashboard.periods.week') },
          { key: 'month', label: t('student.dashboard.periods.month') },
          { key: 'semester', label: t('student.dashboard.periods.semester') },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedPeriod(key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === key
                ? 'bg-info text-white'
                : 'bg-white dark:bg-muted text-muted-foreground dark:text-muted-foreground hover:bg-info-light dark:hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: t('student.dashboard.stats.studyTime'),
            value: stats ? formatTime(stats.totalStudyTime) : '--',
            icon: <Clock className="w-5 h-5" />,
            color: 'text-info dark:text-info',
            bgColor: 'bg-info-light dark:bg-info/20',
          },
          {
            title: t('student.dashboard.stats.tasks'),
            value: stats?.completedTasks || '--',
            icon: <Target className="w-5 h-5" />,
            color: 'text-success dark:text-success-light',
            bgColor: 'bg-success-light dark:bg-success/20',
          },
          {
            title: t('student.dashboard.stats.achievements'),
            value: stats?.achievements || '--',
            icon: <Trophy className="w-5 h-5" />,
            color: 'text-warning dark:text-warning-light',
            bgColor: 'bg-warning-light dark:bg-warning/20',
          },
          {
            title: t('student.dashboard.stats.streak'),
            value: stats ? `${stats.studyStreak} ${t('student.dashboard.stats.days')}` : '--',
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white dark:bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <div className={stat.color}>{stat.icon}</div>
              </div>
              <div className="text-2xl font-bold text-foreground dark:text-white">
                {stat.value}
              </div>
            </div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">
              {stat.title}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Study Goals */}
        <div className="bg-white dark:bg-muted rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground dark:text-white">
              {t('student.dashboard.studyGoals')}
            </h3>
            <button className="text-info dark:text-info hover:text-info dark:hover:text-info-light text-sm font-medium">
              {t('common.viewAll')}
            </button>
          </div>
          
          {goalsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted dark:bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-muted dark:bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : goals && goals.length > 0 ? (
            <div className="space-y-3">
              {goals.slice(0, 3).map((goal: StudyGoal) => (
                <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={getPriorityColor(goal.priority)}>
                        {getCategoryIcon(goal.category)}
                      </div>
                      <h4 className="font-medium text-foreground dark:text-white">
                        {goal.title}
                      </h4>
                    </div>
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {formatDate(goal.targetDate)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">
                    {goal.description}
                  </p>
                  <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                    <div
                      className="bg-info h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                    {goal.progress}% {t('common.complete')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                {t('student.dashboard.noGoals')}
              </p>
              <button className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info transition-colors">
                {t('student.dashboard.createGoal')}
              </button>
            </div>
          )}
        </div>

        {/* Recent Study Sessions */}
        <div className="bg-white dark:bg-muted rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground dark:text-white">
              {t('student.dashboard.recentSessions')}
            </h3>
            <button className="text-info dark:text-info hover:text-info dark:hover:text-info-light text-sm font-medium">
              {t('common.viewAll')}
            </button>
          </div>
          
          {sessionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted dark:bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted dark:bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 3).map((session: StudySession) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-muted dark:bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-info-light dark:bg-info/20 rounded-lg">
                      <BookOpen className="w-4 h-4 text-info dark:text-info" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground dark:text-white">
                        {session.subject}
                      </h4>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {formatTime(session.duration)} • {formatDate(session.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground dark:text-white">
                      {session.productivity}/10
                    </div>
                    <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                      {t('student.dashboard.productivity')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                {t('student.dashboard.noSessions')}
              </p>
              <button className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info transition-colors">
                {t('student.dashboard.startSession')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-muted rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
          {t('student.dashboard.quickActions')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: t('student.dashboard.actions.startStudy'),
              icon: <Zap className="w-6 h-6" />,
              color: 'text-info dark:text-info',
              bgColor: 'bg-info-light dark:bg-info/20',
            },
            {
              title: t('student.dashboard.actions.createGoal'),
              icon: <Target className="w-6 h-6" />,
              color: 'text-success dark:text-success-light',
              bgColor: 'bg-success-light dark:bg-success/20',
            },
            {
              title: t('student.dashboard.actions.joinStudy'),
              icon: <Users className="w-6 h-6" />,
              color: 'text-purple-600 dark:text-purple-400',
              bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            },
            {
              title: t('student.dashboard.actions.viewProgress'),
              icon: <BarChart3 className="w-6 h-6" />,
              color: 'text-primary dark:text-primary-400',
              bgColor: 'bg-primary-100 dark:bg-primary/20',
            },
          ].map((action, index) => (
            <button
              key={index}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              <div className={`p-3 rounded-lg ${action.bgColor} mb-2`}>
                <div className={action.color}>{action.icon}</div>
              </div>
              <span className="text-sm font-medium text-foreground dark:text-white text-center">
                {action.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
