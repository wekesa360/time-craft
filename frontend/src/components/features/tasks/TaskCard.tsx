import React from 'react';
import { Task } from '../../../types';
import { 
  Clock, 
  Calendar, 
  Flag, 
  MoreHorizontal,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

const priorityColors = {
  1: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  2: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
  3: 'text-orange-600 bg-orange-100 dark:bg-orange-900',
  4: 'text-red-600 bg-red-100 dark:bg-red-900'
};

const contextColors = {
  work: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  personal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  health: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  learning: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  social: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onEdit,
  onDelete,
  isDragging = false
}) => {
  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== 'completed';
  const isCompleted = task.status === 'completed';

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(task.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };

  return (
    <div 
      className={`
        card p-4 cursor-pointer transition-all duration-200 hover:shadow-md
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        ${isCompleted ? 'opacity-75' : ''}
        ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
      `}
      onClick={handleEdit}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Completion Toggle */}
          <button
            onClick={handleComplete}
            className="mt-1 text-gray-400 hover:text-primary-600 transition-colors"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-foreground ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Task Metadata */}
            <div className="flex items-center space-x-4 mt-3">
              {/* Priority */}
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                <Flag className="w-3 h-3 mr-1" />
                P{task.priority}
              </div>

              {/* Context Type */}
              {task.contextType && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${contextColors[task.contextType]}`}>
                  {task.contextType}
                </span>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600' : 'text-foreground-secondary'}`}>
                  {isOverdue && <AlertCircle className="w-3 h-3 mr-1" />}
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                </div>
              )}

              {/* Estimated Duration */}
              {task.estimatedDuration && (
                <div className="flex items-center text-xs text-foreground-secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {task.estimatedDuration}m
                </div>
              )}
            </div>

            {/* Eisenhower Matrix Info */}
            <div className="flex items-center space-x-2 mt-2">
              <div className="text-xs text-foreground-secondary">
                Urgency: {task.urgency}/5 • Importance: {task.importance}/5
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                task.quadrant === 'do' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                task.quadrant === 'decide' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                task.quadrant === 'delegate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}>
                {task.quadrant.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <button className="text-gray-400 hover:text-foreground-secondary p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};