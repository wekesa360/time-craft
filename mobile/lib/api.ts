// Unified API client for Time & Wellness Mobile Application
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../stores/auth';
import type {
  LoginForm,
  RegisterForm,
  User,
  Task,
  HealthLog,
  ExercisePayload,
  NutritionPayload,
  MoodPayload,
  HydrationPayload,
  Achievement,
  CalendarEvent,
  FocusSession,
  PaginatedResponse,
  AuthTokens,
} from '../types';

// Type aliases for compatibility
type AuthResponse = {
  user?: User;
  tokens?: AuthTokens;
  message?: string;
  requiresVerification?: boolean;
  otpId?: string;
  expiresAt?: number;
  email?: string;
};

type TaskForm = {
  title: string;
  description?: string;
  priority: number;
  dueDate?: string;
  estimatedDuration?: number;
};

type ExerciseData = ExercisePayload;
type NutritionData = NutritionPayload;
type MoodData = MoodPayload;
type HydrationData = HydrationPayload;
type Badge = Achievement;
type Notification = any; // Notification type not defined in types

// Simple notification system for React Native
export const notify = {
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.error('ERROR:', message),
  info: (message: string) => console.log('INFO:', message),
};

// API Configuration - Read from environment variable
const resolveApiBaseUrl = (): string => {
  // 1) Check environment variable first (from .env file)
  const envUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl;
  }

  // 2) Platform-aware sensible defaults for local dev
  if (Platform.OS === 'android') {
    // Android emulator loopback to host machine
    return 'http://10.0.2.2:8787';
  }
  if (Platform.OS === 'ios') {
    return 'http://localhost:8787';
  }
  return 'http://localhost:8787';
};

const API_BASE_URL = __DEV__
  ? resolveApiBaseUrl()
  : (process.env.EXPO_PUBLIC_API_URL || 'https://your-production-api.com');

export const getApiBaseUrl = () => API_BASE_URL;

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private baseURL: string;
  private onAuthInvalid?: () => void;

  constructor() {
    this.baseURL = API_BASE_URL;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API Client initialized with base URL:', this.baseURL);
    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token and proactively refresh if needed
    this.client.interceptors.request.use(
      async (config) => {
        // Check if token is expired or about to expire, and refresh proactively
        await this.ensureValidToken();
        
        const token = await this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh and errors
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
              
              // Update both the auth store (Zustand) and API client
              // This ensures the token is persisted and available for subsequent requests
              useAuthStore.getState().setTokens(tokens);
              await this.setTokens(tokens);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              console.log('✅ Token refreshed, retrying request with new token');
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
    const method = ((error.config as any)?.method || '').toString().toUpperCase();
    const url = `${(error.config as any)?.baseURL || ''}${(error.config as any)?.url || ''}`;
    const status = error.response?.status;
    let responseData = error.response?.data as any;
    
    // Parse responseData if it's a string
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch {
        // If parsing fails, keep as string
      }
    }
    
    const message = (responseData && (responseData.error || responseData.message)) ||
      (status ? `HTTP ${status}` : 'An error occurred');

    // Skip error handling for email verification errors - handled by redirect in LoginScreen
    if (responseData?.requiresVerification) {
      return;
    }

    if (error.response) {
      // Structured error console to aid debugging
      const snippet = typeof responseData === 'string'
        ? responseData.slice(0, 300)
        : JSON.stringify(responseData)?.slice(0, 300);
      console.error('[API ERROR]', { method, url, status, response: snippet });
      if (error.response.status !== 401) {
        notify.error(message);
      }
    } else if (error.request) {
      console.error('[API ERROR - NETWORK]', { method, url });
      notify.error('Network error. Please check your connection.');
    } else {
      console.error('[API ERROR - UNEXPECTED]', { method, url, error: error.message });
      notify.error('An unexpected error occurred.');
    }
  }

  private redirectToLogin() {
    if (this.onAuthInvalid) {
      try {
        this.onAuthInvalid();
      } catch (e) {
        // noop
      }
    } else {
      // Fallback log to aid debugging if no handler is attached
      console.log('Redirecting to login...');
    }
  }

  // Allow external stores to subscribe to auth invalidation events
  setAuthInvalidHandler(handler: () => void) {
    this.onAuthInvalid = handler;
  }

  // Token management using SecureStore
  private async getStoredToken(): Promise<string | null> {
    try {
      // Try both key formats for compatibility
      return await SecureStore.getItemAsync('access_token') || 
             await SecureStore.getItemAsync('accessToken');
    } catch {
      return null;
    }
  }

  private async getStoredRefreshToken(): Promise<string | null> {
    try {
      // Try both key formats for compatibility
      return await SecureStore.getItemAsync('refresh_token') || 
             await SecureStore.getItemAsync('refreshToken');
    } catch {
      return null;
    }
  }

  async setTokens(tokens: AuthTokens | { accessToken: string; refreshToken: string }) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;

    try {
      // Store in both formats for compatibility
      await SecureStore.setItemAsync('access_token', tokens.accessToken);
      await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
      
      // Store token expiration time for proactive refresh
      try {
        const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
        if (payload.exp) {
          await SecureStore.setItemAsync('token_expiry', payload.exp.toString());
        }
      } catch (error) {
        console.warn('Could not parse token expiration:', error);
      }
    } catch (error) {
      console.error('Failed to save tokens to storage:', error);
    }
  }

  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;

    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('token_expiry');
      await SecureStore.deleteItemAsync('user');
    } catch (error) {
      console.error('Failed to clear tokens from storage:', error);
    }
  }

  private async loadTokensFromStorage() {
    try {
      this.accessToken = await this.getStoredToken();
      this.refreshToken = await this.getStoredRefreshToken();
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
    }
  }

  private async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const response = await axios.post(`${this.baseURL}/auth/refresh`, {
      refreshToken,
    });
    return response.data.tokens;
  }

  /**
   * Check if token is expired or will expire soon
   * @param bufferMinutes Minutes before expiration to consider token as "expired" (default: 5)
   */
  private async isTokenExpired(bufferMinutes: number = 5): Promise<boolean> {
    try {
      const expiryStr = await SecureStore.getItemAsync('token_expiry');
      if (!expiryStr) {
        // No expiry stored, assume expired to be safe
        return true;
      }

      const expiryTime = parseInt(expiryStr) * 1000; // Convert to milliseconds
      const now = Date.now();
      const bufferMs = bufferMinutes * 60 * 1000;

      // Consider expired if expires within buffer time
      return now >= (expiryTime - bufferMs);
    } catch (error) {
      console.warn('Error checking token expiration:', error);
      // On error, assume expired to be safe
      return true;
    }
  }

  /**
   * Ensure token is valid by proactively refreshing if needed
   * This is called before each request to keep the user logged in
   */
  async ensureValidToken(): Promise<void> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) {
        // No refresh token, can't refresh
        return;
      }

      // Check if token is expired or about to expire
      const isExpired = await this.isTokenExpired(5); // Refresh 5 minutes before expiration
      
      if (isExpired) {
        console.log('🔄 Token expired or expiring soon, refreshing proactively...');
        try {
          const tokens = await this.refreshTokens(refreshToken);
          
          // Update both the auth store (Zustand) and API client
          useAuthStore.getState().setTokens(tokens);
          await this.setTokens(tokens);
          
          console.log('✅ Token refreshed proactively');
        } catch (refreshError) {
          console.error('❌ Proactive token refresh failed:', refreshError);
          // Don't clear tokens here - let the 401 handler deal with it
          // This prevents race conditions
        }
      }
    } catch (error) {
      console.warn('Error ensuring valid token:', error);
      // Don't throw - allow request to proceed
    }
  }

  // HTTP Methods
  async get(url: string, config?: AxiosRequestConfig) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post(url, data, config);
  }

  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put(url, data, config);
  }

  async patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch(url, data, config);
  }

  async delete(url: string, config?: AxiosRequestConfig) {
    return this.client.delete(url, config);
  }

  // Auth Methods
  async login(email: string, password: string) {
    try {
      const response = await this.post('/auth/login', { email, password });
      const { user, tokens } = response.data;
      
      if (tokens) {
        await this.setTokens(tokens);
      }
      return { user, tokens };
    } catch (error: any) {
      // Check if error is due to unverified email
      let responseData = error.response?.data;
      
      // Parse if string
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch {
          // Keep as string if parsing fails
        }
      }
      
      if (responseData?.requiresVerification && responseData?.email) {
        // Create a new error object with verification info
        const verificationError: any = new Error(responseData.error || 'Email not verified');
        verificationError.requiresVerification = true;
        verificationError.email = responseData.email;
        verificationError.response = error.response;
        throw verificationError;
      }
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    timezone?: string;
    preferredLanguage?: string;
    isStudent?: boolean;
  }) {
    const response = await this.post('/auth/register', userData);
    const data = response.data;
    
    // If verification is required, return the verification info
    if (data.requiresVerification) {
      return {
        requiresVerification: true,
        email: data.email || userData.email,
        otpId: data.otpId,
        expiresAt: data.expiresAt
      };
    }
    
    // Otherwise, complete registration with tokens
    if (data.user && data.tokens) {
      await this.setTokens(data.tokens);
      return { user: data.user, tokens: data.tokens };
    }
    
    return data;
  }

  async verifyEmail(email: string, otpCode: string) {
    const response = await this.post('/auth/verify-email', { email, otpCode });
    const { user, tokens } = response.data;
    
    if (tokens) {
      await this.setTokens(tokens);
    }
    return { user, tokens };
  }

  async resendVerification(email: string) {
    const response = await this.post('/auth/resend-verification', { email });
    return response.data;
  }

  async logout() {
    try {
      if (this.refreshToken) {
        await this.post('/auth/logout', { refreshToken: this.refreshToken });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await this.clearTokens();
    }
  }

  async forgotPassword(email: string) {
    const response = await this.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await this.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }

  async validateToken(): Promise<{ valid: boolean; payload: any }> {
    const response = await this.get('/auth/validate');
    return response.data;
  }

  // OTP Methods
  async sendOTP(email: string) {
    const response = await this.post('/api/otp/send-otp', { email });
    return response.data;
  }

  async verifyOTP(email: string, code: string) {
    const response = await this.post('/api/otp/verify-otp', { email, otpCode: code });
    
    if (response.data.success && response.data.data) {
      const { user, accessToken, refreshToken } = response.data.data;
      if (accessToken && refreshToken) {
        await this.setTokens({ accessToken, refreshToken });
      }
      return {
        success: true,
        data: {
          user,
          accessToken,
          refreshToken
        }
      };
    }
    
    return response.data;
  }

  // User/Profile Methods
  async getProfile(): Promise<User> {
    const response = await this.get('/api/user/profile');
    return response.data.user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.put('/api/user/profile', data);
    return response.data.user;
  }

  // User Preferences
  async getUserPreferences(): Promise<any> {
    const response = await this.get('/api/user/preferences');
    // backend returns { success: true, preferences }
    return (response.data && (response.data.preferences || response.data)) as any;
  }

  async updateUserPreferences(partial: any): Promise<any> {
    const response = await this.put('/api/user/preferences', partial);
    // backend returns { success: true, message, preferences }
    return (response.data && (response.data.preferences || response.data)) as any;
  }

  // Dashboard Methods
  async getDashboardStats() {
    const response = await this.get('/api/dashboard');
    return response.data;
  }

  async getRecentActivities() {
    const response = await this.get('/api/dashboard');
    return response.data;
  }

  // Tasks Methods
  async getTasks(params?: { 
    status?: string; 
    priority?: number; 
    contextType?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.get('/api/tasks', { params });
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.get(`/api/tasks/${id}`);
    return response.data.task;
  }

  async createTask(task: {
    title: string;
    description?: string;
    priority: number | string;
    dueDate?: string | number | Date;
    estimatedDuration?: number | string;
    energyLevelRequired?: number | string;
    contextType?: string;
    urgency?: number | string;
    importance?: number | string;
    matrixNotes?: string;
    isDelegated?: boolean;
    delegatedTo?: string;
    delegationNotes?: string;
  }) {
    const payload: any = { ...task };
    if (payload.priority !== undefined) payload.priority = Number(payload.priority);
    if (payload.estimatedDuration !== undefined) payload.estimatedDuration = Number(payload.estimatedDuration);
    if (payload.energyLevelRequired !== undefined) payload.energyLevelRequired = Number(payload.energyLevelRequired);
    if (payload.urgency !== undefined) payload.urgency = Number(payload.urgency);
    if (payload.importance !== undefined) payload.importance = Number(payload.importance);
    if (payload.dueDate !== undefined) {
      if (typeof payload.dueDate === 'number') {
        // keep as-is
      } else if (payload.dueDate instanceof Date) {
        payload.dueDate = payload.dueDate.getTime();
      } else {
        const ts = Date.parse(payload.dueDate);
        if (!Number.isNaN(ts)) payload.dueDate = ts;
      }
    }
    const response = await this.post('/api/tasks', payload);
    return response.data;
  }

  async updateTask(taskId: string, updates: any) {
    const payload: any = { ...updates };
    if (payload.priority !== undefined) payload.priority = Number(payload.priority);
    if (payload.estimatedDuration !== undefined) payload.estimatedDuration = Number(payload.estimatedDuration);
    if (payload.energyLevelRequired !== undefined) payload.energyLevelRequired = Number(payload.energyLevelRequired);
    if (payload.urgency !== undefined) payload.urgency = Number(payload.urgency);
    if (payload.importance !== undefined) payload.importance = Number(payload.importance);
    if (payload.dueDate !== undefined) {
      if (typeof payload.dueDate === 'number') {
        // keep as-is
      } else if (payload.dueDate instanceof Date) {
        payload.dueDate = payload.dueDate.getTime();
      } else {
        const ts = Date.parse(payload.dueDate);
        if (!Number.isNaN(ts)) payload.dueDate = ts;
      }
    }
    const response = await this.put(`/api/tasks/${taskId}`, payload);
    return response.data;
  }

  async deleteTask(taskId: string) {
    const response = await this.delete(`/api/tasks/${taskId}`);
    return response.data;
  }

  async getTaskStats() {
    const response = await this.get('/api/tasks/stats');
    return response.data;
  }

  async completeTask(taskId: string) {
    const response = await this.patch(`/api/tasks/${taskId}/complete`);
    return response.data;
  }

  async getMatrix() {
    const response = await this.get('/api/tasks/matrix');
    return response.data;
  }

  async categorizeTasksWithAI() {
    const response = await this.post('/api/matrix/categorize');
    return response.data;
  }

  async updateTaskMatrix(taskId: string, urgency: number, importance: number) {
    const response = await this.patch(`/api/tasks/${taskId}/matrix`, { urgency, importance });
    return response.data;
  }

  // Health Methods
  async getHealthLogs(params?: { 
    type?: string; 
    limit?: number | string; 
    startDate?: number | string; 
    endDate?: number | string;
    offset?: number | string;
  }) {
    const coerced: any = { ...params };
    if (coerced?.limit !== undefined) coerced.limit = Number(coerced.limit);
    if (coerced?.offset !== undefined) coerced.offset = Number(coerced.offset);
    if (coerced?.startDate !== undefined) coerced.startDate = Number(coerced.startDate);
    if (coerced?.endDate !== undefined) coerced.endDate = Number(coerced.endDate);
    const response = await this.get('/api/health/logs', { params: coerced });
    return response.data;
  }

  async getHealthStats(params?: { period?: string }) {
    try {
      const response = await this.get('/api/health/stats', { params });
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 500) {
        // Fallback to summary endpoint and map minimal fields used by the app
        const summaryRes = await this.get('/api/health/summary');
        const summary = summaryRes.data?.summary || {};
        const hydrationAvgMl = summary?.hydration?.averageDaily ?? 0;
        const mapped = {
          stats: {
            caloriesBurned: 0,
            averageMood: summary?.mood?.averageScore ?? 0,
            averageSleep: 0,
            waterIntake: Math.round((hydrationAvgMl / 1000) * 10) / 10,
          },
        };
        return mapped;
      }
      throw err;
    }
  }

  async createHealthLog(log: {
    type: 'exercise' | 'mood' | 'nutrition' | 'hydration' | 'sleep' | 'weight';
    value: number | string;
    unit?: string;
    notes?: string;
    category?: string;
    recordedAt?: string | number;
  }) {
    const payload: any = {
      type: log.type,
      value: Number(log.value),
      unit: log.unit,
      notes: log.notes,
      category: log.category,
    };
    if (log.recordedAt !== undefined) {
      payload.recordedAt = typeof log.recordedAt === 'number' ? log.recordedAt : Date.parse(String(log.recordedAt));
    }
    const response = await this.post('/api/health/manual-entry', payload);
    return response.data;
  }

  async logExercise(data: ExerciseData): Promise<HealthLog> {
    const d: any = { ...data };
    if (d.durationMinutes !== undefined) d.durationMinutes = Number(d.durationMinutes);
    if (d.intensity !== undefined && typeof d.intensity !== 'number') {
      // allow string labels to pass through; backend supports simple format too
      if (['low', 'moderate', 'high'].includes(String(d.intensity))) {
        // leave as-is
      } else {
        d.intensity = Number(d.intensity);
      }
    }
    if (d.caloriesBurned !== undefined) d.caloriesBurned = Number(d.caloriesBurned);
    if (d.distance !== undefined) d.distance = Number(d.distance);
    if (d.heartRateAvg !== undefined) d.heartRateAvg = Number(d.heartRateAvg);
    if (d.heartRateMax !== undefined) d.heartRateMax = Number(d.heartRateMax);
    if (d.recordedAt !== undefined) d.recordedAt = Number(d.recordedAt);
    const response = await this.post('/api/health/exercise', d);
    return response.data.log;
  }

  async logNutrition(data: NutritionData): Promise<HealthLog> {
    const d: any = { ...data };
    if (Array.isArray(d.foods)) {
      d.foods = d.foods.map((f: any) => ({
        ...f,
        calories: f?.calories !== undefined ? Number(f.calories) : f?.calories,
      }));
    }
    if (d.totalCalories !== undefined) d.totalCalories = Number(d.totalCalories);
    if (d.waterMl !== undefined) d.waterMl = Number(d.waterMl);
    if (d.recordedAt !== undefined) d.recordedAt = Number(d.recordedAt);
    const response = await this.post('/api/health/nutrition', d);
    return response.data.log;
  }

  async logMood(data: MoodData): Promise<HealthLog> {
    const d: any = { ...data };
    if (d.score !== undefined) d.score = Number(d.score);
    if (d.energy !== undefined) d.energy = Number(d.energy);
    if (d.stress !== undefined) d.stress = Number(d.stress);
    if (d.recordedAt !== undefined) d.recordedAt = Number(d.recordedAt);
    const response = await this.post('/api/health/mood', d);
    return response.data.log;
  }

  async logHydration(data: HydrationData): Promise<HealthLog> {
    const d: any = { ...data };
    if (d.amountMl !== undefined) d.amountMl = Number(d.amountMl);
    if (d.recordedAt !== undefined) d.recordedAt = Number(d.recordedAt);
    const response = await this.post('/api/health/hydration', d);
    return response.data.log;
  }

  async getHealthSummary(): Promise<any> {
    const response = await this.get('/api/health/summary');
    return response.data; // { summary, timeframe, period }
  }

  // Focus Methods
  async getFocusTemplates() {
    const response = await this.get('/api/focus/templates');
    return response.data;
  }

  async getFocusSessions(params?: { limit?: number }) {
    const response = await this.get('/api/focus/sessions', { params });
    return response.data;
  }

  async getFocusStats(params?: { period?: string }) {
    const response = await this.get('/api/focus/stats/weekly', { params });
    return response.data;
  }

  async createFocusSession(session: {
    sessionType: string;
    plannedDuration: number;
    templateId?: string;
  }) {
    const response = await this.post('/api/focus/sessions', session);
    return response.data;
  }

  async updateFocusSession(sessionId: string, updates: any) {
    const response = await this.patch(`/api/focus/sessions/${sessionId}`, updates);
    return response.data;
  }

  async startFocusSession(data: {
    duration: number;
    taskId?: string;
    type: 'pomodoro' | 'deep_work' | 'break';
  }): Promise<FocusSession> {
    const payload = {
      session_type: data.type,
      planned_duration: Number(data.duration),
      task_id: data.taskId,
    };
    const response = await this.post('/api/focus/sessions', payload);
    return response.data.data;
  }

  async completeFocusSession(
    id: string,
    data: { actualDuration: number; wasProductive: boolean; notes?: string }
  ): Promise<FocusSession> {
    const payload = {
      actual_duration: Number(data.actualDuration),
      is_successful: data.wasProductive,
      notes: data.notes,
    };
    const response = await this.post(`/api/focus/sessions/${id}/complete`, payload);
    return response.data.data;
  }

  // Calendar Methods
  async getEvents(params?: { start?: number; end?: number; type?: string }) {
    const response = await this.get('/api/calendar/events', { params });
    return response.data;
  }

  async createEvent(eventData: Partial<{
    title: string;
    description?: string;
    startTime: number;
    endTime: number;
    location?: string;
    eventType: string;
    isAllDay?: boolean;
  }>) {
    // Transform event data to match backend format
    const backendData: any = {
      title: eventData.title,
      description: eventData.description,
      eventType: eventData.eventType || 'appointment',
      isAllDay: eventData.isAllDay || false,
    };

    // Handle date conversion
    if (eventData.startTime) {
      backendData.startTime = typeof eventData.startTime === 'number' 
        ? eventData.startTime 
        : new Date(eventData.startTime).getTime();
    }
    if (eventData.endTime) {
      backendData.endTime = typeof eventData.endTime === 'number'
        ? eventData.endTime
        : new Date(eventData.endTime).getTime();
    }

    if (eventData.location) {
      backendData.location = eventData.location;
    }

    const response = await this.post('/api/calendar/events', backendData);
    return response.data;
  }

  async updateEvent(eventId: string, updates: any) {
    const response = await this.put(`/api/calendar/events/${eventId}`, updates);
    return response.data;
  }

  async deleteEvent(eventId: string) {
    const response = await this.delete(`/api/calendar/events/${eventId}`);
    return response.data;
  }

  async getCalendarIntegrations(): Promise<any[]> {
    const response = await this.get('/api/calendar/connections');
    return response.data.connections || [];
  }

  async connectCalendar(provider: string, authData: any): Promise<any> {
    const response = await this.post('/api/calendar/connect', {
      provider,
      ...authData
    });
    return response.data;
  }

  async disconnectCalendar(connectionId: string): Promise<void> {
    await this.delete(`/api/calendar/connections/${connectionId}`);
  }

  async syncCalendars(): Promise<{ imported: number; exported: number; errors: string[] }> {
    const response = await this.post('/api/calendar/sync');
    return response.data.result;
  }

  async getGoogleAuthUrl(): Promise<{ authUrl: string; state: string }> {
    const response = await this.get('/api/calendar/google/auth');
    return response.data;
  }

  // Badge/Achievement Methods
  async getAchievements() {
    const response = await this.get('/api/badges');
    return response.data;
  }

  async getUserAchievements() {
    const response = await this.get('/api/badges/user');
    return response.data;
  }

  async getBadges(): Promise<{ badges: Achievement[]; totalPoints: number }> {
    const response = await this.get('/api/badges/user');
    return response.data;
  }

  async getAvailableBadges(): Promise<{
    badges: Achievement[];
    totalAvailable: number;
    totalUnlocked: number;
  }> {
    const response = await this.get('/api/badges/available');
    return response.data;
  }

  async checkBadges(): Promise<{
    newBadges: Achievement[];
    totalNewPoints: number;
  }> {
    const response = await this.post('/api/badges/check');
    return response.data;
  }

  async getBadgeLeaderboard(): Promise<{ leaderboard: any[]; userRank: number }> {
    const response = await this.get('/api/badges/leaderboard');
    return response.data;
  }

  async shareBadge(data: { badgeId: string; platform: 'instagram' | 'whatsapp' | 'twitter' | 'facebook' | 'linkedin' | 'email'; message?: string }) {
    const payload: any = { platform: data.platform };
    if (data.message) payload.customMessage = data.message;
    const response = await this.post(`/api/badges/${data.badgeId}/share`, payload);
    return response.data;
  }

  // Notification Methods
  async getNotifications(): Promise<any[]> {
    const response = await this.get('/api/notifications');
    return response.data.notifications;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.post(`/api/notifications/${id}/opened`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.put('/api/notifications/read-all');
  }

  // Analytics Methods
  async getAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<{
    tasks: any;
    health: any;
    focus: any;
    productivity: any;
  }> {
    const response = await this.get(`/api/analytics/overview?period=${period}`);
    return response.data.overview;
  }

  // Social Methods
  async getSocialFeed(params?: { limit?: number; offset?: number }) {
    const response = await this.get('/api/social/feed', { params });
    return response.data;
  }

  async getConnections(params?: { status?: 'pending' | 'accepted' | 'blocked' }) {
    const response = await this.get('/api/social/connections', { params });
    return response.data;
  }

  async sendConnectionRequest(data: { email?: string; message?: string; addresseeId?: string; type?: 'friend' | 'family' | 'colleague' | 'accountability_partner' }) {
    const response = await this.post('/api/social/connections/request', data);
    return response.data;
  }

  async acceptConnectionRequest(connectionId: string) {
    const response = await this.post(`/api/social/connections/${connectionId}/accept`, {});
    return response.data;
  }

  async rejectConnectionRequest(connectionId: string) {
    const response = await this.post(`/api/social/connections/${connectionId}/reject`, {});
    return response.data;
  }

  async declineConnectionRequest(connectionId: string) {
    const response = await this.post(`/api/social/connections/${connectionId}/decline`, {});
    return response.data;
  }

  async getPublicChallenges(params?: { limit?: number }) {
    const response = await this.get('/api/social/challenges/public', { params });
    return response.data;
  }

  async getMyChallenges() {
    const response = await this.get('/api/social/challenges/my');
    return response.data;
  }

  async createChallenge(data: { title: string; description?: string; challenge_type: 'habit' | 'goal' | 'fitness' | 'mindfulness'; start_date: number; end_date: number; max_participants?: number; is_public?: boolean; reward_type?: string; reward_description?: string; }) {
    const response = await this.post('/api/social/challenges', data);
    return response.data;
  }

  async joinChallenge(challengeId: string) {
    const response = await this.post(`/api/social/challenges/${challengeId}/join`, {});
    return response.data;
  }

  async leaveChallenge(challengeId: string) {
    const response = await this.post(`/api/social/challenges/${challengeId}/leave`, {});
    return response.data;
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Test connection method
  async testConnection() {
    try {
      const response = await this.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;
