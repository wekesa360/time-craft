// Hook for managing Server-Sent Events connection
import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../lib/api';
import type { SSEMessage, SSEConnectionState } from '../types';

interface UseSSEOptions {
  autoConnect?: boolean;
  onMessage?: (message: SSEMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useSSE = (options: UseSSEOptions = {}) => {
  const {
    autoConnect = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [connectionState, setConnectionState] = useState<SSEConnectionState>({
    isConnected: false,
    reconnectAttempts: 0,
    lastMessageTime: 0,
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const connect = () => {
    if (apiClient.isSSEConnected()) return;

    apiClient.connectSSE();
    
    // Subscribe to SSE messages
    unsubscribeRef.current = apiClient.subscribeToUpdates((message: SSEMessage) => {
      setConnectionState(prev => ({
        ...prev,
        lastMessageTime: Date.now(),
      }));
      
      onMessage?.(message);
    });

    setConnectionState(prev => ({
      ...prev,
      isConnected: true,
    }));

    onConnect?.();
  };

  const disconnect = () => {
    apiClient.disconnectSSE();
    
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setConnectionState(prev => ({
      ...prev,
      isConnected: false,
    }));

    onDisconnect?.();
  };

  const reconnect = () => {
    disconnect();
    setTimeout(connect, 1000);
  };

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // Monitor connection state
  useEffect(() => {
    const checkConnection = () => {
      const isConnected = apiClient.isSSEConnected();
      setConnectionState(prev => ({
        ...prev,
        isConnected,
      }));
    };

    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
    reconnect,
    isConnected: connectionState.isConnected,
  };
};

// Hook for listening to specific SSE message types
export const useSSEMessage = <T = any>(
  messageType: string,
  callback: (data: T) => void,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const handleMessage = (event: CustomEvent) => {
      const message = event.detail as SSEMessage;
      if (message.type === messageType) {
        callback(message.data as T);
      }
    };

    window.addEventListener('sse-message', handleMessage as EventListener);
    
    return () => {
      window.removeEventListener('sse-message', handleMessage as EventListener);
    };
  }, deps);
};

// Hook for badge unlock notifications
export const useBadgeUnlockNotifications = (callback: (badge: any) => void) => {
  useSSEMessage('badge_unlocked', callback);
};

// Hook for challenge updates
export const useChallengeUpdates = (callback: (challenge: any) => void) => {
  useSSEMessage('challenge_update', callback);
};

// Hook for task reminders
export const useTaskReminders = (callback: (task: any) => void) => {
  useSSEMessage('task_reminder', callback);
};

// Hook for health insights
export const useHealthInsights = (callback: (insight: any) => void) => {
  useSSEMessage('health_insight', callback);
};

// Hook for focus session completion
export const useFocusSessionUpdates = (callback: (session: any) => void) => {
  useSSEMessage('focus_session_complete', callback);
};