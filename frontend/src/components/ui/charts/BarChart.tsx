/**
 * Bar Chart Component
 * Responsive bar chart for categorical data
 */

import React, { useMemo } from 'react';
import { Chart } from './Chart';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
  loading?: boolean;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  showValues?: boolean;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
  colors?: string[];
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  subtitle,
  className,
  height = 300,
  loading = false,
  error,
  orientation = 'vertical',
  showValues = true,
  showGrid = true,
  formatValue = (value) => value.toString(),
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
}) => {
  const { bars, maxValue } = useMemo(() => {
    if (!data || data.length === 0) {
      return { bars: [], maxValue: 0 };
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const paddedMaxValue = maxValue * 1.1; // Add 10% padding

    const bars = data.map((item, index) => ({
      ...item,
      color: item.color || colors[index % colors.length],
      percentage: (item.value / paddedMaxValue) * 100,
    }));

    return { bars, maxValue: paddedMaxValue };
  }, [data, colors]);

  const renderVerticalChart = () => {
    const barWidth = 100 / bars.length;
    const barPadding = barWidth * 0.2;
    const actualBarWidth = barWidth - barPadding;

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
            </g>
          )}
          
          {/* Bars */}
          {bars.map((bar, index) => {
            const x = index * barWidth + barPadding / 2;
            const barHeight = bar.percentage;
            const y = 100 - barHeight;
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={actualBarWidth}
                  height={barHeight}
                  fill={bar.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  rx="1"
                />
                {showValues && (
                  <text
                    x={x + actualBarWidth / 2}
                    y={y - 2}
                    textAnchor="middle"
                    className="text-xs fill-current text-muted-foreground dark:text-muted-foreground"
                    fontSize="3"
                  >
                    {formatValue(bar.value)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex mt-2">
          {bars.map((bar, index) => (
            <div
              key={index}
              className="flex-1 text-center text-xs text-muted-foreground dark:text-muted-foreground px-1"
            >
              {bar.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHorizontalChart = () => {
    const barHeight = 100 / bars.length;
    const barPadding = barHeight * 0.2;
    const actualBarHeight = barHeight - barPadding;

    return (
      <div className="relative h-full flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between py-2 pr-4 w-24">
          {bars.map((bar, index) => (
            <div
              key={index}
              className="text-xs text-muted-foreground dark:text-muted-foreground text-right flex items-center justify-end"
              style={{ height: `${barHeight}%` }}
            >
              {bar.label}
            </div>
          ))}
        </div>
        
        {/* Chart area */}
        <div className="flex-1 relative">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {showGrid && (
              <g className="opacity-20">
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
            
            {/* Bars */}
            {bars.map((bar, index) => {
              const y = index * barHeight + barPadding / 2;
              const barWidth = bar.percentage;
              
              return (
                <g key={index}>
                  <rect
                    x="0"
                    y={y}
                    width={barWidth}
                    height={actualBarHeight}
                    fill={bar.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    ry="1"
                  />
                  {showValues && (
                    <text
                      x={barWidth + 2}
                      y={y + actualBarHeight / 2}
                      dominantBaseline="middle"
                      className="text-xs fill-current text-muted-foreground dark:text-muted-foreground"
                      fontSize="3"
                    >
                      {formatValue(bar.value)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground dark:text-muted-foreground">
          No data available
        </div>
      );
    }

    return orientation === 'vertical' ? renderVerticalChart() : renderHorizontalChart();
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

export default BarChart;