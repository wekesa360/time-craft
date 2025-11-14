import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertCircle
} from 'lucide-react';
import type { Task } from '../../../types';

interface TaskCardProps {
  task: Task;
  onView?: (task: Task) => void;
  showQuadrant?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
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
    <div className={`p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-all duration-200 ${
      isCompleted ? 'opacity-75' : ''
    } ${isOverdue ? 'border-error bg-error-light' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium text-foreground text-sm ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            {isOverdue && (
              <AlertCircle className="w-3 h-3 text-error flex-shrink-0" />
            )}
          </div>
          
          {/* Priority indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`}></div>
            <span className="text-xs text-muted-foreground">
              {getPriorityText(task.priority)}
            </span>
          </div>
        </div>

        {/* View Details button */}
        {onView && (
          <button
            onClick={() => onView(task)}
            className="px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors flex-shrink-0"
          >
            View
          </button>
        )}
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-1">
          {task.description}
        </p>
      )}
    </div>
  );
};

export default TaskCard;