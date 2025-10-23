/**
 * Health Data Export Component
 * Export health data in various formats
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui';
import { FadeIn, ScaleIn } from '../../ui/animations';

interface HealthData {
  date: string;
  weight?: number;
  steps?: number;
  sleep?: number;
  water?: number;
  mood?: number;
  energy?: number;
  stress?: number;
  exercise?: number;
  notes?: string;
}

interface HealthDataExportProps {
  data: HealthData[];
  onExport?: (format: ExportFormat, options: ExportOptions) => void;
  className?: string;
}

type ExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx';
type DateRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

interface ExportOptions {
  format: ExportFormat;
  dateRange: DateRange;
  customStartDate?: string;
  customEndDate?: string;
  includeMetrics: string[];
  includeNotes: boolean;
  includeCharts: boolean;
}

const exportFormats = [
  {
    id: 'csv' as const,
    name: 'CSV',
    description: 'Comma-separated values for spreadsheet applications',
    icon: '📊',
    extension: '.csv',
    mimeType: 'text/csv',
  },
  {
    id: 'json' as const,
    name: 'JSON',
    description: 'JavaScript Object Notation for developers',
    icon: '🔧',
    extension: '.json',
    mimeType: 'application/json',
  },
  {
    id: 'pdf' as const,
    name: 'PDF',
    description: 'Portable Document Format with charts and summaries',
    icon: '📄',
    extension: '.pdf',
    mimeType: 'application/pdf',
  },
  {
    id: 'xlsx' as const,
    name: 'Excel',
    description: 'Microsoft Excel workbook with multiple sheets',
    icon: '📈',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
];

const dateRangeOptions = [
  { id: '7d', name: 'Last 7 days' },
  { id: '30d', name: 'Last 30 days' },
  { id: '90d', name: 'Last 90 days' },
  { id: '1y', name: 'Last year' },
  { id: 'all', name: 'All data' },
  { id: 'custom', name: 'Custom range' },
];

const availableMetrics = [
  { id: 'weight', name: 'Weight', icon: '⚖️' },
  { id: 'steps', name: 'Steps', icon: '👟' },
  { id: 'sleep', name: 'Sleep', icon: '😴' },
  { id: 'water', name: 'Water Intake', icon: '💧' },
  { id: 'mood', name: 'Mood', icon: '😊' },
  { id: 'energy', name: 'Energy Level', icon: '⚡' },
  { id: 'stress', name: 'Stress Level', icon: '😰' },
  { id: 'exercise', name: 'Exercise', icon: '💪' },
];

const HealthDataExport: React.FC<HealthDataExportProps> = ({
  data,
  onExport,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['weight', 'steps', 'sleep', 'mood']);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const getFilteredData = () => {
    let filteredData = [...data];
    
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      if (dateRange === 'custom') {
        if (!customStartDate || !customEndDate) return [];
        startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= startDate && itemDate <= endDate;
        });
      } else {
        const days = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365,
        }[dateRange] || 30;
        
        startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(item => new Date(item.date) >= startDate);
      }
    }
    
    return filteredData;
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const generateCSV = (filteredData: HealthData[]) => {
    const headers = ['Date', ...selectedMetrics.map(m => availableMetrics.find(am => am.id === m)?.name || m)];
    if (includeNotes) headers.push('Notes');
    
    const rows = filteredData.map(item => {
      const row = [item.date];
      selectedMetrics.forEach(metric => {
        row.push(item[metric as keyof HealthData]?.toString() || '');
      });
      if (includeNotes) row.push(item.notes || '');
      return row;
    });
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generateJSON = (filteredData: HealthData[]) => {
    const exportData = filteredData.map(item => {
      const filtered: any = { date: item.date };
      selectedMetrics.forEach(metric => {
        if (item[metric as keyof HealthData] !== undefined) {
          filtered[metric] = item[metric as keyof HealthData];
        }
      });
      if (includeNotes && item.notes) {
        filtered.notes = item.notes;
      }
      return filtered;
    });
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      dateRange,
      totalRecords: exportData.length,
      metrics: selectedMetrics,
      data: exportData,
    }, null, 2);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const filteredData = getFilteredData();
      const timestamp = new Date().toISOString().split('T')[0];
      const formatConfig = exportFormats.find(f => f.id === selectedFormat)!;
      
      const options: ExportOptions = {
        format: selectedFormat,
        dateRange,
        customStartDate: dateRange === 'custom' ? customStartDate : undefined,
        customEndDate: dateRange === 'custom' ? customEndDate : undefined,
        includeMetrics: selectedMetrics,
        includeNotes,
        includeCharts,
      };
      
      let content: string;
      let filename: string;
      
      switch (selectedFormat) {
        case 'csv':
          content = generateCSV(filteredData);
          filename = `health-data-${timestamp}${formatConfig.extension}`;
          downloadFile(content, filename, formatConfig.mimeType);
          break;
          
        case 'json':
          content = generateJSON(filteredData);
          filename = `health-data-${timestamp}${formatConfig.extension}`;
          downloadFile(content, filename, formatConfig.mimeType);
          break;
          
        case 'pdf':
        case 'xlsx':
          // For PDF and Excel, we would typically use a library like jsPDF or SheetJS
          // For now, we'll call the onExport callback to let the parent handle it
          onExport?.(selectedFormat, options);
          break;
      }
      
      // Close modal after successful export
      setTimeout(() => {
        setIsOpen(false);
        setIsExporting(false);
      }, 1000);
      
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const filteredData = getFilteredData();
  const selectedFormatConfig = exportFormats.find(f => f.id === selectedFormat)!;

  return (
    <div className={cn('', className)}>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Data
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Export Health Data
                  </h2>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="outline"
                    size="sm"
                    className="p-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>

                {/* Format Selection */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Export Format</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exportFormats.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                        className={cn(
                          'p-4 rounded-lg border text-left transition-all duration-200',
                          selectedFormat === format.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{format.icon}</span>
                          <div>
                            <div className="font-medium">{format.name}</div>
                            <div className="text-sm opacity-75">{format.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Date Range</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {dateRangeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setDateRange(option.id as DateRange)}
                        className={cn(
                          'p-2 rounded-lg border text-sm transition-all duration-200',
                          dateRange === option.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        )}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                  
                  {dateRange === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Metrics Selection */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Include Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableMetrics.map((metric) => (
                      <button
                        key={metric.id}
                        onClick={() => toggleMetric(metric.id)}
                        className={cn(
                          'p-2 rounded-lg border text-sm transition-all duration-200',
                          selectedMetrics.includes(metric.id)
                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        )}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{metric.icon}</span>
                          <span>{metric.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Additional Options</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={includeNotes}
                        onChange={(e) => setIncludeNotes(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Include notes</span>
                    </label>
                    
                    {(selectedFormat === 'pdf' || selectedFormat === 'xlsx') && (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={includeCharts}
                          onChange={(e) => setIncludeCharts(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Include charts and visualizations</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Preview</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <p>Format: {selectedFormatConfig.name} ({selectedFormatConfig.extension})</p>
                    <p>Records: {filteredData.length} entries</p>
                    <p>Metrics: {selectedMetrics.length} selected</p>
                    <p>Date range: {dateRangeOptions.find(d => d.id === dateRange)?.name}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={isExporting || selectedMetrics.length === 0 || filteredData.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isExporting ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HealthDataExport;