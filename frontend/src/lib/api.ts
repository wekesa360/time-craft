// API client for Time & Wellness Application
import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from './queryClient';
import type {
  AuthResponse,
  LoginForm,
  RegisterForm,
  User,
  Task,
  TaskForm,
  HealthLog,
  ExerciseData,
  NutritionData,
  MoodData,
  HydrationData,
  Badge,
  CalendarEvent,
  FocusSession,
  SessionTemplate,
  Distraction,
  FocusEnvironment,
  Notification,
  NotificationPreferences,
  PaginatedResponse,
  AuthTokens,
  EisenhowerMatrix,
  MatrixStats,
  HealthInsights,
  HealthGoal,
  Connection,
  Challenge,
  ActivityFeedItem,
  LeaderboardEntry,
  VoiceNote,
  VoiceCommand,
  VoiceSettings,
  VoiceAnalytics,
  MeetingRequest,
  TimeSlot,
  StudentVerification,
  StudentPricing,
  Language,
  LocalizationContent,
  AdminStats,
  SupportTicket,
  SystemMetrics,
  FeatureFlag,
  QueuedRequest,
} from '../types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private sseConnection: EventSource | null = null;
  private offlineQueue: QueuedRequest[] = [];
  private isOnline: boolean = navigator.onLine;
  private sseReconnectAttempts: number = 0;
  private maxSseReconnectAttempts: number = 5;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';
    const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');
    console.log('API Client initialized with baseURL:', this.baseURL);
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: timeout,
    });

    this.setupInterceptors();
    this.setupOfflineHandling();
    this.loadOfflineQueue();
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Check if we have tokens and validate them
    const token = this.getStoredToken();
    if (token) {
      try {
        await this.ensureValidToken();
        // Connect to SSE if we have valid tokens
        this.connectSSE();
      } catch (error) {
        console.error('Auth initialization failed:', error);
        this.clearTokens();
      }
    }
  }

  private loadOfflineQueue() {
    try {
      const stored = localStorage.getItem('offlineQueue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
        // Clean up old requests (older than 24 hours)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.offlineQueue = this.offlineQueue.filter(req => req.timestamp > oneDayAgo);
        localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private setupInterceptors() {
    // Request interceptor to add auth token and request metadata
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = crypto.randomUUID();

        // Add client info
        config.headers['X-Client-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.0';
        config.headers['X-Client-Platform'] = 'web';

        // Log requests in development
        if (import.meta.env.DEV) {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params);
        }

        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
          console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const refreshToken = this.getStoredRefreshToken();
          if (refreshToken) {
            try {
              console.log('🔄 Refreshing expired token...');
              const tokens = await this.refreshTokens(refreshToken);
              this.setTokens(tokens);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              console.log('✅ Token refreshed, retrying request');
              return this.client.request(originalRequest);
            } catch (refreshError) {
              console.error('❌ Token refresh failed:', refreshError);
              this.clearTokens();
              this.redirectToLogin();
              return Promise.reject(refreshError);
            }
          } else {
            console.warn('⚠️ No refresh token available');
            this.clearTokens();
            this.redirectToLogin();
          }
        }

        // Handle rate limiting with exponential backoff
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '1');
          const delay = Math.min(retryAfter * 1000, 30000); // Max 30 seconds
          
          console.log(`⏳ Rate limited, retrying in ${delay}ms`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.client.request(originalRequest);
        }

        // Handle server errors with retry for safe methods
        if (error.response?.status >= 500 && originalRequest.method === 'get' && !originalRequest._serverRetry) {
          originalRequest._serverRetry = true;
          console.log('🔄 Server error, retrying GET request...');
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.client.request(originalRequest);
        }

        // Handle other errors
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleApiError(error: AxiosError) {
    const status = error.response?.status;
    const errorData = error.response?.data as any;
    
    // Handle different error types
    switch (status) {
      case 400:
        // Use getErrorMessage to safely extract error messages
        const errorMessage = getErrorMessage(error, 'Invalid request');
        toast.error(errorMessage);
        break;
        
      case 401:
        // Authentication errors are handled by interceptor
        break;
        
      case 403:
        toast.error('You do not have permission to perform this action');
        break;
        
      case 404:
        toast.error('The requested resource was not found');
        break;
        
      case 409:
        toast.error(getErrorMessage(error, 'Conflict: Resource already exists'));
        break;
        
      case 422:
        toast.error(getErrorMessage(error, 'Validation failed'));
        break;
        
      case 429:
        const retryAfter = error.response?.headers['retry-after'];
        toast.error(`Too many requests. Please try again ${retryAfter ? `in ${retryAfter} seconds` : 'later'}`);
        break;
        
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error('Server error. Please try again later');
        // Queue request for retry if it was a mutation
        if (error.config?.method !== 'get') {
          this.queueRequestForRetry(error.config);
        }
        break;
        
      default:
        if (error.request && !error.response) {
          // Network error
          toast.error('Network error. Please check your connection');
          if (!this.isOnline) {
            this.queueRequestForRetry(error.config);
          }
        } else {
          toast.error(getErrorMessage(error, 'An unexpected error occurred'));
        }
    }
    
    // Log error for monitoring
    console.error('API Error:', {
      status,
      url: error.config?.url,
      method: error.config?.method,
      error: errorData,
    });
  }

  private queueRequestForRetry(config: any) {
    if (!config || config.method === 'get') return;
    
    this.queueRequest({
      method: config.method.toUpperCase(),
      url: config.url,
      data: config.data,
    });
    
    toast.success('Request queued for retry when connection is restored');
  }

  private redirectToLogin() {
    // This will be handled by the auth store
    window.location.href = '/login';
  }

  private setupOfflineHandling() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>) {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    this.offlineQueue.push(queuedRequest);
    localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
  }

  private async syncOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queue) {
      try {
        await this.retryRequest(request);
        toast.success('Offline request synced successfully');
      } catch (error) {
        // Re-queue failed requests with retry limit and exponential backoff
        if (request.retryCount < 3) {
          const backoffDelay = Math.pow(2, request.retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            this.offlineQueue.push({
              ...request,
              retryCount: request.retryCount + 1,
            });
          }, backoffDelay);
        } else {
          console.error('Failed to sync offline request after 3 retries:', request);
          toast.error('Some offline changes could not be synced');
        }
      }
    }

    localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
  }

  private async retryRequest(request: QueuedRequest): Promise<any> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.request({
          method: request.method,
          url: request.url,
          data: request.data,
        });
        return response.data;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // Server-Sent Events methods
  connectSSE() {
    if (this.sseConnection?.readyState === EventSource.OPEN) return;

    const token = this.getStoredToken();
    if (!token) {
      console.warn('Cannot connect to SSE without authentication token');
      return;
    }

    const sseUrl = `${this.baseURL}/api/realtime/sse`;
    this.sseConnection = new EventSource(`${sseUrl}?token=${token}`);

    this.sseConnection.onopen = () => {
      console.log('SSE connected');
      this.sseReconnectAttempts = 0;
      toast.success('Real-time updates connected');
    };

    this.sseConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleSSEMessage(message);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    this.sseConnection.onerror = (error) => {
      console.error('SSE error:', error);
      this.handleSSEReconnect();
    };

    // Listen for all SSE event types
    const eventTypes = [
      // Calendar Events
      'calendar.event.created',
      'calendar.event.updated', 
      'calendar.event.deleted',
      'calendar.sync.started',
      'calendar.sync.completed',
      'calendar.conflict.detected',
      
      // Task Events
      'task.created',
      'task.updated',
      'task.completed',
      'task.deleted',
      'task.reminder',
      
      // Focus Session Events
      'focus.session.started',
      'focus.session.completed',
      'focus.session.paused',
      'focus.session.resumed',
      'focus.session.cancelled',
      
      // Health Events
      'health.log.created',
      'health.insight.generated',
      'health.goal.achieved',
      'health.goal.updated',
      
      // Social Events
      'social.connection.request',
      'social.connection.accepted',
      'social.challenge.created',
      'social.challenge.completed',
      'social.achievement.unlocked',
      
      // Notification Events
      'notification.received',
      'notification.read',
      'notification.deleted',
      
      // Badge Events
      'badge.unlocked',
      'badge.progress.updated',
      
      // System Events
      'system.maintenance.scheduled',
      'system.update.available',
      'system.alert',
      
      // Connection Events
      'connected',
      'disconnected',
      'heartbeat',
      'error'
    ];

    eventTypes.forEach(eventType => {
      this.sseConnection.addEventListener(eventType, (event) => {
        const data = JSON.parse(event.data);
        this.handleSSEMessage({ type: eventType, data });
      });
    });
  }

  private handleSSEMessage(message: any) {
    // Emit custom events for different message types
    const event = new CustomEvent('sse-message', { detail: message });
    window.dispatchEvent(event);

    // Handle specific message types
    switch (message.type) {
      // Calendar Events
      case 'calendar.event.created':
        toast.success(`📅 Calendar event created: ${message.data.title}`);
        break;
      case 'calendar.event.updated':
        toast.success(`📅 Calendar event updated: ${message.data.title}`);
        break;
      case 'calendar.event.deleted':
        toast.success(`📅 Calendar event deleted: ${message.data.title}`);
        break;
      case 'calendar.sync.started':
        toast.success('📅 Calendar sync started...');
        break;
      case 'calendar.sync.completed':
        toast.success('📅 Calendar sync completed');
        break;
      case 'calendar.conflict.detected':
        toast.error(`⚠️ Calendar conflict detected: ${message.data.message}`);
        break;

      // Task Events
      case 'task.created':
        toast.success(`✅ Task created: ${message.data.title}`);
        break;
      case 'task.updated':
        toast.success(`📝 Task updated: ${message.data.title}`);
        break;
      case 'task.completed':
        toast.success(`🎉 Task completed: ${message.data.title}`);
        break;
      case 'task.deleted':
        toast.success(`🗑️ Task deleted: ${message.data.title}`);
        break;
      case 'task.reminder':
        toast.success(`⏰ Task reminder: ${message.data.title}`);
        break;

      // Focus Session Events
      case 'focus.session.started':
        toast.success(`🎯 Focus session started: ${message.data.duration} minutes`);
        break;
      case 'focus.session.completed':
        toast.success(`🎯 Focus session completed! Rating: ${message.data.rating}/10`);
        break;
      case 'focus.session.paused':
        toast.success('⏸️ Focus session paused');
        break;
      case 'focus.session.resumed':
        toast.success('▶️ Focus session resumed');
        break;
      case 'focus.session.cancelled':
        toast.success('❌ Focus session cancelled');
        break;

      // Health Events
      case 'health.log.created':
        toast.success(`💪 Health log recorded: ${message.data.type}`);
        break;
      case 'health.insight.generated':
        toast.success(`💡 Health insight: ${message.data.message}`);
        break;
      case 'health.goal.achieved':
        toast.success(`🏆 Health goal achieved: ${message.data.goal}`);
        break;
      case 'health.goal.updated':
        toast.success(`📊 Health goal updated: ${message.data.goal}`);
        break;

      // Social Events
      case 'social.connection.request':
        toast.success(`👥 New connection request from ${message.data.from}`);
        break;
      case 'social.connection.accepted':
        toast.success(`👥 Connection accepted: ${message.data.name}`);
        break;
      case 'social.challenge.created':
        toast.success(`🏆 New challenge: ${message.data.title}`);
        break;
      case 'social.challenge.completed':
        toast.success(`🏆 Challenge completed: ${message.data.title}`);
        break;
      case 'social.achievement.unlocked':
        toast.success(`🎉 Achievement unlocked: ${message.data.achievement}`);
        break;

      // Notification Events
      case 'notification.received':
        if (message.data.priority === 'high' || message.data.priority === 'urgent') {
          toast.error(message.data.message);
        } else {
          toast.success(message.data.message);
        }
        break;
      case 'notification.read':
        // Silent - no toast needed
        break;
      case 'notification.deleted':
        // Silent - no toast needed
        break;

      // Badge Events
      case 'badge.unlocked':
        toast.success(`🎉 Badge unlocked: ${message.data.name}!`, {
          duration: 5000,
        });
        break;
      case 'badge.progress.updated':
        toast.success(`🏆 Badge progress: ${message.data.progress}%`);
        break;

      // System Events
      case 'system.maintenance.scheduled':
        toast.error(`🔧 System maintenance scheduled: ${message.data.message}`);
        break;
      case 'system.update.available':
        toast.success(`🔄 System update available: ${message.data.version}`);
        break;
      case 'system.alert':
        toast.error(`⚠️ System alert: ${message.data.message}`);
        break;

      // Connection Events
      case 'connected':
        toast.success('🔗 Real-time connection established');
        break;
      case 'disconnected':
        toast.error('🔌 Real-time connection lost');
        break;
      case 'heartbeat':
        // Silent - no toast needed
        break;
      case 'error':
        toast.error(`❌ Real-time error: ${message.data.message}`);
        break;

      // Legacy event types (for backward compatibility)
      case 'badge_unlocked':
        toast.success(`🎉 Badge unlocked: ${message.data.name}!`, {
          duration: 5000,
        });
        break;
      case 'challenge_update':
        toast.success(`Challenge update: ${message.data.title}`);
        break;
      case 'notification':
        if (message.data.priority === 'high' || message.data.priority === 'urgent') {
          toast.error(message.data.message);
        } else {
          toast.success(message.data.message);
        }
        break;
      case 'task_reminder':
        toast.success(`⏰ Task reminder: ${message.data.title}`);
        break;
      case 'health_insight':
        toast.success(`💡 Health insight: ${message.data.message}`);
        break;
      case 'focus_session_complete':
        toast.success(`🎯 Focus session completed! Rating: ${message.data.rating}/10`);
        break;
    }
  }

  private handleSSEReconnect() {
    if (this.sseReconnectAttempts >= this.maxSseReconnectAttempts) {
      console.error('Max SSE reconnection attempts reached');
      toast.error('Real-time updates disconnected. Please refresh the page.');
      return;
    }

    this.sseReconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.sseReconnectAttempts), 30000); // Max 30s delay

    console.log(`SSE reconnecting in ${delay}ms (attempt ${this.sseReconnectAttempts})`);
    
    setTimeout(() => {
      this.disconnectSSE();
      this.connectSSE();
    }, delay);
  }

  subscribeToUpdates(callback: (data: any) => void) {
    const handleMessage = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener('sse-message', handleMessage as EventListener);
    
    // Return unsubscribe function
    return () => {
      window.removeEventListener('sse-message', handleMessage as EventListener);
    };
  }

  disconnectSSE() {
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
      this.sseReconnectAttempts = 0;
    }
  }

  // Check if SSE is connected
  isSSEConnected(): boolean {
    return this.sseConnection?.readyState === EventSource.OPEN;
  }

  // Token management
  private getStoredToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  setTokens(tokens: AuthTokens) {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    
    // Store token expiration time if available
    try {
      const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
      if (payload.exp) {
        localStorage.setItem('tokenExpiry', payload.exp.toString());
      }
    } catch (error) {
      console.warn('Could not parse token expiration:', error);
    }
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    
    // Disconnect SSE when tokens are cleared
    this.disconnectSSE();
  }

  // Check if token is expired or will expire soon
  isTokenExpired(): boolean {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return false;
    
    const expiryTime = parseInt(expiry) * 1000; // Convert to milliseconds
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return now >= (expiryTime - fiveMinutes); // Consider expired if expires within 5 minutes
  }

  // Proactively refresh token if it's about to expire
  async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) {
      const refreshToken = this.getStoredRefreshToken();
      if (refreshToken) {
        try {
          const tokens = await this.refreshTokens(refreshToken);
          this.setTokens(tokens);
        } catch (error) {
          console.error('Proactive token refresh failed:', error);
          this.clearTokens();
          this.redirectToLogin();
        }
      }
    }
  }

  // Auth endpoints
  async register(data: RegisterForm): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async login(data: LoginForm): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    this.clearTokens();
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const response = await this.client.post<{ tokens: AuthTokens }>('/auth/refresh', {
      refreshToken,
    });
    return response.data.tokens;
  }

  async forgotPassword(email: string): Promise<void> {
    await this.client.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.client.post('/auth/reset-password', { token, newPassword });
  }

  async validateToken(): Promise<{ valid: boolean; payload: any }> {
    const response = await this.client.get('/auth/validate');
    return response.data;
  }

  // User endpoints
  async getProfile(): Promise<User> {
    const response = await this.client.get<{ user: User }>('/api/user/profile');
    return response.data.user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.client.put<{ user: User }>('/api/user/profile', data);
    return response.data.user;
  }

  // Task endpoints
  async getTasks(params?: {
    status?: string;
    priority?: number;
    contextType?: string;
    search?: string;
    startDate?: number;
    endDate?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Task[]>> {
    const response = await this.client.get<PaginatedResponse<Task[]>>('/api/tasks', { params });
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.client.get<{ task: Task }>(`/api/tasks/${id}`);
    return response.data.task;
  }

  async createTask(data: TaskForm): Promise<Task> {
    const response = await this.client.post<{ task: Task }>('/api/tasks', data);
    return response.data.task;
  }

  async updateTask(id: string, data: Partial<TaskForm>): Promise<Task> {
    const response = await this.client.put<{ task: Task }>(`/api/tasks/${id}`, data);
    return response.data.task;
  }

  async completeTask(id: string): Promise<void> {
    await this.client.patch(`/api/tasks/${id}/complete`);
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/api/tasks/${id}`);
  }

  async getTaskStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const response = await this.client.get('/api/tasks/stats');
    return response.data.stats;
  }

  // Eisenhower Matrix endpoints
  async getEisenhowerMatrix(): Promise<EisenhowerMatrix> {
    const response = await this.client.get<{ matrix: EisenhowerMatrix }>('/api/tasks/matrix');
    return response.data.matrix;
  }

  async getMatrixStats(): Promise<MatrixStats> {
    const response = await this.client.get<{ stats: MatrixStats }>('/api/tasks/matrix/stats');
    return response.data.stats;
  }

  async updateTaskMatrix(id: string, urgency: number, importance: number): Promise<Task> {
    const response = await this.client.patch<{ task: Task }>(`/api/tasks/${id}/matrix`, {
      urgency,
      importance,
    });
    return response.data.task;
  }

  // Health endpoints
  async getHealthLogs(params?: {
    type?: string;
    startDate?: number;
    endDate?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<HealthLog[]>> {
    const response = await this.client.get<PaginatedResponse<HealthLog[]>>('/api/health/logs', { params });
    return response.data;
  }

  async logExercise(data: ExerciseData): Promise<HealthLog> {
    const response = await this.client.post<{ log: HealthLog }>('/api/health/exercise', data);
    return response.data.log;
  }

  async logNutrition(data: NutritionData): Promise<HealthLog> {
    const response = await this.client.post<{ log: HealthLog }>('/api/health/nutrition', data);
    return response.data.log;
  }

  async logMood(data: MoodData): Promise<HealthLog> {
    const response = await this.client.post<{ log: HealthLog }>('/api/health/mood', data);
    return response.data.log;
  }

  async logHydration(data: HydrationData): Promise<HealthLog> {
    const response = await this.client.post<{ log: HealthLog }>('/api/health/hydration', data);
    return response.data.log;
  }

  async getHealthSummary(days?: number): Promise<{
    exerciseCount: number;
    nutritionCount: number;
    hydrationTotal: number;
    moodAverage: number;
  }> {
    const response = await this.client.get('/api/health/summary', { params: { days } });
    return response.data.summary;
  }

  // Health Insights endpoints
  async getHealthInsights(days?: number): Promise<HealthInsights> {
    const response = await this.client.get<{ insights: HealthInsights }>('/api/health/insights', {
      params: { days },
    });
    return response.data.insights;
  }

  async createHealthGoal(data: Omit<HealthGoal, 'id' | 'userId' | 'progress' | 'isActive'>): Promise<HealthGoal> {
    const response = await this.client.post<{ goal: HealthGoal }>('/api/health/goals', data);
    return response.data.goal;
  }

  async getHealthGoals(): Promise<HealthGoal[]> {
    const response = await this.client.get<{ goals: HealthGoal[] }>('/api/health/goals');
    return response.data.goals;
  }

  async updateHealthGoal(id: string, data: Partial<HealthGoal>): Promise<HealthGoal> {
    const response = await this.client.put<{ goal: HealthGoal }>(`/api/health/goals/${id}`, data);
    return response.data.goal;
  }

  async deleteHealthGoal(id: string): Promise<void> {
    await this.client.delete(`/api/health/goals/${id}`);
  }

  // Focus endpoints
  async getFocusTemplates(): Promise<SessionTemplate[]> {
    const response = await this.client.get<{ templates: SessionTemplate[] }>('/api/focus/templates');
    return response.data.templates;
  }

  async startFocusSession(data: {
    templateKey: string;
    taskId?: string;
    environmentId?: string;
  }): Promise<FocusSession> {
    const response = await this.client.post<{ session: FocusSession }>('/api/focus/sessions', data);
    return response.data.session;
  }

  async getFocusSessions(params?: {
    status?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
  }): Promise<FocusSession[]> {
    const response = await this.client.get<{ sessions: FocusSession[] }>('/api/focus/sessions', { params });
    return response.data.sessions;
  }

  async getFocusSession(id: string): Promise<FocusSession> {
    const response = await this.client.get<{ session: FocusSession }>(`/api/focus/sessions/${id}`);
    return response.data.session;
  }

  async completeFocusSession(
    id: string,
    data: { actualEndTime: number; productivityRating: number; notes?: string }
  ): Promise<FocusSession> {
    const response = await this.client.patch<{ session: FocusSession }>(`/api/focus/sessions/${id}/complete`, data);
    return response.data.session;
  }

  async pauseFocusSession(id: string): Promise<FocusSession> {
    const response = await this.client.patch<{ session: FocusSession }>(`/api/focus/sessions/${id}/pause`);
    return response.data.session;
  }

  async resumeFocusSession(id: string): Promise<FocusSession> {
    const response = await this.client.patch<{ session: FocusSession }>(`/api/focus/sessions/${id}/resume`);
    return response.data.session;
  }

  async cancelFocusSession(id: string): Promise<FocusSession> {
    const response = await this.client.patch<{ session: FocusSession }>(`/api/focus/sessions/${id}/cancel`);
    return response.data.session;
  }

  async logDistraction(sessionId: string, data: { type: string; description?: string }): Promise<Distraction> {
    const response = await this.client.post<{ distraction: Distraction }>(`/api/focus/sessions/${sessionId}/distractions`, data);
    return response.data.distraction;
  }

  async getSessionDistractions(sessionId: string): Promise<Distraction[]> {
    const response = await this.client.get<{ distractions: Distraction[] }>(`/api/focus/sessions/${sessionId}/distractions`);
    return response.data.distractions;
  }

  async getFocusDashboard(): Promise<any> {
    const response = await this.client.get('/api/focus/dashboard');
    return response.data;
  }

  async getFocusAnalytics(period?: string): Promise<any> {
    const response = await this.client.get('/api/focus/analytics', { params: { period } });
    return response.data;
  }

  async getFocusEnvironments(): Promise<FocusEnvironment[]> {
    const response = await this.client.get<{ environments: FocusEnvironment[] }>('/api/focus/environments');
    return response.data.environments;
  }

  async createFocusEnvironment(data: Omit<FocusEnvironment, 'id' | 'userId'>): Promise<FocusEnvironment> {
    const response = await this.client.post<{ environment: FocusEnvironment }>('/api/focus/environments', data);
    return response.data.environment;
  }

  // Badge endpoints
  async getBadges(): Promise<{ badges: Badge[]; totalBadges: number; unlockedBadges: number }> {
    const response = await this.client.get('/api/badges/user');
    return response.data;
  }

  async shareBadge(data: { badgeId: string; platform: string; message?: string }): Promise<void> {
    await this.client.post('/api/badges/share', data);
  }

  async getBadgeLeaderboard(): Promise<LeaderboardEntry[]> {
    const response = await this.client.get<{ leaderboard: LeaderboardEntry[] }>('/api/badges/leaderboard');
    return response.data.leaderboard;
  }

  // Calendar endpoints
  async getEvents(params?: {
    start?: number;
    end?: number;
    type?: string;
  }): Promise<PaginatedResponse<CalendarEvent[]>> {
    const response = await this.client.get<PaginatedResponse<CalendarEvent[]>>('/api/calendar/events', { params });
    return response.data;
  }

  async createEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await this.client.post<{ event: CalendarEvent }>('/api/calendar/events', data);
    return response.data.event;
  }

  async updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await this.client.put<{ event: CalendarEvent }>(`/api/calendar/events/${id}`, data);
    return response.data.event;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.client.delete(`/api/calendar/events/${id}`);
  }

  // Notification endpoints
  async registerDevice(data: { deviceToken: string; platform: string; appVersion: string }): Promise<{ deviceId: string }> {
    const response = await this.client.post<{ deviceId: string }>('/api/notifications/devices/register', data);
    return response.data;
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await this.client.get<{ preferences: NotificationPreferences }>('/api/notifications/preferences');
    return response.data.preferences;
  }

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    const response = await this.client.put<{ preferences: NotificationPreferences }>('/api/notifications/preferences', preferences);
    return response.data.preferences;
  }

  async sendNotification(data: { type: string; title: string; message: string; data?: any }): Promise<{ notificationId: string }> {
    const response = await this.client.post<{ notificationId: string }>('/api/notifications/send', data);
    return response.data;
  }

  async getNotificationHistory(params?: { limit?: number; type?: string }): Promise<Notification[]> {
    const response = await this.client.get<{ notifications: Notification[] }>('/api/notifications/history', { params });
    return response.data.notifications;
  }

  async getNotificationTemplates(): Promise<any[]> {
    const response = await this.client.get('/api/notifications/templates');
    return response.data.templates;
  }

  // Social Features endpoints
  async sendConnectionRequest(data: { email: string; message?: string }): Promise<{ connectionId: string }> {
    const response = await this.client.post<{ connectionId: string }>('/api/social/connections/request', data);
    return response.data;
  }

  async getConnections(): Promise<{ connections: Connection[]; pendingRequests: Connection[] }> {
    const response = await this.client.get('/api/social/connections');
    return response.data;
  }

  async acceptConnection(id: string): Promise<void> {
    await this.client.post(`/api/social/connections/${id}/accept`);
  }

  async declineConnection(id: string): Promise<void> {
    await this.client.post(`/api/social/connections/${id}/decline`);
  }

  async createChallenge(data: Omit<Challenge, 'id' | 'createdBy' | 'participants' | 'leaderboard' | 'isActive'>): Promise<Challenge> {
    const response = await this.client.post<{ challenge: Challenge }>('/api/social/challenges', data);
    return response.data.challenge;
  }

  async getPublicChallenges(): Promise<Challenge[]> {
    const response = await this.client.get<{ challenges: Challenge[] }>('/api/social/challenges/public');
    return response.data.challenges;
  }

  async getChallenges(): Promise<Challenge[]> {
    const response = await this.client.get<{ challenges: Challenge[] }>('/api/social/challenges');
    return response.data.challenges;
  }

  async joinChallenge(id: string): Promise<void> {
    await this.client.post(`/api/social/challenges/${id}/join`);
  }

  async leaveChallenge(id: string): Promise<void> {
    await this.client.post(`/api/social/challenges/${id}/leave`);
  }

  async acceptConnectionRequest(id: string): Promise<void> {
    await this.client.post(`/api/social/connections/${id}/accept`);
  }

  async declineConnectionRequest(id: string): Promise<void> {
    await this.client.post(`/api/social/connections/${id}/decline`);
  }

  async shareAchievement(data: { type: string; content: any; platform?: string }): Promise<void> {
    await this.client.post('/api/social/achievements/share', data);
  }

  async getActivityFeed(): Promise<ActivityFeedItem[]> {
    const response = await this.client.get<{ feed: ActivityFeedItem[] }>('/api/social/feed');
    return response.data.feed;
  }

  // Voice Processing endpoints
  async uploadVoiceNote(audioFile: File, language?: string): Promise<VoiceNote> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    if (language) formData.append('language', language);
    formData.append('processType', 'transcribe_and_analyze');

    const response = await this.client.post<{ voiceNote: VoiceNote }>('/api/voice/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.voiceNote;
  }

  async getVoiceNotes(params?: { limit?: number; offset?: number; startDate?: number; endDate?: number }): Promise<{ notes: VoiceNote[]; total: number }> {
    const response = await this.client.get('/api/voice/notes', { params });
    return response.data;
  }

  async getVoiceNote(id: string): Promise<VoiceNote> {
    const response = await this.client.get<{ note: VoiceNote }>(`/api/voice/notes/${id}`);
    return response.data.note;
  }

  async getVoiceNoteAudio(id: string): Promise<Blob> {
    const response = await this.client.get(`/api/voice/notes/${id}/audio`, { responseType: 'blob' });
    return response.data;
  }

  async interpretVoiceCommand(data: { transcription: string; context?: string }): Promise<VoiceCommand> {
    const response = await this.client.post<{ interpretation: VoiceCommand }>('/api/voice/commands/interpret', data);
    return response.data.interpretation;
  }

  async executeVoiceCommand(data: { intent: string; parameters: Record<string, any> }): Promise<{ success: boolean; result: any }> {
    const response = await this.client.post('/api/voice/commands/execute', data);
    return response.data;
  }

  async getVoiceAnalytics(): Promise<VoiceAnalytics> {
    const response = await this.client.get<{ analytics: VoiceAnalytics }>('/api/voice/analytics/usage');
    return response.data.analytics;
  }

  async getVoiceAccuracyAnalytics(): Promise<any> {
    const response = await this.client.get('/api/voice/analytics/accuracy');
    return response.data;
  }

  async getVoiceSettings(): Promise<VoiceSettings> {
    const response = await this.client.get<{ settings: VoiceSettings }>('/api/voice/settings');
    return response.data.settings;
  }

  async updateVoiceSettings(settings: Partial<VoiceSettings>): Promise<VoiceSettings> {
    const response = await this.client.put<{ settings: VoiceSettings }>('/api/voice/settings', settings);
    return response.data.settings;
  }

  // AI Meeting Scheduling endpoints
  async createMeetingRequest(data: Omit<MeetingRequest, 'id' | 'suggestedSlots' | 'status' | 'createdBy' | 'createdAt'>): Promise<MeetingRequest> {
    const response = await this.client.post<{ meetingRequest: MeetingRequest }>('/api/calendar/meetings/request', data);
    return response.data.meetingRequest;
  }

  async getMeetingRequests(): Promise<MeetingRequest[]> {
    const response = await this.client.get<{ requests: MeetingRequest[] }>('/api/calendar/meetings/requests');
    return response.data.requests;
  }

  async respondToMeeting(id: string, data: { response: 'accept' | 'decline'; selectedSlot?: TimeSlot }): Promise<{ meetingStatus: string }> {
    const response = await this.client.post(`/api/calendar/meetings/${id}/respond`, data);
    return response.data;
  }

  async checkAvailability(id: string, timeSlot: TimeSlot): Promise<{ available: boolean; conflicts: string[] }> {
    const response = await this.client.get(`/api/calendar/meetings/${id}/availability`, { params: timeSlot });
    return response.data;
  }

  async rescheduleMeeting(id: string, newTimeSlot: TimeSlot): Promise<MeetingRequest> {
    const response = await this.client.post<{ meeting: MeetingRequest }>(`/api/calendar/meetings/${id}/reschedule`, newTimeSlot);
    return response.data.meeting;
  }

  async cancelMeeting(id: string): Promise<void> {
    await this.client.delete(`/api/calendar/meetings/${id}`);
  }

  // Student Verification endpoints
  async getStudentPricing(): Promise<StudentPricing> {
    const response = await this.client.get<{ pricing: StudentPricing }>('/api/student-verification/pricing');
    return response.data.pricing;
  }

  async sendStudentVerificationOTP(studentEmail: string): Promise<{ expiresAt: number }> {
    const response = await this.client.post('/api/student-verification/user/send-otp', { studentEmail });
    return response.data;
  }

  async verifyStudentOTP(otp: string): Promise<void> {
    await this.client.post('/api/student-verification/user/verify-otp', { otp });
  }

  async getStudentVerificationStatus(): Promise<StudentVerification> {
    const response = await this.client.get<{ verification: StudentVerification }>('/api/student-verification/user/status');
    return response.data.verification;
  }

  // Student dashboard and analytics
  async getStudentStats(period: 'week' | 'month' | 'semester'): Promise<any> {
    const response = await this.client.get(`/api/student/stats?period=${period}`);
    return response.data;
  }

  async getStudentGoals(): Promise<any[]> {
    const response = await this.client.get('/api/student/goals');
    return response.data;
  }

  async getStudentSessions(period: 'week' | 'month' | 'semester'): Promise<any[]> {
    const response = await this.client.get(`/api/student/sessions?period=${period}`);
    return response.data;
  }

  async createStudentGoal(goal: any): Promise<any> {
    const response = await this.client.post('/api/student/goals', goal);
    return response.data;
  }

  async updateStudentGoal(goalId: string, updates: any): Promise<any> {
    const response = await this.client.put(`/api/student/goals/${goalId}`, updates);
    return response.data;
  }

  async deleteStudentGoal(goalId: string): Promise<void> {
    await this.client.delete(`/api/student/goals/${goalId}`);
  }

  async startStudySession(session: any): Promise<any> {
    const response = await this.client.post('/api/student/sessions', session);
    return response.data;
  }

  async endStudySession(sessionId: string, data: any): Promise<any> {
    const response = await this.client.put(`/api/student/sessions/${sessionId}/end`, data);
    return response.data;
  }

  // Notification methods
  async markNotificationAsRead(id: string): Promise<void> {
    await this.client.put(`/api/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.client.put('/api/notifications/read-all');
  }

  // Notification management methods
  async getNotifications(filter?: string): Promise<Notification[]> {
    const response = await this.client.get<{ notifications: Notification[] }>('/api/notifications', { 
      params: { filter } 
    });
    return response.data.notifications;
  }

  async deleteNotification(id: string): Promise<void> {
    await this.client.delete(`/api/notifications/${id}`);
  }

  async clearAllNotifications(): Promise<void> {
    await this.client.delete('/api/notifications/clear-all');
  }

  async create(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<Notification> {
    const response = await this.client.post<{ notification: Notification }>('/api/notifications', notification);
    return response.data.notification;
  }

  // Localization endpoints
  async getAvailableLanguages(): Promise<Language[]> {
    const response = await this.client.get<{ languages: Language[] }>('/api/localization/languages');
    return response.data.languages;
  }

  async getLocalizedContent(language: string): Promise<LocalizationContent> {
    const response = await this.client.get<{ localization: LocalizationContent }>(`/api/localization/content/${language}`);
    return response.data.localization;
  }



  async updateUserLanguage(language: string): Promise<void> {
    await this.client.put('/api/localization/user/language', { language });
  }

  // Additional user management endpoints
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.put('/api/user/password', { currentPassword, newPassword });
  }

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await this.client.post<{ user: User }>('/api/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.user;
  }

  async exportUserData(): Promise<any> {
    const response = await this.client.get('/api/user/export');
    return response.data;
  }

  async deleteAccount(): Promise<void> {
    await this.client.delete('/api/user/account');
  }

  async getUserSubscription(): Promise<any> {
    const response = await this.client.get('/api/user/subscription');
    return response.data.subscription;
  }

  // Admin Dashboard endpoints (admin only)
  async getAdminDashboard(): Promise<AdminStats> {
    const response = await this.client.get<{ stats: AdminStats }>('/api/admin/dashboard');
    return response.data.stats;
  }

  async getAdminAnalytics(): Promise<any> {
    const response = await this.client.get('/api/admin/analytics');
    return response.data;
  }

  async createSupportTicket(data: Omit<SupportTicket, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<SupportTicket> {
    const response = await this.client.post<{ ticket: SupportTicket }>('/api/admin/support-tickets', data);
    return response.data.ticket;
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await this.client.get<{ metrics: SystemMetrics }>('/api/admin/metrics');
    return response.data.metrics;
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const response = await this.client.get<{ flags: FeatureFlag[] }>('/api/admin/feature-flags');
    return response.data.flags;
  }

  async updateFeatureFlag(id: string, data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const response = await this.client.put<{ flag: FeatureFlag }>(`/api/admin/feature-flags/${id}`, data);
    return response.data.flag;
  }

  // Additional admin endpoints
  admin = {
    // System health and metrics
    getSystemHealth: async () => {
      const response = await this.client.get('/api/admin/system/health');
      return response.data;
    },

    getSystemMetrics: async () => {
      const response = await this.client.get('/api/admin/system/metrics');
      return response.data;
    },

    getResourceUsage: async () => {
      const response = await this.client.get('/api/admin/system/resources');
      return response.data;
    },

    getDatabaseMetrics: async () => {
      const response = await this.client.get('/api/admin/system/database');
      return response.data;
    },

    getApplicationMetrics: async () => {
      const response = await this.client.get('/api/admin/system/application');
      return response.data;
    },

    getRecentActivity: async () => {
      const response = await this.client.get('/api/admin/activity');
      return response.data;
    },

    getSystemAlerts: async () => {
      const response = await this.client.get('/api/admin/alerts');
      return response.data;
    },

    // User management
    getUsers: async (params?: {
      search?: string;
      role?: string;
      status?: string;
      plan?: string;
      studentVerified?: string;
      page?: number;
      limit?: number;
    }) => {
      const response = await this.client.get('/api/admin/users', { params });
      return response.data;
    },

    suspendUsers: async (userIds: string[]) => {
      const response = await this.client.post('/api/admin/users/suspend', { userIds });
      return response.data;
    },

    activateUsers: async (userIds: string[]) => {
      const response = await this.client.post('/api/admin/users/activate', { userIds });
      return response.data;
    },

    deleteUsers: async (userIds: string[]) => {
      const response = await this.client.post('/api/admin/users/delete', { userIds });
      return response.data;
    },

    // Feature flags management
    getFeatureFlags: async () => {
      const response = await this.client.get('/api/admin/feature-flags');
      return response.data;
    },

    createFeatureFlag: async (data: any) => {
      const response = await this.client.post('/api/admin/feature-flags', data);
      return response.data;
    },

    updateFeatureFlag: async (id: string, data: any) => {
      const response = await this.client.put(`/api/admin/feature-flags/${id}`, data);
      return response.data;
    },

    deleteFeatureFlag: async (id: string) => {
      const response = await this.client.delete(`/api/admin/feature-flags/${id}`);
      return response.data;
    },

    // Security endpoints
    getSecurityEvents: async (timeRange: string, filters?: any) => {
      const response = await this.client.get(`/api/admin/security/events?timeRange=${timeRange}`, { params: filters });
      return response.data;
    },

    getSecurityStats: async (timeRange: string) => {
      const response = await this.client.get(`/api/admin/security/stats?timeRange=${timeRange}`);
      return response.data;
    },

    getThreatIntelligence: async (timeRange: string) => {
      const response = await this.client.get(`/api/admin/security/threats?timeRange=${timeRange}`);
      return response.data;
    },

    getComplianceReport: async (timeRange: string) => {
      const response = await this.client.get(`/api/admin/security/compliance?timeRange=${timeRange}`);
      return response.data;
    },

    getAuditLogs: async (timeRange: string, filters?: any) => {
      const response = await this.client.get(`/api/admin/security/audit-logs?timeRange=${timeRange}`, { params: filters });
      return response.data;
    },

    getSecurityIncidents: async (timeRange: string, status?: string) => {
      const response = await this.client.get(`/api/admin/security/incidents?timeRange=${timeRange}${status ? `&status=${status}` : ''}`);
      return response.data;
    },

    getUserSecurityStatus: async (userId: string) => {
      const response = await this.client.get(`/api/admin/security/users/${userId}/status`);
      return response.data;
    },

    getSecurityPolicies: async () => {
      const response = await this.client.get('/api/admin/security/policies');
      return response.data;
    },

    getSecurityAlerts: async (timeRange: string) => {
      const response = await this.client.get(`/api/admin/security/alerts?timeRange=${timeRange}`);
      return response.data;
    },

    getDataAccessLogs: async (timeRange: string, userId?: string) => {
      const response = await this.client.get(`/api/admin/security/data-access?timeRange=${timeRange}${userId ? `&userId=${userId}` : ''}`);
      return response.data;
    },

    getApiAccessLogs: async (timeRange: string, endpoint?: string) => {
      const response = await this.client.get(`/api/admin/security/api-access?timeRange=${timeRange}${endpoint ? `&endpoint=${endpoint}` : ''}`);
      return response.data;
    },

    getSecurityMetrics: async (timeRange: string) => {
      const response = await this.client.get(`/api/admin/security/metrics?timeRange=${timeRange}`);
      return response.data;
    },

    getRiskAssessment: async (timeRange: string) => {
      const response = await this.client.get(`/api/admin/security/risk-assessment?timeRange=${timeRange}`);
      return response.data;
    },

    getSecurityRecommendations: async () => {
      const response = await this.client.get('/api/admin/security/recommendations');
      return response.data;
    },

    // Security actions
    blockUser: async (userId: string, reason: string) => {
      const response = await this.client.post(`/api/admin/security/users/${userId}/block`, { reason });
      return response.data;
    },

    unblockUser: async (userId: string) => {
      const response = await this.client.post(`/api/admin/security/users/${userId}/unblock`);
      return response.data;
    },

    blockIP: async (ipAddress: string, reason: string) => {
      const response = await this.client.post('/api/admin/security/block-ip', { ipAddress, reason });
      return response.data;
    },

    unblockIP: async (ipAddress: string) => {
      const response = await this.client.post('/api/admin/security/unblock-ip', { ipAddress });
      return response.data;
    },

    createSecurityAlert: async (data: any) => {
      const response = await this.client.post('/api/admin/security/alerts', data);
      return response.data;
    },

    updateSecurityPolicy: async (policyId: string, data: any) => {
      const response = await this.client.put(`/api/admin/security/policies/${policyId}`, data);
      return response.data;
    }
  };

  // Dashboard endpoint
  async getDashboardData(): Promise<any> {
    const response = await this.client.get('/api/dashboard');
    return response.data;
  }

  // Analytics endpoints
  async getAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<{
    tasks: any;
    health: any;
    focus: any;
    productivity: any;
  }> {
    const response = await this.client.get(`/api/analytics/overview?period=${period}`);
    return response.data.overview;
  }

  // Comprehensive Analytics API
  analytics = {
    // Dashboard data
    getDashboard: async (timeRange: string, category: string) => {
      const response = await this.client.get(`/api/analytics/dashboard?timeRange=${timeRange}&category=${category}`);
      return response.data;
    },

    // Task analytics
    getTaskAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/tasks?timeRange=${timeRange}`);
      return response.data;
    },

    // Health analytics
    getHealthAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/health?timeRange=${timeRange}`);
      return response.data;
    },

    // Focus analytics
    getFocusAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/focus?timeRange=${timeRange}`);
      return response.data;
    },

    // Social analytics
    getSocialAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/social?timeRange=${timeRange}`);
      return response.data;
    },

    // Productivity reports
    getProductivityReport: async (timeRange: string, reportType: string) => {
      const response = await this.client.get(`/api/analytics/productivity?timeRange=${timeRange}&type=${reportType}`);
      return response.data;
    },

    // User behavior analytics
    getUserBehaviorAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/behavior?timeRange=${timeRange}`);
      return response.data;
    },

    // Performance metrics
    getPerformanceMetrics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/performance?timeRange=${timeRange}`);
      return response.data;
    },

    // Goal tracking analytics
    getGoalAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/goals?timeRange=${timeRange}`);
      return response.data;
    },

    // Time tracking analytics
    getTimeTrackingAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/time?timeRange=${timeRange}`);
      return response.data;
    },

    // Habit analytics
    getHabitAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/habits?timeRange=${timeRange}`);
      return response.data;
    },

    // Mood analytics
    getMoodAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/mood?timeRange=${timeRange}`);
      return response.data;
    },

    // Energy level analytics
    getEnergyAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/energy?timeRange=${timeRange}`);
      return response.data;
    },

    // Stress level analytics
    getStressAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/stress?timeRange=${timeRange}`);
      return response.data;
    },

    // Sleep analytics
    getSleepAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/sleep?timeRange=${timeRange}`);
      return response.data;
    },

    // Exercise analytics
    getExerciseAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/exercise?timeRange=${timeRange}`);
      return response.data;
    },

    // Nutrition analytics
    getNutritionAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/nutrition?timeRange=${timeRange}`);
      return response.data;
    },

    // Hydration analytics
    getHydrationAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/hydration?timeRange=${timeRange}`);
      return response.data;
    },

    // Badge analytics
    getBadgeAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/badges?timeRange=${timeRange}`);
      return response.data;
    },

    // Challenge analytics
    getChallengeAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/challenges?timeRange=${timeRange}`);
      return response.data;
    },

    // Voice analytics
    getVoiceAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/voice?timeRange=${timeRange}`);
      return response.data;
    },

    // Calendar analytics
    getCalendarAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/calendar?timeRange=${timeRange}`);
      return response.data;
    },

    // Notification analytics
    getNotificationAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/notifications?timeRange=${timeRange}`);
      return response.data;
    },

    // System analytics (admin only)
    getSystemAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/system?timeRange=${timeRange}`);
      return response.data;
    },

    // User engagement analytics
    getEngagementAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/engagement?timeRange=${timeRange}`);
      return response.data;
    },

    // Retention analytics
    getRetentionAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/retention?timeRange=${timeRange}`);
      return response.data;
    },

    // Feature usage analytics
    getFeatureUsageAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/features?timeRange=${timeRange}`);
      return response.data;
    },

    // Error analytics
    getErrorAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/errors?timeRange=${timeRange}`);
      return response.data;
    },

    // Performance analytics
    getPerformanceAnalytics: async (timeRange: string) => {
      const response = await this.client.get(`/api/analytics/performance?timeRange=${timeRange}`);
      return response.data;
    },

    // Custom analytics query
    getCustomAnalytics: async (endpoint: string, params: Record<string, any>) => {
      const response = await this.client.get(`/api/analytics/${endpoint}`, { params });
      return response.data;
    }
  };

  // Convenience methods for analytics
  async getAnalyticsDashboard(timeRange: string, category: string) {
    return this.analytics.getDashboard(timeRange, category);
  }

  async getTaskAnalytics(timeRange: string) {
    return this.analytics.getTaskAnalytics(timeRange);
  }

  async getHealthAnalytics(timeRange: string) {
    return this.analytics.getHealthAnalytics(timeRange);
  }


  async getSocialAnalytics(timeRange: string) {
    return this.analytics.getSocialAnalytics(timeRange);
  }

  async getProductivityReport(timeRange: string, reportType: string) {
    return this.analytics.getProductivityReport(timeRange, reportType);
  }

  async getUserBehaviorAnalytics(timeRange: string) {
    return this.analytics.getUserBehaviorAnalytics(timeRange);
  }

  async getPerformanceMetrics(timeRange: string) {
    return this.analytics.getPerformanceMetrics(timeRange);
  }

  async getGoalAnalytics(timeRange: string) {
    return this.analytics.getGoalAnalytics(timeRange);
  }

  async getTimeTrackingAnalytics(timeRange: string) {
    return this.analytics.getTimeTrackingAnalytics(timeRange);
  }

  async getHabitAnalytics(timeRange: string) {
    return this.analytics.getHabitAnalytics(timeRange);
  }

  async getMoodAnalytics(timeRange: string) {
    return this.analytics.getMoodAnalytics(timeRange);
  }

  async getEnergyAnalytics(timeRange: string) {
    return this.analytics.getEnergyAnalytics(timeRange);
  }

  async getStressAnalytics(timeRange: string) {
    return this.analytics.getStressAnalytics(timeRange);
  }

  async getSleepAnalytics(timeRange: string) {
    return this.analytics.getSleepAnalytics(timeRange);
  }

  async getExerciseAnalytics(timeRange: string) {
    return this.analytics.getExerciseAnalytics(timeRange);
  }

  async getNutritionAnalytics(timeRange: string) {
    return this.analytics.getNutritionAnalytics(timeRange);
  }

  async getHydrationAnalytics(timeRange: string) {
    return this.analytics.getHydrationAnalytics(timeRange);
  }

  async getBadgeAnalytics(timeRange: string) {
    return this.analytics.getBadgeAnalytics(timeRange);
  }

  async getChallengeAnalytics(timeRange: string) {
    return this.analytics.getChallengeAnalytics(timeRange);
  }


  async getCalendarAnalytics(timeRange: string) {
    return this.analytics.getCalendarAnalytics(timeRange);
  }

  async getNotificationAnalytics(timeRange: string) {
    return this.analytics.getNotificationAnalytics(timeRange);
  }

  async getSystemAnalytics(timeRange: string) {
    return this.analytics.getSystemAnalytics(timeRange);
  }

  async getEngagementAnalytics(timeRange: string) {
    return this.analytics.getEngagementAnalytics(timeRange);
  }

  async getRetentionAnalytics(timeRange: string) {
    return this.analytics.getRetentionAnalytics(timeRange);
  }

  async getFeatureUsageAnalytics(timeRange: string) {
    return this.analytics.getFeatureUsageAnalytics(timeRange);
  }

  async getErrorAnalytics(timeRange: string) {
    return this.analytics.getErrorAnalytics(timeRange);
  }

  async getPerformanceAnalytics(timeRange: string) {
    return this.analytics.getPerformanceAnalytics(timeRange);
  }

  async getCustomAnalytics(endpoint: string, params: Record<string, any>) {
    return this.analytics.getCustomAnalytics(endpoint, params);
  }

  // Generic HTTP methods for external API modules
  async get(url: string, config?: any) {
    const response = await this.client.get(url, config);
    return response;
  }

  async post(url: string, data?: any, config?: any) {
    const response = await this.client.post(url, data, config);
    return response;
  }

  async put(url: string, data?: any, config?: any) {
    const response = await this.client.put(url, data, config);
    return response;
  }

  async delete(url: string, config?: any) {
    const response = await this.client.delete(url, config);
    return response;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;