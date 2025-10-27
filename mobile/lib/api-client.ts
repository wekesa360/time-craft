import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8787' // Local development
  : 'https://your-production-api.com'; // Production

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearTokens();
            // You might want to emit an event here to redirect to login
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async loadTokensFromStorage() {
    try {
      this.accessToken = await SecureStore.getItemAsync('access_token');
      this.refreshToken = await SecureStore.getItemAsync('refresh_token');
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
    }
  }

  async setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    try {
      await SecureStore.setItemAsync('access_token', accessToken);
      await SecureStore.setItemAsync('refresh_token', refreshToken);
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
    } catch (error) {
      console.error('Failed to clear tokens from storage:', error);
    }
  }

  private async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: this.refreshToken,
    });

    const { accessToken, refreshToken } = response.data;
    await this.setTokens(accessToken, refreshToken);
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
    const response = await this.post('/auth/login', { email, password });
    const { user, tokens } = response.data;
    
    await this.setTokens(tokens.accessToken, tokens.refreshToken);
    return { user, tokens };
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
    const { user, tokens } = response.data;
    
    await this.setTokens(tokens.accessToken, tokens.refreshToken);
    return { user, tokens };
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

  async googleLogin(idToken: string) {
    const response = await this.post('/auth/google', { idToken });
    const { user, tokens } = response.data;
    
    await this.setTokens(tokens.accessToken, tokens.refreshToken);
    return { user, tokens };
  }

  // Dashboard Methods
  async getDashboardStats() {
    const response = await this.get('/dashboard/stats');
    return response.data;
  }

  async getRecentActivities() {
    const response = await this.get('/dashboard/recent-activities');
    return response.data;
  }

  // Tasks Methods
  async getTasks(params?: { status?: string; priority?: number; limit?: number }) {
    const response = await this.get('/tasks', { params });
    return response.data;
  }

  async createTask(task: {
    title: string;
    description?: string;
    priority: number;
    dueDate?: string;
    estimatedDuration?: number;
  }) {
    const response = await this.post('/tasks', task);
    return response.data;
  }

  async updateTask(taskId: string, updates: any) {
    const response = await this.patch(`/tasks/${taskId}`, updates);
    return response.data;
  }

  async deleteTask(taskId: string) {
    const response = await this.delete(`/tasks/${taskId}`);
    return response.data;
  }

  // Health Methods
  async getHealthLogs(params?: { type?: string; limit?: number }) {
    const response = await this.get('/health/logs', { params });
    return response.data;
  }

  async createHealthLog(log: {
    type: string;
    payload: any;
    recordedAt?: string;
  }) {
    const response = await this.post('/health/logs', log);
    return response.data;
  }

  // Focus Methods
  async getFocusSessions(params?: { limit?: number }) {
    const response = await this.get('/focus/sessions', { params });
    return response.data;
  }

  async createFocusSession(session: {
    sessionType: string;
    plannedDuration: number;
    templateId?: string;
  }) {
    const response = await this.post('/focus/sessions', session);
    return response.data;
  }

  async updateFocusSession(sessionId: string, updates: any) {
    const response = await this.patch(`/focus/sessions/${sessionId}`, updates);
    return response.data;
  }

  // Achievements Methods
  async getAchievements() {
    const response = await this.get('/achievements');
    return response.data;
  }

  async getUserAchievements() {
    const response = await this.get('/achievements/user');
    return response.data;
  }

  // Profile Methods
  async getProfile() {
    const response = await this.get('/profile');
    return response.data;
  }

  async updateProfile(updates: any) {
    const response = await this.patch('/profile', updates);
    return response.data;
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export const apiClient = new ApiClient();