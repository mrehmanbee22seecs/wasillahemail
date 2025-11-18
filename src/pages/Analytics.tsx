/**
 * Analytics Dashboard Page
 * Comprehensive analytics for all users with role-based views
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Target,
  Building2,
  Server,
  Download,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import UserAnalytics from '../components/Analytics/UserAnalytics';
import ProjectAnalytics from '../components/Analytics/ProjectAnalytics';
import NGOAnalytics from '../components/Analytics/NGOAnalytics';
import {
  getUserAnalytics,
  getProjectAnalytics,
  getNGOAnalytics,
  getSystemAnalytics,
} from '../services/analyticsService';
import {
  UserAnalyticsData,
  ProjectAnalyticsData,
  NGOAnalyticsData,
  SystemAnalyticsData,
} from '../types/analytics';
import { formatCurrency } from '../utils/analytics';

const Analytics: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'ngos' | 'system'>('users');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsData | null>(null);
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalyticsData | null>(null);
  const [ngoAnalytics, setNGOAnalytics] = useState<NGOAnalyticsData | null>(null);
  const [systemAnalytics, setSystemAnalytics] = useState<SystemAnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [users, projects, ngos, system] = await Promise.all([
        getUserAnalytics(),
        getProjectAnalytics(),
        getNGOAnalytics(),
        getSystemAnalytics(),
      ]);

      setUserAnalytics(users);
      setProjectAnalytics(projects);
      setNGOAnalytics(ngos);
      setSystemAnalytics(system);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  // Only admins can access full analytics
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pt-24">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Access Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Only administrators can access the analytics dashboard
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'users' as const, label: 'User Analytics', icon: Users },
    { id: 'projects' as const, label: 'Project Analytics', icon: Target },
    { id: 'ngos' as const, label: 'NGO Analytics', icon: Building2 },
    { id: 'system' as const, label: 'System Health', icon: Server },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive insights and performance metrics
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* System Overview Card */}
        {systemAnalytics && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">System Status</p>
                <p className="text-xl font-bold text-green-600 capitalize">
                  {systemAnalytics.systemStatus}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Documents</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {systemAnalytics.totalDocuments.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Storage Used</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {systemAnalytics.storageUsed.toFixed(1)} MB
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Est. Monthly Cost</p>
                <p className="text-xl font-bold text-blue-600">
                  ${systemAnalytics.estimatedMonthlyCost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-fit px-6 py-4 flex items-center justify-center font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'users' && (
              <UserAnalytics data={userAnalytics} loading={loading} />
            )}
            {activeTab === 'projects' && (
              <ProjectAnalytics data={projectAnalytics} loading={loading} />
            )}
            {activeTab === 'ngos' && (
              <NGOAnalytics data={ngoAnalytics} loading={loading} />
            )}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                  <h3 className="text-xl font-bold mb-4">System Performance</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-blue-100 mb-1">Uptime</p>
                      <p className="text-2xl font-bold">
                        {systemAnalytics?.uptime.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-100 mb-1">Total Reads (Est.)</p>
                      <p className="text-2xl font-bold">
                        {systemAnalytics?.totalReads.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-100 mb-1">Total Writes (Est.)</p>
                      <p className="text-2xl font-bold">
                        {systemAnalytics?.totalWrites.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Cost Breakdown
                  </h3>
                  {systemAnalytics && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Firestore</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${systemAnalytics.costBreakdown.firestore.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Storage</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${systemAnalytics.costBreakdown.storage.toFixed(2)}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                        <span className="font-bold text-blue-600 text-xl">
                          ${systemAnalytics.estimatedMonthlyCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <div className="text-center">
          <button
            onClick={() => alert('Export functionality coming soon')}
            className="inline-flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Analytics Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
