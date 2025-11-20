/**
 * User Analytics Component
 * Displays comprehensive user analytics and metrics
 */

import React from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  UserPlus,
  UserCheck,
  Repeat,
} from 'lucide-react';
import { UserAnalyticsData } from '../../types/analytics';
import { formatLargeNumber, formatPercentage, getTrendColor } from '../../utils/analytics';

interface UserAnalyticsProps {
  data: UserAnalyticsData | null;
  loading: boolean;
}

export const UserAnalytics: React.FC<UserAnalyticsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No user analytics data available</p>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Users',
      value: formatLargeNumber(data.totalUsers),
      icon: Users,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
      change: data.userGrowthRate,
      changeLabel: 'vs last month',
    },
    {
      title: 'New Users (Month)',
      value: formatLargeNumber(data.newUsersThisMonth),
      icon: UserPlus,
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600',
      change: data.userGrowthRate,
      changeLabel: 'growth rate',
    },
    {
      title: 'Active Users (Month)',
      value: formatLargeNumber(data.activeUsersThisMonth),
      icon: Activity,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600',
      change: 0,
      changeLabel: 'engagement',
    },
    {
      title: 'New Users (Week)',
      value: formatLargeNumber(data.newUsersThisWeek),
      icon: UserCheck,
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600',
      change: 0,
      changeLabel: 'this week',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
              {metric.change !== 0 && (
                <div className="flex items-center">
                  {metric.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      metric.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercentage(Math.abs(metric.change))}
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {metric.title}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {metric.changeLabel}
            </p>
          </div>
        ))}
      </div>

      {/* User Segmentation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Segmentation by Role
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(data.usersByRole).map(([role, count]) => (
            <div
              key={role}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize mb-1">
                {role}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatLargeNumber(count)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {data.totalUsers > 0
                  ? formatPercentage((count / data.totalUsers) * 100)
                  : '0%'}{' '}
                of total
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Trend */}
      {data.userGrowthTrend.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Growth Trend (Last 30 Days)
          </h3>
          <div className="space-y-2">
            {data.userGrowthTrend.slice(-10).map((item, index) => {
              const maxCount = Math.max(...data.userGrowthTrend.map(i => i.count));
              const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-24">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="flex-1 ml-4">
                    <div className="flex items-center">
                      <div
                        className="bg-blue-600 h-6 rounded transition-all duration-300"
                        style={{ width: `${width}%` }}
                      ></div>
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {item.count}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Engagement Metrics (Placeholder for future implementation) */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Engagement Insights</h3>
        <p className="text-blue-100 mb-4">
          Advanced engagement metrics including session duration, retention rates, and user behavior
          patterns are being collected for future analysis.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-blue-100">Daily Retention</p>
            <p className="text-2xl font-bold">Coming Soon</p>
          </div>
          <div>
            <p className="text-sm text-blue-100">Avg Session Duration</p>
            <p className="text-2xl font-bold">Coming Soon</p>
          </div>
          <div>
            <p className="text-sm text-blue-100">Actions per User</p>
            <p className="text-2xl font-bold">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;
