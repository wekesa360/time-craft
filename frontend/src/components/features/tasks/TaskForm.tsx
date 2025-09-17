import React, { useState, useEffect } from 'react';
import { Task, TaskForm as TaskFormData } from '../../../types';
import { 
  X, 
  Calendar, 
  Clock, 
  Flag, 
  Zap, 
  Tag,
  Save,
  Trash2
} from 'lucide-react';

interface TaskFormProps {
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  onDelete?: (id: string) => void;
  defaultQuadrant?: string;
}

const priorityOptions = [
  { value: 1, label: 'Low', color: 'text-gray-600' },
  { value: 2, label: 'Medium', color: 'text-blue-600' },
  { value: 3, label: 'High', color: 'text-orange-600' },
  { value: 4, label: 'Urgent', color: 'text-red-600' }
];

const contextOptions = [
  { value: 'work', label: 'Work', color: 'bg-blue-100 text-blue-800' },
  { value: 'personal', label: 'Personal', color: 'bg-green-100 text-green-800' },
  { value: 'health', label: 'Health', color: 'bg-pink-100 text-pink-800' },
  { value: 'learning', label: 'Learning', color: 'bg-purple-100 text-purple-800' },
  { value: 'social', label: 'Social', color: 'bg-yellow-100 text-yellow-800' }
];

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  defaultQuadrant
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 2,
    dueDate: '',
    estimatedDuration: undefined,
    contextType: 'work'
  });

  const [urgency, setUrgency] = useState(3);
  const [importance, setImportance] = useState(3);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
        estimatedDuration: task.estimatedDuration,
        contextType: task.contextType || 'work'
      });
      setUrgency(task.urgency);
      setImportance(task.importance);
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        priority: 2,
        dueDate: '',
        estimatedDuration: undefined,
        contextType: 'work'
      });
      setUrgency(3);
      setImportance(3);
    }
    setErrors({});
  }, [task, isOpen]);

  const calculateQuadrant = (urgency: number, importance: number): string => {
    if (urgency >= 4 && importance >= 4) return 'do';
    if (urgency < 4 && importance >= 4) return 'decide';
    if (urgency >= 4 && importance < 4) return 'delegate';
    return 'delete';
  };

  const currentQuadrant = calculateQuadrant(urgency, importance);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.estimatedDuration && formData.estimatedDuration < 1) {
      newErrors.estimatedDuration = 'Duration must be at least 1 minute';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const taskData: TaskFormData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).getTime().toString() : undefined
    };

    onSave(taskData);
  };

  const handleDelete = () => {
    if (task && onDelete && window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`input w-full ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter task title..."
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full h-24 resize-none"
              placeholder="Add task description..."
            />
          </div>

          {/* Priority and Context Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Flag className="w-4 h-4 inline mr-1" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) as any })}
                className="input w-full"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    P{option.value} - {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Context Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Context
              </label>
              <select
                value={formData.contextType}
                onChange={(e) => setFormData({ ...formData, contextType: e.target.value })}
                className="input w-full"
              >
                {contextOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date and Duration Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input w-full"
              />
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.estimatedDuration || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimatedDuration: e.target.value ? Number(e.target.value) : undefined 
                })}
                className={`input w-full ${errors.estimatedDuration ? 'border-red-500' : ''}`}
                placeholder="e.g., 30"
              />
              {errors.estimatedDuration && (
                <p className="text-red-500 text-sm mt-1">{errors.estimatedDuration}</p>
              )}
            </div>
          </div>

          {/* Eisenhower Matrix Sliders */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Eisenhower Matrix Classification</h3>
            
            {/* Urgency Slider */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Zap className="w-4 h-4 inline mr-1" />
                Urgency: {urgency}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={urgency}
                onChange={(e) => setUrgency(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-foreground-secondary mt-1">
                <span>Not Urgent</span>
                <span>Very Urgent</span>
              </div>
            </div>

            {/* Importance Slider */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Flag className="w-4 h-4 inline mr-1" />
                Importance: {importance}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-foreground-secondary mt-1">
                <span>Not Important</span>
                <span>Very Important</span>
              </div>
            </div>

            {/* Quadrant Preview */}
            <div className={`p-3 rounded-lg border-2 ${
              currentQuadrant === 'do' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' :
              currentQuadrant === 'decide' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' :
              currentQuadrant === 'delegate' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' :
              'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800'
            }`}>
              <p className="text-sm font-medium text-foreground">
                This task will be placed in: <span className="font-bold">{currentQuadrant.toUpperCase()}</span>
              </p>
              <p className="text-xs text-foreground-secondary mt-1">
                {currentQuadrant === 'do' && 'Do First - Urgent & Important'}
                {currentQuadrant === 'decide' && 'Schedule - Not Urgent but Important'}
                {currentQuadrant === 'delegate' && 'Delegate - Urgent but Not Important'}
                {currentQuadrant === 'delete' && 'Eliminate - Neither Urgent nor Important'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {task && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-outline text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Task
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                {task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};