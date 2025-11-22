/**
 * Plan Selector Component
 * Displays subscription plans with comparison and selection
 */

import React, { useState } from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { SubscriptionPlan } from '../../types/subscription';
import PaymentCheckout from '../Payment/PaymentCheckout';

interface PlanSelectorProps {
  onSelectPlan?: (plan: SubscriptionPlan) => void;
  currentPlan?: SubscriptionPlan;
  showCurrentBadge?: boolean;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  onSelectPlan,
  currentPlan: propCurrentPlan,
  showCurrentBadge = true,
}) => {
  const { subscription, getPlanConfig, upgradeToPremium, downgradToFree } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);

  const currentPlan = propCurrentPlan || subscription?.plan || 'free';

  const freePlan = getPlanConfig('free');
  const premiumPlan = getPlanConfig('premium');

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return;

    // If upgrading to premium, show payment modal
    if (plan === 'premium') {
      setSelectedPlanForPayment(plan);
      setShowPaymentModal(true);
      return;
    }

    // If downgrading to free, proceed directly
    setLoading(true);
    try {
      await downgradToFree();
      
      if (onSelectPlan) {
        onSelectPlan(plan);
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Failed to change plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PlanCard: React.FC<{
    plan: typeof freePlan | typeof premiumPlan;
    isCurrent: boolean;
    isRecommended?: boolean;
  }> = ({ plan, isCurrent, isRecommended }) => {
    const Icon = plan.id === 'free' ? Zap : Crown;
    const borderColor = plan.id === 'free' ? 'border-blue-500' : 'border-purple-500';
    const bgColor = plan.id === 'free' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20';
    const buttonColor = plan.id === 'free' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700';

    return (
      <div
        className={`relative flex flex-col p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${
          isRecommended ? borderColor : 'border-gray-200 dark:border-gray-700'
        } transition-all hover:shadow-xl ${
          isRecommended ? 'transform scale-105' : ''
        }`}
      >
        {isRecommended && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
              <Sparkles className="w-4 h-4 mr-1" />
              Recommended
            </span>
          </div>
        )}

        {isCurrent && showCurrentBadge && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              Current Plan
            </span>
          </div>
        )}

        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`w-6 h-6 text-${plan.id === 'free' ? 'blue' : 'purple'}-600`} />
          </div>
          <div className="ml-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {plan.displayName}
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {plan.price === 0 ? 'Free' : `PKR ${plan.price.toLocaleString()}`}
            </span>
            {plan.price > 0 && (
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                /{selectedInterval === 'monthly' ? 'month' : 'year'}
              </span>
            )}
          </div>
          {plan.price > 0 && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Billed {selectedInterval}
            </p>
          )}
        </div>

        <ul className="space-y-3 mb-8 flex-grow">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => handleSelectPlan(plan.id)}
          disabled={isCurrent || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
            isCurrent
              ? 'bg-gray-400 cursor-not-allowed'
              : buttonColor
          } disabled:opacity-50`}
        >
          {loading ? (
            'Processing...'
          ) : isCurrent ? (
            'Current Plan'
          ) : plan.id === 'premium' ? (
            'Upgrade to Premium'
          ) : (
            'Switch to Free'
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Start with our free plan or unlock unlimited potential with Premium
        </p>
      </div>

      {/* Billing interval toggle - for future use when pricing is added */}
      {premiumPlan.price > 0 && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setSelectedInterval('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedInterval === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedInterval('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedInterval === 'yearly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <PlanCard
          plan={freePlan}
          isCurrent={currentPlan === 'free'}
        />
        <PlanCard
          plan={premiumPlan}
          isCurrent={currentPlan === 'premium'}
          isRecommended
        />
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          All plans include access to our community and knowledge base
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Secure payment processing via JazzCash
        </p>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlanForPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <PaymentCheckout
              plan={selectedPlanForPayment}
              amount={premiumPlan.price}
              currency={premiumPlan.currency}
              onSuccess={async () => {
                await upgradeToPremium();
                setShowPaymentModal(false);
                if (onSelectPlan) {
                  onSelectPlan(selectedPlanForPayment);
                }
              }}
              onCancel={() => {
                setShowPaymentModal(false);
                setSelectedPlanForPayment(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanSelector;
