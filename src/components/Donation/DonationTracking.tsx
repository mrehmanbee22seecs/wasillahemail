/**
 * Donation Tracking Component
 * Displays donation history and status for donors
 */

import React, { useEffect, useState } from 'react';
import {
  Heart,
  Calendar,
  CreditCard,
  Check,
  Clock,
  XCircle,
  RefreshCw,
  Download,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDonations, getDonorProfile } from '../../services/donationService';
import { DonationRecord, DonorProfile } from '../../types/donation';

export const DonationTracking: React.FC = () => {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'one-time' | 'recurring'>('all');

  useEffect(() => {
    loadDonations();
  }, [currentUser]);

  const loadDonations = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const [donationsData, profileData] = await Promise.all([
        getUserDonations(currentUser.uid),
        getDonorProfile(currentUser.uid),
      ]);
      setDonations(donationsData);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: DonationRecord['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: DonationRecord['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
    }
  };

  const filteredDonations = donations.filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'one-time') return d.frequency === 'one-time';
    if (filter === 'recurring') return d.frequency !== 'one-time';
    return true;
  });

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Please sign in to view your donation history
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Donor Stats */}
      {profile && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Donated
              </h3>
              <Heart className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              PKR {profile.totalDonated.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Donations
              </h3>
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.donationCount}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Recurring
              </h3>
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.recurringDonations}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Donation History
        </h2>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'one-time', label: 'One-time' },
            { value: 'recurring', label: 'Recurring' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Donations List */}
      {filteredDonations.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No donations found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Your donation history will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDonations.map((donation) => (
            <div
              key={donation.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        donation.status
                      )}`}
                    >
                      {donation.status.toUpperCase()}
                    </span>
                    {donation.frequency !== 'one-time' && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400">
                        <RefreshCw className="w-3 h-3 inline mr-1" />
                        {donation.frequency}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    PKR {donation.amount.toLocaleString()}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {donation.createdAt?.toDate
                        ? new Date(donation.createdAt.toDate()).toLocaleDateString()
                        : 'N/A'}
                    </span>
                    <span className="flex items-center capitalize">
                      <CreditCard className="w-4 h-4 mr-1" />
                      {donation.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(donation.status)}
                </div>
              </div>

              {donation.message && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    "{donation.message}"
                  </p>
                </div>
              )}

              {donation.dedication && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    {donation.dedication.type === 'in_honor' ? '💐 In honor of' : '🕊️ In memory of'}{' '}
                    <span className="font-semibold">{donation.dedication.honoree}</span>
                  </p>
                </div>
              )}

              {donation.transactionId && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Transaction ID: {donation.transactionId}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                {donation.receiptUrl && (
                  <button className="text-sm text-green-600 hover:text-green-700 flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    Download Receipt
                  </button>
                )}
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Impact Statement */}
      {profile && profile.totalDonated > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Your Impact 🌟</h3>
          <p className="text-green-100">
            Thank you for your generosity! Your donations have helped support{' '}
            <span className="font-bold">{profile.favoriteNgos.length || 'multiple'}</span>{' '}
            organizations and made a real difference in communities across Pakistan.
          </p>
          {profile.lastDonationDate && (
            <p className="text-sm text-green-100 mt-2">
              Last donation:{' '}
              {new Date(profile.lastDonationDate.toDate()).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DonationTracking;
