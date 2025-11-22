/**
 * Payment Return Page
 * Handles return from JazzCash payment gateway
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { verifyJazzCashPayment, getPaymentTransaction } from '../services/jazzCashPaymentService';
import { useSubscription } from '../contexts/SubscriptionContext';
import { JazzCashPaymentResponse } from '../types/payment';

const PaymentReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    handlePaymentReturn();
  }, [searchParams]);

  const handlePaymentReturn = async () => {
    try {
      // Get all parameters from URL
      const params: Partial<JazzCashPaymentResponse> = {
        pp_Version: searchParams.get('pp_Version') || '',
        pp_TxnType: searchParams.get('pp_TxnType') || '',
        pp_Language: searchParams.get('pp_Language') || '',
        pp_MerchantID: searchParams.get('pp_MerchantID') || '',
        pp_TxnRefNo: searchParams.get('pp_TxnRefNo') || '',
        pp_Amount: searchParams.get('pp_Amount') || '',
        pp_TxnCurrency: searchParams.get('pp_TxnCurrency') || '',
        pp_TxnDateTime: searchParams.get('pp_TxnDateTime') || '',
        pp_BillReference: searchParams.get('pp_BillReference') || '',
        pp_Description: searchParams.get('pp_Description') || '',
        pp_ReturnURL: searchParams.get('pp_ReturnURL') || '',
        pp_SecureHash: searchParams.get('pp_SecureHash') || '',
        pp_ResponseCode: searchParams.get('pp_ResponseCode') || '',
        pp_ResponseMessage: searchParams.get('pp_ResponseMessage') || '',
      };

      // Verify the payment
      const isValid = await verifyJazzCashPayment(params as JazzCashPaymentResponse);
      
      if (isValid && params.pp_ResponseCode === '000') {
        setStatus('success');
        setMessage('Payment successful! Your subscription has been activated.');
        
        // Get transaction details
        if (params.pp_BillReference) {
          const transaction = await getPaymentTransaction(params.pp_BillReference);
          setTransactionDetails(transaction);
        }
        
        // Refresh subscription data
        await refreshSubscription();
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setStatus('failed');
        setMessage(params.pp_ResponseMessage || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Error processing payment return:', error);
      setStatus('failed');
      setMessage('An error occurred while processing your payment.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Processing Payment
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your payment...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            
            {transactionDetails && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Transaction Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {transactionDetails.currency} {transactionDetails.amount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                      {transactionDetails.subscriptionPlan}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                    <span className="font-mono text-xs text-gray-900 dark:text-white">
                      {transactionDetails.transactionId}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/upgrade')}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentReturn;
