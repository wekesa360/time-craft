import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Flag, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Users,
  Percent,
  Calendar,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers: string[];
  environment: 'development' | 'staging' | 'production';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  category: 'feature' | 'experiment' | 'killswitch' | 'config';
  status: 'active' | 'inactive' | 'scheduled';
}

// Mock data - in real app this would come from API
const mockFeatureFlags: FeatureFlag[] = [
  {
    id: '1',
    name: 'Voice Commands',
    key: 'voice_commands_enabled',
    description: 'Enable voice command functionality for task creation and navigation',
    enabled: true,
    rolloutPercentage: 100,
    targetUsers: [],
    environment: 'production',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-01',
    createdBy: 'admin@timecraft.app',
    category: 'feature',
    status: 'active'
  },
  {
    id: '2',
    name: 'AI Meeting Scheduler',
    key: 'ai_meeting_scheduler',
    description: 'AI-powered meeting scheduling with conflict detection',
    enabled: true,
    rolloutPercentage: 75,
    targetUsers: ['premium', 'student'],
    environment: 'production',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-15',
    createdBy: 'admin@timecraft.app',
    category: 'feature',
    status: 'active'
  },
  {
    id: '3',
    name: 'New Dashboard Layout',
    key: 'new_dashboard_layout',
    description: 'A/B test for the new dashboard design',
    enabled: true,
    rolloutPercentage: 25,
    targetUsers: [],
    environment: 'production',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-20',
    createdBy: 'designer@timecraft.app',
    category: 'experiment',
    status: 'active'
  },
  {
    id: '4',
    name: 'Legacy API Killswitch',
    key: 'legacy_api_killswitch',
    description: 'Emergency killswitch for legacy API endpoints',
    enabled: false,
    rolloutPercentage: 0,
    targetUsers: [],
    environment: 'production',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: 'admin@timecraft.app',
    category: 'killswitch',
    status: 'inactive'
  },
  {
    id: '5',
    name: 'Beta Features Access',
    key: 'beta_features_access',
    description: 'Access to beta features for selected users',
    enabled: true,
    rolloutPercentage: 10,
    targetUsers: ['beta_testers'],
    environment: 'production',
    createdAt: '2024-02-05',
    updatedAt: '2024-02-25',
    createdBy: 'admin@timecraft.app',
    category: 'config',
    status: 'active'
  }
];

interface FeatureFlagsProps {
  className?: string;
}

export const FeatureFlags: React.FC<FeatureFlagsProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [flags, setFlags] = useState<FeatureFlag[]>(mockFeatureFlags);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || flag.category === selectedCategory;
    const matchesEnvironment = selectedEnvironment === 'all' || flag.environment === selectedEnvironment;
    
    return matchesSearch && matchesCategory && matchesEnvironment;
  });

  const handleToggleFlag = (flagId: string) => {
    setFlags(flags.map(flag => 
      flag.id === flagId 
        ? { ...flag, enabled: !flag.enabled, updatedAt: new Date().toISOString().split('T')[0] }
        : flag
    ));
  };

  const handleUpdateRollout = (flagId: string, percentage: number) => {
    setFlags(flags.map(flag => 
      flag.id === flagId 
        ? { ...flag, rolloutPercentage: percentage, updatedAt: new Date().toISOString().split('T')[0] }
        : flag
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature': return <Flag className="w-4 h-4 text-blue-500" />;
      case 'experiment': return <Percent className="w-4 h-4 text-purple-500" />;
      case 'killswitch': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'config': return <Settings className="w-4 h-4 text-green-500" />;
      default: return <Flag className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (category) {
      case 'feature':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>Feature</span>;
      case 'experiment':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}>Experiment</span>;
      case 'killswitch':
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>Killswitch</span>;
      case 'config':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>Config</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`}>Unknown</span>;
    }
  };

  const getEnvironmentBadge = (environment: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (environment) {
      case 'production':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>Production</span>;
      case 'staging':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>Staging</span>;
      case 'development':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>Development</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`}>Unknown</span>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {t('admin.featureFlags.title', 'Feature Flags')}
          </h2>
          <p className="text-foreground-secondary mt-1">
            {t('admin.featureFlags.subtitle', 'Manage feature rollouts and A/B testing')}
          </p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.featureFlags.createFlag', 'Create Flag')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary w-4 h-4" />
              <input
                type="text"
                placeholder={t('admin.featureFlags.searchPlaceholder', 'Search feature flags...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              <option value="all">{t('admin.featureFlags.allCategories', 'All Categories')}</option>
              <option value="feature">{t('admin.featureFlags.category.feature', 'Feature')}</option>
              <option value="experiment">{t('admin.featureFlags.category.experiment', 'Experiment')}</option>
              <option value="killswitch">{t('admin.featureFlags.category.killswitch', 'Killswitch')}</option>
              <option value="config">{t('admin.featureFlags.category.config', 'Config')}</option>
            </select>
            
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="input"
            >
              <option value="all">{t('admin.featureFlags.allEnvironments', 'All Environments')}</option>
              <option value="production">{t('admin.featureFlags.environment.production', 'Production')}</option>
              <option value="staging">{t('admin.featureFlags.environment.staging', 'Staging')}</option>
              <option value="development">{t('admin.featureFlags.environment.development', 'Development')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feature Flags List */}
      <div className="space-y-4">
        {filteredFlags.map((flag) => (
          <div key={flag.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {getCategoryIcon(flag.category)}
                  <h3 className="text-lg font-semibold text-foreground">
                    {flag.name}
                  </h3>
                  {getCategoryBadge(flag.category)}
                  {getEnvironmentBadge(flag.environment)}
                </div>
                
                <p className="text-foreground-secondary mb-3">
                  {flag.description}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-foreground-secondary">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{t('admin.featureFlags.updated', 'Updated')}: {flag.updatedAt}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{t('admin.featureFlags.createdBy', 'Created by')}: {flag.createdBy}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Rollout Percentage */}
                <div className="text-center">
                  <div className="text-sm text-foreground-secondary mb-1">
                    {t('admin.featureFlags.rollout', 'Rollout')}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={flag.rolloutPercentage}
                      onChange={(e) => handleUpdateRollout(flag.id, parseInt(e.target.value))}
                      className="w-20"
                      disabled={!flag.enabled}
                    />
                    <span className="text-sm font-medium text-foreground w-8">
                      {flag.rolloutPercentage}%
                    </span>
                  </div>
                </div>
                
                {/* Toggle Switch */}
                <div className="text-center">
                  <div className="text-sm text-foreground-secondary mb-1">
                    {t('admin.featureFlags.status', 'Status')}
                  </div>
                  <button
                    onClick={() => handleToggleFlag(flag.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      flag.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flag.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title={t('admin.featureFlags.edit', 'Edit flag')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title={t('admin.featureFlags.delete', 'Delete flag')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Target Users */}
            {flag.targetUsers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-foreground-secondary" />
                  <span className="text-sm text-foreground-secondary">
                    {t('admin.featureFlags.targetUsers', 'Target Users')}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {flag.targetUsers.map((user, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                      >
                        {user}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFlags.length === 0 && (
        <div className="card p-12 text-center">
          <Flag className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {t('admin.featureFlags.noFlags', 'No feature flags found')}
          </h3>
          <p className="text-foreground-secondary">
            {t('admin.featureFlags.noFlagsDescription', 'Try adjusting your search or filter criteria.')}
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {flags.length}
          </div>
          <div className="text-sm text-foreground-secondary">
            {t('admin.featureFlags.stats.total', 'Total Flags')}
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-500">
            {flags.filter(f => f.enabled).length}
          </div>
          <div className="text-sm text-foreground-secondary">
            {t('admin.featureFlags.stats.enabled', 'Enabled')}
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">
            {flags.filter(f => f.category === 'experiment').length}
          </div>
          <div className="text-sm text-foreground-secondary">
            {t('admin.featureFlags.stats.experiments', 'Experiments')}
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">
            {flags.filter(f => f.environment === 'production').length}
          </div>
          <div className="text-sm text-foreground-secondary">
            {t('admin.featureFlags.stats.production', 'Production')}
          </div>
        </div>
      </div>

      {/* Create Flag Modal (placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('admin.featureFlags.createFlag', 'Create Feature Flag')}
            </h3>
            <p className="text-foreground-secondary mb-4">
              {t('admin.featureFlags.createFlagDescription', 'Feature flag creation form would be implemented here.')}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-primary"
              >
                {t('common.create', 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};