import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Grid3X3, 
  List, 
  BarChart3,
  Download
} from 'lucide-react';

// Components
import EisenhowerMatrix from '../components/features/tasks/EisenhowerMatrix';
import { TaskCard } from '../components/features/tasks/TaskCard';
import TaskForm from '../components/features/tasks/TaskForm';
import TaskFilters from '../components/features/tasks/TaskFilters';
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
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    contextType: '',
    quadrant: '',
    dateRange: ''
  });

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

  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery({
    ...filters,
    priority: filters.priority ? parseInt(filters.priority) : undefined
  });
  const { data: taskStats } = useTaskStatsQuery();
  const { data: matrixData } = useEisenhowerMatrixQuery();

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

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !task.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority.toString() !== filters.priority) return false;
    if (filters.contextType && task.context_type !== filters.contextType) return false;
    if (filters.quadrant && task.eisenhower_quadrant !== filters.quadrant) return false;
    
    // Date range filtering
    if (filters.dateRange) {
      const now = Date.now();
      const today = new Date(now).setHours(0, 0, 0, 0);
      const tomorrow = today + 24 * 60 * 60 * 1000;
      const weekStart = today - new Date(today).getDay() * 24 * 60 * 60 * 1000;
      const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
      const nextWeekEnd = weekEnd + 7 * 24 * 60 * 60 * 1000;

      switch (filters.dateRange) {
        case 'today':
          if (!task.due_date || task.due_date < today || task.due_date >= tomorrow) return false;
          break;
        case 'tomorrow':
          if (!task.due_date || task.due_date < tomorrow || task.due_date >= tomorrow + 24 * 60 * 60 * 1000) return false;
          break;
        case 'this_week':
          if (!task.due_date || task.due_date < weekStart || task.due_date >= weekEnd) return false;
          break;
        case 'next_week':
          if (!task.due_date || task.due_date < weekEnd || task.due_date >= nextWeekEnd) return false;
          break;
        case 'overdue':
          if (!task.due_date || task.due_date >= now || task.status === 'done') return false;
          break;
      }
    }
    
    return true;
  });

  const taskCounts = {
    total: filteredTasks.length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    completed: filteredTasks.filter(t => t.status === 'done').length,
    overdue: filteredTasks.filter(t => t.due_date && t.due_date < Date.now() && t.status !== 'done').length
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
          <button className="btn-outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <button 
            onClick={() => handleCreateTask()}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          taskCounts={taskCounts}
        />
      </div>

      {/* Content based on view mode */}
      {tasksLoading ? (
        <TaskListSkeleton />
      ) : (
        <>
          {viewMode === 'matrix' && (
            <EisenhowerMatrix
              tasks={filteredTasks}
              onTaskComplete={handleCompleteTask}
              onTaskEdit={handleEditTask}
              onTaskDelete={handleDeleteTask}
              onCreateTask={handleCreateTask}
            />
          )}

          {viewMode === 'list' && (
            <div className="card p-6">
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <List className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
                    <p className="text-foreground-secondary mb-4">
                      {Object.values(filters).some(f => f) 
                        ? 'Try adjusting your filters or create a new task'
                        : 'Get started by creating your first task'
                      }
                    </p>
                    <button 
                      onClick={() => handleCreateTask()}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </button>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
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
          {matrixData && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Matrix Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Do First</span>
                  <span className="font-medium text-red-600">{matrixData.stats.do}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Schedule</span>
                  <span className="font-medium text-yellow-600">{matrixData.stats.decide}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Delegate</span>
                  <span className="font-medium text-blue-600">{matrixData.stats.delegate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Eliminate</span>
                  <span className="font-medium text-gray-600">{matrixData.stats.delete}</span>
                </div>
              </div>
            </div>
          )}

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

      {/* Task Form Modal */}
      <TaskForm
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