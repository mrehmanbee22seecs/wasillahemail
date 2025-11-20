/**
 * Usage Dashboard Component
 * Displays usage statistics, quotas, and alerts
 */

import React, { useEffect } from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import {
  BarChart3,
  Calendar,
  FolderOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

export const UsageDashboard: React.FC = () => {
  const {
    subscription,
    usage,
    planConfig,
    getQuotaAlerts,
    refreshUsage,
    loading,
  } = useSubscription();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    // Refresh usage on mount
    refreshUsage();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUsage();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subscription || !usage) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        No usage data available
      </div>
    );
  }

  const alerts = getQuotaAlerts();
  const { maxProjects, maxEventsPerProject } = planConfig.limits;

  const projectsPercentage = maxProjects > 0
    ? Math.min((usage.projectsCreated / maxProjects) * 100, 100)
    : 0;

  const eventsLimit = maxProjects > 0 && maxEventsPerProject > 0
    ? maxProjects * maxEventsPerProject
    : 0;

  const eventsPercentage = eventsLimit > 0
    ? Math.min((usage.eventsCreated / eventsLimit) * 100, 100)
    : 0;

  const UsageCard: React.FC<{
    title: string;
    current: number;
    limit: number;
    percentage: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, current, limit, percentage, icon, color }) => {
    const isUnlimited = limit === -1;
    const isNearLimit = percentage >= 80 && !isUnlimited;
    const isAtLimit = percentage >= 100 && !isUnlimited;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
              {icon}
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          {isAtLimit ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : isNearLimit ? (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
        </div>

        <div className="mb-2">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {current}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isUnlimited ? 'Unlimited' : `of ${limit}`}
            </span>
          </div>
        </div>

        {!isUnlimited && (
          <>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full ${
                  isAtLimit
                    ? 'bg-red-500'
                    : isNearLimit
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {percentage.toFixed(0)}% used
            </p>
          </>
        )}

        {isUnlimited && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            ✓ Unlimited access with Premium
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Usage Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your usage and quotas
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Current Plan Badge */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Current Plan</p>
            <h3 className="text-2xl font-bold mt-1">{planConfig.displayName}</h3>
            {subscription.status === 'trial' && subscription.trialEndDate && (
              <p className="text-sm opacity-90 mt-2">
                Trial ends: {new Date(subscription.trialEndDate.seconds * 1000).toLocaleDateString()}
              </p>
            )}
          </div>
          {planConfig.id === 'free' && (
            <a
              href="/upgrade"
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Upgrade
            </a>
          )}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                alert.type === 'limit_reached'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <div className="flex items-start">
                <AlertTriangle
                  className={`w-5 h-5 flex-shrink-0 ${
                    alert.type === 'limit_reached' ? 'text-red-500' : 'text-yellow-500'
                  }`}
                />
                <div className="ml-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {alert.type === 'limit_reached'
                      ? `${alert.resource === 'projects' ? 'Project' : 'Event'} Limit Reached`
                      : `Approaching ${alert.resource === 'projects' ? 'Project' : 'Event'} Limit`}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    You've used {alert.current} of {alert.limit}{' '}
                    {alert.resource === 'projects' ? 'projects' : 'events'}. 
                    {alert.type === 'limit_reached' && planConfig.id === 'free' && (
                      <> Upgrade to Premium for unlimited access.</>
                    )}
                  </p>
                  {alert.type === 'limit_reached' && planConfig.id === 'free' && (
                    <a
                      href="/upgrade"
                      className="inline-block mt-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Upgrade Now →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <UsageCard
          title="Projects"
          current={usage.projectsCreated}
          limit={maxProjects}
          percentage={projectsPercentage}
          icon={<FolderOpen className="w-6 h-6 text-blue-600" />}
          color="blue"
        />
        <UsageCard
          title="Events"
          current={usage.eventsCreated}
          limit={eventsLimit}
          percentage={eventsPercentage}
          icon={<Calendar className="w-6 h-6 text-green-600" />}
          color="green"
        />
      </div>

      {/* Stats Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Usage Statistics
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {usage.lastUpdated && usage.lastUpdated.seconds
                ? new Date(usage.lastUpdated.seconds * 1000).toLocaleString()
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {subscription.status}
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Maximize Your Impact
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {planConfig.id === 'free' ? (
                <>
                  You're on the free plan with 1 project and 2 events. 
                  Upgrade to Premium to create unlimited projects and events, 
                  plus get advanced analytics and priority support.
                </>
              ) : (
                <>
                  You have unlimited access to all features! Create as many 
                  projects and events as you need to maximize your impact.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageDashboard;
