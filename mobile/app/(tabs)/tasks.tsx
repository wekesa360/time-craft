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
  FlagIcon
} from 'react-native-heroicons/outline';
import { CheckCircleIcon as CheckCircleSolid } from 'react-native-heroicons/solid';
import { apiClient } from '../../lib/api-client';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  estimatedDuration?: number;
  aiPriorityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export default function TasksScreen() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<Task[]> => {
      const response = await apiClient.getTasks();
      return response.tasks || [];
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
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update task');
    },
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
    router.push(`/modals/task-detail?id=${task.id}`);
  };

  const handleCreateTask = () => {
    router.push('/modals/add-task');
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { status: newStatus }
    });
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
      key: 'in_progress', 
      label: 'In Progress', 
      count: tasks.filter(t => t.status === 'in_progress').length,
      color: 'text-blue-600'
    },
    { 
      key: 'completed', 
      label: 'Done', 
      count: tasks.filter(t => t.status === 'completed').length,
      color: 'text-green-600'
    },
  ];

  const getFilteredTasks = () => {
    let filtered = tasks;
    
    if (selectedFilter !== 'all') {
      filtered = tasks.filter(task => task.status === selectedFilter);
    }
    
    // Sort by priority and due date
    return filtered.sort((a, b) => {
      // Completed tasks go to bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      
      // Sort by priority (higher priority first)
      if (a.priority !== b.priority) return b.priority - a.priority;
      
      // Sort by due date (earlier dates first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      return 0;
    });
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'bg-red-100 text-red-700 border-red-200';
      case 3: return 'bg-orange-100 text-orange-700 border-orange-200';
      case 2: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 1: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-bold text-gray-900">Tasks</Text>
            <Text className="text-gray-600 mt-1">
              {tasks.filter(t => t.status === 'completed').length} of {tasks.length} completed
            </Text>
          </View>
          
          <TouchableOpacity
            className="bg-blue-600 rounded-2xl px-6 py-3 shadow-sm"
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
              className={`px-4 py-2 rounded-full flex-row items-center mr-3 ${
                selectedFilter === filter.key
                  ? 'bg-blue-100 border border-blue-200'
                  : 'bg-gray-100'
              }`}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text
                className={`font-medium text-sm ${
                  selectedFilter === filter.key
                    ? 'text-blue-700'
                    : 'text-gray-600'
                }`}
              >
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View
                  className={`ml-2 px-2 py-0.5 rounded-full ${
                    selectedFilter === filter.key
                      ? 'bg-blue-200'
                      : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      selectedFilter === filter.key
                        ? 'text-blue-800'
                        : 'text-gray-700'
                    }`}
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
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTasks.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <CheckCircleIcon size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg font-medium mt-4">
              {selectedFilter === 'all' ? 'No tasks yet' : `No ${selectedFilter} tasks`}
            </Text>
            <Text className="text-gray-400 text-center mt-2 px-8">
              {selectedFilter === 'all' 
                ? 'Create your first task to get started with your productivity journey'
                : `All your ${selectedFilter} tasks will appear here`
              }
            </Text>
            {selectedFilter === 'all' && (
              <TouchableOpacity
                className="bg-blue-600 rounded-2xl px-6 py-3 mt-6"
                onPress={handleCreateTask}
              >
                <Text className="text-white font-semibold">Create First Task</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="py-4 space-y-3">
            {filteredTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border ${
                  task.status === 'completed' 
                    ? 'border-green-100 bg-green-50/30' 
                    : 'border-gray-100'
                }`}
                onPress={() => handleTaskPress(task)}
              >
                <View className="flex-row items-start">
                  {/* Checkbox */}
                  <TouchableOpacity
                    className="mr-4 mt-1"
                    onPress={() => toggleTaskStatus(task)}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircleSolid size={24} color="#10B981" />
                    ) : (
                      <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    )}
                  </TouchableOpacity>

                  {/* Task Content */}
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between mb-2">
                      <Text 
                        className={`text-lg font-semibold flex-1 ${
                          task.status === 'completed' 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-900'
                        }`}
                        numberOfLines={2}
                      >
                        {task.title}
                      </Text>
                      
                      {/* Priority Badge */}
                      <View className={`px-2 py-1 rounded-full border ml-3 ${getPriorityColor(task.priority)}`}>
                        <Text className="text-xs font-medium">
                          {getPriorityLabel(task.priority)}
                        </Text>
                      </View>
                    </View>

                    {task.description && (
                      <Text 
                        className={`text-sm mb-3 ${
                          task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                        numberOfLines={2}
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
                            isDueToday(task.dueDate) ? '#EA580C' : '#6B7280'
                          } />
                          <Text className={`text-xs font-medium ml-1 ${
                            isOverdue(task.dueDate) ? 'text-red-600' : 
                            isDueToday(task.dueDate) ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            {formatDueDate(task.dueDate)}
                          </Text>
                        </View>
                      )}

                      {task.estimatedDuration && (
                        <View className="flex-row items-center mr-4 mb-1">
                          <ClockIcon size={14} color="#6B7280" />
                          <Text className="text-xs text-gray-500 font-medium ml-1">
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
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom Padding for Tab Bar */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}