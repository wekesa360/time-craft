import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Clock, Flag, CalendarIcon, Sparkles, X, Filter, MoreHorizontal } from "lucide-react";
import { TaskCard } from '../components/features/tasks/TaskCard';
import TaskForm from '../components/features/tasks/TaskForm';
import { TaskFilters } from '../components/features/tasks/TaskFilters';
import { TaskListSkeleton } from '../components/skeletons/TaskListSkeleton';
import { useTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '../hooks/queries/useTaskQueries';
import { useTaskStore } from '../stores/tasks';
import type { Task, TaskForm as TaskFormType } from '../types';

export default function TasksPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const { filters, setFilters } = useTaskStore();

  // Fetch tasks with current filters
  const { data: tasks = [], isLoading, error } = useTasksQuery({
    status: filters.status,
    priority: filters.priority,
    contextType: filters.contextType,
    search: searchQuery,
    ...filters
  });

  // Mutations
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

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

  // Filter tasks based on selected filter
  const filteredTasks = useMemo(() => {
    if (selectedFilter === "all") {
      return groupedTasks;
    }
    
    return {
      ...groupedTasks,
      [selectedFilter]: groupedTasks[selectedFilter as keyof typeof groupedTasks] || []
    };
  }, [groupedTasks, selectedFilter]);

  const handleCreateTask = async (data: TaskFormType) => {
    try {
      await createTaskMutation.mutateAsync(data);
      setShowAddTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (data: TaskFormType) => {
    if (!editingTask) return;
    
    try {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, data });
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTaskMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await updateTaskMutation.mutateAsync({ 
        id, 
        data: { status: 'done' } 
      });
    } catch (error) {
      console.error('Failed to complete task:', error);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your tasks with AI-powered prioritization</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl font-medium hover:bg-card/80 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>
      </div>

      {/* AI Suggestion Banner */}
      <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground mb-1">AI Recommendation</h3>
            <p className="text-sm text-foreground leading-relaxed">
              Based on your deadlines and energy patterns, I recommend starting with high-priority tasks during your peak focus hours. 
              Consider breaking larger tasks into smaller, manageable chunks for better completion rates.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          {["all", "high", "medium", "low"].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                selectedFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:bg-card/80"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <TaskFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && <TaskListSkeleton />}

      {/* Task Lists */}
      {!isLoading && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* High Priority */}
          {(selectedFilter === "all" || selectedFilter === "high") && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-500" />
                  High Priority
                </h2>
                <span className="text-sm text-muted-foreground">{filteredTasks.high.length} tasks</span>
              </div>

              <div className="space-y-3">
                {filteredTasks.high.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onView={handleViewTask}
                  />
                ))}
                {filteredTasks.high.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No high priority tasks
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medium Priority */}
          {(selectedFilter === "all" || selectedFilter === "medium") && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Flag className="w-5 h-5 text-yellow-500" />
                  Medium Priority
                </h2>
                <span className="text-sm text-muted-foreground">{filteredTasks.medium.length} tasks</span>
              </div>

              <div className="space-y-3">
                {filteredTasks.medium.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onView={handleViewTask}
                  />
                ))}
                {filteredTasks.medium.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No medium priority tasks
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Low Priority */}
          {(selectedFilter === "all" || selectedFilter === "low") && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Flag className="w-5 h-5 text-green-500" />
                  Low Priority
                </h2>
                <span className="text-sm text-muted-foreground">{filteredTasks.low.length} tasks</span>
              </div>

              <div className="space-y-3">
                {filteredTasks.low.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onView={handleViewTask}
                  />
                ))}
                {filteredTasks.low.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No low priority tasks
                  </div>
                )}
              </div>
            </div>
          )}

      {/* Completed Tasks */}
      {filteredTasks.completed.length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Completed Today</h2>
            <span className="text-sm text-primary font-medium">{filteredTasks.completed.length} tasks</span>
          </div>

          <div className="space-y-2">
            {filteredTasks.completed.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                <div className="w-5 h-5 rounded bg-primary flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground line-through opacity-70">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-through opacity-50">{task.description}</p>
                  )}
                </div>
                {task.completed_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.completed_at).toLocaleTimeString()}
                  </span>
                )}
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
                    onClick={() => setViewingTask(null)}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
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
  );
}