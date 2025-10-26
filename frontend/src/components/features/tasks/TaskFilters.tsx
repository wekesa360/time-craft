import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface TaskFiltersProps {
  filters: {
    status?: string;
    priority?: number;
    contextType?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClose?: () => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose,
}) => {
  const { t } = useTranslation();

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: undefined,
      priority: undefined,
      contextType: undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== undefined && filter !== '');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Filter Tasks</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="done">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Priority
          </label>
          <select
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
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
          <label className="block text-sm font-medium text-foreground mb-2">
            Context
          </label>
          <select
            value={filters.contextType || ''}
            onChange={(e) => handleFilterChange('contextType', e.target.value || undefined)}
            className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="">All Contexts</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="health">Health</option>
            <option value="learning">Learning</option>
            <option value="social">Social</option>
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export { TaskFilters };