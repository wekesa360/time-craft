import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  FlagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'react-native-heroicons/outline';
import { CheckCircleIcon as CheckCircleSolid } from 'react-native-heroicons/solid';
import { apiClient } from '../../lib/api';
import { useAppTheme } from '../../constants/dynamicTheme';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: number;
  status: 'pending' | 'done' | 'archived';
  dueDate?: string;
  estimatedDuration?: number;
  aiPriorityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export default function TasksScreen() {
  const theme = useAppTheme();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean; task: Task | null }>({ visible: false, task: null });
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<Task[]> => {
      const response = await apiClient.getTasks();
      // Backend returns { tasks: Task[], hasMore, nextCursor, total }
      return response.tasks || response.data?.tasks || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      return apiClient.updateTask(taskId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activities'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update task');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => apiClient.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activities'] });
      Alert.alert('Deleted', 'Task deleted successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete task');
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh tasks');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTaskPress = (task: Task) => {
    router.push({ pathname: '/modals/task-detail', params: { id: task.id } } as any);
  };

  const handleCreateTask = () => {
    router.push('/modals/add-task');
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { status: newStatus }
    });
  };

  const confirmAndDeleteTask = (task: Task) => {
    setDeleteDialog({ visible: true, task });
  };

  const filterOptions = [
    { 
      key: 'all', 
      label: 'All', 
      count: tasks.length,
      color: 'text-gray-600'
    },
    { 
      key: 'pending', 
      label: 'Pending', 
      count: tasks.filter(t => t.status === 'pending').length,
      color: 'text-orange-600'
    },
    { 
      key: 'done', 
      label: 'Done', 
      count: tasks.filter(t => t.status === 'done').length,
      color: 'text-green-600'
    },
    { 
      key: 'archived', 
      label: 'Archived', 
      count: tasks.filter(t => t.status === 'archived').length,
      color: 'text-gray-600'
    },
  ];

  const getFilteredTasks = () => {
    // All: show everything in original order
    if (selectedFilter === 'all') return tasks;
    // Others: filter by status only, keep original order
    return tasks.filter((t) => t.status === selectedFilter);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'text-red-700 border-red-300';
      case 3: return 'text-orange-700 border-orange-300';
      case 2: return 'text-yellow-700 border-yellow-300';
      case 1: return 'text-green-700 border-green-300';
      default: return 'text-gray-700 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 4: return 'Urgent';
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return 'None';
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isDueToday = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isOverdue = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    return date.getTime() < now.getTime();
  };

  const filteredTasks = getFilteredTasks();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      {/* Header */}
      <View className="px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-bold" style={{ color: theme.colors.foreground }}>Tasks</Text>
            <Text className="mt-1" style={{ color: theme.colors.muted }}>
              {tasks.filter(t => t.status === 'done').length} of {tasks.length} completed
            </Text>
          </View>
          
          <TouchableOpacity
            className="rounded-2xl px-6 py-3 shadow-sm"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleCreateTask}
          >
            <View className="flex-row items-center">
              <PlusIcon size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Add Task</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {filterOptions.map((filter, index) => (
            <TouchableOpacity
              key={filter.key}
              className="flex-row items-center mr-3 px-6 py-3"
              style={{
                borderRadius: theme.radii.pill,
                backgroundColor:
                  selectedFilter === filter.key ? theme.colors.primaryLight : theme.colors.input,
                borderWidth: 1,
                borderColor:
                  selectedFilter === filter.key ? theme.colors.primary : theme.colors.border,
              }}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text
                className="font-medium text-sm"
                style={{ color: selectedFilter === filter.key ? theme.colors.primary : theme.colors.muted }}
              >
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View
                  className="ml-2 rounded-full"
                  style={{
                    paddingVertical: theme.spacing.xs,
                    paddingHorizontal: theme.spacing.sm,
                    backgroundColor:
                      selectedFilter === filter.key ? theme.colors.primaryLight : theme.colors.surface,
                    borderWidth: 1,
                    borderColor:
                      selectedFilter === filter.key ? theme.colors.primary : theme.colors.border,
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: selectedFilter === filter.key ? theme.colors.primary : theme.colors.muted }}
                  >
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Task List */}
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTasks.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
            <CheckCircleIcon size={64} color="#D1D5DB" />
            <Text className="text-lg font-medium mt-4" style={{ color: theme.colors.muted }}>
              {selectedFilter === 'all' ? 'No tasks yet' : `No ${selectedFilter === 'done' ? 'completed' : selectedFilter} tasks`}
            </Text>
            <Text className="text-center mt-2 px-8" style={{ color: theme.colors.mutedAlt }}>
              {selectedFilter === 'all' 
                ? 'Create your first task to get started with your productivity journey'
                : `All your ${selectedFilter === 'done' ? 'completed' : selectedFilter} tasks will appear here`
              }
            </Text>
            {selectedFilter === 'all' && (
              <TouchableOpacity
                className="rounded-2xl px-6 py-3 mt-6"
                style={{ backgroundColor: theme.colors.primary }}
                onPress={handleCreateTask}
              >
                <Text className="text-white font-semibold">Create First Task</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View>
            {filteredTasks.map((task, index) => (
              <View key={task.id}>
                <TouchableOpacity
                  className={`px-6 py-4`}
                  style={{ backgroundColor: task.status === 'done' ? theme.colors.successBg : theme.colors.card }}
                  onPress={() => setExpanded((prev) => ({ ...prev, [task.id]: !prev[task.id] }))}
                  onLongPress={() => confirmAndDeleteTask(task)}
                >
                <View className="flex-row items-start">
                  {/* Checkbox */}
                  <TouchableOpacity
                    className="mr-4 mt-1"
                    onPress={() => toggleTaskStatus(task)}
                  >
                    {task.status === 'done' ? (
                      <CheckCircleSolid size={24} color={theme.colors.success} />
                    ) : (
                      <View className="w-6 h-6 rounded-full border-2" style={{ borderColor: theme.colors.border }} />
                  )}
                </TouchableOpacity>

                  {/* Task Content */}
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between mb-2">
                      <Text 
                        className={`text-lg font-semibold flex-1 ${
                          task.status === 'done' 
                            ? 'line-through' 
                            : ''
                        }`}
                        style={{ color: task.status === 'done' ? theme.colors.muted : theme.colors.foreground }}
                        numberOfLines={expanded[task.id] ? undefined : 2}
                      >
                        {task.title}
                      </Text>
                      
                      {/* Priority Badge - border only, colored text */}
                      <View className={`px-2 py-1 rounded-full border ml-3 ${getPriorityColor(task.priority)}`}>
                        <Text className="text-xs font-medium">
                          {getPriorityLabel(task.priority)}
                        </Text>
                      </View>
                    </View>

                    {task.description && (
                      <Text 
                        className={`text-sm mb-3`}
                        style={{ color: task.status === 'done' ? theme.colors.mutedAlt : theme.colors.muted }}
                        numberOfLines={expanded[task.id] ? undefined : 2}
                      >
                        {task.description}
                      </Text>
                    )}

                    {/* Task Meta */}
                    <View className="flex-row items-center flex-wrap">
                      {task.dueDate && (
                        <View className={`flex-row items-center mr-4 mb-1 ${
                          isOverdue(task.dueDate) ? 'text-red-600' : 
                          isDueToday(task.dueDate) ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                          <CalendarIcon size={14} color={
                            isOverdue(task.dueDate) ? '#DC2626' : 
                            isDueToday(task.dueDate) ? theme.colors.warning : theme.colors.muted
                          } />
                          <Text className={`text-xs font-medium ml-1 ${
                            isOverdue(task.dueDate) ? 'text-red-600' : 
                            isDueToday(task.dueDate) ? '' : ''
                          }`}>
                            <Text style={{ color: isOverdue(task.dueDate) ? '#DC2626' : isDueToday(task.dueDate) ? theme.colors.warning : theme.colors.muted }}>
                              {formatDueDate(task.dueDate)}
                            </Text>
                          </Text>
                        </View>
                      )}

                      {task.estimatedDuration && (
                        <View className="flex-row items-center mr-4 mb-1">
                          <ClockIcon size={14} color={theme.colors.muted} />
                          <Text className="text-xs font-medium ml-1" style={{ color: theme.colors.muted }}>
                            {task.estimatedDuration}m
                          </Text>
                        </View>
                      )}

                      {task.aiPriorityScore && task.aiPriorityScore > 0.8 && (
                        <View className="flex-row items-center mb-1">
                          <ExclamationTriangleIcon size={14} color="#F59E0B" />
                          <Text className="text-xs text-orange-600 font-medium ml-1">
                            AI High Priority
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Accordion extra info */}
                    {expanded[task.id] && (
                      <View className="mt-3">
                        <View className="flex-row items-center">
                          <Text className="text-xs" style={{ color: theme.colors.muted }}>Created:</Text>
                          <Text className="text-xs ml-1" style={{ color: theme.colors.muted }}>
                            {new Date(task.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        {task.updatedAt && (
                          <View className="flex-row items-center mt-1">
                            <Text className="text-xs" style={{ color: theme.colors.muted }}>Updated:</Text>
                            <Text className="text-xs ml-1" style={{ color: theme.colors.muted }}>
                              {new Date(task.updatedAt).toLocaleDateString()}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Accordion Toggle Icon */}
                  <View className="ml-3 mt-1">
                    {expanded[task.id] ? (
                      <ChevronUpIcon size={20} color={theme.colors.muted} />
                    ) : (
                      <ChevronDownIcon size={20} color={theme.colors.muted} />
                    )}
                  </View>
                </View>
                </TouchableOpacity>
                {index < filteredTasks.length - 1 && (
                  <View className="h-px" style={{ backgroundColor: theme.colors.border }} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Bottom Padding for Tab Bar */}
        <View className="h-20" />
      </ScrollView>
      <ConfirmDialog
        visible={deleteDialog.visible}
        title={'Delete Task'}
        description={deleteDialog.task ? `Are you sure you want to delete "${deleteDialog.task.title}"?` : ''}
        confirmText={'Delete'}
        cancelText={'Cancel'}
        onCancel={() => setDeleteDialog({ visible: false, task: null })}
        onConfirm={() => {
          if (deleteDialog.task) {
            deleteTaskMutation.mutate(deleteDialog.task.id);
          }
          setDeleteDialog({ visible: false, task: null });
        }}
      />
    </SafeAreaView>
  );
}