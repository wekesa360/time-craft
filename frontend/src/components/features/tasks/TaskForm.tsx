import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Clock, Tag, User } from 'lucide-react';
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
  description: z.string().max(1000).optional(),
  priority: z.number().min(1).max(4),
  dueDate: z.string().optional().transform(val => val ? new Date(val).getTime() : undefined),
  estimatedDuration: z.number().min(1).optional(),
  energyLevelRequired: z.number().min(1).max(10).optional(),
  contextType: z.string().max(50).optional(),
  status: z.enum(['pending', 'done', 'archived']).optional(),
  // Eisenhower Matrix fields
  urgency: z.number().min(1).max(4).optional(),
  importance: z.number().min(1).max(4).optional(),
  matrixNotes: z.string().max(500).optional(),
  isDelegated: z.boolean().default(false),
  delegatedTo: z.string().max(100).optional(),
  delegationNotes: z.string().max(500).optional(),
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
      priority: 1,
      contextType: '',
      isDelegated: false,
    },
  });

  const watchedPriority = watch('priority');

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        estimatedDuration: task.estimated_duration || undefined,
        energyLevelRequired: task.energy_level_required || undefined,
        contextType: task.context_type || '',
        status: task.status,
        matrixNotes: task.matrix_notes || '',
        isDelegated: task.is_delegated || false,
        delegatedTo: task.delegated_to || '',
        delegationNotes: task.delegation_notes || '',
      });
      setUrgency(task.urgency || 3);
      setImportance(task.importance || 3);
    } else {
      reset({
        title: '',
        description: '',
        priority: 1,
        dueDate: '',
        estimatedDuration: undefined,
        energyLevelRequired: undefined,
        contextType: '',
        status: 'pending',
        matrixNotes: '',
        isDelegated: false,
        delegatedTo: '',
        delegationNotes: '',
      });
      setUrgency(3);
      setImportance(3);
    }
  }, [task, reset]);

  const onSubmit = (data: TaskFormData) => {
    const formData: TaskFormType = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      urgency,
      importance,
      dueDate: data.dueDate,
      estimatedDuration: data.estimatedDuration,
      energyLevelRequired: data.energyLevelRequired,
      contextType: data.contextType,
      status: data.status,
      matrixNotes: data.matrixNotes,
      isDelegated: data.isDelegated,
      delegatedTo: data.delegatedTo,
      delegationNotes: data.delegationNotes,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-foreground">
                  {task ? 'Edit Task' : 'Create Task'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
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
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., Complete project proposal, Call dentist, Review quarterly reports"
                  />
                  {errors.title && (
                    <p className="text-error text-sm mt-1">{errors.title.message}</p>
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
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground h-20 resize-none"
                    placeholder="e.g., Include specific requirements, deadlines, or any additional context that will help you complete this task..."
                  />
                  {errors.description && (
                    <p className="text-error text-sm mt-1">{errors.description.message}</p>
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
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value={1}>Low (1) - Can be done later</option>
                    <option value={2}>Medium (2) - Normal priority</option>
                    <option value={3}>High (3) - Important task</option>
                    <option value={4}>Urgent (4) - Critical, needs immediate attention</option>
                  </select>
                  {errors.priority && (
                    <p className="text-error text-sm mt-1">{errors.priority.message}</p>
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
                        Urgency (1-4)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={urgency}
                        onChange={(e) => setUrgency(parseInt(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-foreground-secondary mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-foreground-secondary mb-1">
                        Importance (1-4)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={importance}
                        onChange={(e) => setImportance(parseInt(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-foreground-secondary mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                    <span className="font-medium">Quadrant: </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      currentQuadrant === 'do' ? 'bg-error-light text-error dark:bg-error dark:text-error-light' :
                      currentQuadrant === 'decide' ? 'bg-warning-light text-warning dark:bg-warning dark:text-warning-light' :
                      currentQuadrant === 'delegate' ? 'bg-info-light text-info dark:bg-info dark:text-info-light' :
                      'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'
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
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                  {errors.dueDate && (
                    <p className="text-error text-sm mt-1">{errors.dueDate.message}</p>
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
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., 30"
                  />
                  {errors.estimatedDuration && (
                    <p className="text-error text-sm mt-1">{errors.estimatedDuration.message}</p>
                  )}
                </div>

                {/* Context Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Context Type
                  </label>
                  <p className="text-xs text-foreground-secondary mb-2">e.g., work, personal, health, learning</p>
                  <input
                    {...register('contextType')}
                    type="text"
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., work"
                    maxLength={50}
                  />
                  {errors.contextType && (
                    <p className="text-error text-sm mt-1">{errors.contextType.message}</p>
                  )}
                </div>

                {/* Energy Level Required */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Energy Level Required (1-10)
                  </label>
                  <p className="text-xs text-foreground-secondary mb-2">How much energy does this task require?</p>
                  <input
                    {...register('energyLevelRequired', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="10"
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., 7"
                  />
                  {errors.energyLevelRequired && (
                    <p className="text-error text-sm mt-1">{errors.energyLevelRequired.message}</p>
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
                      className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {errors.status && (
                      <p className="text-error text-sm mt-1">{errors.status.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                {task && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-6 py-3 bg-error text-error-foreground rounded-xl font-medium hover:bg-error/90 transition-colors ml-auto"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;