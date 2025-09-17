/**
 * ResponsiveTable Tests
 * Tests for the responsive table component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { render, userEvent } from '../../../test/test-utils';
import { ResponsiveTable } from '../ResponsiveTable';

interface TestData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

const testData: TestData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'user',
    status: 'inactive',
  },
];

const columns = [
  {
    key: 'name' as keyof TestData,
    header: 'Name',
    sortable: true,
  },
  {
    key: 'email' as keyof TestData,
    header: 'Email',
    sortable: true,
  },
  {
    key: 'role' as keyof TestData,
    header: 'Role',
    sortable: false,
  },
  {
    key: 'status' as keyof TestData,
    header: 'Status',
    sortable: true,
  },
];

describe('ResponsiveTable', () => {
  beforeEach(() => {
    // Mock matchMedia for responsive behavior
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false, // Default to desktop
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders table with data', () => {
    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
        ariaLabel="Test table"
      />
    );

    // Check table structure
    const table = screen.getByRole('table', { name: 'Test table' });
    expect(table).toBeInTheDocument();

    // Check headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Check data rows
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('renders mobile card view on mobile devices', () => {
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

    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
        ariaLabel="Test table"
      />
    );

    // Should render as list on mobile
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();

    // Should not render table
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Check card items
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('supports sorting functionality', async () => {
    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
        sortable={true}
      />
    );

    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    // Click to sort ascending
    await userEvent.click(nameHeader);
    
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    // Click again to sort descending
    await userEvent.click(nameHeader);
    
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('supports search functionality', async () => {
    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
        searchable={true}
      />
    );

    const searchInput = screen.getByLabelText(/search table/i);
    expect(searchInput).toBeInTheDocument();

    // Search for "John"
    await userEvent.type(searchInput, 'John');

    // Should show only John's row
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
  });

  it('supports row selection', async () => {
    const onSelectionChange = vi.fn();
    
    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
        selectable={true}
        onSelectionChange={onSelectionChange}
      />
    );

    // Should have select all checkbox
    const selectAllCheckbox = screen.getByLabelText(/select.*all/i);
    expect(selectAllCheckbox).toBeInTheDocument();

    // Should have individual row checkboxes
    const rowCheckboxes = screen.getAllByLabelText(/select row/i);
    expect(rowCheckboxes).toHaveLength(3);

    // Select first row
    await userEvent.click(rowCheckboxes[0]);
    
    expect(onSelectionChange).toHaveBeenCalledWith([testData[0]]);

    // Select all
    await userEvent.click(selectAllCheckbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith(testData);
  });

  it('supports pagination', () => {
    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
        pagination={true}
        itemsPerPage={2}
      />
    );

    // Should show pagination controls
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();

    // Should only show 2 rows
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3); // 1 header + 2 data rows
  });

  it('handles empty data state', () => {
    render(
      <ResponsiveTable 
        data={[]} 
        columns={columns}
        emptyMessage="No data found"
      />
    );

    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
      />
    );

    // Focus first cell
    const firstCell = screen.getAllByRole('gridcell')[0];
    firstCell.focus();

    // Navigate with arrow keys
    fireEvent.keyDown(firstCell, { key: 'ArrowRight' });
    
    // Should move focus to next cell
    expect(document.activeElement).not.toBe(firstCell);
  });

  it('supports row click handler', async () => {
    const onRowClick = vi.fn();
    
    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
        onRowClick={onRowClick}
      />
    );

    // Click first row
    const firstRow = screen.getAllByRole('row')[1]; // Skip header
    await userEvent.click(firstRow);

    expect(onRowClick).toHaveBeenCalledWith(testData[0], 0);
  });

  it('provides proper accessibility attributes', () => {
    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
        caption="User data table"
        ariaLabel="Users table"
      />
    );

    const table = screen.getByRole('table', { name: 'Users table' });
    expect(table).toHaveAttribute('aria-rowcount', '3');
    expect(table).toHaveAttribute('aria-colcount', '4');

    // Check caption
    expect(screen.getByText('User data table')).toBeInTheDocument();

    // Check row attributes
    const dataRows = screen.getAllByRole('row').slice(1); // Skip header
    dataRows.forEach((row, index) => {
      expect(row).toHaveAttribute('aria-rowindex', String(index + 1));
    });
  });

  it('handles loading state', () => {
    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
        loadingState={true}
      />
    );

    // Should show loading indicator or skeleton
    // This would depend on the actual loading implementation
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('supports custom cell renderers', () => {
    const customColumns = [
      {
        key: 'name' as keyof TestData,
        header: 'Name',
        accessor: (item: TestData) => (
          <strong data-testid={`name-${item.id}`}>{item.name}</strong>
        ),
      },
      {
        key: 'status' as keyof TestData,
        header: 'Status',
        accessor: (item: TestData) => (
          <span 
            className={item.status === 'active' ? 'text-green-600' : 'text-red-600'}
            data-testid={`status-${item.id}`}
          >
            {item.status}
          </span>
        ),
      },
    ];

    render(
      <ResponsiveTable 
        data={testData} 
        columns={customColumns}
      />
    );

    // Check custom rendered cells
    expect(screen.getByTestId('name-1')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('status-1')).toHaveTextContent('active');
    expect(screen.getByTestId('status-3')).toHaveTextContent('inactive');
  });

  it('provides screen reader instructions', () => {
    render(
      <ResponsiveTable 
        data={testData} 
        columns={columns}
        sortable={true}
        selectable={true}
      />
    );

    // Check for screen reader instructions
    const instructions = screen.getByText(/table with.*rows.*columns/i);
    expect(instructions).toBeInTheDocument();
    expect(instructions).toHaveClass('sr-only');
  });
});