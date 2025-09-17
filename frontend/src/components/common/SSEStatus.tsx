// SSE Connection Status Component
import React from 'react';
import { useSSE } from '../../hooks/useSSE';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface SSEStatusProps {
  className?: string;
  showText?: boolean;
}

export const SSEStatus: React.FC<SSEStatusProps> = ({ 
  className = '', 
  showText = false 
}) => {
  const { connectionState, reconnect, isConnected } = useSSE();

  const getStatusColor = () => {
    if (isConnected) return 'text-green-500';
    if (connectionState.reconnectAttempts > 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (connectionState.reconnectAttempts > 0) return 'Reconnecting...';
    return 'Disconnected';
  };

  const handleReconnect = () => {
    reconnect();
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleReconnect}
        className={`p-1 rounded-full hover:bg-background-secondary transition-colors ${getStatusColor()}`}
        title={`Real-time updates: ${getStatusText()}`}
        disabled={isConnected}
      >
        {isConnected ? (
          <Wifi className="w-4 h-4" />
        ) : connectionState.reconnectAttempts > 0 ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
      </button>
      
      {showText && (
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

// Notification component for SSE messages
export const SSENotificationHandler: React.FC = () => {
  useSSE({
    onConnect: () => {
      console.log('SSE connected');
    },
    onDisconnect: () => {
      console.log('SSE disconnected');
    },
    onError: (error) => {
      console.error('SSE error:', error);
    },
  });

  return null; // This component doesn't render anything
};