/**
 * My Donations Page
 * Donor dashboard to view donation history and impact
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DonationTracking from '../components/Donation/DonationTracking';

const MyDonations: React.FC = () => {
  const navigate = useNavigate();

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
            My Donations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your donation history and track your impact
          </p>
        </div>

        {/* Donation Tracking Component */}
        <DonationTracking />
      </div>
    </div>
  );
};

export default MyDonations;
