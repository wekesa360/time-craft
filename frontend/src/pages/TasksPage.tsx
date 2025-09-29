import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Grid3X3, 
  List, 
  BarChart3
} from 'lucide-react';

// Components
import EisenhowerMatrix from '../components/features/tasks/EisenhowerMatrix';
import { TaskCard } from '../components/features/tasks/TaskCard';
import TaskFormSheet from '../components/features/tasks/TaskFormSheet';
import { TaskListSkeleton } from '../components/skeletons/TaskListSkeleton';

// Hooks and API
import { useTaskQueries } from '../hooks/queries/useTaskQueries';
import type { Task, TaskForm as TaskFormData } from '../types';

type ViewMode = 'matrix' | 'list' | 'stats';

export default function TasksPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultQuadrant, setDefaultQuadrant] = useState<string>('');
  // Queries
  const {
    useTasksQuery,
    useTaskStatsQuery,
    useEisenhowerMatrixQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useCompleteTaskMutation,
    useDeleteTaskMutation
  } = useTaskQueries();

  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery({});
  const { data: taskStats } = useTaskStatsQuery();
  const { data: matrixData, isLoading: matrixLoading, error: matrixError } = useEisenhowerMatrixQuery();

  // Mutations
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const completeTaskMutation = useCompleteTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  // Handlers
  const handleCreateTask = (quadrant?: string) => {
    setDefaultQuadrant(quadrant || '');
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultQuadrant('');
    setIsTaskFormOpen(true);
  };

  const handleSaveTask = async (formData: TaskFormData) => {
    try {
      if (editingTask) {
        await updateTaskMutation.mutateAsync({
          id: editingTask.id,
          data: formData
        });
        toast.success('Task updated successfully');
      } else {
        await createTaskMutation.mutateAsync(formData);
        toast.success('Task created successfully');
      }
      setIsTaskFormOpen(false);
      setEditingTask(null);
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await completeTaskMutation.mutateAsync(id);
      toast.success('Task completed!');
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTaskMutation.mutateAsync(id);
      toast.success('Task deleted');
      setIsTaskFormOpen(false);
      setEditingTask(null);
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.due_date && t.due_date < Date.now() && t.status !== 'done').length
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('navigation.tasks')}
          </h1>
          <p className="text-foreground-secondary mt-1">
            Organize and prioritize your tasks using the Eisenhower Matrix
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('matrix')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'matrix' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="Matrix View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'stats' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="Statistics View"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <button 
            onClick={() => handleCreateTask()}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 active:scale-95"
          >
            <span>Create Task</span>
          </button>
          
        </div>
      </div>


      {/* Content based on view mode */}
      {tasksLoading ? (
        <TaskListSkeleton />
      ) : (
        <>
          {viewMode === 'matrix' && (
            <EisenhowerMatrix
              tasks={tasks}
              onTaskComplete={handleCompleteTask}
              onTaskEdit={handleEditTask}
              onTaskDelete={handleDeleteTask}
              onCreateTask={handleCreateTask}
            />
          )}

          {viewMode === 'list' && (
            <div className="card p-6">
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
                    <p className="text-foreground-secondary">
                      Get started by creating your first task
                    </p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Task Statistics */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Task Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Total Tasks</span>
                <span className="font-medium text-foreground">{taskStats?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Completed</span>
                <span className="font-medium text-green-600">{taskStats?.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Pending</span>
                <span className="font-medium text-blue-600">{taskStats?.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Overdue</span>
                <span className="font-medium text-red-600">{taskStats?.overdue || 0}</span>
              </div>
            </div>
          </div>

          {/* Matrix Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Matrix Distribution</h3>
            {matrixLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : matrixError ? (
              <div className="text-center py-8 text-red-600">
                <p>Failed to load matrix data</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Do First</span>
                  <span className="font-medium text-red-600">{matrixData?.stats?.do || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Schedule</span>
                  <span className="font-medium text-yellow-600">{matrixData?.stats?.decide || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Delegate</span>
                  <span className="font-medium text-blue-600">{matrixData?.stats?.delegate || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Eliminate</span>
                  <span className="font-medium text-gray-600">{matrixData?.stats?.delete || 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Productivity Insights */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Insights</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200">
                  Focus on completing "Do First" tasks to reduce stress
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  Schedule time for "Decide" tasks to prevent them from becoming urgent
                </p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">
                  Consider eliminating tasks in the "Delete" quadrant
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Form Sheet */}
      <TaskFormSheet
        task={editingTask}
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
          setDefaultQuadrant('');
        }}
        onSave={(data) => handleSaveTask(data as TaskFormData)}
        onDelete={handleDeleteTask}
        defaultQuadrant={defaultQuadrant}
      />
    </div>
  );
}