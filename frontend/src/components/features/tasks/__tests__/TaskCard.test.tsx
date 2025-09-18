import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskCard } from '../TaskCard';
import type { Task } from '../../../../types';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockTask: Task = {
  id: '1',
  userId: 'user1',
  title: 'Test Task',
  description: 'This is a test task',
  priority: 3,
  urgency: 3,
  importance: 4,
  eisenhower_quadrant: 'do',
  status: 'pending',
  dueDate: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
  estimatedDuration: 30,
  contextType: 'work',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const mockHandlers = {
  onComplete: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe('TaskCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task information correctly', () => {
    render(
      <TaskCard
        task={mockTask}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task')).toBeInTheDocument();
    expect(screen.getByText('work')).toBeInTheDocument();
  });

  it('displays priority badge with correct color', () => {
    render(
      <TaskCard
        task={mockTask}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const priorityBadge = screen.getByText('3');
    expect(priorityBadge).toBeInTheDocument();
    expect(priorityBadge).toHaveClass('text-orange-600');
  });

  it('shows Eisenhower quadrant when showQuadrant is true', () => {
    render(
      <TaskCard
        task={mockTask}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        showQuadrant={true}
      />
    );

    expect(screen.getByText('Q1: Do First')).toBeInTheDocument();
  });

  it('calls onComplete when complete button is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const completeButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(completeButton);

    expect(mockHandlers.onComplete).toHaveBeenCalledWith('1');
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
  });

  it('displays due date correctly', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const taskWithDueDate = {
      ...mockTask,
      dueDate: tomorrow.getTime(),
    };

    render(
      <TaskCard
        task={taskWithDueDate}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    expect(screen.getByText(/tomorrow/i)).toBeInTheDocument();
  });

  it('shows completed status for completed tasks', () => {
    const completedTask = {
      ...mockTask,
      status: 'done' as const,
    };

    render(
      <TaskCard
        task={completedTask}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows delegation information when task is delegated', () => {
    const delegatedTask = {
      ...mockTask,
      is_delegated: true,
      delegated_to: 'John Doe',
      delegation_notes: 'Please review by Friday',
    };

    render(
      <TaskCard
        task={delegatedTask}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    expect(screen.getByText('Delegated to: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Please review by Friday')).toBeInTheDocument();
  });

  it('displays urgency and importance levels', () => {
    const highPriorityTask = {
      ...mockTask,
      urgency: 4,
      importance: 4,
    };

    render(
      <TaskCard
        task={highPriorityTask}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        showQuadrant={true}
      />
    );

    expect(screen.getByText('Urgency: 4')).toBeInTheDocument();
    expect(screen.getByText('Importance: 4')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalTask = {
      id: '2',
      userId: 'user1',
      title: 'Minimal Task',
      priority: 1,
      urgency: 1,
      importance: 1,
      eisenhower_quadrant: 'delete' as const,
      status: 'pending' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    render(
      <TaskCard
        task={minimalTask}
        onComplete={mockHandlers.onComplete}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    expect(screen.getByText('Minimal Task')).toBeInTheDocument();
    expect(screen.queryByText('This is a test task')).not.toBeInTheDocument();
  });
});
