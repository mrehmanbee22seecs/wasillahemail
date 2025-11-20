/**
 * Analytics Utilities
 * Helper functions for analytics calculations and formatting
 */

import { TrendData, ChartDataPoint } from '../types/analytics';

/**
 * Calculate trend direction and percentage change
 */
export const calculateTrend = (current: number, previous: number): TrendData => {
  if (previous === 0) {
    return {
      current,
      previous,
      change: current > 0 ? 100 : 0,
      direction: current > 0 ? 'up' : 'stable',
    };
  }
  
  const change = ((current - previous) / previous) * 100;
  const direction = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
  
  return {
    current,
    previous,
    change: Math.round(change * 10) / 10,
    direction,
  };
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format percentage with symbol
 */
export const formatPercentage = (num: number, decimals: number = 1): string => {
  return num.toFixed(decimals) + '%';
};

/**
 * Format currency (PKR)
 */
export const formatCurrency = (amount: number): string => {
  return 'PKR ' + amount.toLocaleString('en-PK');
};

/**
 * Get color for metric trend
 */
export const getTrendColor = (direction: 'up' | 'down' | 'stable', isPositive: boolean = true): string => {
  if (direction === 'stable') return 'text-gray-600 dark:text-gray-400';
  if (direction === 'up') return isPositive ? 'text-green-600' : 'text-red-600';
  return isPositive ? 'text-red-600' : 'text-green-600';
};

/**
 * Get color for percentage value
 */
export const getPercentageColor = (value: number, threshold: { good: number; warning: number }): string => {
  if (value >= threshold.good) return 'text-green-600';
  if (value >= threshold.warning) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Calculate moving average for smoothing trends
 */
export const calculateMovingAverage = (data: number[], window: number = 7): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const subset = data.slice(start, i + 1);
    const avg = subset.reduce((a, b) => a + b, 0) / subset.length;
    result.push(Math.round(avg * 10) / 10);
  }
  return result;
};

/**
 * Generate chart colors
 */
export const getChartColors = (count: number): string[] => {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];
  
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

/**
 * Prepare data for pie chart
 */
export const preparePieChartData = (
  data: Array<{ label: string; value: number }>
): ChartDataPoint[] => {
  const colors = getChartColors(data.length);
  return data.map((item, index) => ({
    label: item.label,
    value: item.value,
    color: colors[index],
  }));
};

/**
 * Prepare data for line chart
 */
export const prepareLineChartData = (
  data: Array<{ date: string; count: number }>
): Array<{ x: string; y: number }> => {
  return data.map(item => ({
    x: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    y: item.count,
  }));
};

/**
 * Calculate retention rate
 */
export const calculateRetentionRate = (
  activeUsers: number,
  totalUsers: number
): number => {
  if (totalUsers === 0) return 0;
  return (activeUsers / totalUsers) * 100;
};

/**
 * Calculate churn rate
 */
export const calculateChurnRate = (
  churnedUsers: number,
  totalUsers: number
): number => {
  if (totalUsers === 0) return 0;
  return (churnedUsers / totalUsers) * 100;
};

/**
 * Calculate engagement score (0-100)
 */
export const calculateEngagementScore = (metrics: {
  activeUsers: number;
  totalUsers: number;
  averageActions: number;
  retention: number;
}): number => {
  const activeRatio = metrics.totalUsers > 0 ? metrics.activeUsers / metrics.totalUsers : 0;
  const actionScore = Math.min(metrics.averageActions / 10, 1); // Normalize to 0-1
  const retentionScore = metrics.retention / 100;
  
  const score = (activeRatio * 0.4 + actionScore * 0.3 + retentionScore * 0.3) * 100;
  return Math.round(score);
};

/**
 * Get time range label
 */
export const getTimeRangeLabel = (range: string): string => {
  switch (range) {
    case 'today':
      return 'Today';
    case 'week':
      return 'This Week';
    case 'month':
      return 'This Month';
    case 'quarter':
      return 'This Quarter';
    case 'year':
      return 'This Year';
    default:
      return 'Custom Range';
  }
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',')
    ),
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Group data by time period
 */
export const groupByTimePeriod = (
  data: Array<{ date: Date; value: number }>,
  period: 'day' | 'week' | 'month'
): Array<{ label: string; value: number }> => {
  const grouped = new Map<string, number>();
  
  data.forEach(item => {
    let key: string;
    if (period === 'day') {
      key = item.date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(item.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    grouped.set(key, (grouped.get(key) || 0) + item.value);
  });
  
  return Array.from(grouped.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
