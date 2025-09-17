/**
 * Responsive Table Component
 * Accessible table that adapts to different screen sizes
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { useAccessibilityContext } from '../accessibility/AccessibilityProvider';
import { ChevronDown, ChevronUp, ArrowUpDown, Search, Filter } from 'lucide-react';

interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  accessor?: (item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  mobileHeader?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  ariaLabel?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  className?: string;
  caption?: string;
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
  emptyMessage?: string;
  loadingState?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowKeyAccessor?: (item: T, index: number) => string;
  selectable?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  stickyHeader?: boolean;
  zebra?: boolean;
  compact?: boolean;
  ariaLabel?: string;
  id?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  className,
  caption,
  searchable = false,
  sortable = true,
  pagination = false,
  itemsPerPage = 10,
  emptyMessage,
  loadingState = false,
  onRowClick,
  rowKeyAccessor,
  selectable = false,
  onSelectionChange,
  stickyHeader = false,
  zebra = true,
  compact = false,
  ariaLabel,
  id = 'responsive-table',
}: ResponsiveTableProps<T>) {
  const {
    isMobile,
    isTablet,
    announce,
    language,
    prefersReducedMotion,
    shouldUseHighContrast,
  } = useAccessibilityContext();

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const tableRef = useRef<HTMLTableElement>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  // Filter data based on search term
  const filteredData = searchTerm
    ? data.filter((item) =>
        columns
          .filter(col => col.searchable !== false)
          .some((column) => {
            const value = column.accessor
              ? column.accessor(item)
              : (item as any)[column.key];
            return String(value).toLowerCase().includes(searchTerm.toLowerCase());
          })
      )
    : data;

  // Sort filtered data
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const column = columns.find(col => col.key === sortConfig.key);
        const aValue = column?.accessor 
          ? column.accessor(a) 
          : (a as any)[sortConfig.key];
        const bValue = column?.accessor 
          ? column.accessor(b) 
          : (b as any)[sortConfig.key];

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Paginate data
  const totalPages = pagination ? Math.ceil(sortedData.length / itemsPerPage) : 1;
  const startIndex = pagination ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = pagination ? startIndex + itemsPerPage : sortedData.length;
  const displayedData = sortedData.slice(startIndex, endIndex);

  // Get visible columns based on screen size
  const visibleColumns = columns.filter(column => {
    if (isMobile && column.hideOnMobile) return false;
    if (isTablet && column.hideOnTablet) return false;
    return true;
  });

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable && column?.sortable !== undefined) return;
    if (!sortable) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key: columnKey, direction });
    
    const message = language === 'de'
      ? `Tabelle sortiert nach ${column?.header} ${direction === 'asc' ? 'aufsteigend' : 'absteigend'}`
      : `Table sorted by ${column?.header} ${direction === 'asc' ? 'ascending' : 'descending'}`;
    announce(message);
  };

  // Handle selection
  const handleRowSelection = (item: T, checked: boolean) => {
    const newSelection = checked
      ? [...selectedItems, item]
      : selectedItems.filter(selected => selected !== item);
    
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? [...displayedData] : [];
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
    
    const message = language === 'de'
      ? `${checked ? 'Alle' : 'Keine'} Zeilen ausgewählt`
      : `${checked ? 'All' : 'No'} rows selected`;
    announce(message);
  };

  // Keyboard navigation for table
  useEffect(() => {
    if (!tableRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!focusedCell) return;

      const { row, col } = focusedCell;
      const maxRow = displayedData.length - 1;
      const maxCol = visibleColumns.length - 1 + (selectable ? 1 : 0);

      let newRow = row;
      let newCol = col;

      switch (event.key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(maxRow, row + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(maxCol, col + 1);
          break;
        case 'Home':
          newCol = 0;
          break;
        case 'End':
          newCol = maxCol;
          break;
        case 'Enter':
        case ' ':
          if (onRowClick && row >= 0) {
            event.preventDefault();
            onRowClick(displayedData[row], row);
          }
          break;
        default:
          return;
      }

      if (newRow !== row || newCol !== col) {
        event.preventDefault();
        setFocusedCell({ row: newRow, col: newCol });
        
        // Focus the appropriate cell
        const targetCell = tableRef.current?.querySelector(
          `[data-row="${newRow}"][data-col="${newCol}"]`
        ) as HTMLElement;
        targetCell?.focus();
      }
    };

    tableRef.current.addEventListener('keydown', handleKeyDown);
    return () => tableRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [focusedCell, displayedData.length, visibleColumns.length, selectable, onRowClick]);

  // Mobile card view
  if (isMobile) {
    return (
      <div className={cn('responsive-table-mobile', className)}>
        {searchable && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary w-4 h-4" />
              <input
                type="text"
                placeholder={language === 'de' ? 'Suchen...' : 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
                aria-label={language === 'de' ? 'Tabelle durchsuchen' : 'Search table'}
              />
            </div>
          </div>
        )}

        <div 
          className="space-y-4"
          role="list"
          aria-label={ariaLabel || caption}
        >
          {displayedData.map((item, index) => (
            <div
              key={rowKeyAccessor ? rowKeyAccessor(item, index) : index}
              className={cn(
                'card p-4',
                {
                  'cursor-pointer hover:shadow-md transition-shadow': onRowClick,
                  'border-2 border-primary-500': selectedItems.includes(item),
                }
              )}
              onClick={() => onRowClick?.(item, index)}
              role={onRowClick ? 'button' : 'listitem'}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={
                onRowClick 
                  ? (language === 'de' ? `Zeile ${index + 1} auswählen` : `Select row ${index + 1}`)
                  : undefined
              }
            >
              {selectable && (
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={(e) => handleRowSelection(item, e.target.checked)}
                    aria-label={
                      language === 'de' 
                        ? `Zeile ${index + 1} auswählen`
                        : `Select row ${index + 1}`
                    }
                  />
                </div>
              )}
              
              {visibleColumns.map((column, colIndex) => (
                <div key={String(column.key)} className="flex justify-between py-1">
                  <span className="font-medium text-foreground-secondary">
                    {column.mobileHeader || column.header}:
                  </span>
                  <span className="text-foreground text-right">
                    {column.accessor 
                      ? column.accessor(item)
                      : (item as any)[column.key]
                    }
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop/tablet table view
  return (
    <div className={cn('responsive-table-container', className)}>
      {searchable && (
        <div className="mb-4 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary w-4 h-4" />
            <input
              type="text"
              placeholder={language === 'de' ? 'Tabelle durchsuchen...' : 'Search table...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
              aria-label={language === 'de' ? 'Tabelle durchsuchen' : 'Search table'}
            />
          </div>
          {sortedData.length > 0 && (
            <span className="text-sm text-foreground-secondary">
              {language === 'de' 
                ? `${sortedData.length} von ${data.length} Einträgen`
                : `${sortedData.length} of ${data.length} entries`
              }
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table
          ref={tableRef}
          id={id}
          className={cn(
            'w-full border-collapse',
            {
              'table-compact': compact,
              'table-zebra': zebra,
              'table-sticky-header': stickyHeader,
            }
          )}
          role="table"
          aria-label={ariaLabel}
          aria-rowcount={displayedData.length}
          aria-colcount={visibleColumns.length + (selectable ? 1 : 0)}
        >
          {caption && (
            <caption className="caption-bottom text-sm text-foreground-secondary p-2">
              {caption}
            </caption>
          )}
          
          <thead className="bg-background-secondary">
            <tr role="row">
              {selectable && (
                <th 
                  className="px-4 py-3 text-left"
                  role="columnheader"
                  aria-sort="none"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.length === displayedData.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label={
                      language === 'de'
                        ? 'Alle Zeilen auswählen/abwählen'
                        : 'Select/deselect all rows'
                    }
                  />
                </th>
              )}
              
              {visibleColumns.map((column, colIndex) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-foreground',
                    {
                      'cursor-pointer hover:bg-background-tertiary': 
                        sortable && column.sortable !== false,
                    }
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(String(column.key))}
                  role="columnheader"
                  aria-sort={
                    sortConfig?.key === column.key
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : sortable && column.sortable !== false ? 'none' : undefined
                  }
                  tabIndex={sortable && column.sortable !== false ? 0 : undefined}
                  aria-label={column.ariaLabel || column.header}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.header}</span>
                    {sortable && column.sortable !== false && (
                      <span className="text-foreground-secondary">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {displayedData.map((item, rowIndex) => (
              <tr
                key={rowKeyAccessor ? rowKeyAccessor(item, rowIndex) : rowIndex}
                className={cn(
                  'border-t border-border',
                  {
                    'hover:bg-background-secondary cursor-pointer': onRowClick,
                    'bg-primary-50 dark:bg-primary-950': selectedItems.includes(item),
                  }
                )}
                onClick={() => onRowClick?.(item, rowIndex)}
                role="row"
                aria-rowindex={rowIndex + 1}
                tabIndex={onRowClick ? 0 : undefined}
                data-row={rowIndex}
              >
                {selectable && (
                  <td 
                    className="px-4 py-3"
                    role="gridcell"
                    data-col={0}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item)}
                      onChange={(e) => handleRowSelection(item, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={
                        language === 'de'
                          ? `Zeile ${rowIndex + 1} auswählen`
                          : `Select row ${rowIndex + 1}`
                      }
                    />
                  </td>
                )}
                
                {visibleColumns.map((column, colIndex) => (
                  <td
                    key={String(column.key)}
                    className="px-4 py-3 text-foreground"
                    role="gridcell"
                    data-col={colIndex + (selectable ? 1 : 0)}
                    tabIndex={0}
                    onFocus={() => setFocusedCell({ 
                      row: rowIndex, 
                      col: colIndex + (selectable ? 1 : 0)
                    })}
                  >
                    {column.accessor 
                      ? column.accessor(item)
                      : (item as any)[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayedData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-foreground-secondary">
            {emptyMessage || 
              (language === 'de' ? 'Keine Daten verfügbar' : 'No data available')
            }
          </p>
        </div>
      )}

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-foreground-secondary">
            {language === 'de'
              ? `${startIndex + 1}-${Math.min(endIndex, sortedData.length)} von ${sortedData.length} Einträgen`
              : `${startIndex + 1}-${Math.min(endIndex, sortedData.length)} of ${sortedData.length} entries`
            }
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary btn-sm"
              aria-label={language === 'de' ? 'Vorherige Seite' : 'Previous page'}
            >
              {language === 'de' ? 'Zurück' : 'Previous'}
            </button>
            
            <span className="text-sm text-foreground">
              {language === 'de' 
                ? `Seite ${currentPage} von ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`
              }
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary btn-sm"
              aria-label={language === 'de' ? 'Nächste Seite' : 'Next page'}
            >
              {language === 'de' ? 'Weiter' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        {language === 'de' ? (
          `Tabelle mit ${displayedData.length} Zeilen und ${visibleColumns.length} Spalten. 
          Verwenden Sie Pfeiltasten zur Navigation. ${sortable ? 'Enter zum Sortieren.' : ''} 
          ${selectable ? 'Leertaste zum Auswählen.' : ''}`
        ) : (
          `Table with ${displayedData.length} rows and ${visibleColumns.length} columns. 
          Use arrow keys to navigate. ${sortable ? 'Press Enter to sort.' : ''} 
          ${selectable ? 'Press Space to select.' : ''}`
        )}
      </div>
    </div>
  );
}