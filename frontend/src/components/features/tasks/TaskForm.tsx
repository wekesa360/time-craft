import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Clock, Tag } from 'lucide-react';
import type { Task, TaskForm as TaskFormType } from '../../../types';

interface TaskFormProps {
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
  contextType: z.enum(['work', 'personal', 'health', 'learning', 'social']).optional(),
  status: z.enum(['pending', 'done', 'archived']).optional(),
  matrixNotes: z.string().optional(),
  isDelegated: z.boolean().optional(),
  delegatedTo: z.string().optional(),
  delegationNotes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
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
    onSave(data);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-background rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-background px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">
                  {task ? 'Edit Task' : 'Create Task'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Task Title *
                  </label>
                  <p className="text-xs text-foreground-secondary mb-2">Give your task a clear, descriptive name</p>
                  <input
                    {...register('title')}
                    className="input w-full"
                    placeholder="e.g., Complete project proposal, Call dentist, Review quarterly reports"
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Task Description
                  </label>
                  <p className="text-xs text-foreground-secondary mb-2">Add details, notes, or context for this task</p>
                  <textarea
                    {...register('description')}
                    className="input w-full h-20 resize-none"
                    placeholder="e.g., Include specific requirements, deadlines, or any additional context that will help you complete this task..."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Priority Level
                  </label>
                  <p className="text-xs text-foreground-secondary mb-2">How important is this task compared to others?</p>
                  <select
                    {...register('priority', { valueAsNumber: true })}
                    className="input w-full"
                  >
                    <option value={1}>Low (1) - Can be done later</option>
                    <option value={2}>Medium (2) - Normal priority</option>
                    <option value={3}>High (3) - Important task</option>
                    <option value={4}>Urgent (4) - Critical, needs immediate attention</option>
                  </select>
                  {errors.priority && (
                    <p className="text-red-600 text-sm mt-1">{errors.priority.message}</p>
                  )}
                </div>

                {/* Eisenhower Matrix */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Eisenhower Matrix
                  </label>
                  <p className="text-xs text-foreground-secondary mb-3">Rate urgency and importance to automatically categorize your task</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-foreground-secondary mb-1">
                        Urgency (1-5)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={urgency}
                        onChange={(e) => setUrgency(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-foreground-secondary mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-foreground-secondary mb-1">
                        Importance (1-5)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={importance}
                        onChange={(e) => setImportance(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-foreground-secondary mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-background-secondary rounded text-sm">
                    <span className="font-medium">Quadrant: </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      currentQuadrant === 'do' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      currentQuadrant === 'decide' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      currentQuadrant === 'delegate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {currentQuadrant.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Due Date
                  </label>
                  <p className="text-xs text-foreground-secondary mb-2">When does this task need to be completed?</p>
                  <input
                    {...register('dueDate')}
                    type="date"
                    className="input w-full"
                  />
                  {errors.dueDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.dueDate.message}</p>
                  )}
                </div>

                {/* Estimated Duration */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Estimated Duration (minutes)
                  </label>
                  <input
                    {...register('estimatedDuration', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="1440"
                    className="input w-full"
                    placeholder="e.g., 30"
                  />
                  {errors.estimatedDuration && (
                    <p className="text-red-600 text-sm mt-1">{errors.estimatedDuration.message}</p>
                  )}
                </div>

                {/* Context Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Context Type
                  </label>
                  <select
                    {...register('contextType')}
                    className="input w-full"
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

                {/* Status */}
                {task && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="input w-full"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {errors.status && (
                      <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-background-secondary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-outline"
                >
                  Cancel
                </button>
                {task && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;