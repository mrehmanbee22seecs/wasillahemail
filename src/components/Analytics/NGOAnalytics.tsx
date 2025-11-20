/**
 * NGO Analytics Component
 * Displays NGO performance and impact metrics
 */

import React from 'react';
import {
  Building2,
  TrendingUp,
  Users,
  Target,
  Award,
  Heart,
} from 'lucide-react';
import { NGOAnalyticsData } from '../../types/analytics';
import { formatLargeNumber, formatPercentage, formatCurrency } from '../../utils/analytics';

interface NGOAnalyticsProps {
  data: NGOAnalyticsData | null;
  loading: boolean;
}

export const NGOAnalytics: React.FC<NGOAnalyticsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No NGO analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 inline-block mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total NGOs
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatLargeNumber(data.totalNGOs)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {formatPercentage(data.ngoGrowthRate)} growth
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 inline-block mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Active NGOs
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatLargeNumber(data.activeNGOs)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 inline-block mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Volunteers
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatLargeNumber(data.totalVolunteersAcquired)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 inline-block mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Projects Created
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatLargeNumber(data.projectsCreated)}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Project Success Rate
          </h4>
          <p className="text-3xl font-bold text-green-600">
            {formatPercentage(data.projectSuccessRate)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.projectsCompleted} of {data.projectsCreated} completed
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Avg Volunteers per NGO
          </h4>
          <p className="text-3xl font-bold text-blue-600">
            {data.averageVolunteersPerNGO.toFixed(1)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Impact
          </h4>
          <p className="text-3xl font-bold text-purple-600">
            {formatLargeNumber(data.totalImpact)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            people reached
          </p>
        </div>
      </div>

      {/* Donation Metrics */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Heart className="w-6 h-6 mr-2" fill="currentColor" />
          Donation Impact
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-green-100 mb-1">Total Donations</p>
            <p className="text-2xl font-bold">{formatLargeNumber(data.donationsReceived)}</p>
          </div>
          <div>
            <p className="text-sm text-green-100 mb-1">Total Amount Raised</p>
            <p className="text-2xl font-bold">
              {formatCurrency(data.donationsReceived * data.averageDonationAmount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-100 mb-1">Avg Donation</p>
            <p className="text-2xl font-bold">{formatCurrency(data.averageDonationAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGOAnalytics;
