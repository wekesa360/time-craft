import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTaskStore } from '../../stores/tasks';
import { Task } from '../../types';

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete, onDelete, onPress }) => {
  const completedOpacity = useSharedValue(task.status === 'done' ? 0.6 : 1);
  const completedScale = useSharedValue(task.status === 'done' ? 0.95 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: completedOpacity.value,
    transform: [{ scale: completedScale.value }],
  }));

  const handleComplete = () => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    completedOpacity.value = withTiming(newStatus === 'done' ? 0.6 : 1);
    completedScale.value = withTiming(newStatus === 'done' ? 0.95 : 1);
    onComplete(task.id);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
      ]
    );
  };

  const renderRightActions = () => (
    <View className="flex-row">
      <TouchableOpacity
        className="bg-green-500 justify-center items-center px-6 rounded-r-2xl ml-2"
        onPress={handleComplete}
      >
        <Text className="text-white font-semibold">
          {task.status === 'done' ? '↶' : '✓'}
        </Text>
        <Text className="text-white text-xs mt-1">
          {task.status === 'done' ? 'Undo' : 'Done'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className="bg-red-500 justify-center items-center px-6 rounded-r-2xl ml-1"
        onPress={handleDelete}
      >
        <Text className="text-white font-semibold text-lg">🗑</Text>
        <Text className="text-white text-xs mt-1">Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'border-l-red-500'; // Urgent
      case 3: return 'border-l-orange-500'; // High
      case 2: return 'border-l-yellow-500'; // Medium
      case 1: return 'border-l-green-500'; // Low
      default: return 'border-l-gray-300';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 4: return 'Urgent';
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return '';
    }
  };

  return (
    <GestureHandlerRootView>
      <Swipeable renderRightActions={renderRightActions}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            className={`bg-white rounded-2xl p-4 mb-3 shadow-sm border-l-4 ${getPriorityColor(task.priority)}`}
            onPress={() => onPress(task)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-4">
                <Text 
                  className={`text-lg font-semibold ${
                    task.status === 'done' 
                      ? 'text-gray-500 line-through' 
                      : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </Text>
                
                {task.description && (
                  <Text 
                    className={`text-sm mt-1 ${
                      task.status === 'done' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    numberOfLines={2}
                  >
                    {task.description}
                  </Text>
                )}
                
                <View className="flex-row items-center mt-2 space-x-4">
                  <Text className="text-xs text-primary-600 font-medium">
                    {getPriorityText(task.priority)}
                  </Text>
                  
                  {(task as any).contextType && (
                    <Text className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {(task as any).contextType}
                    </Text>
                  )}
                  
                  {task.dueDate && (
                    <Text className="text-xs text-orange-600">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
              
              <TouchableOpacity
                onPress={handleComplete}
                className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
                  task.status === 'done'
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300'
                }`}
              >
                {task.status === 'done' && (
                  <Text className="text-white font-bold text-sm">✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    </GestureHandlerRootView>
  );
};

interface TaskListProps {
  onTaskPress?: (task: Task) => void;
  filteredTasks?: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ onTaskPress = () => {}, filteredTasks }) => {
  const { tasks, isFetching, fetchTasks, deleteTask, toggleTaskComplete } = useTaskStore();
  const displayTasks = filteredTasks || tasks;

  const handleRefresh = async () => {
    await fetchTasks();
  };

  const renderEmptyState = () => (
    <View className="items-center justify-center py-16">
      <Text className="text-6xl mb-4">📝</Text>
      <Text className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</Text>
      <Text className="text-gray-600 text-center px-8">
        Create your first task to get started with your productivity journey
      </Text>
    </View>
  );

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TaskItem
      task={item}
      onComplete={toggleTaskComplete}
      onDelete={deleteTask}
      onPress={onTaskPress}
    />
  );

  return (
    <FlatList
      data={displayTasks}
      renderItem={renderTaskItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ 
        padding: 16,
        paddingBottom: 100, // Space for tab bar
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={handleRefresh}
          colors={['#2563eb']}
          tintColor="#2563eb"
        />
      }
      ListEmptyComponent={renderEmptyState}
    />
  );
};

export default TaskList;