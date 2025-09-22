// Unit tests for Real-time SSE Service

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealtimeSSEService, sseService, SSE_EVENT_TYPES } from '../../src/lib/realtime-sse';

describe('Real-time SSE Service', () => {
  let sseService: RealtimeSSEService;

  beforeEach(() => {
    sseService = new RealtimeSSEService();
  });

  describe('Connection Management', () => {
    it('should create SSE connection', () => {
      const { connectionId, stream } = sseService.createConnection('user123');
      
      expect(connectionId).toMatch(/^sse_\d+_[a-z0-9]+$/);
      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('should remove SSE connection', () => {
      const { connectionId } = sseService.createConnection('user123');
      
      sseService.removeConnection(connectionId);
      
      const stats = sseService.getStats();
      expect(stats.totalConnections).toBe(0);
    });

    it('should track user connections', () => {
      sseService.createConnection('user123');
      sseService.createConnection('user123');
      sseService.createConnection('user456');
      
      const stats = sseService.getStats();
      expect(stats.totalConnections).toBe(3);
      expect(stats.userConnections).toBe(2);
    });
  });

  describe('Event Broadcasting', () => {
    it('should send event to specific connection', () => {
      const { connectionId } = sseService.createConnection('user123');
      
      const result = sseService.sendToConnection(connectionId, {
        type: 'test_event',
        data: { message: 'Hello' }
      });
      
      expect(result).toBe(true);
    });

    it('should send event to user', () => {
      sseService.createConnection('user123');
      sseService.createConnection('user123');
      
      const sentCount = sseService.sendToUser('user123', {
        type: 'test_event',
        data: { message: 'Hello' }
      });
      
      expect(sentCount).toBe(2);
    });

    it('should broadcast event to all connections', () => {
      sseService.createConnection('user123');
      sseService.createConnection('user456');
      
      const sentCount = sseService.broadcast({
        type: 'test_event',
        data: { message: 'Hello' }
      });
      
      expect(sentCount).toBe(2);
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe connection to event types', () => {
      const { connectionId } = sseService.createConnection('user123');
      
      const success = sseService.subscribe(connectionId, [
        SSE_EVENT_TYPES.TASK_CREATED,
        SSE_EVENT_TYPES.CALENDAR_EVENT_CREATED
      ]);
      
      expect(success).toBe(true);
    });

    it('should unsubscribe connection from event types', () => {
      const { connectionId } = sseService.createConnection('user123');
      
      sseService.subscribe(connectionId, [SSE_EVENT_TYPES.TASK_CREATED]);
      const success = sseService.unsubscribe(connectionId, [SSE_EVENT_TYPES.TASK_CREATED]);
      
      expect(success).toBe(true);
    });

    it('should send event only to subscribed connections', () => {
      const { connectionId: conn1 } = sseService.createConnection('user123');
      const { connectionId: conn2 } = sseService.createConnection('user456');
      
      sseService.subscribe(conn1, [SSE_EVENT_TYPES.TASK_CREATED]);
      
      const sentCount = sseService.sendToSubscribers(SSE_EVENT_TYPES.TASK_CREATED, {
        type: SSE_EVENT_TYPES.TASK_CREATED,
        data: { taskId: 'task123' }
      });
      
      expect(sentCount).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should return connection statistics', () => {
      sseService.createConnection('user123');
      sseService.createConnection('user123');
      sseService.createConnection('user456');
      
      const stats = sseService.getStats();
      
      expect(stats.totalConnections).toBe(3);
      expect(stats.userConnections).toBe(2);
      expect(stats.averageSubscriptions).toBe(0);
    });
  });

  describe('Event Types', () => {
    it('should have all required event types', () => {
      expect(SSE_EVENT_TYPES.CALENDAR_EVENT_CREATED).toBe('calendar.event.created');
      expect(SSE_EVENT_TYPES.TASK_CREATED).toBe('task.created');
      expect(SSE_EVENT_TYPES.FOCUS_SESSION_STARTED).toBe('focus.session.started');
      expect(SSE_EVENT_TYPES.NOTIFICATION_RECEIVED).toBe('notification.received');
      expect(SSE_EVENT_TYPES.CONNECTED).toBe('connected');
      expect(SSE_EVENT_TYPES.HEARTBEAT).toBe('heartbeat');
    });
  });
});
