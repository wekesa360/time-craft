import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X } from 'lucide-react';

interface TaskFiltersProps {
  filters: {
    search: string;
    status: string;
    priority: string;
    contextType: string;
    quadrant: string;
    dateRange: string;
  };
  onFiltersChange: (filters: any) => void;
  taskCounts: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
  };
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  taskCounts,
}) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      priority: '',
      contextType: '',
      quadrant: '',
      dateRange: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  return (
    <div className="space-y-4">
      {/* Search and Basic Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        {/* Quick Status Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('status', filters.status === 'pending' ? '' : 'pending')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-background-secondary text-foreground-secondary hover:bg-background-tertiary'
            }`}
          >
            Pending ({taskCounts.pending})
          </button>
          <button
            onClick={() => handleFilterChange('status', filters.status === 'completed' ? '' : 'completed')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.status === 'completed'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-background-secondary text-foreground-secondary hover:bg-background-tertiary'
            }`}
          >
            Completed ({taskCounts.completed})
          </button>
          <button
            onClick={() => handleFilterChange('dateRange', filters.dateRange === 'overdue' ? '' : 'overdue')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.dateRange === 'overdue'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-background-secondary text-foreground-secondary hover:bg-background-tertiary'
            }`}
          >
            Overdue ({taskCounts.overdue})
          </button>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-outline flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Advanced</span>
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn-ghost flex items-center space-x-2 text-foreground-secondary hover:text-foreground"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-background-secondary rounded-lg">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input w-full"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="input w-full"
            >
              <option value="">All Priorities</option>
              <option value="1">Low (1)</option>
              <option value="2">Medium (2)</option>
              <option value="3">High (3)</option>
              <option value="4">Urgent (4)</option>
            </select>
          </div>

          {/* Context Type Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Context
            </label>
            <select
              value={filters.contextType}
              onChange={(e) => handleFilterChange('contextType', e.target.value)}
              className="input w-full"
            >
              <option value="">All Contexts</option>
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
              <option value="social">Social</option>
            </select>
          </div>

          {/* Quadrant Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Quadrant
            </label>
            <select
              value={filters.quadrant}
              onChange={(e) => handleFilterChange('quadrant', e.target.value)}
              className="input w-full"
            >
              <option value="">All Quadrants</option>
              <option value="do">Do First</option>
              <option value="decide">Schedule</option>
              <option value="delegate">Delegate</option>
              <option value="delete">Eliminate</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Date Range
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                onClick={() => handleFilterChange('dateRange', filters.dateRange === 'today' ? '' : 'today')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filters.dateRange === 'today'
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'bg-background text-foreground-secondary hover:bg-background-tertiary'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleFilterChange('dateRange', filters.dateRange === 'tomorrow' ? '' : 'tomorrow')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filters.dateRange === 'tomorrow'
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'bg-background text-foreground-secondary hover:bg-background-tertiary'
                }`}
              >
                Tomorrow
              </button>
              <button
                onClick={() => handleFilterChange('dateRange', filters.dateRange === 'this_week' ? '' : 'this_week')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filters.dateRange === 'this_week'
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'bg-background text-foreground-secondary hover:bg-background-tertiary'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => handleFilterChange('dateRange', filters.dateRange === 'next_week' ? '' : 'next_week')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filters.dateRange === 'next_week'
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'bg-background text-foreground-secondary hover:bg-background-tertiary'
                }`}
              >
                Next Week
              </button>
              <button
                onClick={() => handleFilterChange('dateRange', filters.dateRange === 'overdue' ? '' : 'overdue')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filters.dateRange === 'overdue'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-background text-foreground-secondary hover:bg-background-tertiary'
                }`}
              >
                Overdue
              </button>
              <button
                onClick={() => handleFilterChange('dateRange', '')}
                className="px-3 py-2 rounded text-sm font-medium bg-background text-foreground-secondary hover:bg-background-tertiary transition-colors"
              >
                All Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-foreground-secondary">Active filters:</span>
          {filters.search && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs">
              Search: "{filters.search}"
            </span>
          )}
          {filters.status && (
            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">
              Status: {filters.status}
            </span>
          )}
          {filters.priority && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded text-xs">
              Priority: {filters.priority}
            </span>
          )}
          {filters.contextType && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded text-xs">
              Context: {filters.contextType}
            </span>
          )}
          {filters.quadrant && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs">
              Quadrant: {filters.quadrant}
            </span>
          )}
          {filters.dateRange && (
            <span className="px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 rounded text-xs">
              Date: {filters.dateRange.replace('_', ' ')}
            </span>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-foreground-secondary">
        Showing {taskCounts.total} task{taskCounts.total !== 1 ? 's' : ''}
        {hasActiveFilters && ' (filtered)'}
      </div>
    </div>
  );
};

export default TaskFilters;