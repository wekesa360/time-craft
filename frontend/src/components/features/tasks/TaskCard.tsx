import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertCircle
} from 'lucide-react';
import type { Task } from '../../../types';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onView?: (task: Task) => void;
  showQuadrant?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onEdit,
  onDelete,
  onView,
  showQuadrant = false,
}) => {
  const { t } = useTranslation();

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4:
        return 'bg-error';
      case 3:
        return 'bg-warning';
      case 2:
        return 'bg-warning';
      case 1:
        return 'bg-success';
      default:
        return 'bg-muted';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 4:
        return 'Urgent';
      case 3:
        return 'High';
      case 2:
        return 'Medium';
      case 1:
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  const isCompleted = task.status === 'done' || task.status === 'completed';
  const isOverdue = task.due_date && task.due_date < Date.now() && !isCompleted;

  return (
    <div className={`p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all duration-200 ${
      isCompleted ? 'opacity-75' : ''
    } ${isOverdue ? 'border-error bg-error-light' : ''}`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-foreground text-lg ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            {isOverdue && (
              <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
            )}
          </div>
          
          {/* Priority indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
            <span className="text-sm text-muted-foreground">
              {getPriorityText(task.priority)} Priority
            </span>
          </div>
        </div>
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <button
              onClick={() => onComplete(task.id)}
              className="px-3 py-1 text-sm font-medium text-success hover:bg-success-light rounded-lg transition-colors"
            >
              Complete
            </button>
          )}
          
          <button
            onClick={() => onEdit(task)}
            className="px-3 py-1 text-sm font-medium text-info hover:bg-info-light rounded-lg transition-colors"
          >
            Edit
          </button>
          
          <button
            onClick={() => onDelete(task.id)}
            className="px-3 py-1 text-sm font-medium text-error hover:bg-error-light rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>

        {/* View button */}
        {onView && (
          <button
            onClick={() => onView(task)}
            className="px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;