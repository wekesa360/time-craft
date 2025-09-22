import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';

// Mock the API client
const mockApiClient = {
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  getProfile: vi.fn(),
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  completeTask: vi.fn(),
  getEisenhowerMatrix: vi.fn(),
  logExercise: vi.fn(),
  logMood: vi.fn(),
  getHealthSummary: vi.fn(),
  getFocusTemplates: vi.fn(),
  startFocusSession: vi.fn(),
  getBadges: vi.fn(),
  getEvents: vi.fn(),
  createEvent: vi.fn(),
  connectSSE: vi.fn(),
  disconnectSSE: vi.fn(),
  isSSEConnected: vi.fn(),
};

// Mock the API client module
vi.mock('../../lib/api', () => ({
  ApiClient: vi.fn(() => mockApiClient),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Critical User Flows E2E Tests', () => {
  let queryClient: QueryClient;

  beforeAll(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    queryClient.clear();
  });

  describe('Authentication Flow', () => {
    it('should complete user registration and login flow', async () => {
      // Mock successful registration
      mockApiClient.register.mockResolvedValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          timezone: 'UTC',
          preferredLanguage: 'en',
          subscriptionType: 'free',
          isStudent: false,
          badgePoints: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
        message: 'Registration successful',
      });

      // Mock successful login
      mockApiClient.login.mockResolvedValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          timezone: 'UTC',
          preferredLanguage: 'en',
          subscriptionType: 'free',
          isStudent: false,
          badgePoints: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
        message: 'Login successful',
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Test registration flow
      const registerButton = screen.getByText(/register/i);
      fireEvent.click(registerButton);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(firstNameInput, { target: { value: 'Test' } });
      fireEvent.change(lastNameInput, { target: { value: 'User' } });

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiClient.register).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          timezone: 'UTC',
          preferredLanguage: 'en',
        });
      });

      // Test login flow
      const loginButton = screen.getByText(/login/i);
      fireEvent.click(loginButton);

      const loginEmailInput = screen.getByLabelText(/email/i);
      const loginPasswordInput = screen.getByLabelText(/password/i);

      fireEvent.change(loginEmailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(loginPasswordInput, { target: { value: 'password123' } });

      const loginSubmitButton = screen.getByText(/login/i);
      fireEvent.click(loginSubmitButton);

      await waitFor(() => {
        expect(mockApiClient.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('Task Management Flow', () => {
    beforeEach(() => {
      // Mock authenticated user
      mockApiClient.getProfile.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'UTC',
        preferredLanguage: 'en',
        subscriptionType: 'free',
        isStudent: false,
        badgePoints: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Mock tasks data
      mockApiClient.getTasks.mockResolvedValue({
        data: [
          {
            id: 'task1',
            userId: 'user123',
            title: 'Test Task 1',
            description: 'This is a test task',
            priority: 3,
            urgency: 3,
            importance: 4,
            eisenhower_quadrant: 'do',
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      });

      // Mock Eisenhower matrix
      mockApiClient.getEisenhowerMatrix.mockResolvedValue({
        quadrants: {
          do: [],
          decide: [],
          delegate: [],
          delete: [],
        },
      });
    });

    it('should complete task creation, editing, and completion flow', async () => {
      // Mock task creation
      mockApiClient.createTask.mockResolvedValue({
        id: 'task2',
        userId: 'user123',
        title: 'New Task',
        description: 'A new task',
        priority: 2,
        urgency: 2,
        importance: 3,
        eisenhower_quadrant: 'decide',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Mock task update
      mockApiClient.updateTask.mockResolvedValue({
        id: 'task2',
        userId: 'user123',
        title: 'Updated Task',
        description: 'An updated task',
        priority: 3,
        urgency: 3,
        importance: 4,
        eisenhower_quadrant: 'do',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Mock task completion
      mockApiClient.completeTask.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to tasks page
      const tasksLink = screen.getByText(/tasks/i);
      fireEvent.click(tasksLink);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      // Create a new task
      const addTaskButton = screen.getByText(/add task/i);
      fireEvent.click(addTaskButton);

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const prioritySelect = screen.getByLabelText(/priority/i);

      fireEvent.change(titleInput, { target: { value: 'New Task' } });
      fireEvent.change(descriptionInput, { target: { value: 'A new task' } });
      fireEvent.change(prioritySelect, { target: { value: '2' } });

      const saveButton = screen.getByText(/save/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.createTask).toHaveBeenCalledWith({
          title: 'New Task',
          description: 'A new task',
          priority: 2,
          urgency: 3,
          importance: 3,
          eisenhower_quadrant: 'decide',
          status: 'pending',
        });
      });

      // Edit the task
      const editButton = screen.getByText(/edit/i);
      fireEvent.click(editButton);

      const editTitleInput = screen.getByDisplayValue('New Task');
      fireEvent.change(editTitleInput, { target: { value: 'Updated Task' } });

      const updateButton = screen.getByText(/update/i);
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockApiClient.updateTask).toHaveBeenCalledWith('task2', {
          title: 'Updated Task',
        });
      });

      // Complete the task
      const completeButton = screen.getByText(/complete/i);
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockApiClient.completeTask).toHaveBeenCalledWith('task2');
      });
    });
  });

  describe('Health Tracking Flow', () => {
    beforeEach(() => {
      // Mock health data
      mockApiClient.getHealthSummary.mockResolvedValue({
        exerciseCount: 5,
        nutritionCount: 10,
        hydrationTotal: 2000,
        moodAverage: 7.5,
      });

      // Mock health logging
      mockApiClient.logExercise.mockResolvedValue({
        id: 'exercise1',
        userId: 'user123',
        type: 'exercise',
        payload: {
          activity: 'Running',
          durationMinutes: 30,
          intensity: 7,
        },
        recordedAt: Date.now(),
        source: 'manual',
        createdAt: Date.now(),
      });

      mockApiClient.logMood.mockResolvedValue({
        id: 'mood1',
        userId: 'user123',
        type: 'mood',
        payload: {
          score: 8,
          energy: 7,
          stress: 3,
        },
        recordedAt: Date.now(),
        source: 'manual',
        createdAt: Date.now(),
      });
    });

    it('should complete health logging flow', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to health page
      const healthLink = screen.getByText(/health/i);
      fireEvent.click(healthLink);

      await waitFor(() => {
        expect(screen.getByText(/health dashboard/i)).toBeInTheDocument();
      });

      // Log exercise
      const logExerciseButton = screen.getByText(/log exercise/i);
      fireEvent.click(logExerciseButton);

      const activitySelect = screen.getByLabelText(/activity/i);
      const durationInput = screen.getByLabelText(/duration/i);
      const intensitySelect = screen.getByLabelText(/intensity/i);

      fireEvent.change(activitySelect, { target: { value: 'running' } });
      fireEvent.change(durationInput, { target: { value: '30' } });
      fireEvent.change(intensitySelect, { target: { value: '7' } });

      const saveExerciseButton = screen.getByText(/save/i);
      fireEvent.click(saveExerciseButton);

      await waitFor(() => {
        expect(mockApiClient.logExercise).toHaveBeenCalledWith({
          activity: 'running',
          durationMinutes: 30,
          intensity: 7,
        });
      });

      // Log mood
      const logMoodButton = screen.getByText(/log mood/i);
      fireEvent.click(logMoodButton);

      const moodScore = screen.getByLabelText(/mood score/i);
      const energyLevel = screen.getByLabelText(/energy level/i);
      const stressLevel = screen.getByLabelText(/stress level/i);

      fireEvent.change(moodScore, { target: { value: '8' } });
      fireEvent.change(energyLevel, { target: { value: '7' } });
      fireEvent.change(stressLevel, { target: { value: '3' } });

      const saveMoodButton = screen.getByText(/save/i);
      fireEvent.click(saveMoodButton);

      await waitFor(() => {
        expect(mockApiClient.logMood).toHaveBeenCalledWith({
          score: 8,
          energy: 7,
          stress: 3,
        });
      });
    });
  });

  describe('Focus Session Flow', () => {
    beforeEach(() => {
      // Mock focus templates
      mockApiClient.getFocusTemplates.mockResolvedValue([
        {
          id: 'template1',
          templateKey: 'pomodoro_25',
          name: 'Pomodoro 25',
          duration: 25,
          breakDuration: 5,
          longBreakDuration: 15,
          cycles: 4,
          description: '25-minute focused work sessions',
        },
      ]);

      // Mock focus session
      mockApiClient.startFocusSession.mockResolvedValue({
        id: 'session1',
        userId: 'user123',
        templateKey: 'pomodoro_25',
        status: 'active',
        startTime: Date.now(),
        endTime: null,
        duration: 25,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    it('should complete focus session flow', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to focus page
      const focusLink = screen.getByText(/focus/i);
      fireEvent.click(focusLink);

      await waitFor(() => {
        expect(screen.getByText(/focus sessions/i)).toBeInTheDocument();
      });

      // Start a focus session
      const startSessionButton = screen.getByText(/start session/i);
      fireEvent.click(startSessionButton);

      const templateSelect = screen.getByLabelText(/template/i);
      fireEvent.change(templateSelect, { target: { value: 'pomodoro_25' } });

      const confirmButton = screen.getByText(/start/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockApiClient.startFocusSession).toHaveBeenCalledWith({
          templateKey: 'pomodoro_25',
        });
      });

      // Verify session is active
      expect(screen.getByText(/session active/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Features Flow', () => {
    it('should handle SSE connection and real-time updates', async () => {
      // Mock SSE connection
      mockApiClient.isSSEConnected.mockReturnValue(true);
      mockApiClient.connectSSE.mockImplementation(() => {
        // Simulate SSE message
        const event = new CustomEvent('sse-message', {
          detail: {
            type: 'task.created',
            data: {
              title: 'Real-time Task',
            },
          },
        });
        window.dispatchEvent(event);
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check SSE connection
      expect(mockApiClient.isSSEConnected()).toBe(true);

      // Simulate real-time task creation
      const event = new CustomEvent('sse-message', {
        detail: {
          type: 'task.created',
          data: {
            title: 'Real-time Task',
          },
        },
      });
      window.dispatchEvent(event);

      // Verify real-time update is handled
      await waitFor(() => {
        expect(screen.getByText(/real-time task/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockApiClient.getTasks.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to tasks page
      const tasksLink = screen.getByText(/tasks/i);
      fireEvent.click(tasksLink);

      // Verify error is handled
      await waitFor(() => {
        expect(screen.getByText(/error loading tasks/i)).toBeInTheDocument();
      });
    });
  });
});
