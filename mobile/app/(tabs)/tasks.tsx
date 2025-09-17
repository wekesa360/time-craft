import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTaskStore } from '../../stores/tasks';
import TaskList from '../../components/tasks/TaskList';
import { Task } from '../../types';

export default function TasksScreen() {
  const { fetchTasks, tasks } = useTaskStore();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskPress = (task: Task) => {
    // Navigate to task detail screen (to be implemented)
    console.log('Task pressed:', task.title);
  };

  const handleCreateTask = () => {
    router.push('/modals/create-task');
  };

  const filterOptions = [
    { key: 'all', label: 'All', count: tasks.length },
    { key: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { key: 'completed', label: 'Done', count: tasks.filter(t => t.status === 'completed').length },
  ];

  const getFilteredTasks = () => {
    switch (selectedFilter) {
      case 'pending':
        return tasks.filter(task => task.status === 'pending');
      case 'completed':
        return tasks.filter(task => task.status === 'completed');
      default:
        return tasks;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            My Tasks
          </Text>
          
          <TouchableOpacity
            className="bg-primary-600 rounded-xl px-4 py-2"
            onPress={handleCreateTask}
          >
            <Text className="text-white font-semibold">+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row gap-2">
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              className={`px-4 py-2 rounded-full flex-row items-center ${
                selectedFilter === filter.key
                  ? 'bg-primary-100 border border-primary-300'
                  : 'bg-gray-100'
              }`}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text
                className={`font-medium text-sm ${
                  selectedFilter === filter.key
                    ? 'text-primary-700'
                    : 'text-gray-600'
                }`}
              >
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View
                  className={`ml-2 px-2 py-0.5 rounded-full ${
                    selectedFilter === filter.key
                      ? 'bg-primary-200'
                      : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      selectedFilter === filter.key
                        ? 'text-primary-800'
                        : 'text-gray-700'
                    }`}
                  >
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Task List */}
      <TaskList 
        onTaskPress={handleTaskPress} 
        filteredTasks={getFilteredTasks()} 
      />
    </SafeAreaView>
  );
}