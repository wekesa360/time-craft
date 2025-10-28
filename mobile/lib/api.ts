// API client for Time & Wellness Mobile Application
import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
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
  Notification,
  PaginatedResponse,
  AuthTokens,
} from '../types';

// Simple notification system for React Native
export const notify = {
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.error('ERROR:', message),
  info: (message: string) => console.log('INFO:', message),
};

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // TODO: Replace with your backend URL or use env variable
    this.baseURL = 'http://localhost:8787'; // Your Hono backend
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const refreshToken = await this.getStoredRefreshToken();
          if (refreshToken) {
            try {
              const tokens = await this.refreshTokens(refreshToken);
              await this.setTokens(tokens);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              return this.client.request(originalRequest);
            } catch (refreshError) {
              await this.clearTokens();
              this.redirectToLogin();
              return Promise.reject(refreshError);
            }
          } else {
            await this.clearTokens();
            this.redirectToLogin();
          }
        }

        // Handle other errors
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleApiError(error: AxiosError) {
    if (error.response?.data) {
      const errorData = error.response.data as any;
      const message = errorData.error || errorData.message || 'An error occurred';
      
      // Don't show notification for authentication errors (handled separately)
      if (error.response.status !== 401) {
        notify.error(message);
      }
    } else if (error.request) {
      notify.error('Network error. Please check your connection.');
    } else {
      notify.error('An unexpected error occurred.');
    }
  }

  private redirectToLogin() {
    // TODO: Implement navigation to login screen
    console.log('Redirecting to login...');
  }

  // Token management using SecureStore
  private async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('accessToken');
    } catch {
      return null;
    }
  }

  private async getStoredRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('refreshToken');
    } catch {
      return null;
    }
  }

  async setTokens(tokens: AuthTokens) {
    try {
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  async clearTokens() {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
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
    await this.clearTokens();
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
    const response = await this.client.get<{ user: User }>('/users/profile');
    return response.data.user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.client.put<{ user: User }>('/users/profile', data);
    return response.data.user;
  }

  // Task endpoints
  async getTasks(params?: {
    status?: string;
    priority?: number;
    contextType?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Task[]>> {
    const response = await this.client.get<PaginatedResponse<Task[]>>('/tasks', { params });
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.client.get<{ task: Task }>(`/tasks/${id}`);
    return response.data.task;
  }

  async createTask(data: TaskForm): Promise<Task> {
    const response = await this.client.post<{ task: Task }>('/tasks', data);
    return response.data.task;
  }

  async updateTask(id: string, data: Partial<TaskForm>): Promise<Task> {
    const response = await this.client.put<{ task: Task }>(`/tasks/${id}`, data);
    return response.data.task;
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/tasks/${id}`);
  }

  async getTaskStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const response = await this.client.get('/tasks/stats');
    return response.data.stats;
  }

  // Health endpoints
  async getHealthLogs(params?: {
    type?: string;
    startDate?: number;
    endDate?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<HealthLog[]>> {
    const response = await this.client.get<PaginatedResponse<HealthLog[]>>('/health/logs', { params });
    return response.data;
  }

  async logExercise(data: ExerciseData): Promise<HealthLog> {
    const response = await this.client.post<{ log: HealthLog }>('/health/exercise', data);
    return response.data.log;
  }

  async logNutrition(data: NutritionData): Promise<HealthLog> {
    const response = await this.client.post<{ log: HealthLog }>('/health/nutrition', data);
    return response.data.log;
  }

  async logMood(data: MoodData): Promise<HealthLog> {
    const response = await this.client.post<{ log: HealthLog }>('/health/mood', data);
    return response.data.log;
  }

  async logHydration(data: HydrationData): Promise<HealthLog> {
    const response = await this.client.post<{ log: HealthLog }>('/health/hydration', data);
    return response.data.log;
  }

  async getHealthSummary(): Promise<{
    exerciseCount: number;
    nutritionCount: number;
    hydrationTotal: number;
    moodAverage: number;
  }> {
    const response = await this.client.get('/health/summary');
    return response.data.summary;
  }

  // Focus endpoints
  async startFocusSession(data: {
    duration: number;
    taskId?: string;
    type: 'pomodoro' | 'deep_work' | 'break';
  }): Promise<FocusSession> {
    const response = await this.client.post<{ session: FocusSession }>('/focus/start', data);
    return response.data.session;
  }

  async completeFocusSession(
    id: string,
    data: { actualDuration: number; wasProductive: boolean; notes?: string }
  ): Promise<FocusSession> {
    const response = await this.client.post<{ session: FocusSession }>(`/focus/${id}/complete`, data);
    return response.data.session;
  }

  async getFocusSessions(): Promise<FocusSession[]> {
    const response = await this.client.get<{ sessions: FocusSession[] }>('/focus/sessions');
    return response.data.sessions;
  }

  // Badge endpoints
  async getBadges(): Promise<{ badges: Badge[]; totalPoints: number }> {
    const response = await this.client.get('/badges/user');
    return response.data;
  }

  async getAvailableBadges(): Promise<{
    badges: Badge[];
    totalAvailable: number;
    totalUnlocked: number;
  }> {
    const response = await this.client.get('/badges/available');
    return response.data;
  }

  async checkBadges(): Promise<{
    newBadges: Badge[];
    totalNewPoints: number;
  }> {
    const response = await this.client.post('/badges/check');
    return response.data;
  }

  // Calendar endpoints
  async getEvents(params?: {
    start?: number;
    end?: number;
    type?: string;
  }): Promise<PaginatedResponse<CalendarEvent[]>> {
    const response = await this.client.get<PaginatedResponse<CalendarEvent[]>>('/calendar/events', { params });
    return response.data;
  }

  async createEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await this.client.post<{ event: CalendarEvent }>('/calendar/events', data);
    return response.data.event;
  }

  async updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await this.client.put<{ event: CalendarEvent }>(`/calendar/events/${id}`, data);
    return response.data.event;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.client.delete(`/calendar/events/${id}`);
  }

  // Calendar Integration endpoints
  async getCalendarIntegrations(): Promise<any[]> {
    const response = await this.client.get('/calendar/connections');
    return response.data.connections || [];
  }

  async connectCalendar(provider: string, authData: any): Promise<any> {
    const response = await this.client.post('/calendar/connect', {
      provider,
      ...authData
    });
    return response.data;
  }

  async disconnectCalendar(connectionId: string): Promise<void> {
    await this.client.delete(`/calendar/connections/${connectionId}`);
  }

  async syncCalendars(): Promise<{ imported: number; exported: number; errors: string[] }> {
    const response = await this.client.post('/calendar/sync');
    return response.data.result;
  }

  async getGoogleAuthUrl(): Promise<{ authUrl: string; state: string }> {
    const response = await this.client.get('/calendar/google/auth');
    return response.data;
  }

  // Notification endpoints
  async getNotifications(): Promise<Notification[]> {
    const response = await this.client.get<{ notifications: Notification[] }>('/notifications');
    return response.data.notifications;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.client.put(`/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.client.put('/notifications/read-all');
  }

  // Analytics endpoints
  async getAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<{
    tasks: any;
    health: any;
    focus: any;
    productivity: any;
  }> {
    const response = await this.client.get(`/analytics/overview?period=${period}`);
    return response.data.overview;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;