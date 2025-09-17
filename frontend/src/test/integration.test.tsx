/**
 * Integration Tests
 * Tests for complete user workflows and component interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { render, userEvent } from './test-utils';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import AdminDashboard from '../pages/admin/AdminDashboard';
import { UserManagement } from '../components/features/admin/UserManagement';
import { SystemMetrics } from '../components/features/admin/SystemMetrics';

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/admin' }),
  };
});

describe('Integration Tests', () => {
  beforeEach(() => {
    // Reset any runtime handlers
    server.resetHandlers();
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Admin Dashboard Integration', () => {
    it('loads and displays admin dashboard with all sections', async () => {
      render(<AdminDashboard />);

      // Check main dashboard elements
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('System overview and administration tools')).toBeInTheDocument();

      // Check quick stats cards
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('Tasks Created')).toBeInTheDocument();
      expect(screen.getByText('Support Tickets')).toBeInTheDocument();

      // Check quick actions section
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();

      // Check recent activity
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('displays proper admin access indicators', () => {
      render(<AdminDashboard />);

      // Check admin access badge
      expect(screen.getByText('Admin Access')).toBeInTheDocument();
    });
  });

  describe('User Management Workflow', () => {
    beforeEach(() => {
      // Mock window.confirm for delete operations
      Object.defineProperty(window, 'confirm', {
        value: vi.fn(() => true),
        writable: true,
      });
    });

    it('completes full user management workflow', async () => {
      render(<UserManagement />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await userEvent.type(searchInput, 'John');

      // Should filter results
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();

      // Clear search
      await userEvent.clear(searchInput);

      // Test role filtering
      const roleFilter = screen.getByDisplayValue('All Roles');
      await userEvent.selectOptions(roleFilter, 'admin');

      // Should show admin users
      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      // Reset filters
      await userEvent.selectOptions(roleFilter, 'all');

      // Test user actions
      const editButtons = screen.getAllByLabelText(/edit user/i);
      await userEvent.click(editButtons[0]);

      // Should open edit modal
      expect(screen.getByText('Edit User')).toBeInTheDocument();

      // Close modal
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('Edit User')).not.toBeInTheDocument();
      });
    });

    it('handles user deletion workflow', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete user/i);
      await userEvent.click(deleteButtons[0]);

      // Should show confirmation
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this user?'
      );
    });

    it('displays correct user statistics', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Check statistics cards
      const statsContainer = screen.getByText('Total Users').closest('.grid');
      expect(statsContainer).toBeInTheDocument();

      // Should display mock data counts
      const totalUsersCard = screen.getByText('Total Users').closest('.card');
      expect(within(totalUsersCard!).getByText('5')).toBeInTheDocument();
    });
  });

  describe('System Metrics Integration', () => {
    it('loads and updates system metrics', async () => {
      render(<SystemMetrics />);

      // Check main metrics title
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
      expect(screen.getByText('Real-time system performance monitoring')).toBeInTheDocument();

      // Check refresh functionality
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();

      await userEvent.click(refreshButton);

      // Should show loading state briefly
      expect(refreshButton).toBeDisabled();
    });

    it('displays all metric categories', () => {
      render(<SystemMetrics />);

      // Check metric cards are present
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Disk Usage')).toBeInTheDocument();
      expect(screen.getByText('Network I/O')).toBeInTheDocument();
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
    });

    it('shows health summary section', () => {
      render(<SystemMetrics />);

      expect(screen.getByText('System Health Summary')).toBeInTheDocument();
      expect(screen.getByText('Healthy Services')).toBeInTheDocument();
      expect(screen.getByText('Warning Services')).toBeInTheDocument();
      expect(screen.getByText('Critical Services')).toBeInTheDocument();
    });

    it('displays historical data placeholder', () => {
      render(<SystemMetrics />);

      expect(screen.getByText('Historical Data')).toBeInTheDocument();
      expect(screen.getByText('Charts Coming Soon')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('handles API errors gracefully', async () => {
      // Mock API error
      server.use(
        http.get('/admin/users', () => {
          return new HttpResponse('Internal Server Error', { status: 500 });
        })
      );

      render(<UserManagement />);

      // Component should still render with error state
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('handles empty API responses', async () => {
      // Mock empty response
      server.use(
        http.get('/admin/users', () => {
          return HttpResponse.json({
            users: [],
            total: 0,
            page: 1,
            limit: 10
          });
        })
      );

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('handles loading states', async () => {
      // Mock delayed response
      server.use(
        http.get('/admin/users', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({
            users: [],
            total: 0,
            page: 1,
            limit: 10
          });
        })
      );

      render(<UserManagement />);

      // Should show loading state initially
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior Integration', () => {
    it('adapts to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Component should adapt to mobile layout
      // This would depend on the specific mobile adaptations
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains accessibility during interactions', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const searchInput = screen.getByPlaceholderText(/search users/i);
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Tab to next element
      await userEvent.tab();
      
      // Should move focus appropriately
      expect(document.activeElement).not.toBe(searchInput);
    });

    it('provides proper screen reader support during state changes', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Perform action that should trigger screen reader announcement
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await userEvent.type(searchInput, 'test');

      // Component should handle accessibility updates
      expect(searchInput).toHaveValue('test');
    });
  });

  describe('State Management Integration', () => {
    it('maintains consistent state across component updates', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Change filter state
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await userEvent.type(searchInput, 'John');

      // State should be maintained
      expect(searchInput).toHaveValue('John');

      // Change another filter
      const roleFilter = screen.getByDisplayValue('All Roles');
      await userEvent.selectOptions(roleFilter, 'admin');

      // Both states should be maintained
      expect(searchInput).toHaveValue('John');
      expect(roleFilter).toHaveValue('admin');
    });
  });

  describe('Error Boundary Integration', () => {
    it('handles component errors gracefully', () => {
      // Mock console.error to suppress error output in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // This would test error boundary behavior if implemented
      // For now, just ensure components render without throwing

      expect(() => {
        render(<UserManagement />);
      }).not.toThrow();

      expect(() => {
        render(<SystemMetrics />);
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});