/**
 * Donation Form Component
 * Comprehensive donation form with multiple payment methods and options
 */

import React, { useState } from 'react';
import {
  Heart,
  CreditCard,
  Smartphone,
  Building2,
  User,
  Mail,
  Phone,
  MessageSquare,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createDonation } from '../../services/donationService';
import {
  DonationFormData,
  DonationFrequency,
  PaymentMethod,
} from '../../types/donation';

interface DonationFormProps {
  targetNgoId?: string;
  targetProjectId?: string;
  onSuccess?: (donationId: string) => void;
  onCancel?: () => void;
}

export const DonationForm: React.FC<DonationFormProps> = ({
  targetNgoId,
  targetProjectId,
  onSuccess,
  onCancel,
}) => {
  const { currentUser, userData } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<DonationFormData>({
    amount: null,
    customAmount: undefined,
    frequency: 'one-time',
    paymentMethod: 'easypaisa',
    isAnonymous: false,
    donorName: userData?.displayName || '',
    donorEmail: userData?.email || '',
    donorPhone: userData?.phoneNumber || '',
    targetNgoId,
    targetProjectId,
  });

  const predefinedAmounts = [500, 1000, 2500, 5000, 10000];

  const paymentMethods: Array<{
    id: PaymentMethod;
    name: string;
    icon: any;
    color: string;
    accountInfo: { number: string; title: string };
  }> = [
    {
      id: 'easypaisa',
      name: 'Easypaisa',
      icon: Smartphone,
      color: 'bg-green-600',
      accountInfo: {
        number: '03349682146',
        title: 'Wasilah Foundation',
      },
    },
    {
      id: 'jazzcash',
      name: 'JazzCash',
      icon: Smartphone,
      color: 'bg-orange-600',
      accountInfo: {
        number: '03349682146',
        title: 'Wasilah Foundation',
      },
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: Building2,
      color: 'bg-blue-600',
      accountInfo: {
        number: '19367902143803',
        title: 'Habib Bank Limited',
      },
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.amount && !formData.customAmount) {
      setError('Please select or enter a donation amount');
      return;
    }

    if (!formData.isAnonymous) {
      if (!formData.donorName || !formData.donorEmail) {
        setError('Please provide your name and email');
        return;
      }
    }

    setLoading(true);
    try {
      const donationId = await createDonation(formData, currentUser?.uid);
      console.log('Donation created:', donationId);
      
      if (onSuccess) {
        onSuccess(donationId);
      }
    } catch (err: any) {
      console.error('Error creating donation:', err);
      setError(err.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Account number copied to clipboard!');
  };

  // Step 1: Amount Selection
  const AmountStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Donation Amount
        </h3>
        
        {/* Predefined Amounts */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {predefinedAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setFormData({ ...formData, amount, customAmount: undefined })}
              className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                formData.amount === amount && !formData.customAmount
                  ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
              }`}
            >
              PKR {amount.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or enter custom amount (PKR)
          </label>
          <input
            type="number"
            min="100"
            value={formData.customAmount || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                customAmount: e.target.value ? parseInt(e.target.value) : undefined,
                amount: null,
              })
            }
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
            placeholder="Enter amount"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Minimum donation: PKR 100
          </p>
        </div>
      </div>

      {/* Frequency Selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Donation Frequency
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'one-time' as DonationFrequency, label: 'One-time' },
            { value: 'monthly' as DonationFrequency, label: 'Monthly' },
            { value: 'quarterly' as DonationFrequency, label: 'Quarterly' },
            { value: 'yearly' as DonationFrequency, label: 'Yearly' },
          ].map((freq) => (
            <button
              key={freq.value}
              type="button"
              onClick={() => setFormData({ ...formData, frequency: freq.value })}
              className={`p-3 rounded-lg border-2 font-medium transition-all ${
                formData.frequency === freq.value
                  ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
              }`}
            >
              {freq.label}
            </button>
          ))}
        </div>
        {formData.frequency !== 'one-time' && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            ℹ️ Recurring donations help sustain our programs long-term
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setStep(2)}
        disabled={!formData.amount && !formData.customAmount}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to Payment Method
      </button>
    </div>
  );

  // Step 2: Payment Method & Details
  const PaymentStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Payment Method
        </h3>
        
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                formData.paymentMethod === method.id
                  ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
              }`}
            >
              <div className="flex items-center">
                <div className={`${method.color} w-12 h-12 rounded-full flex items-center justify-center mr-3`}>
                  <method.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {method.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {method.accountInfo.title}
                  </p>
                </div>
                {formData.paymentMethod === method.id && (
                  <Check className="w-6 h-6 text-green-600" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Account Details */}
        {formData.paymentMethod && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transfer to:
            </p>
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900 dark:text-white text-lg">
                {paymentMethods.find((m) => m.id === formData.paymentMethod)?.accountInfo.number}
              </p>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    paymentMethods.find((m) => m.id === formData.paymentMethod)?.accountInfo
                      .number || ''
                  )
                }
                className="text-green-600 hover:text-green-700 text-sm font-bold"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              After making the transfer, please complete the form below
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Continue to Details
        </button>
      </div>
    </div>
  );

  // Step 3: Donor Details
  const DetailsStep = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Details
        </h3>

        {/* Anonymous Checkbox */}
        <label className="flex items-center mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          />
          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Make this donation anonymous
          </span>
        </label>

        {/* Donor Information (if not anonymous) */}
        {!formData.isAnonymous && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                required={!formData.isAnonymous}
                value={formData.donorName}
                onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                required={!formData.isAnonymous}
                value={formData.donorEmail}
                onChange={(e) => setFormData({ ...formData, donorEmail: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.donorPhone}
                onChange={(e) => setFormData({ ...formData, donorPhone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                placeholder="03XX XXXXXXX"
              />
            </div>
          </div>
        )}

        {/* Optional Message */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Message (Optional)
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
            placeholder="Leave a message of support..."
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Donation Summary</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Amount:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              PKR {(formData.customAmount || formData.amount || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
            <span className="font-semibold text-gray-900 dark:text-white capitalize">
              {formData.frequency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
            <span className="font-semibold text-gray-900 dark:text-white capitalize">
              {formData.paymentMethod.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={loading}
          className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Heart className="w-5 h-5 mr-2" fill="currentColor" />
              Complete Donation
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        After submission, please send payment confirmation to{' '}
        <a href="mailto:donations@wasilah.org" className="text-green-600 hover:underline">
          donations@wasilah.org
        </a>
      </p>
    </form>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {s}
                </div>
                <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                  {s === 1 ? 'Amount' : s === 2 ? 'Payment' : 'Details'}
                </span>
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {step === 1 && <AmountStep />}
        {step === 2 && <PaymentStep />}
        {step === 3 && <DetailsStep />}
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default DonationForm;
