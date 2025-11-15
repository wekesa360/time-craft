import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Plus, Clock, Flag, CalendarIcon, X, MoreHorizontal } from "lucide-react";
import { TaskCard } from '../components/features/tasks/TaskCard';
import TaskForm from '../components/features/tasks/TaskForm';
import { TaskListSkeleton } from '../components/skeletons/TaskListSkeleton';
import { useTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useCompleteTaskMutation, useTaskStatsQuery, useEisenhowerMatrixQuery } from '../hooks/queries/useTaskQueries';
import { useTaskStore } from '../stores/tasks';
import type { Task, TaskForm as TaskFormType, TasksResponse } from '../types';

export default function TasksPage() {
  const { t } = useTranslation();
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    high: false,
    medium: false,
    low: false
  });

  // Fetch tasks
  const { data: tasksData, isLoading, error } = useTasksQuery({
    limit: 50,
    offset: 0
  });
  
  // Extract tasks array and pagination info
  const tasksResponse = tasksData as TasksResponse | undefined;
  const tasks = tasksResponse?.tasks || [];
  const hasMore = tasksResponse?.hasMore || false;
  const totalTasks = tasksResponse?.total || tasks.length;

  // Log fetched tasks
  useEffect(() => {
    if (tasks.length > 0) {
      console.log('📋 TasksPage: Loaded', tasks.length, 'tasks from backend');
      console.log('Tasks breakdown:', {
        high: tasks.filter(t => t.priority === 4).length,
        medium: tasks.filter(t => t.priority === 3).length,
        low: tasks.filter(t => t.priority <= 2).length,
        completed: tasks.filter(t => t.status === 'done').length,
      });
    }
  }, [tasks]);

  // Mutations
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();
  const completeTaskMutation = useCompleteTaskMutation();
  
  // Stats and Matrix queries
  const { data: taskStats } = useTaskStatsQuery();
  const { data: eisenhowerMatrix } = useEisenhowerMatrixQuery();

  // Group tasks by priority
  const groupedTasks = useMemo(() => {
    const grouped = {
      high: [] as Task[],
      medium: [] as Task[],
      low: [] as Task[],
      completed: [] as Task[]
    };

    tasks.forEach(task => {
      if (task.status === 'done') {
        grouped.completed.push(task);
      } else {
        switch (task.priority) {
          case 4:
            grouped.high.push(task);
            break;
          case 3:
            grouped.medium.push(task);
            break;
          case 2:
          case 1:
            grouped.low.push(task);
            break;
        }
      }
    });

    return grouped;
  }, [tasks]);


  const handleCreateTask = async (data: TaskFormType) => {
    try {
      console.log('📝 Creating task:', data);
      await createTaskMutation.mutateAsync(data);
      console.log('✅ Task created successfully');
      setShowAddTask(false);
    } catch (error) {
      console.error('❌ Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (data: TaskFormType) => {
    if (!editingTask) return;
    
    try {
      console.log('✏️ Updating task:', editingTask.id, data);
      await updateTaskMutation.mutateAsync({ id: editingTask.id, data });
      console.log('✅ Task updated successfully');
      setEditingTask(null);
    } catch (error) {
      console.error('❌ Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      console.log('🗑️ Deleting task:', id);
      await deleteTaskMutation.mutateAsync(id);
      console.log('✅ Task deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete task:', error);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      console.log('✓ Completing task:', id);
      await completeTaskMutation.mutateAsync(id);
      console.log('✅ Task completed successfully');
    } catch (error) {
      console.error('❌ Failed to complete task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 4: return 'Urgent';
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return 'Unknown';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'text-error-light0';
      case 3: return 'text-primary';
      case 2: return 'text-warning';
      case 1: return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Tasks</h2>
          <p className="text-muted-foreground">Failed to load tasks. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your tasks with AI-powered prioritization</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Task Stats */}
      {taskStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="text-sm text-muted-foreground">Total Tasks</div>
            <div className="text-2xl font-bold text-foreground mt-1">{taskStats.total}</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-success mt-1">{taskStats.completed}</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-warning mt-1">{taskStats.pending}</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="text-sm text-muted-foreground">Overdue</div>
            <div className="text-2xl font-bold text-error-light0 mt-1">{taskStats.overdue}</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <TaskListSkeleton />}

      {/* Task Lists */}
      {!isLoading && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* High Priority */}
          {(
            <div className="bg-card rounded-2xl p-6 border border-border h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  High Priority
                </h2>
                <span className="text-sm text-muted-foreground">{groupedTasks.high.length} tasks</span>
              </div>

              <div className="space-y-2 min-h-[300px]">
                {groupedTasks.high.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No high priority tasks
                  </div>
                ) : (
                  <>
                    {(expandedSections.high ? groupedTasks.high : groupedTasks.high.slice(0, 4)).map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onView={handleViewTask}
                      />
                    ))}
                    {groupedTasks.high.length > 4 && (
                      <button
                        onClick={() => setExpandedSections(prev => ({ ...prev, high: !prev.high }))}
                        className="w-full py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        {expandedSections.high ? 'View Less' : `View More (${groupedTasks.high.length - 4} more)`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Medium Priority */}
          {(
            <div className="bg-card rounded-2xl p-6 border border-border h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Medium Priority
                </h2>
                <span className="text-sm text-muted-foreground">{groupedTasks.medium.length} tasks</span>
              </div>

              <div className="space-y-2 min-h-[300px]">
                {groupedTasks.medium.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No medium priority tasks
                  </div>
                ) : (
                  <>
                    {(expandedSections.medium ? groupedTasks.medium : groupedTasks.medium.slice(0, 4)).map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onView={handleViewTask}
                      />
                    ))}
                    {groupedTasks.medium.length > 4 && (
                      <button
                        onClick={() => setExpandedSections(prev => ({ ...prev, medium: !prev.medium }))}
                        className="w-full py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        {expandedSections.medium ? 'View Less' : `View More (${groupedTasks.medium.length - 4} more)`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Low Priority */}
          {(
            <div className="bg-card rounded-2xl p-6 border border-border h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Low Priority
                </h2>
                <span className="text-sm text-muted-foreground">{groupedTasks.low.length} tasks</span>
              </div>

              <div className="space-y-2 min-h-[300px]">
                {groupedTasks.low.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No low priority tasks
                  </div>
                ) : (
                  <>
                    {(expandedSections.low ? groupedTasks.low : groupedTasks.low.slice(0, 4)).map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onView={handleViewTask}
                      />
                    ))}
                    {groupedTasks.low.length > 4 && (
                      <button
                        onClick={() => setExpandedSections(prev => ({ ...prev, low: !prev.low }))}
                        className="w-full py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        {expandedSections.low ? 'View Less' : `View More (${groupedTasks.low.length - 4} more)`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

      {/* Completed Tasks */}
      {groupedTasks.completed.length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border col-span-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Completed Today</h2>
            <span className="text-sm text-primary font-medium">{groupedTasks.completed.length} tasks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {groupedTasks.completed.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-primary/10">
                <div className="w-4 h-4 rounded bg-primary flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-through opacity-70 truncate">{task.title}</p>
                  {task.completed_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.completed_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Flag className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No tasks yet</h2>
          <p className="text-muted-foreground mb-6">Get started by creating your first task</p>
          <button
            onClick={() => setShowAddTask(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Task
          </button>
        </div>
      )}

      {/* Add Task Modal */}
      <TaskForm
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSave={handleCreateTask}
      />

      {/* Edit Task Modal */}
      <TaskForm
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleUpdateTask}
        onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : undefined}
      />

      {/* View Task Modal */}
      {viewingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Task Details</h2>
                <button
                  onClick={() => setViewingTask(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{viewingTask.title}</h3>
                  {viewingTask.description && (
                    <p className="text-muted-foreground">{viewingTask.description}</p>
                  )}
                </div>

                {/* Priority and Status */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      viewingTask.priority === 4 ? 'bg-red-500' :
                      viewingTask.priority === 3 ? 'bg-yellow-500' :
                      viewingTask.priority === 2 ? 'bg-green-500' :
                      'bg-blue-500'
                    }`}></div>
                    <span className="text-sm font-medium text-foreground">
                      {getPriorityLabel(viewingTask.priority)} Priority
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    viewingTask.status === 'done' ? 'bg-green-100 text-green-700' :
                    viewingTask.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {viewingTask.status.charAt(0).toUpperCase() + viewingTask.status.slice(1)}
                  </span>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {viewingTask.due_date && (
                    <div>
                      <span className="font-medium text-foreground">Due Date:</span>
                      <p className="text-muted-foreground">{new Date(viewingTask.due_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {viewingTask.estimated_duration && (
                    <div>
                      <span className="font-medium text-foreground">Duration:</span>
                      <p className="text-muted-foreground">{viewingTask.estimated_duration} minutes</p>
                    </div>
                  )}
                  {viewingTask.context_type && (
                    <div>
                      <span className="font-medium text-foreground">Context:</span>
                      <p className="text-muted-foreground">{viewingTask.context_type}</p>
                    </div>
                  )}
                  {viewingTask.energy_level_required && (
                    <div>
                      <span className="font-medium text-foreground">Energy Level:</span>
                      <p className="text-muted-foreground">{viewingTask.energy_level_required}/10</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  {viewingTask.status !== 'done' && (
                    <button
                      onClick={() => {
                        handleCompleteTask(viewingTask.id);
                        setViewingTask(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Complete Task
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setViewingTask(null);
                      setEditingTask(viewingTask);
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Edit Task
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this task?')) {
                        handleDeleteTask(viewingTask.id);
                        setViewingTask(null);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Task
                  </button>
                  <button
                    onClick={() => setViewingTask(null)}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors ml-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}