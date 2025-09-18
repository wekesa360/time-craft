import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle, 
  Clock, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Tag,
  AlertCircle
} from 'lucide-react';
import type { Task } from '../../../types';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  showQuadrant?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onEdit,
  onDelete,
  showQuadrant = false,
}) => {
  const { t } = useTranslation();

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4:
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 3:
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 2:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 1:
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'do':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'decide':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'delegate':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'delete':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isOverdue = task.due_date && task.due_date < Date.now() && task.status !== 'done';
  const isCompleted = task.status === 'done';

  return (
    <div className={`p-4 rounded-lg border border-border bg-background hover:shadow-sm transition-all duration-200 ${
      isCompleted ? 'opacity-75' : ''
    } ${isOverdue ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className={`font-medium text-foreground ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            {isOverdue && (
              <span title="Overdue">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Priority Badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              Priority {task.priority}
            </span>

            {/* Status Badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>

            {/* Quadrant Badge */}
            {showQuadrant && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuadrantColor(task.eisenhower_quadrant)}`}>
                {task.eisenhower_quadrant.replace('_', ' ')}
              </span>
            )}

            {/* Context Type */}
            {task.context_type && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                <Tag className="w-3 h-3 inline mr-1" />
                {task.context_type}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4 text-xs text-foreground-secondary">
            {/* Due Date */}
            {task.due_date && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Estimated Duration */}
            {task.estimated_duration && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{task.estimated_duration} min</span>
              </div>
            )}

            {/* Energy Level */}
            {task.energy_level_required && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Energy: {task.energy_level_required}/10</span>
              </div>
            )}

            {/* AI Priority Score */}
            {task.ai_priority_score && (
              <div className="flex items-center space-x-1">
                <span className="text-xs">AI Score: {task.ai_priority_score}</span>
              </div>
            )}
          </div>

          {/* Completion Date */}
          {task.completed_at && (
            <div className="mt-2 text-xs text-green-600">
              Completed: {new Date(task.completed_at).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 ml-4">
          {!isCompleted && (
            <button
              onClick={() => onComplete(task.id)}
              className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
              title="Complete task"
            >
              <CheckCircle className="w-4 h-4 text-green-600" />
            </button>
          )}
          
          <button
            onClick={() => onEdit(task)}
            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
            title="Edit task"
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </button>
          
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
};