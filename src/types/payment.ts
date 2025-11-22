/**
 * Payment Types and Interfaces
 * Defines payment transactions, gateways, and JazzCash integration types
 */

export type PaymentGateway = 'jazzcash' | 'manual';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type TransactionType = 'subscription' | 'donation' | 'one-time';

export interface PaymentTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  type: TransactionType;
  subscriptionPlan?: string;
  transactionId?: string; // JazzCash transaction ID
  paymentReference?: string; // JazzCash reference number
  metadata?: Record<string, any>;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
}

export interface JazzCashConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  returnUrl: string;
  postBackUrl: string; // Webhook URL
  isSandbox: boolean;
}

export interface JazzCashPaymentRequest {
  pp_Version: string;
  pp_TxnType: string;
  pp_Language: string;
  pp_MerchantID: string;
  pp_SubMerchantID?: string;
  pp_Password: string;
  pp_TxnRefNo: string; // Unique transaction reference
  pp_Amount: string; // Amount in paisa (multiply by 100)
  pp_TxnCurrency: string;
  pp_TxnDateTime: string;
  pp_BillReference: string;
  pp_Description: string;
  pp_TxnExpiryDateTime: string;
  pp_ReturnURL: string;
  pp_SecureHash: string; // HMAC SHA256 hash
  ppmpf_1?: string; // Optional field 1
  ppmpf_2?: string; // Optional field 2
  ppmpf_3?: string; // Optional field 3
  ppmpf_4?: string; // Optional field 4
  ppmpf_5?: string; // Optional field 5
}

export interface JazzCashPaymentResponse {
  pp_Version: string;
  pp_TxnType: string;
  pp_Language: string;
  pp_MerchantID: string;
  pp_SubMerchantID?: string;
  pp_TxnRefNo: string;
  pp_Amount: string;
  pp_TxnCurrency: string;
  pp_TxnDateTime: string;
  pp_BillReference: string;
  pp_Description: string;
  pp_ReturnURL: string;
  pp_SecureHash: string;
  pp_ResponseCode: string; // 000 = Success
  pp_ResponseMessage: string;
  pp_TxnStatus?: string;
  ppmpf_1?: string;
  ppmpf_2?: string;
  ppmpf_3?: string;
  ppmpf_4?: string;
  ppmpf_5?: string;
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  userId: string;
  type: TransactionType;
  subscriptionPlan?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentIntentResult {
  transactionId: string;
  paymentUrl: string;
  expiresAt: Date;
}
