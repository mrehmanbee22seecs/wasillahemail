/**
 * Donation Types and Interfaces
 * Defines donation records, payment methods, and tracking
 */

export type DonationFrequency = 'one-time' | 'monthly' | 'quarterly' | 'yearly';
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'card';

export interface DonationRecord {
  id: string;
  donorId?: string; // null for anonymous
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number;
  currency: string;
  frequency: DonationFrequency;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  status: DonationStatus;
  isAnonymous: boolean;
  dedication?: DonationDedication;
  targetNgoId?: string; // If donated to specific NGO
  targetProjectId?: string; // If donated to specific project
  message?: string;
  receiptUrl?: string;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  nextRecurringDate?: any; // For recurring donations
}

export interface DonationDedication {
  type: 'in_honor' | 'in_memory';
  honoree: string;
  notifyEmail?: string;
}

export interface DonationGoal {
  id: string;
  ngoId: string;
  projectId?: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline?: any;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface DonationAnalytics {
  totalDonations: number;
  totalAmount: number;
  averageDonation: number;
  uniqueDonors: number;
  recurringDonors: number;
  recentDonations: DonationRecord[];
  topDonors: {
    donorName: string;
    amount: number;
    donationCount: number;
  }[];
  monthlyTrends: {
    month: string;
    amount: number;
    count: number;
  }[];
}

export interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  displayName: string;
  icon: string;
  enabled: boolean;
  accountInfo?: {
    accountNumber?: string;
    accountTitle?: string;
    bankName?: string;
    instructions?: string;
  };
}

export interface DonationFormData {
  amount: number | null;
  customAmount?: number;
  frequency: DonationFrequency;
  paymentMethod: PaymentMethod;
  isAnonymous: boolean;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  dedication?: DonationDedication;
  message?: string;
  targetNgoId?: string;
  targetProjectId?: string;
}

export interface DonorProfile {
  userId?: string;
  totalDonated: number;
  donationCount: number;
  lastDonationDate: any;
  recurringDonations: number;
  favoriteNgos: string[];
  badges: DonorBadge[];
}

export interface DonorBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: any;
}
