# React Query Setup and Store Persistence Implementation

## Overview
This document outlines the React Query integration and store persistence implementation for offline functionality in the TimeCraft frontend application.

## ✅ Completed Features

### 1. React Query Configuration
- **QueryClient Setup**: Created centralized query client configuration with optimized defaults
- **Query Keys Factory**: Implemented consistent query key management system
- **Cache Utilities**: Added comprehensive cache management utilities
- **Error Handling**: Global error handling with toast notifications
- **Retry Logic**: Smart retry logic with exponential backoff

### 2. Store Persistence System
- **IndexedDB Storage**: Advanced storage for complex data structures
- **LocalStorage Adapter**: Simple storage for basic preferences
- **Persistence Configurations**: Tailored persistence settings for each store type
- **Offline Queue Management**: Comprehensive offline action queuing system

### 3. Enhanced Stores
- **Auth Store**: Updated with new persistence configuration
- **Theme Store**: Enhanced with improved persistence
- **Tasks Store**: Added offline functionality and optimistic updates
- **Offline Actions**: Support for create, update, delete operations while offline

### 4. API Hooks
- **Authentication Hooks**: Complete auth management with React Query
- **Task Management Hooks**: CRUD operations with optimistic updates
- **Cache Integration**: Seamless integration between stores and React Query cache

### 5. Offline Support
- **Offline Detection**: Automatic online/offline status detection
- **Queue Processing**: Automatic sync when connection is restored
- **Optimistic Updates**: Immediate UI updates for better UX
- **Conflict Resolution**: Basic conflict handling for offline changes

## 📁 File Structure

```
frontend/src/
├── lib/
│   ├── queryClient.ts          # React Query configuration
│   └── storePersistence.ts     # Store persistence utilities
├── providers/
│   └── QueryProvider.tsx       # React Query provider component
├── hooks/api/
│   ├── useAuthQueries.ts       # Authentication API hooks
│   ├── useTaskQueries.ts       # Task management API hooks
│   ├── index.ts                # API hooks exports
│   └── __tests__/
│       └── useAuthQueries.test.ts
├── stores/
│   ├── auth.ts                 # Enhanced with persistence
│   ├── theme.ts                # Enhanced with persistence
│   └── tasks.ts                # Enhanced with offline support
└── components/common/
    └── OfflineQueueHandler.tsx  # Offline sync handler
```

## 🔧 Key Features

### Query Client Configuration
- **Stale Time**: 5 minutes for user data, 2 minutes for dynamic data
- **Cache Time**: 10 minutes for optimal performance
- **Retry Logic**: Smart retry with exponential backoff
- **Error Handling**: Global error handling with user-friendly messages

### Store Persistence
- **IndexedDB**: For complex data (tasks, health metrics, etc.)
- **LocalStorage**: For simple preferences (theme, UI state)
- **Selective Persistence**: Only persist necessary data to optimize storage
- **Migration Support**: Built-in support for schema migrations

### Offline Functionality
- **Action Queuing**: Queue CRUD operations when offline
- **Optimistic Updates**: Immediate UI feedback
- **Automatic Sync**: Process queue when connection is restored
- **Conflict Detection**: Basic conflict resolution for data integrity

## 🚀 Usage Examples

### Using API Hooks
```typescript
// Authentication
const { data: user, isLoading } = useCurrentUser();
const loginMutation = useLogin();

// Tasks
const { data: tasks } = useTasks({ status: 'pending' });
const createTaskMutation = useCreateTask();
const updateTaskMutation = useOptimisticTaskUpdate();
```

### Offline Operations
```typescript
// Tasks automatically handle offline mode
const createTask = useCreateTask();
createTask.mutate(taskData); // Works offline with optimistic updates

// Manual offline queue management
const { processOfflineQueue, offlineQueue } = useTaskStore();
```

### Cache Management
```typescript
import { queryClient, cacheUtils } from '@/lib/queryClient';

// Invalidate specific queries
cacheUtils.invalidateQueries(queryKeys.tasks.all());

// Prefetch data
cacheUtils.prefetchQuery(queryKeys.auth.user(), fetchUser);
```

## 🧪 Testing
- **Unit Tests**: Comprehensive tests for API hooks
- **Mock Setup**: Proper mocking of API client and stores
- **Test Utilities**: Reusable test wrappers and helpers

## 📈 Performance Benefits
- **Reduced API Calls**: Smart caching reduces unnecessary requests
- **Optimistic Updates**: Immediate UI feedback improves perceived performance
- **Background Sync**: Offline changes sync automatically without user intervention
- **Memory Management**: Automatic cache cleanup prevents memory leaks

## 🔄 Next Steps
1. Add more API hooks for other features (health, focus, badges, etc.)
2. Implement real-time updates with Server-Sent Events integration
3. Add more sophisticated conflict resolution for offline changes
4. Implement cache warming strategies for better initial load performance
5. Add metrics and monitoring for cache hit rates and offline usage

## 🛠️ Development Tools
- **React Query DevTools**: Available in development mode
- **Cache Inspection**: Window globals for debugging (development only)
- **Offline Simulation**: Easy testing of offline functionality
- **Performance Monitoring**: Built-in cache statistics and metrics

This implementation provides a solid foundation for scalable, offline-capable state management with excellent developer experience and user performance.