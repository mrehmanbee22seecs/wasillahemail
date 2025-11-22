/**
 * JazzCash Payment Service
 * Handles payment gateway integration for Pakistan's JazzCash payment system
 * 
 * IMPORTANT: This requires backend setup with JazzCash merchant credentials
 * Environment variables needed:
 * - VITE_JAZZCASH_MERCHANT_ID
 * - VITE_JAZZCASH_PASSWORD (should be handled server-side only)
 * - VITE_JAZZCASH_SALT (should be handled server-side only)
 * - VITE_JAZZCASH_SANDBOX (true/false)
 */

import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  PaymentTransaction,
  CreatePaymentParams,
  PaymentIntentResult,
  JazzCashPaymentRequest,
  JazzCashPaymentResponse,
} from '../types/payment';
import CryptoJS from 'crypto-js';

// JazzCash API URLs
const JAZZCASH_SANDBOX_URL = 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform';
const JAZZCASH_PRODUCTION_URL = 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform';

/**
 * Get JazzCash configuration from environment
 * Note: In production, sensitive data should come from secure backend
 */
const getJazzCashConfig = () => {
  const isSandbox = import.meta.env.VITE_JAZZCASH_SANDBOX === 'true';
  
  return {
    merchantId: import.meta.env.VITE_JAZZCASH_MERCHANT_ID || 'MC0000',
    password: import.meta.env.VITE_JAZZCASH_PASSWORD || '', // Should be server-side only!
    integritySalt: import.meta.env.VITE_JAZZCASH_SALT || '', // Should be server-side only!
    returnUrl: `${window.location.origin}/payment/return`,
    postBackUrl: `${window.location.origin}/api/payment/webhook`, // Backend webhook
    isSandbox,
    apiUrl: isSandbox ? JAZZCASH_SANDBOX_URL : JAZZCASH_PRODUCTION_URL,
  };
};

/**
 * Generate secure hash for JazzCash transaction
 * SECURITY: This should be done on the server-side in production!
 */
const generateSecureHash = (data: string, integritySalt: string): string => {
  const hash = CryptoJS.HmacSHA256(data, integritySalt);
  return hash.toString(CryptoJS.enc.Hex);
};

/**
 * Format transaction reference number
 */
const generateTxnRef = (userId: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `TXN-${userId.substring(0, 8)}-${timestamp}-${random}`;
};

/**
 * Format date time for JazzCash (YYYYMMDDHHMMSS)
 */
const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

/**
 * Create a payment transaction record in Firestore
 */
export const createPaymentTransaction = async (
  params: CreatePaymentParams
): Promise<PaymentTransaction> => {
  const transactionRef = await addDoc(collection(db, 'payment_transactions'), {
    userId: params.userId,
    amount: params.amount,
    currency: params.currency,
    status: 'pending',
    gateway: 'jazzcash',
    type: params.type,
    subscriptionPlan: params.subscriptionPlan,
    description: params.description,
    metadata: params.metadata || {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const transaction = await getDoc(transactionRef);
  return {
    id: transactionRef.id,
    ...transaction.data(),
  } as PaymentTransaction;
};

/**
 * Initialize JazzCash payment
 * Returns payment form data to redirect user to JazzCash
 */
export const initiateJazzCashPayment = async (
  params: CreatePaymentParams
): Promise<PaymentIntentResult> => {
  try {
    // Create transaction record
    const transaction = await createPaymentTransaction(params);
    
    const config = getJazzCashConfig();
    const txnRef = generateTxnRef(params.userId);
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 60000); // 30 minutes expiry
    
    // Amount in paisa (multiply by 100)
    const amountInPaisa = Math.round(params.amount * 100).toString();
    
    // Prepare payment request data
    const paymentData: Partial<JazzCashPaymentRequest> = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET', // Mobile wallet transaction
      pp_Language: 'EN',
      pp_MerchantID: config.merchantId,
      pp_Password: config.password,
      pp_TxnRefNo: txnRef,
      pp_Amount: amountInPaisa,
      pp_TxnCurrency: params.currency,
      pp_TxnDateTime: formatDateTime(now),
      pp_BillReference: transaction.id,
      pp_Description: params.description,
      pp_TxnExpiryDateTime: formatDateTime(expiryDate),
      pp_ReturnURL: config.returnUrl,
      ppmpf_1: params.subscriptionPlan || '',
      ppmpf_2: params.type,
      ppmpf_3: params.userId,
    };

    // Generate secure hash
    // Order matters! Must match JazzCash documentation
    const hashString = [
      config.integritySalt,
      paymentData.pp_Amount,
      paymentData.pp_BillReference,
      paymentData.pp_Description,
      paymentData.pp_Language,
      paymentData.pp_MerchantID,
      paymentData.pp_Password,
      paymentData.pp_ReturnURL,
      paymentData.pp_TxnCurrency,
      paymentData.pp_TxnDateTime,
      paymentData.pp_TxnExpiryDateTime,
      paymentData.pp_TxnRefNo,
      paymentData.pp_TxnType,
      paymentData.pp_Version,
      paymentData.ppmpf_1,
      paymentData.ppmpf_2,
      paymentData.ppmpf_3,
    ]
      .filter(Boolean)
      .join('&');

    const secureHash = generateSecureHash(hashString, config.integritySalt);
    paymentData.pp_SecureHash = secureHash;

    // Update transaction with payment reference
    await updateDoc(doc(db, 'payment_transactions', transaction.id), {
      transactionId: txnRef,
      paymentReference: txnRef,
      'metadata.paymentData': paymentData,
      updatedAt: serverTimestamp(),
    });

    // In a real implementation, you would:
    // 1. Send this data to your backend
    // 2. Backend creates the payment form
    // 3. Backend returns the payment URL or auto-submits form
    
    // For now, we'll create a form submission URL
    const formData = new URLSearchParams();
    Object.entries(paymentData).forEach(([key, value]) => {
      if (value) formData.append(key, value.toString());
    });

    return {
      transactionId: transaction.id,
      paymentUrl: `${config.apiUrl}?${formData.toString()}`,
      expiresAt: expiryDate,
    };
  } catch (error) {
    console.error('Error initiating JazzCash payment:', error);
    throw new Error('Failed to initiate payment');
  }
};

/**
 * Verify payment response from JazzCash
 */
export const verifyJazzCashPayment = async (
  response: JazzCashPaymentResponse
): Promise<boolean> => {
  try {
    const config = getJazzCashConfig();
    
    // Reconstruct hash string (same order as request)
    const hashString = [
      config.integritySalt,
      response.pp_Amount,
      response.pp_BillReference,
      response.pp_Description,
      response.pp_Language,
      response.pp_MerchantID,
      response.pp_ResponseCode,
      response.pp_ResponseMessage,
      response.pp_ReturnURL,
      response.pp_TxnCurrency,
      response.pp_TxnDateTime,
      response.pp_TxnRefNo,
      response.pp_TxnType,
      response.pp_Version,
      response.ppmpf_1,
      response.ppmpf_2,
      response.ppmpf_3,
    ]
      .filter(Boolean)
      .join('&');

    const calculatedHash = generateSecureHash(hashString, config.integritySalt);
    
    // Verify hash matches
    if (calculatedHash !== response.pp_SecureHash) {
      console.error('Hash verification failed');
      return false;
    }

    // Check response code (000 = success)
    if (response.pp_ResponseCode === '000') {
      // Update transaction status
      await updateDoc(doc(db, 'payment_transactions', response.pp_BillReference), {
        status: 'completed',
        transactionId: response.pp_TxnRefNo,
        'metadata.response': response,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } else {
      // Payment failed
      await updateDoc(doc(db, 'payment_transactions', response.pp_BillReference), {
        status: 'failed',
        'metadata.response': response,
        'metadata.failureReason': response.pp_ResponseMessage,
        updatedAt: serverTimestamp(),
      });
      return false;
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
};

/**
 * Get transaction by ID
 */
export const getPaymentTransaction = async (
  transactionId: string
): Promise<PaymentTransaction | null> => {
  try {
    const transactionDoc = await getDoc(doc(db, 'payment_transactions', transactionId));
    if (transactionDoc.exists()) {
      return {
        id: transactionDoc.id,
        ...transactionDoc.data(),
      } as PaymentTransaction;
    }
    return null;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
};

/**
 * WARNING: In production, hash generation and sensitive operations
 * should be done on the backend server, not in the client!
 * 
 * Recommended architecture:
 * 1. Client calls backend API: POST /api/payment/create
 * 2. Backend generates secure hash and creates payment
 * 3. Backend returns payment URL or form HTML
 * 4. Client redirects user to JazzCash
 * 5. JazzCash redirects back to your return URL
 * 6. Backend webhook receives payment notification
 * 7. Backend verifies and updates transaction
 */
