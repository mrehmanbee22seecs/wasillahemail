/**
 * Project Analytics Component
 * Displays project performance and engagement metrics
 */

import React from 'react';
import {
  Target,
  CheckCircle,
  Users,
  TrendingUp,
  Award,
  BarChart3,
} from 'lucide-react';
import { ProjectAnalyticsData } from '../../types/analytics';
import { formatLargeNumber, formatPercentage } from '../../utils/analytics';

interface ProjectAnalyticsProps {
  data: ProjectAnalyticsData | null;
  loading: boolean;
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No project analytics data available</p>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Projects',
      value: formatLargeNumber(data.totalProjects),
      icon: Target,
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600',
    },
    {
      title: 'Active Projects',
      value: formatLargeNumber(data.activeProjects),
      icon: TrendingUp,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
    },
    {
      title: 'Completed',
      value: formatLargeNumber(data.completedProjects),
      icon: CheckCircle,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600',
    },
    {
      title: 'Total Applications',
      value: formatLargeNumber(data.totalApplications),
      icon: Users,
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            <div className={`p-3 rounded-lg ${metric.color} inline-block mb-3`}>
              <metric.icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {metric.title}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Completion Rate
          </h4>
          <p className="text-3xl font-bold text-green-600">
            {formatPercentage(data.projectCompletionRate)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Avg Applications/Project
          </h4>
          <p className="text-3xl font-bold text-blue-600">
            {data.averageApplicationsPerProject.toFixed(1)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Impact
          </h4>
          <p className="text-3xl font-bold text-purple-600">
            {formatLargeNumber(data.totalPeopleImpacted)}
          </p>
        </div>
      </div>

      {/* Projects by Category */}
      {data.projectsByCategory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Projects by Category
          </h3>
          <div className="space-y-3">
            {data.projectsByCategory.slice(0, 8).map((item, index) => {
              const maxCount = Math.max(...data.projectsByCategory.map(i => i.count));
              const width = (item.count / maxCount) * 100;
              
              return (
                <div key={index} className="flex items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-32">
                    {item.category}
                  </span>
                  <div className="flex-1 ml-4">
                    <div className="flex items-center">
                      <div
                        className="bg-green-600 h-6 rounded"
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

      {/* Top Projects */}
      {data.topProjects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            Top Performing Projects
          </h3>
          <div className="space-y-3">
            {data.topProjects.slice(0, 5).map((project, index) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {project.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {project.applications} applications · {formatLargeNumber(project.impact)} impacted
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAnalytics;
