/**
 * NGO Donation Management Page
 * Comprehensive donation management dashboard for NGOs
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, TrendingUp, Users, Target, Calendar, ArrowLeft } from 'lucide-react';
import DonationGoals from '../components/Donation/DonationGoals';
import { getNgoDonationAnalytics } from '../services/donationService';
import { DonationAnalytics } from '../types/donation';

const DonationManagement: React.FC = () => {
  const { currentUser, userData, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<DonationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'analytics' | 'donors'>('goals');

  React.useEffect(() => {
    loadAnalytics();
  }, [currentUser]);

  const loadAnalytics = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const data = await getNgoDonationAnalytics(currentUser.uid);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only allow NGOs and admins
  if (!currentUser || (!isAdmin && userData?.role !== 'ngo')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This page is only accessible to registered NGOs
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Donation Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your fundraising goals and track donations
          </p>
        </div>

        {/* Stats Overview */}
        {!loading && analytics && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Raised
                </h3>
                <Heart className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                PKR {analytics.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                From {analytics.totalDonations} donations
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Donation
                </h3>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                PKR {Math.round(analytics.averageDonation).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Per donation
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Unique Donors
                </h3>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.uniqueDonors}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {analytics.recurringDonors} recurring
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Recent Activity
                </h3>
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.recentDonations.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last 10 donations
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              {[
                { id: 'goals', label: 'Donation Goals', icon: Target },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'donors', label: 'Donors', icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-6 py-4 flex items-center justify-center font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-green-600 text-green-600'
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
            {activeTab === 'goals' && (
              <DonationGoals ngoId={currentUser.uid} showCreateForm={false} />
            )}

            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                {/* Monthly Trends */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Monthly Trends
                  </h3>
                  {analytics.monthlyTrends.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.monthlyTrends.map((trend, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(trend.month + '-01').toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {trend.count} donations
                            </p>
                          </div>
                          <p className="text-xl font-bold text-green-600">
                            PKR {trend.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No monthly data available yet
                    </p>
                  )}
                </div>

                {/* Recent Donations */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Recent Donations
                  </h3>
                  {analytics.recentDonations.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.recentDonations.map((donation) => (
                        <div
                          key={donation.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {donation.isAnonymous ? 'Anonymous' : donation.donorName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {donation.createdAt?.toDate
                                ? new Date(donation.createdAt.toDate()).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">
                              PKR {donation.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {donation.frequency}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No recent donations
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'donors' && analytics && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Top Donors
                </h3>
                {analytics.topDonors.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topDonors.map((donor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {donor.donorName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {donor.donationCount} donations
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          PKR {donor.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No donor data available yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white text-center">
          <Heart className="w-12 h-12 mx-auto mb-4" fill="currentColor" />
          <h3 className="text-2xl font-bold mb-2">Share Your Impact</h3>
          <p className="text-green-100 mb-6">
            Share your donation page with supporters to increase visibility and reach your goals faster
          </p>
          <button
            onClick={() => {
              const url = `${window.location.origin}/ngo/${currentUser.uid}`;
              navigator.clipboard.writeText(url);
              alert('Profile link copied to clipboard!');
            }}
            className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Copy Profile Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationManagement;
