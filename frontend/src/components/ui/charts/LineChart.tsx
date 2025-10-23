/**
 * Line Chart Component
 * Responsive line chart for time series data
 */

import React, { useMemo } from 'react';
import { Chart } from './Chart';

interface DataPoint {
  x: string | number;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
  loading?: boolean;
  error?: string;
  color?: string;
  showGrid?: boolean;
  showDots?: boolean;
  smooth?: boolean;
  formatValue?: (value: number) => string;
  formatLabel?: (label: string | number) => string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  subtitle,
  className,
  height = 300,
  loading = false,
  error,
  color = '#3b82f6',
  showGrid = true,
  showDots = true,
  smooth = true,
  formatValue = (value) => (value ?? 0).toString(),
  formatLabel = (label) => (label ?? '').toString(),
}) => {
  const { pathData, points, minY, maxY, minX, maxX } = useMemo(() => {
    if (!data || data.length === 0) {
      return { pathData: '', points: [], minY: 0, maxY: 0, minX: 0, maxX: 0 };
    }

    const yValues = data.map(d => d.y ?? 0).filter(y => !isNaN(y));
    const xValues = data.map((d, i) => typeof d.x === 'number' ? d.x : i);
    
    if (yValues.length === 0) {
      return { pathData: '', points: [], minY: 0, maxY: 0, minX: 0, maxX: 0 };
    }
    
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    
    // Add padding to Y range
    const yRange = maxY - minY;
    const paddedMinY = minY - yRange * 0.1;
    const paddedMaxY = maxY + yRange * 0.1;
    
    const width = 100; // SVG viewBox width
    const chartHeight = 100; // SVG viewBox height
    
    const points = data.map((point, index) => {
      const x = typeof point.x === 'number' ? point.x : index;
      const y = point.y ?? 0;
      const normalizedX = ((x - minX) / (maxX - minX)) * width;
      const normalizedY = chartHeight - ((y - paddedMinY) / (paddedMaxY - paddedMinY)) * chartHeight;
      
      return {
        x: normalizedX,
        y: normalizedY,
        originalX: point.x ?? index,
        originalY: y,
        label: point.label,
      };
    });
    
    // Create path data
    let pathData = '';
    if (points.length > 0) {
      pathData = `M ${points[0].x} ${points[0].y}`;
      
      if (smooth && points.length > 2) {
        // Create smooth curve using quadratic bezier curves
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const next = points[i + 1];
          
          if (next) {
            const cp1x = prev.x + (curr.x - prev.x) * 0.5;
            const cp1y = prev.y;
            const cp2x = curr.x - (next.x - curr.x) * 0.5;
            const cp2y = curr.y;
            
            pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
          } else {
            pathData += ` L ${curr.x} ${curr.y}`;
          }
        }
      } else {
        // Straight lines
        for (let i = 1; i < points.length; i++) {
          pathData += ` L ${points[i].x} ${points[i].y}`;
        }
      }
    }
    
    return { pathData, points, minY: paddedMinY, maxY: paddedMaxY, minX, maxX };
  }, [data, smooth]);

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          No data available
        </div>
      );
    }

    return (
      <div className="relative h-full">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="opacity-20">
              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <line
                  key={`h-${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              ))}
              {/* Vertical grid lines */}
              {[0, 25, 50, 75, 100].map(x => (
                <line
                  key={`v-${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              ))}
            </g>
          )}
          
          {/* Line path */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {showDots && points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="2"
              fill={color}
              className="drop-shadow-sm hover:r-3 transition-all cursor-pointer"
            />
          ))}
        </svg>
        
        {/* Tooltip overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {points.map((point, index) => (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-full opacity-0 hover:opacity-100 transition-opacity pointer-events-auto"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
            >
              <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 mb-1">
                {point.label || formatLabel(point.originalX ?? '')}: {formatValue(point.originalY ?? 0)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Chart
      title={title}
      subtitle={subtitle}
      className={className}
      height={height}
      loading={loading}
      error={error}
    >
      {renderChart()}
    </Chart>
  );
};

export default LineChart;