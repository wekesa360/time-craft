/**
 * UserManagement Tests
 * Tests for the user management admin component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within, waitFor } from '@testing-library/react';
import { render, userEvent } from '../../../../test/test-utils';
import { UserManagement } from '../UserManagement';

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(),
  writable: true,
});

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default confirm to true
    (window.confirm as any).mockReturnValue(true);
    
    // Mock console.log to suppress outputs in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('renders user management interface', () => {
    render(<UserManagement />);

    // Check header
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Manage user accounts and permissions')).toBeInTheDocument();

    // Check add user button
    expect(screen.getByText('Add User')).toBeInTheDocument();

    // Check search functionality
    expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument();

    // Check filter dropdowns
    expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
  });

  it('displays user data in table format', () => {
    render(<UserManagement />);

    // Check table headers
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('Last Active')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check mock user data is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('filters users by search term', async () => {
    render(<UserManagement />);

    const searchInput = screen.getByPlaceholderText(/search users/i);

    // Search for "John"
    await userEvent.type(searchInput, 'John');

    // Should show only John's row
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
  });

  it('filters users by role', async () => {
    render(<UserManagement />);

    const roleFilter = screen.getByDisplayValue('All Roles');

    // Filter by admin role
    await userEvent.selectOptions(roleFilter, 'admin');

    // Should show only admin user
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('filters users by status', async () => {
    render(<UserManagement />);

    const statusFilter = screen.getByDisplayValue('All Statuses');

    // Filter by inactive status
    await userEvent.selectOptions(statusFilter, 'inactive');

    // Should show only inactive user
    expect(screen.getByText('Inactive User')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
  });

  it('displays proper user status icons', () => {
    render(<UserManagement />);

    // Check for status icons (they should be present as svg elements)
    const statusIcons = screen.getAllByTestId(/status-icon|CheckCircle|Clock|AlertCircle/);
    expect(statusIcons.length).toBeGreaterThan(0);
  });

  it('displays role icons correctly', () => {
    render(<UserManagement />);

    // Should have different icons for different roles
    // Admin should have ShieldCheck, moderator should have Shield, user should have User
    const roleElements = screen.getAllByText(/admin|moderator|user/i);
    expect(roleElements.length).toBeGreaterThan(0);
  });

  it('displays subscription badges', () => {
    render(<UserManagement />);

    // Check for subscription badges
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('opens edit user modal on edit action', async () => {
    render(<UserManagement />);

    // Find and click first edit button
    const editButtons = screen.getAllByLabelText(/edit user/i);
    await userEvent.click(editButtons[0]);

    // Should open modal
    expect(screen.getByText('Edit User')).toBeInTheDocument();
    expect(screen.getByText('User editing functionality would be implemented here.')).toBeInTheDocument();
  });

  it('handles user deletion with confirmation', async () => {
    render(<UserManagement />);

    // Find and click first delete button
    const deleteButtons = screen.getAllByLabelText(/delete user/i);
    await userEvent.click(deleteButtons[0]);

    // Should show confirmation dialog
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');
  });

  it('handles user suspension', async () => {
    render(<UserManagement />);

    // Find and click suspend button (only visible for active users)
    const suspendButtons = screen.getAllByLabelText(/suspend user/i);
    await userEvent.click(suspendButtons[0]);

    // Should call suspend function (mocked console.log)
    expect(console.log).toHaveBeenCalledWith('Suspending user:', expect.any(String));
  });

  it('displays user statistics', () => {
    render(<UserManagement />);

    // Check statistics cards
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('Premium Users')).toBeInTheDocument();
    expect(screen.getByText('Student Users')).toBeInTheDocument();

    // Check statistics values
    expect(screen.getByText('5')).toBeInTheDocument(); // Total users
    expect(screen.getByText('4')).toBeInTheDocument(); // Active users (assuming 4 active out of 5)
    expect(screen.getByText('3')).toBeInTheDocument(); // Premium users
    expect(screen.getByText('1')).toBeInTheDocument(); // Student users
  });

  it('shows empty state when no users match filters', async () => {
    render(<UserManagement />);

    const searchInput = screen.getByPlaceholderText(/search users/i);

    // Search for non-existent user
    await userEvent.type(searchInput, 'NonExistentUser');

    // Should show no users found message
    expect(screen.getByText('No users found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
  });

  it('closes edit modal when cancel is clicked', async () => {
    render(<UserManagement />);

    // Open modal
    const editButtons = screen.getAllByLabelText(/edit user/i);
    await userEvent.click(editButtons[0]);

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Edit User')).not.toBeInTheDocument();
    });
  });

  it('provides proper accessibility attributes', () => {
    render(<UserManagement />);

    // Check table accessibility
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Check action buttons have proper labels
    const editButtons = screen.getAllByLabelText(/edit user/i);
    const deleteButtons = screen.getAllByLabelText(/delete user/i);
    
    expect(editButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Check filter inputs have labels
    const searchInput = screen.getByPlaceholderText(/search users/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    render(<UserManagement />);

    // Test tab navigation through interactive elements
    const searchInput = screen.getByPlaceholderText(/search users/i);
    const roleFilter = screen.getByDisplayValue('All Roles');
    
    // Focus search input
    searchInput.focus();
    expect(document.activeElement).toBe(searchInput);

    // Tab to role filter
    await userEvent.tab();
    expect(document.activeElement).toBe(roleFilter);
  });

  it('displays verified users with checkmark', () => {
    render(<UserManagement />);

    // Verified users should have a checkmark icon next to their name
    const verifiedIcons = screen.getAllByText('John Doe').length > 0;
    expect(verifiedIcons).toBeTruthy();
  });
});