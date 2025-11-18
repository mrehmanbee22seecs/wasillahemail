/**
 * Upgrade Page
 * Full page for subscription plan selection and management
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import PlanSelector from '../components/Subscription/PlanSelector';
import UsageDashboard from '../components/Subscription/UsageDashboard';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Upgrade: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { subscription } = useSubscription();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to continue
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be signed in to manage your subscription
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Subscription & Billing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your subscription plan and monitor usage
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Current Usage Section */}
        <div className="mb-12">
          <UsageDashboard />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-12"></div>

        {/* Plans Section */}
        <div>
          <PlanSelector currentPlan={subscription?.plan} />
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I upgrade or downgrade at any time?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade to Premium or downgrade to Free at any time. 
                Changes take effect immediately.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data is always safe. If you downgrade to the free plan and have more 
                than 1 project or 2 events, you can still view them but won't be able to 
                create new ones until you're within the free plan limits.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is payment required for Premium?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Payment processing is coming soon. Currently, Premium features are available 
                for testing. When we launch paid plans, pricing will be optimized for the 
                Pakistani market with local payment options.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What payment methods will be available?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We're working to integrate Pakistan-friendly payment methods including 
                JazzCash, EasyPaisa, and local bank transfers. International cards will 
                also be supported.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Do you offer discounts for NGOs?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! We're committed to supporting social impact. Registered NGOs and 
                non-profit organizations will be eligible for special pricing. Contact us 
                to learn more.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How can I get support?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Free plan users have access to our community forums and knowledge base. 
                Premium users get priority email support with faster response times. 
                Visit our contact page for more information.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Need help choosing a plan?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
