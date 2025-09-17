import React from 'react';
import { 
  Filter, 
  Search, 
  Calendar, 
  Flag, 
  Tag, 
  CheckSquare,
  X
} from 'lucide-react';

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

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: '1', label: 'Low (P1)' },
  { value: '2', label: 'Medium (P2)' },
  { value: '3', label: 'High (P3)' },
  { value: '4', label: 'Urgent (P4)' }
];

const contextOptions = [
  { value: '', label: 'All Contexts' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' },
  { value: 'social', label: 'Social' }
];

const quadrantOptions = [
  { value: '', label: 'All Quadrants' },
  { value: 'do', label: 'Do First' },
  { value: 'decide', label: 'Schedule' },
  { value: 'delegate', label: 'Delegate' },
  { value: 'delete', label: 'Eliminate' }
];

const dateRangeOptions = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this_week', label: 'This Week' },
  { value: 'next_week', label: 'Next Week' },
  { value: 'overdue', label: 'Overdue' }
];

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  taskCounts
}) => {
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      priority: '',
      contextType: '',
      quadrant: '',
      dateRange: ''
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary w-4 h-4" />
        <input
          type="text"
          placeholder="Search tasks by title or description..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="input pl-10 w-full"
        />
        {filters.search && (
          <button
            onClick={() => handleFilterChange('search', '')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <CheckSquare className="w-4 h-4 text-foreground-secondary" />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input text-sm min-w-[120px]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <Flag className="w-4 h-4 text-foreground-secondary" />
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="input text-sm min-w-[120px]"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Context Filter */}
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-foreground-secondary" />
          <select
            value={filters.contextType}
            onChange={(e) => handleFilterChange('contextType', e.target.value)}
            className="input text-sm min-w-[120px]"
          >
            {contextOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quadrant Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-foreground-secondary" />
          <select
            value={filters.quadrant}
            onChange={(e) => handleFilterChange('quadrant', e.target.value)}
            className="input text-sm min-w-[120px]"
          >
            {quadrantOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-foreground-secondary" />
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="input text-sm min-w-[120px]"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="btn-outline text-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Task Counts Summary */}
      <div className="flex items-center space-x-6 text-sm text-foreground-secondary">
        <div className="flex items-center space-x-1">
          <span className="font-medium text-foreground">{taskCounts.total}</span>
          <span>Total</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-medium text-blue-600">{taskCounts.pending}</span>
          <span>Pending</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-medium text-green-600">{taskCounts.completed}</span>
          <span>Completed</span>
        </div>
        {taskCounts.overdue > 0 && (
          <div className="flex items-center space-x-1">
            <span className="font-medium text-red-600">{taskCounts.overdue}</span>
            <span>Overdue</span>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground-secondary">Active filters:</span>
          {filters.search && (
            <span className="badge-secondary text-xs">
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-1 hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="badge-secondary text-xs">
              Status: {statusOptions.find(o => o.value === filters.status)?.label}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="ml-1 hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.priority && (
            <span className="badge-secondary text-xs">
              Priority: {priorityOptions.find(o => o.value === filters.priority)?.label}
              <button
                onClick={() => handleFilterChange('priority', '')}
                className="ml-1 hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.contextType && (
            <span className="badge-secondary text-xs">
              Context: {contextOptions.find(o => o.value === filters.contextType)?.label}
              <button
                onClick={() => handleFilterChange('contextType', '')}
                className="ml-1 hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.quadrant && (
            <span className="badge-secondary text-xs">
              Quadrant: {quadrantOptions.find(o => o.value === filters.quadrant)?.label}
              <button
                onClick={() => handleFilterChange('quadrant', '')}
                className="ml-1 hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.dateRange && (
            <span className="badge-secondary text-xs">
              Date: {dateRangeOptions.find(o => o.value === filters.dateRange)?.label}
              <button
                onClick={() => handleFilterChange('dateRange', '')}
                className="ml-1 hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};