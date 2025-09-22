// Real-Time Server-Sent Events (SSE) Service
// Handles real-time updates for calendar sync, notifications, and live data

import { logger } from './logger';

export interface SSEConnection {
  id: string;
  userId: string;
  stream: ReadableStream;
  controller: ReadableStreamDefaultController;
  lastPing: number;
  subscriptions: Set<string>;
}

export interface SSEEvent {
  type: string;
  data: any;
  id?: string;
  retry?: number;
}

export class RealtimeSSEService {
  private connections: Map<string, SSEConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();

  /**
   * Create SSE connection for user
   */
  createConnection(userId: string): { connectionId: string; stream: ReadableStream } {
    const connectionId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let controller: ReadableStreamDefaultController;
    const stream = new ReadableStream({
      start(ctrl) {
        controller = ctrl;
      },
      cancel() {
        this.removeConnection(connectionId);
      }
    });

    const connection: SSEConnection = {
      id: connectionId,
      userId,
      stream,
      controller: controller!,
      lastPing: Date.now(),
      subscriptions: new Set()
    };

    this.connections.set(connectionId, connection);
    
    // Track user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    // Send initial connection event
    this.sendToConnection(connectionId, {
      type: 'connected',
      data: { connectionId, timestamp: Date.now() }
    });

    // Start heartbeat
    this.startHeartbeat(connectionId);

    logger.info('SSE connection created', {
      connectionId,
      userId,
      totalConnections: this.connections.size
    });

    return { connectionId, stream };
  }

  /**
   * Remove SSE connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from user connections
    const userConnections = this.userConnections.get(connection.userId);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    this.connections.delete(connectionId);

    logger.info('SSE connection removed', {
      connectionId,
      userId: connection.userId,
      totalConnections: this.connections.size
    });
  }

  /**
   * Send event to specific connection
   */
  sendToConnection(connectionId: string, event: SSEEvent): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    try {
      const sseData = this.formatSSEEvent(event);
      connection.controller.enqueue(new TextEncoder().encode(sseData));
      return true;
    } catch (error) {
      logger.error('Failed to send SSE event', {
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.removeConnection(connectionId);
      return false;
    }
  }

  /**
   * Send event to all connections for a user
   */
  sendToUser(userId: string, event: SSEEvent): number {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) return 0;

    let sentCount = 0;
    for (const connectionId of userConnections) {
      if (this.sendToConnection(connectionId, event)) {
        sentCount++;
      }
    }

    logger.info('SSE event sent to user', {
      userId,
      eventType: event.type,
      sentCount,
      totalConnections: userConnections.size
    });

    return sentCount;
  }

  /**
   * Send event to all connections (broadcast)
   */
  broadcast(event: SSEEvent): number {
    let sentCount = 0;
    for (const connectionId of this.connections.keys()) {
      if (this.sendToConnection(connectionId, event)) {
        sentCount++;
      }
    }

    logger.info('SSE event broadcasted', {
      eventType: event.type,
      sentCount,
      totalConnections: this.connections.size
    });

    return sentCount;
  }

  /**
   * Subscribe connection to specific event types
   */
  subscribe(connectionId: string, eventTypes: string[]): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    for (const eventType of eventTypes) {
      connection.subscriptions.add(eventType);
    }

    logger.info('SSE subscription added', {
      connectionId,
      eventTypes,
      totalSubscriptions: connection.subscriptions.size
    });

    return true;
  }

  /**
   * Unsubscribe connection from event types
   */
  unsubscribe(connectionId: string, eventTypes: string[]): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    for (const eventType of eventTypes) {
      connection.subscriptions.delete(eventType);
    }

    logger.info('SSE subscription removed', {
      connectionId,
      eventTypes,
      totalSubscriptions: connection.subscriptions.size
    });

    return true;
  }

  /**
   * Send event only to subscribed connections
   */
  sendToSubscribers(eventType: string, event: SSEEvent): number {
    let sentCount = 0;
    
    for (const [connectionId, connection] of this.connections) {
      if (connection.subscriptions.has(eventType)) {
        if (this.sendToConnection(connectionId, event)) {
          sentCount++;
        }
      }
    }

    logger.info('SSE event sent to subscribers', {
      eventType,
      sentCount,
      totalConnections: this.connections.size
    });

    return sentCount;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    userConnections: number;
    averageSubscriptions: number;
  } {
    const totalConnections = this.connections.size;
    const userConnections = this.userConnections.size;
    
    let totalSubscriptions = 0;
    for (const connection of this.connections.values()) {
      totalSubscriptions += connection.subscriptions.size;
    }
    const averageSubscriptions = totalConnections > 0 ? totalSubscriptions / totalConnections : 0;

    return {
      totalConnections,
      userConnections,
      averageSubscriptions
    };
  }

  /**
   * Format event as SSE data
   */
  private formatSSEEvent(event: SSEEvent): string {
    let sseData = '';
    
    if (event.id) {
      sseData += `id: ${event.id}\n`;
    }
    
    if (event.retry) {
      sseData += `retry: ${event.retry}\n`;
    }
    
    sseData += `event: ${event.type}\n`;
    sseData += `data: ${JSON.stringify(event.data)}\n\n`;
    
    return sseData;
  }

  /**
   * Start heartbeat for connection
   */
  private startHeartbeat(connectionId: string): void {
    const heartbeatInterval = setInterval(() => {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        clearInterval(heartbeatInterval);
        return;
      }

      // Check if connection is still alive
      const now = Date.now();
      if (now - connection.lastPing > 30000) { // 30 seconds timeout
        logger.warn('SSE connection timeout', { connectionId });
        this.removeConnection(connectionId);
        clearInterval(heartbeatInterval);
        return;
      }

      // Send heartbeat
      this.sendToConnection(connectionId, {
        type: 'heartbeat',
        data: { timestamp: now }
      });
    }, 10000); // Send heartbeat every 10 seconds
  }
}

// Global SSE service instance
export const sseService = new RealtimeSSEService();

/**
 * Create SSE response for Cloudflare Workers
 */
export function createSSEResponse(userId: string): Response {
  const { connectionId, stream } = sseService.createConnection(userId);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Connection-ID': connectionId
    }
  });
}

/**
 * SSE Event Types
 */
export const SSE_EVENT_TYPES = {
  // Calendar Events
  CALENDAR_EVENT_CREATED: 'calendar.event.created',
  CALENDAR_EVENT_UPDATED: 'calendar.event.updated',
  CALENDAR_EVENT_DELETED: 'calendar.event.deleted',
  CALENDAR_SYNC_STARTED: 'calendar.sync.started',
  CALENDAR_SYNC_COMPLETED: 'calendar.sync.completed',
  CALENDAR_CONFLICT_DETECTED: 'calendar.conflict.detected',

  // Task Events
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',

  // Focus Session Events
  FOCUS_SESSION_STARTED: 'focus.session.started',
  FOCUS_SESSION_COMPLETED: 'focus.session.completed',
  FOCUS_SESSION_PAUSED: 'focus.session.paused',

  // Health Events
  HEALTH_DATA_SYNCED: 'health.data.synced',
  HEALTH_GOAL_ACHIEVED: 'health.goal.achieved',
  HEALTH_INSIGHT_GENERATED: 'health.insight.generated',

  // Notification Events
  NOTIFICATION_RECEIVED: 'notification.received',
  NOTIFICATION_READ: 'notification.read',

  // System Events
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  HEARTBEAT: 'heartbeat',
  ERROR: 'error'
} as const;

export type SSEEventType = typeof SSE_EVENT_TYPES[keyof typeof SSE_EVENT_TYPES];
