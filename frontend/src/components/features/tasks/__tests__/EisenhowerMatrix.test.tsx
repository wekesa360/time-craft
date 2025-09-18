import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EisenhowerMatrix } from '../EisenhowerMatrix';
import type { Task } from '../../../../types';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockTasks: Task[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'Urgent and Important Task',
    description: 'This is urgent and important',
    priority: 4,
    urgency: 4,
    importance: 4,
    eisenhower_quadrant: 'do',
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Important but Not Urgent',
    description: 'This is important but not urgent',
    priority: 3,
    urgency: 2,
    importance: 4,
    eisenhower_quadrant: 'decide',
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '3',
    userId: 'user1',
    title: 'Urgent but Not Important',
    description: 'This is urgent but not important',
    priority: 2,
    urgency: 4,
    importance: 2,
    eisenhower_quadrant: 'delegate',
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '4',
    userId: 'user1',
    title: 'Not Urgent and Not Important',
    description: 'This is neither urgent nor important',
    priority: 1,
    urgency: 1,
    importance: 1,
    eisenhower_quadrant: 'delete',
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const mockHandlers = {
  onTaskComplete: vi.fn(),
  onTaskEdit: vi.fn(),
  onTaskDelete: vi.fn(),
  onCreateTask: vi.fn(),
};

describe('EisenhowerMatrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all four quadrants', () => {
    render(
      <EisenhowerMatrix
        tasks={mockTasks}
        onTaskComplete={mockHandlers.onTaskComplete}
        onTaskEdit={mockHandlers.onTaskEdit}
        onTaskDelete={mockHandlers.onTaskDelete}
        onCreateTask={mockHandlers.onCreateTask}
      />
    );

    expect(screen.getByText('Q1: Do First')).toBeInTheDocument();
    expect(screen.getByText('Q2: Schedule')).toBeInTheDocument();
    expect(screen.getByText('Q3: Delegate')).toBeInTheDocument();
    expect(screen.getByText('Q4: Eliminate')).toBeInTheDocument();
  });

  it('displays tasks in correct quadrants', () => {
    render(
      <EisenhowerMatrix
        tasks={mockTasks}
        onTaskComplete={mockHandlers.onTaskComplete}
        onTaskEdit={mockHandlers.onTaskEdit}
        onTaskDelete={mockHandlers.onTaskDelete}
        onCreateTask={mockHandlers.onCreateTask}
      />
    );

    expect(screen.getByText('Urgent and Important Task')).toBeInTheDocument();
    expect(screen.getByText('Important but Not Urgent')).toBeInTheDocument();
    expect(screen.getByText('Urgent but Not Important')).toBeInTheDocument();
    expect(screen.getByText('Not Urgent and Not Important')).toBeInTheDocument();
  });

  it('shows task counts for each quadrant', () => {
    render(
      <EisenhowerMatrix
        tasks={mockTasks}
        onTaskComplete={mockHandlers.onTaskComplete}
        onTaskEdit={mockHandlers.onTaskEdit}
        onTaskDelete={mockHandlers.onTaskDelete}
        onCreateTask={mockHandlers.onCreateTask}
      />
    );

    // Each quadrant should show 1 task
    const taskCounts = screen.getAllByText('1 task');
    expect(taskCounts).toHaveLength(4);
  });

  it('calls onCreateTask when add button is clicked', () => {
    render(
      <EisenhowerMatrix
        tasks={mockTasks}
        onTaskComplete={mockHandlers.onTaskComplete}
        onTaskEdit={mockHandlers.onTaskEdit}
        onTaskDelete={mockHandlers.onTaskDelete}
        onCreateTask={mockHandlers.onCreateTask}
      />
    );

    const addButtons = screen.getAllByRole('button', { name: /add/i });
    expect(addButtons).toHaveLength(4);

    fireEvent.click(addButtons[0]); // Click first add button
    expect(mockHandlers.onCreateTask).toHaveBeenCalledWith('do');
  });

  it('calls onTaskComplete when task is completed', () => {
    render(
      <EisenhowerMatrix
        tasks={mockTasks}
        onTaskComplete={mockHandlers.onTaskComplete}
        onTaskEdit={mockHandlers.onTaskEdit}
        onTaskDelete={mockHandlers.onTaskDelete}
        onCreateTask={mockHandlers.onCreateTask}
      />
    );

    const completeButtons = screen.getAllByRole('button', { name: /complete/i });
    expect(completeButtons.length).toBeGreaterThan(0);

    fireEvent.click(completeButtons[0]);
    expect(mockHandlers.onTaskComplete).toHaveBeenCalledWith('1');
  });

  it('calls onTaskEdit when task is edited', () => {
    render(
      <EisenhowerMatrix
        tasks={mockTasks}
        onTaskComplete={mockHandlers.onTaskComplete}
        onTaskEdit={mockHandlers.onTaskEdit}
        onTaskDelete={mockHandlers.onTaskDelete}
        onCreateTask={mockHandlers.onCreateTask}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);

    fireEvent.click(editButtons[0]);
    expect(mockHandlers.onTaskEdit).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('calls onTaskDelete when task is deleted', () => {
    render(
      <EisenhowerMatrix
        tasks={mockTasks}
        onTaskComplete={mockHandlers.onTaskComplete}
        onTaskEdit={mockHandlers.onTaskEdit}
        onTaskDelete={mockHandlers.onTaskDelete}
        onCreateTask={mockHandlers.onCreateTask}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);

    fireEvent.click(deleteButtons[0]);
    expect(mockHandlers.onTaskDelete).toHaveBeenCalledWith('1');
  });

  it('handles empty task list', () => {
    render(
      <EisenhowerMatrix
        tasks={[]}
        onTaskComplete={mockHandlers.onTaskComplete}
        onTaskEdit={mockHandlers.onTaskEdit}
        onTaskDelete={mockHandlers.onTaskDelete}
        onCreateTask={mockHandlers.onCreateTask}
      />
    );

    expect(screen.getByText('Q1: Do First')).toBeInTheDocument();
    expect(screen.getByText('Q2: Schedule')).toBeInTheDocument();
    expect(screen.getByText('Q3: Delegate')).toBeInTheDocument();
    expect(screen.getByText('Q4: Eliminate')).toBeInTheDocument();

    // All quadrants should show 0 tasks
    const taskCounts = screen.getAllByText('0 tasks');
    expect(taskCounts).toHaveLength(4);
  });

  it('displays quadrant descriptions', () => {
    render(
      <EisenhowerMatrix
        tasks={mockTasks}
        onTaskComplete={mockHandlers.onTaskComplete}
        onTaskEdit={mockHandlers.onTaskEdit}
        onTaskDelete={mockHandlers.onTaskDelete}
        onCreateTask={mockHandlers.onCreateTask}
      />
    );

    expect(screen.getByText('Important & Urgent')).toBeInTheDocument();
    expect(screen.getByText('Important & Not Urgent')).toBeInTheDocument();
    expect(screen.getByText('Not Important & Urgent')).toBeInTheDocument();
    expect(screen.getByText('Not Important & Not Urgent')).toBeInTheDocument();
  });

  it('applies correct styling to each quadrant', () => {
    render(
      <EisenhowerMatrix
        tasks={mockTasks}
        onTaskComplete={mockHandlers.onTaskComplete}
        onTaskEdit={mockHandlers.onTaskEdit}
        onTaskDelete={mockHandlers.onTaskDelete}
        onCreateTask={mockHandlers.onCreateTask}
      />
    );

    // Check that each quadrant has the correct border color
    const quadrants = screen.getAllByText(/Q[1-4]:/);
    expect(quadrants).toHaveLength(4);

    // Q1 should have red border (urgent & important)
    const q1Container = quadrants[0].closest('.border-red-500');
    expect(q1Container).toBeInTheDocument();

    // Q2 should have blue border (important & not urgent)
    const q2Container = quadrants[1].closest('.border-blue-500');
    expect(q2Container).toBeInTheDocument();

    // Q3 should have yellow border (urgent & not important)
    const q3Container = quadrants[2].closest('.border-yellow-500');
    expect(q3Container).toBeInTheDocument();

    // Q4 should have gray border (not urgent & not important)
    const q4Container = quadrants[3].closest('.border-gray-500');
    expect(q4Container).toBeInTheDocument();
  });
});
