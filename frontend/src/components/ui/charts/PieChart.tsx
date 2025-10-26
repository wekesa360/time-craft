/**
 * Pie Chart Component
 * Responsive pie/donut chart for proportional data
 */

import React, { useMemo } from 'react';
import { Chart } from './Chart';

interface PieData {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieData[];
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
  loading?: boolean;
  error?: string;
  donut?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  showPercentages?: boolean;
  formatValue?: (value: number) => string;
  colors?: string[];
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  subtitle,
  className,
  height = 300,
  loading = false,
  error,
  donut = false,
  showLabels = true,
  showLegend = true,
  showPercentages = true,
  formatValue = (value) => value.toString(),
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
}) => {
  const { segments, total } = useMemo(() => {
    if (!data || data.length === 0) {
      return { segments: [], total: 0 };
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90; // Start from top

    const segments = data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      // Calculate path for SVG arc
      const centerX = 50;
      const centerY = 50;
      const radius = donut ? 35 : 40;
      const innerRadius = donut ? 20 : 0;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      let pathData = '';
      if (donut) {
        const innerX1 = centerX + innerRadius * Math.cos(startAngleRad);
        const innerY1 = centerY + innerRadius * Math.sin(startAngleRad);
        const innerX2 = centerX + innerRadius * Math.cos(endAngleRad);
        const innerY2 = centerY + innerRadius * Math.sin(endAngleRad);
        
        pathData = [
          `M ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          `L ${innerX2} ${innerY2}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
          'Z'
        ].join(' ');
      } else {
        pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
      }
      
      // Calculate label position
      const labelAngle = (startAngle + endAngle) / 2;
      const labelAngleRad = (labelAngle * Math.PI) / 180;
      const labelRadius = donut ? (radius + innerRadius) / 2 : radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos(labelAngleRad);
      const labelY = centerY + labelRadius * Math.sin(labelAngleRad);
      
      currentAngle = endAngle;
      
      return {
        ...item,
        color: item.color || colors[index % colors.length],
        percentage,
        angle,
        pathData,
        labelX,
        labelY,
        startAngle,
        endAngle,
      };
    });

    return { segments, total };
  }, [data, colors, donut]);

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground dark:text-muted-foreground">
          No data available
        </div>
      );
    }

    return (
      <div className="flex items-center h-full">
        {/* Chart */}
        <div className="flex-1">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full max-w-sm mx-auto"
          >
            {segments.map((segment, index) => (
              <g key={index}>
                <path
                  d={segment.pathData}
                  fill={segment.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  stroke="white"
                  strokeWidth="0.5"
                />
                {showLabels && segment.percentage > 5 && (
                  <text
                    x={segment.labelX}
                    y={segment.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs fill-white font-medium"
                    fontSize="3"
                  >
                    {showPercentages ? `${segment.percentage.toFixed(0)}%` : segment.label}
                  </text>
                )}
              </g>
            ))}
            
            {/* Center text for donut chart */}
            {donut && (
              <g>
                <text
                  x="50"
                  y="47"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-lg font-bold fill-current text-foreground dark:text-white"
                  fontSize="8"
                >
                  {formatValue(total)}
                </text>
                <text
                  x="50"
                  y="53"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-current text-muted-foreground dark:text-muted-foreground"
                  fontSize="3"
                >
                  Total
                </text>
              </g>
            )}
          </svg>
        </div>
        
        {/* Legend */}
        {showLegend && (
          <div className="ml-6 space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="flex-1">
                  <div className="text-foreground dark:text-white font-medium">
                    {segment.label}
                  </div>
                  <div className="text-muted-foreground dark:text-muted-foreground text-xs">
                    {formatValue(segment.value)} ({segment.percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

export default PieChart;