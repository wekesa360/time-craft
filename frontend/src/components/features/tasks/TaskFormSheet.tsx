import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, Tag, Save } from 'lucide-react';
import Sheet from '../../ui/Sheet';
import type { Task, TaskForm as TaskFormType } from '../../../types';

interface TaskFormSheetProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskFormType) => void;
  onDelete?: (id: string) => void;
  defaultQuadrant?: string;
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  priority: z.number().min(1).max(4),
  urgency: z.number().min(1).max(4),
  importance: z.number().min(1).max(4),
  eisenhower_quadrant: z.enum(['do', 'decide', 'delegate', 'delete']).optional(),
  dueDate: z.number().optional(),
  estimatedDuration: z.number().min(1).max(1440).optional(),
  energyLevelRequired: z.number().min(1).max(10).optional(),
  contextType: z.enum(['work', 'personal', 'health', 'learning', 'social']).optional(),
  status: z.enum(['pending', 'done', 'archived']).optional(),
  matrixNotes: z.string().optional(),
  isDelegated: z.boolean().optional(),
  delegatedTo: z.string().optional(),
  delegationNotes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const TaskFormSheet: React.FC<TaskFormSheetProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  defaultQuadrant,
}) => {
  const { t } = useTranslation();
  const [urgency, setUrgency] = useState(3);
  const [importance, setImportance] = useState(3);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 2,
      contextType: 'personal',
      status: 'pending',
    },
  });

  const watchedPriority = watch('priority');

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.due_date || undefined,
        estimatedDuration: task.estimated_duration || undefined,
        contextType: (task.context_type as 'work' | 'personal' | 'health' | 'learning' | 'social') || 'personal',
        status: task.status,
      });
      setUrgency(task.urgency);
      setImportance(task.importance);
    } else {
      reset({
        title: '',
        description: '',
        priority: 2,
        contextType: 'personal',
        status: 'pending',
      });
      setUrgency(3);
      setImportance(3);
    }
  }, [task, reset]);

  const onSubmit = (data: TaskFormType) => {
    // Use defaultQuadrant if provided, otherwise calculate from urgency/importance
    let eisenhower_quadrant: 'do' | 'decide' | 'delegate' | 'delete';
    
    if (defaultQuadrant) {
      // Map quadrant names from EisenhowerMatrix to backend values
      const quadrantMap: Record<string, 'do' | 'decide' | 'delegate' | 'delete'> = {
        'do_first': 'do',
        'schedule': 'decide', 
        'delegate': 'delegate',
        'eliminate': 'delete'
      };
      eisenhower_quadrant = quadrantMap[defaultQuadrant] || getQuadrantFromMatrix(urgency, importance);
    } else {
      eisenhower_quadrant = getQuadrantFromMatrix(urgency, importance);
    }
    
    const formData = {
      ...data,
      urgency,
      importance,
      eisenhower_quadrant,
    };
    
    onSave(formData);
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
    }
  };

  const getQuadrantFromMatrix = (urgency: number, importance: number) => {
    if (urgency >= 4 && importance >= 4) return 'do';
    if (urgency < 4 && importance >= 4) return 'decide';
    if (urgency >= 4 && importance < 4) return 'delegate';
    return 'delete';
  };

  const currentQuadrant = getQuadrantFromMatrix(urgency, importance);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create Task'}
      className="p-6"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <input
            {...register('title')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter task title"
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <textarea
            {...register('description')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-20 resize-none"
            placeholder="Enter task description"
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Priority */}
        <div>
          <select
            {...register('priority', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value={1}>Low (1)</option>
            <option value={2}>Medium (2)</option>
            <option value={3}>High (3)</option>
            <option value={4}>Urgent (4)</option>
          </select>
          {errors.priority && (
            <p className="text-red-600 text-sm mt-1">{errors.priority.message}</p>
          )}
        </div>

        {/* Eisenhower Matrix */}
        <div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="range"
                min="1"
                max="5"
                value={urgency}
                onChange={(e) => setUrgency(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Low</span>
                <span className="font-medium">{urgency}</span>
                <span>High</span>
              </div>
            </div>
            <div>
              <input
                type="range"
                min="1"
                max="5"
                value={importance}
                onChange={(e) => setImportance(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Low</span>
                <span className="font-medium">{importance}</span>
                <span>High</span>
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quadrant: </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              currentQuadrant === 'do' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              currentQuadrant === 'decide' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              currentQuadrant === 'delegate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {currentQuadrant.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <input
            {...register('dueDate', { 
              setValueAs: (value) => value ? new Date(value).getTime() : undefined 
            })}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          {errors.dueDate && (
            <p className="text-red-600 text-sm mt-1">{errors.dueDate.message}</p>
          )}
        </div>

        {/* Estimated Duration */}
        <div>
          <input
            {...register('estimatedDuration', { valueAsNumber: true })}
            type="number"
            min="1"
            max="1440"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Estimated Duration (minutes)"
          />
          {errors.estimatedDuration && (
            <p className="text-red-600 text-sm mt-1">{errors.estimatedDuration.message}</p>
          )}
        </div>

        {/* Energy Level Required */}
        <div>
          <input
            {...register('energyLevelRequired', { valueAsNumber: true })}
            type="number"
            min="1"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Energy Level Required (1-10)"
          />
          {errors.energyLevelRequired && (
            <p className="text-red-600 text-sm mt-1">{errors.energyLevelRequired.message}</p>
          )}
        </div>

        {/* Context Type */}
        <div>
          <select
            {...register('contextType')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="health">Health</option>
            <option value="learning">Learning</option>
            <option value="social">Social</option>
          </select>
          {errors.contextType && (
            <p className="text-red-600 text-sm mt-1">{errors.contextType.message}</p>
          )}
        </div>

        {/* Status - only show for existing tasks */}
        {task && (
          <div>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="pending">Pending</option>
              <option value="done">Completed</option>
              <option value="archived">Archived</option>
            </select>
            {errors.status && (
              <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          {task && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </Sheet>
  );
};

export default TaskFormSheet;
