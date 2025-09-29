/**
 * Accessible Navigation Component
 * Responsive navigation with full keyboard support and screen reader accessibility
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useAccessibilityContext } from '../accessibility/AccessibilityProvider';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';

interface NavigationItem {
  key: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  children?: NavigationItem[];
  onClick?: () => void;
  disabled?: boolean;
  badge?: string | number;
  ariaLabel?: string;
}

interface AccessibleNavigationProps {
  items: NavigationItem[];
  logo?: React.ReactNode;
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'sidebar';
  collapsible?: boolean;
  stickyOnMobile?: boolean;
  showLabels?: boolean;
  compactMode?: boolean;
  ariaLabel?: string;
  id?: string;
}

export const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({
  items,
  logo,
  className,
  variant = 'horizontal',
  collapsible = true,
  stickyOnMobile = true,
  showLabels = true,
  compactMode = false,
  ariaLabel,
  id = 'main-navigation',
}) => {
  const location = useLocation();
  const {
    isMobile,
    isTablet,
    isDesktop,
    announce,
    language,
    isKeyboardUser,
    handleKeyPress,
    trapFocus,
    saveFocus,
    restoreFocus,
  } = useAccessibilityContext();

  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isMobileLayout = isMobile || (isTablet && variant === 'sidebar');
  const shouldCollapse = collapsible && isMobileLayout;

  // Handle navigation toggle
  const toggleNavigation = () => {
    if (!shouldCollapse) return;
    
    setIsOpen(!isOpen);
    
    const message = language === 'de'
      ? `Navigation ${!isOpen ? 'ge�ffnet' : 'geschlossen'}`
      : `Navigation ${!isOpen ? 'opened' : 'closed'}`;
    announce(message);

    if (!isOpen) {
      saveFocus();
    } else {
      restoreFocus();
    }
  };

  // Handle submenu toggle
  const toggleSubmenu = (itemKey: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
    }
    setExpandedItems(newExpanded);

    const isExpanded = newExpanded.has(itemKey);
    const item = findItemByKey(items, itemKey);
    const message = language === 'de'
      ? `${item?.label} Men� ${isExpanded ? 'erweitert' : 'eingeklappt'}`
      : `${item?.label} menu ${isExpanded ? 'expanded' : 'collapsed'}`;
    announce(message);
  };

  // Find item by key
  const findItemByKey = (navItems: NavigationItem[], key: string): NavigationItem | null => {
    for (const item of navItems) {
      if (item.key === key) return item;
      if (item.children) {
        const found = findItemByKey(item.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  // Check if item is active
  const isItemActive = (item: NavigationItem): boolean => {
    if (item.href && location.pathname === item.href) return true;
    if (item.children) {
      return item.children.some(child => isItemActive(child));
    }
    return false;
  };

  // Keyboard navigation
  useEffect(() => {
    if (!navRef.current || !isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = Array.from(
        navRef.current!.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex="0"]'
        )
      ) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          nextIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
          break;
        case 'ArrowUp':
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = focusableElements.length - 1;
          break;
        case 'Escape':
          if (shouldCollapse) {
            setIsOpen(false);
            toggleRef.current?.focus();
          }
          break;
        default:
          return;
      }

      if (nextIndex !== currentIndex) {
        event.preventDefault();
        focusableElements[nextIndex]?.focus();
      }
    };

    navRef.current.addEventListener('keydown', handleKeyDown);
    return () => navRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, shouldCollapse]);

  // Focus trap when mobile navigation is open
  useEffect(() => {
    if (shouldCollapse && isOpen && navRef.current) {
      const cleanup = trapFocus(navRef.current);
      return cleanup;
    }
  }, [isOpen, shouldCollapse, trapFocus]);

  // Close mobile navigation on route change
  useEffect(() => {
    if (shouldCollapse && isOpen) {
      setIsOpen(false);
    }
  }, [location.pathname, shouldCollapse, isOpen]);

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = isItemActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = hasChildren && expandedItems.has(item.key);
    const isDisabled = item.disabled;

    const itemClasses = cn(
      'flex items-center w-full text-left transition-colors relative',
      {
        // Spacing
        'px-3 py-2': level === 0,
        'px-6 py-1.5 text-sm': level === 1,
        'px-9 py-1 text-xs': level === 2,
        
        // States
        'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-950': isActive,
        'text-foreground hover:text-primary-600 hover:bg-background-secondary': !isActive && !isDisabled,
        'text-foreground-secondary opacity-50 cursor-not-allowed': isDisabled,
        'rounded-lg': variant !== 'sidebar' || level === 0,
        
        // Focus styles for keyboard users
        'focus-visible:outline-2 focus-visible:outline-primary-500': isKeyboardUser,
      }
    );

    const ItemContent = () => (
      <>
        {item.icon && (
          <item.icon 
            className={cn(
              'flex-shrink-0',
              compactMode || !showLabels ? 'w-5 h-5' : 'w-4 h-4 mr-3',
              {
                'text-primary-600 dark:text-primary-400': isActive,
                'text-foreground-secondary': !isActive,
              }
            )}
            aria-hidden={true}
          />
        )}
        
        {showLabels && !compactMode && (
          <span className="flex-1 truncate">{item.label}</span>
        )}
        
        {item.badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-500 text-white ml-2">
            {item.badge}
            <span className="sr-only">
              {language === 'de' ? 'Benachrichtigungen' : 'notifications'}
            </span>
          </span>
        )}
        
        {hasChildren && (
          <span className="flex-shrink-0 ml-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" aria-hidden={true} />
            ) : (
              <ChevronRight className="w-4 h-4" aria-hidden={true} />
            )}
          </span>
        )}
      </>
    );

    if (hasChildren) {
      return (
        <div key={item.key} className="w-full">
          <button
            className={itemClasses}
            onClick={() => toggleSubmenu(item.key)}
            onKeyDown={(e) => handleKeyPress(e, () => toggleSubmenu(item.key))}
            disabled={isDisabled}
            aria-expanded={isExpanded}
            aria-controls={`submenu-${item.key}`}
            aria-label={item.ariaLabel || `${item.label} menu`}
          >
            <ItemContent />
          </button>
          
          <div
            id={`submenu-${item.key}`}
            className={cn(
              'overflow-hidden transition-all duration-200',
              {
                'max-h-0': !isExpanded,
                'max-h-96': isExpanded,
              }
            )}
            aria-hidden={!isExpanded}
          >
            <div className="py-1">
              {item.children?.map(child => renderNavigationItem(child, level + 1))}
            </div>
          </div>
        </div>
      );
    }

    if (item.href) {
      return (
        <Link
          key={item.key}
          to={item.href}
          className={itemClasses}
          aria-current={isActive ? 'page' : undefined}
          aria-label={item.ariaLabel}
          aria-disabled={isDisabled}
          onClick={isDisabled ? (e) => e.preventDefault() : undefined}
        >
          <ItemContent />
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        className={itemClasses}
        onClick={item.onClick}
        onKeyDown={(e) => handleKeyPress(e, item.onClick || (() => {}))}
        disabled={isDisabled}
        aria-label={item.ariaLabel || item.label}
      >
        <ItemContent />
      </button>
    );
  };

  return (
    <>
      {/* Mobile Navigation Toggle */}
      {shouldCollapse && (
        <button
          ref={toggleRef}
          onClick={toggleNavigation}
          className={cn(
            'fixed top-4 left-4 z-50 p-2 rounded-lg bg-background border border-border shadow-lg',
            {
              'sticky top-0': stickyOnMobile,
            }
          )}
          aria-label={
            language === 'de'
              ? `Navigation ${isOpen ? 'schlie�en' : '�ffnen'}`
              : `${isOpen ? 'Close' : 'Open'} navigation menu`
          }
          aria-expanded={isOpen}
          aria-controls={id}
        >
          {isOpen ? (
            <X className="w-5 h-5" aria-hidden={true} />
          ) : (
            <Menu className="w-5 h-5" aria-hidden={true} />
          )}
        </button>
      )}

      {/* Mobile Navigation Overlay */}
      {shouldCollapse && isOpen && (
        <div
          className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden={true}
        />
      )}

      {/* Navigation Container */}
      <nav
        ref={navRef}
        id={id}
        className={cn(
          'bg-background border-border',
          {
            // Horizontal layout
            'flex items-center justify-between px-4 py-3 border-b': variant === 'horizontal' && !shouldCollapse,
            
            // Vertical/Sidebar layout
            'flex flex-col w-64 h-full border-r': variant === 'vertical' || variant === 'sidebar',
            
            // Mobile responsive
            'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300': shouldCollapse,
            'translate-x-0': shouldCollapse && isOpen,
            '-translate-x-full': shouldCollapse && !isOpen,
            
            // Desktop sidebar
            'sticky top-0 h-screen': variant === 'sidebar' && isDesktop,
          },
          className
        )}
        aria-label={ariaLabel || (language === 'de' ? 'Hauptnavigation' : 'Main navigation')}
        aria-hidden={shouldCollapse && !isOpen}
        role="navigation"
      >
        {/* Logo/Brand */}
        {logo && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            {logo}
            
            {shouldCollapse && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-background-secondary"
                aria-label={language === 'de' ? 'Navigation schlie�en' : 'Close navigation'}
              >
                <X className="w-5 h-5" aria-hidden={true} />
              </button>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <div 
          className={cn(
            'flex-1 overflow-y-auto',
            {
              'flex items-center space-x-1': variant === 'horizontal' && !shouldCollapse,
              'flex flex-col p-4 space-y-1': variant !== 'horizontal' || shouldCollapse,
            }
          )}
          role="list"
        >
          {items.map(item => (
            <div key={item.key} role="listitem">
              {renderNavigationItem(item)}
            </div>
          ))}
        </div>
      </nav>

      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary-600 text-white px-4 py-2 rounded-md"
        onClick={(e) => {
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        {language === 'de' ? 'Zum Hauptinhalt springen' : 'Skip to main content'}
      </a>

      {/* Screen Reader Instructions */}
      <div className="sr-only" aria-live="polite">
        {language === 'de' ? (
          `Navigation mit ${items.length} Hauptelementen. Verwenden Sie Pfeiltasten zur Navigation. 
          ${shouldCollapse ? 'Escape zum Schlie�en.' : ''}`
        ) : (
          `Navigation with ${items.length} main items. Use arrow keys to navigate. 
          ${shouldCollapse ? 'Press Escape to close.' : ''}`
        )}
      </div>
    </>
  );
};