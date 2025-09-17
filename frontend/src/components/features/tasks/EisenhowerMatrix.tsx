import React, { useState } from 'react';
import { Task } from '../../../types';
import { TaskCard } from './TaskCard';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  Trash2,
  Plus,
  Filter
} from 'lucide-react';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (id: string) => void;
  onCreateTask: (quadrant: string) => void;
}

const quadrantConfig = {
  do: {
    title: 'Do First',
    subtitle: 'Urgent & Important',
    description: 'Critical tasks that need immediate attention',
    icon: AlertTriangle,
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    headerColor: 'bg-red-100 dark:bg-red-900/30'
  },
  decide: {
    title: 'Schedule',
    subtitle: 'Not Urgent but Important',
    description: 'Important tasks to plan and schedule',
    icon: Clock,
    color: 'yellow',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    headerColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  delegate: {
    title: 'Delegate',
    subtitle: 'Urgent but Not Important',
    description: 'Tasks that can be delegated to others',
    icon: Users,
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    headerColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  delete: {
    title: 'Eliminate',
    subtitle: 'Neither Urgent nor Important',
    description: 'Tasks to eliminate or minimize',
    icon: Trash2,
    color: 'gray',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    headerColor: 'bg-gray-100 dark:bg-gray-900/30'
  }
};

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onCreateTask
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<string | null>(null);

  // Group tasks by quadrant
  const tasksByQuadrant = tasks.reduce((acc, task) => {
    if (!acc[task.quadrant]) {
      acc[task.quadrant] = [];
    }
    acc[task.quadrant].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, quadrant: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverQuadrant(quadrant);
  };

  const handleDragLeave = () => {
    setDragOverQuadrant(null);
  };

  const handleDrop = (e: React.DragEvent, quadrant: string) => {
    e.preventDefault();
    setDragOverQuadrant(null);
    
    if (draggedTask && draggedTask.quadrant !== quadrant) {
      // Update task quadrant - this would trigger an API call
      const updatedTask = { ...draggedTask, quadrant: quadrant as any };
      onTaskEdit(updatedTask);
    }
    
    setDraggedTask(null);
  };

  const renderQuadrant = (quadrantKey: string) => {
    const config = quadrantConfig[quadrantKey as keyof typeof quadrantConfig];
    const quadrantTasks = tasksByQuadrant[quadrantKey] || [];
    const Icon = config.icon;
    const isDragOver = dragOverQuadrant === quadrantKey;

    return (
      <div
        key={quadrantKey}
        className={`
          ${config.bgColor} ${config.borderColor} border-2 rounded-lg transition-all duration-200
          ${isDragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : ''}
        `}
        onDragOver={(e) => handleDragOver(e, quadrantKey)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, quadrantKey)}
      >
        {/* Quadrant Header */}
        <div className={`${config.headerColor} p-4 rounded-t-lg border-b ${config.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className={`w-5 h-5 text-${config.color}-600`} />
              <div>
                <h3 className="font-semibold text-foreground">{config.title}</h3>
                <p className="text-sm text-foreground-secondary">{config.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground-secondary">
                {quadrantTasks.length}
              </span>
              <button
                onClick={() => onCreateTask(quadrantKey)}
                className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors"
                title={`Add task to ${config.title}`}
              >
                <Plus className="w-4 h-4 text-foreground-secondary" />
              </button>
            </div>
          </div>
          <p className="text-xs text-foreground-secondary mt-1">{config.description}</p>
        </div>

        {/* Tasks List */}
        <div className="p-4 space-y-3 min-h-[200px]">
          {quadrantTasks.length === 0 ? (
            <div className="text-center py-8">
              <Icon className={`w-8 h-8 text-${config.color}-300 mx-auto mb-2`} />
              <p className="text-sm text-foreground-secondary">No tasks in this quadrant</p>
              <button
                onClick={() => onCreateTask(quadrantKey)}
                className="text-xs text-primary-600 hover:text-primary-700 mt-1"
              >
                Add your first task
              </button>
            </div>
          ) : (
            quadrantTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                className="cursor-move"
              >
                <TaskCard
                  task={task}
                  onComplete={onTaskComplete}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                  isDragging={draggedTask?.id === task.id}
                />
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Matrix Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Eisenhower Matrix</h2>
        <p className="text-foreground-secondary">
          Organize your tasks by urgency and importance. Drag tasks between quadrants to reprioritize.
        </p>
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(quadrantConfig).map(renderQuadrant)}
      </div>

      {/* Matrix Legend */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Matrix Guide</h3>
          <Filter className="w-4 h-4 text-foreground-secondary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {Object.entries(quadrantConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 text-${config.color}-600`} />
                <span className="text-foreground-secondary">{config.title}:</span>
                <span className="text-foreground">{config.subtitle}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};