/**
 * Virtual Scrolling Component
 * High-performance scrolling for large datasets
 * Renders only visible items for optimal performance
 */

import React, { 
  useEffect, 
  useRef, 
  useState, 
  useMemo, 
  useCallback,
  ReactNode 
} from 'react';

export interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
  isLoading?: boolean;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualScrolling<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  loadingComponent,
  emptyComponent,
  isLoading = false,
  onEndReached,
  endReachedThreshold = 0.8
}: VirtualScrollProps<T>) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    if (!items.length) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] };
    }

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan);
    
    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1)
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for positioning visible items
  const offsetY = startIndex * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    setIsScrolling(true);
    
    onScroll?.(scrollTop);

    // Check if we've reached the end for infinite loading
    if (onEndReached) {
      const scrollHeight = event.currentTarget.scrollHeight;
      const clientHeight = event.currentTarget.clientHeight;
      const scrollPercent = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercent >= endReachedThreshold) {
        onEndReached();
      }
    }
  }, [onScroll, onEndReached, endReachedThreshold]);

  // Debounce scroll end detection
  useEffect(() => {
    if (!isScrolling) return;

    const timer = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [isScrolling, scrollTop]);

  // Empty state
  if (!isLoading && items.length === 0 && emptyComponent) {
    return <div className={className}>{emptyComponent}</div>;
  }

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: itemHeight,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
        
        {isLoading && loadingComponent && (
          <div className="flex justify-center py-4">
            {loadingComponent}
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized virtual scrolling components for specific use cases

// Task List Virtual Scrolling
export interface VirtualTaskListProps {
  tasks: any[];
  onTaskClick?: (task: any) => void;
  onTaskComplete?: (taskId: string) => void;
  className?: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export const VirtualTaskList: React.FC<VirtualTaskListProps> = ({
  tasks,
  onTaskClick,
  onTaskComplete,
  className,
  isLoading,
  onLoadMore
}) => {
  const renderTask = useCallback((task: any, index: number) => (
    <div
      className="flex items-center space-x-3 p-3 hover:bg-background-secondary transition-colors cursor-pointer border-b border-border"
      onClick={() => onTaskClick?.(task)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTaskComplete?.(task.id);
        }}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          task.status === 'completed'
            ? 'bg-primary-600 border-primary-600 text-white'
            : 'border-border hover:border-primary-400'
        }`}
      >
        {task.status === 'completed' && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-medium truncate ${
          task.status === 'completed' ? 'line-through text-foreground-secondary' : 'text-foreground'
        }`}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-xs text-foreground-secondary truncate">{task.description}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {task.priority && (
          <span className={`px-2 py-1 text-xs rounded-full ${
            task.priority === 4 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
            task.priority === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
            task.priority === 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            P{task.priority}
          </span>
        )}
        {task.dueDate && (
          <span className="text-xs text-foreground-secondary">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  ), [onTaskClick, onTaskComplete]);

  const loadingComponent = (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="ml-2 text-sm text-foreground-secondary">Loading more tasks...</span>
    </div>
  );

  const emptyComponent = (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg className="w-12 h-12 text-foreground-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 className="text-lg font-medium text-foreground mb-1">No tasks found</h3>
      <p className="text-foreground-secondary">Create your first task to get started</p>
    </div>
  );

  return (
    <VirtualScrolling
      items={tasks}
      itemHeight={72}
      containerHeight={600}
      renderItem={renderTask}
      className={className}
      loadingComponent={loadingComponent}
      emptyComponent={emptyComponent}
      isLoading={isLoading}
      onEndReached={onLoadMore}
    />
  );
};

// Health Log Virtual Scrolling
export interface VirtualHealthLogProps {
  logs: any[];
  onLogClick?: (log: any) => void;
  className?: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export const VirtualHealthLog: React.FC<VirtualHealthLogProps> = ({
  logs,
  onLogClick,
  className,
  isLoading,
  onLoadMore
}) => {
  const renderLog = useCallback((log: any, index: number) => (
    <div
      className="flex items-center space-x-4 p-4 hover:bg-background-secondary transition-colors cursor-pointer border-b border-border"
      onClick={() => onLogClick?.(log)}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        log.type === 'exercise' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
        log.type === 'nutrition' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
        log.type === 'mood' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' :
        'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300'
      }`}>
        {log.type === 'exercise' && '🏃'}
        {log.type === 'nutrition' && '🥗'}
        {log.type === 'mood' && '😊'}
        {log.type === 'hydration' && '💧'}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground capitalize">{log.type}</h3>
        <p className="text-xs text-foreground-secondary">
          {new Date(log.recordedAt).toLocaleString()}
        </p>
      </div>
      
      <div className="text-right">
        {log.type === 'exercise' && log.payload?.durationMinutes && (
          <span className="text-sm font-medium text-foreground">{log.payload.durationMinutes}m</span>
        )}
        {log.type === 'nutrition' && log.payload?.calories && (
          <span className="text-sm font-medium text-foreground">{log.payload.calories} cal</span>
        )}
        {log.type === 'mood' && log.payload?.score && (
          <span className="text-sm font-medium text-foreground">{log.payload.score}/10</span>
        )}
        {log.type === 'hydration' && log.payload?.amount && (
          <span className="text-sm font-medium text-foreground">{log.payload.amount}ml</span>
        )}
      </div>
    </div>
  ), [onLogClick]);

  const loadingComponent = (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="ml-2 text-sm text-foreground-secondary">Loading more logs...</span>
    </div>
  );

  const emptyComponent = (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg className="w-12 h-12 text-foreground-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <h3 className="text-lg font-medium text-foreground mb-1">No health logs found</h3>
      <p className="text-foreground-secondary">Start tracking your health data</p>
    </div>
  );

  return (
    <VirtualScrolling
      items={logs}
      itemHeight={80}
      containerHeight={600}
      renderItem={renderLog}
      className={className}
      loadingComponent={loadingComponent}
      emptyComponent={emptyComponent}
      isLoading={isLoading}
      onEndReached={onLoadMore}
    />
  );
};

// Voice Notes Virtual Scrolling
export interface VirtualVoiceNotesProps {
  notes: any[];
  onNotePlay?: (note: any) => void;
  onNoteClick?: (note: any) => void;
  className?: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export const VirtualVoiceNotes: React.FC<VirtualVoiceNotesProps> = ({
  notes,
  onNotePlay,
  onNoteClick,
  className,
  isLoading,
  onLoadMore
}) => {
  const renderNote = useCallback((note: any, index: number) => (
    <div
      className="flex items-start space-x-4 p-4 hover:bg-background-secondary transition-colors border-b border-border"
    >
      <button
        onClick={() => onNotePlay?.(note)}
        className="w-10 h-10 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center hover:bg-primary-200 dark:hover:bg-primary-900 transition-colors"
      >
        <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      </button>
      
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onNoteClick?.(note)}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">
            Voice Note {index + 1}
          </h3>
          <div className="flex items-center space-x-2 text-xs text-foreground-secondary">
            <span>{Math.floor(note.duration / 60)}:{(note.duration % 60).toString().padStart(2, '0')}</span>
            <span>•</span>
            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        {note.transcription && (
          <p className="text-sm text-foreground-secondary line-clamp-2 mb-2">
            {note.transcription}
          </p>
        )}
        
        <div className="flex items-center space-x-2">
          {note.confidence && (
            <span className={`px-2 py-1 text-xs rounded-full ${
              note.confidence > 0.8 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
              note.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            }`}>
              {Math.round(note.confidence * 100)}% confident
            </span>
          )}
          
          {note.analysis?.sentiment && (
            <span className={`px-2 py-1 text-xs rounded-full ${
              note.analysis.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
              note.analysis.sentiment === 'neutral' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            }`}>
              {note.analysis.sentiment}
            </span>
          )}
        </div>
      </div>
    </div>
  ), [onNotePlay, onNoteClick]);

  const loadingComponent = (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="ml-2 text-sm text-foreground-secondary">Loading more notes...</span>
    </div>
  );

  const emptyComponent = (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg className="w-12 h-12 text-foreground-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      <h3 className="text-lg font-medium text-foreground mb-1">No voice notes found</h3>
      <p className="text-foreground-secondary">Record your first voice note</p>
    </div>
  );

  return (
    <VirtualScrolling
      items={notes}
      itemHeight={120}
      containerHeight={600}
      renderItem={renderNote}
      className={className}
      loadingComponent={loadingComponent}
      emptyComponent={emptyComponent}
      isLoading={isLoading}
      onEndReached={onLoadMore}
    />
  );
};