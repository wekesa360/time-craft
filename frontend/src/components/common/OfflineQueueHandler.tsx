/**
 * Offline Queue Handler
 * Listens for offline actions and processes them when the app comes back online
 */

import { useEffect } from 'react';
import { useTaskStore } from '../../stores/tasks';
import { toast } from 'react-hot-toast';

export const OfflineQueueHandler: React.FC = () => {
  const { processOfflineQueue, offlineQueue } = useTaskStore();

  useEffect(() => {
    const handleOnline = async () => {
      if (offlineQueue.length > 0) {
        toast.loading('Syncing offline changes...', { id: 'offline-sync' });
        
        try {
          await processOfflineQueue();
          toast.success('Offline changes synced successfully', { id: 'offline-sync' });
        } catch (error) {
          toast.error('Failed to sync some offline changes', { id: 'offline-sync' });
        }
      }
    };

    const handleOffline = () => {
      toast('You are now offline. Changes will be saved locally.', {
        icon: '📱',
        duration: 3000,
      });
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Process queue on mount if online
    if (navigator.onLine && offlineQueue.length > 0) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processOfflineQueue, offlineQueue.length]);

  // This component doesn't render anything
  return null;
};