/**
 * Accessibility Tests
 * Comprehensive accessibility testing using axe-core
 */

import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from './test-utils';
import { UserManagement } from '../components/features/admin/UserManagement';
import { SystemMetrics } from '../components/features/admin/SystemMetrics';
import { FeatureFlags } from '../components/features/admin/FeatureFlags';
import { ResponsiveTable } from '../components/ui/ResponsiveTable';
import { AccessibleNavigation } from '../components/ui/AccessibleNavigation';
import ResponsiveGrid from '../components/ui/layout/ResponsiveGrid';

// Extend Jest matchers to include axe
expect.extend(toHaveNoViolations);

// Test data for components
const mockTableData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' as const },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' as const },
];

const mockTableColumns = [
  { key: 'name' as keyof typeof mockTableData[0], header: 'Name', sortable: true },
  { key: 'email' as keyof typeof mockTableData[0], header: 'Email', sortable: true },
  { key: 'role' as keyof typeof mockTableData[0], header: 'Role', sortable: false },
];

const mockNavigationItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: () => <span>=Ê</span>,
  },
  {
    key: 'tasks',
    label: 'Tasks',
    href: '/tasks',
    icon: () => <span></span>,
  },
  {
    key: 'settings',
    label: 'Settings',
    children: [
      {
        key: 'profile',
        label: 'Profile',
        href: '/settings/profile',
      },
      {
        key: 'preferences',
        label: 'Preferences',
        href: '/settings/preferences',
      },
    ],
  },
];

describe('Accessibility Tests', () => {
  describe('Admin Components', () => {
    it('UserManagement should not have accessibility violations', async () => {
      const { container } = render(<UserManagement />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('SystemMetrics should not have accessibility violations', async () => {
      const { container } = render(<SystemMetrics />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('FeatureFlags should not have accessibility violations', async () => {
      const { container } = render(<FeatureFlags />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('UI Components', () => {
    it('ResponsiveTable should not have accessibility violations', async () => {
      const { container } = render(
        <ResponsiveTable
          data={mockTableData}
          columns={mockTableColumns}
          ariaLabel="Test data table"
          caption="Sample user data"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ResponsiveTable with selection should not have accessibility violations', async () => {
      const { container } = render(
        <ResponsiveTable
          data={mockTableData}
          columns={mockTableColumns}
          selectable={true}
          ariaLabel="Selectable data table"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ResponsiveTable with search should not have accessibility violations', async () => {
      const { container } = render(
        <ResponsiveTable
          data={mockTableData}
          columns={mockTableColumns}
          searchable={true}
          ariaLabel="Searchable data table"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('AccessibleNavigation should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleNavigation
          items={mockNavigationItems}
          ariaLabel="Main navigation"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('AccessibleNavigation with logo should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleNavigation
          items={mockNavigationItems}
          logo={<div>TimeCraft</div>}
          ariaLabel="Main navigation with logo"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ResponsiveGrid should not have accessibility violations', async () => {
      const { container } = render(
        <ResponsiveGrid
          xs={1}
          md={2}
          lg={3}
          ariaLabel="Responsive grid layout"
          enableKeyboardNavigation={true}
        >
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
          <div>Item 4</div>
        </ResponsiveGrid>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Accessibility', () => {
    it('Search inputs should have proper labels', async () => {
      const { container } = render(
        <ResponsiveTable
          data={mockTableData}
          columns={mockTableColumns}
          searchable={true}
        />
      );
      
      const results = await axe(container, {
        rules: {
          'label': { enabled: true },
          'aria-input-field-name': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('Filter selects should have proper labels', async () => {
      const { container } = render(<UserManagement />);
      
      const results = await axe(container, {
        rules: {
          'label': { enabled: true },
          'select-name': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Interactive Elements', () => {
    it('Buttons should have accessible names', async () => {
      const { container } = render(<UserManagement />);
      
      const results = await axe(container, {
        rules: {
          'button-name': { enabled: true },
          'aria-command-name': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('Links should have accessible names', async () => {
      const { container } = render(
        <AccessibleNavigation
          items={mockNavigationItems}
          ariaLabel="Navigation links test"
        />
      );
      
      const results = await axe(container, {
        rules: {
          'link-name': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('Interactive elements should be keyboard accessible', async () => {
      const { container } = render(
        <ResponsiveTable
          data={mockTableData}
          columns={mockTableColumns}
          sortable={true}
          selectable={true}
        />
      );
      
      const results = await axe(container, {
        rules: {
          'keyboard': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast', () => {
    it('Should meet color contrast requirements', async () => {
      const { container } = render(<UserManagement />);
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Semantic Structure', () => {
    it('Should use proper heading hierarchy', async () => {
      const { container } = render(
        <div>
          <SystemMetrics />
          <FeatureFlags />
        </div>
      );
      
      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
          'page-has-heading-one': { enabled: false } // Disabled for component tests
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('Should use proper landmark roles', async () => {
      const { container } = render(
        <AccessibleNavigation
          items={mockNavigationItems}
          ariaLabel="Landmark test navigation"
        />
      );
      
      const results = await axe(container, {
        rules: {
          'landmark-one-main': { enabled: false }, // Disabled for component tests
          'landmark-unique': { enabled: true },
          'region': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('Tables should have proper structure and headers', async () => {
      const { container } = render(
        <ResponsiveTable
          data={mockTableData}
          columns={mockTableColumns}
          caption="User data for accessibility testing"
        />
      );
      
      const results = await axe(container, {
        rules: {
          'table-fake-caption': { enabled: true },
          'table-duplicate-name': { enabled: true },
          'td-headers-attr': { enabled: true },
          'th-has-data-cells': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('Form controls should have proper associations', async () => {
      const { container } = render(<UserManagement />);
      
      const results = await axe(container, {
        rules: {
          'label-title-only': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
          'aria-input-field-name': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Implementation', () => {
    it('Should use valid ARIA attributes', async () => {
      const { container } = render(
        <div>
          <ResponsiveTable
            data={mockTableData}
            columns={mockTableColumns}
            sortable={true}
          />
          <ResponsiveGrid
            xs={1}
            md={2}
            enableKeyboardNavigation={true}
            ariaLabel="ARIA test grid"
          >
            <button>Item 1</button>
            <button>Item 2</button>
          </ResponsiveGrid>
        </div>
      );
      
      const results = await axe(container, {
        rules: {
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-roles': { enabled: true },
          'aria-allowed-role': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-required-children': { enabled: true },
          'aria-required-parent': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('Should properly implement live regions', async () => {
      const { container } = render(<SystemMetrics />);
      
      const results = await axe(container, {
        rules: {
          'aria-live-region-atomic': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Mobile Accessibility', () => {
    it('Mobile responsive components should be accessible', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: () => ({
          matches: true, // Mock mobile
          media: '(max-width: 768px)',
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {},
        }),
      });

      const { container } = render(
        <ResponsiveTable
          data={mockTableData}
          columns={mockTableColumns}
          ariaLabel="Mobile responsive table"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});