/**
 * Donation Service
 * Handles donation operations, tracking, and management
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  DonationRecord,
  DonationGoal,
  DonationAnalytics,
  DonationFormData,
  DonorProfile,
} from '../types/donation';

/**
 * Create a new donation record
 */
export const createDonation = async (
  formData: DonationFormData,
  userId?: string
): Promise<string> => {
  try {
    const donationData: Partial<DonationRecord> = {
      donorId: formData.isAnonymous ? undefined : userId,
      donorName: formData.isAnonymous ? 'Anonymous' : formData.donorName,
      donorEmail: formData.isAnonymous ? undefined : formData.donorEmail,
      donorPhone: formData.isAnonymous ? undefined : formData.donorPhone,
      amount: formData.customAmount || formData.amount || 0,
      currency: 'PKR',
      frequency: formData.frequency,
      paymentMethod: formData.paymentMethod,
      status: 'pending',
      isAnonymous: formData.isAnonymous,
      dedication: formData.dedication,
      targetNgoId: formData.targetNgoId,
      targetProjectId: formData.targetProjectId,
      message: formData.message,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Set next recurring date if applicable
    if (formData.frequency !== 'one-time') {
      const nextDate = new Date();
      switch (formData.frequency) {
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      donationData.nextRecurringDate = Timestamp.fromDate(nextDate);
    }

    const docRef = await addDoc(collection(db, 'donations'), donationData);
    console.log('Donation created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
};

/**
 * Update donation status (e.g., when payment is confirmed)
 */
export const updateDonationStatus = async (
  donationId: string,
  status: DonationRecord['status'],
  transactionId?: string
): Promise<void> => {
  try {
    const donationRef = doc(db, 'donations', donationId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'completed') {
      updateData.completedAt = serverTimestamp();
    }

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    await updateDoc(donationRef, updateData);

    // If completed, update goal progress if donation is linked to a project
    if (status === 'completed') {
      const donationSnap = await getDoc(donationRef);
      const donation = donationSnap.data() as DonationRecord;
      
      if (donation.targetProjectId) {
        await updateGoalProgress(donation.targetProjectId, donation.amount);
      }

      // Update donor profile
      if (donation.donorId) {
        await updateDonorProfile(donation.donorId, donation.amount);
      }
    }
  } catch (error) {
    console.error('Error updating donation status:', error);
    throw error;
  }
};

/**
 * Get donations for a user
 */
export const getUserDonations = async (userId: string): Promise<DonationRecord[]> => {
  try {
    const q = query(
      collection(db, 'donations'),
      where('donorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as DonationRecord));
  } catch (error) {
    console.error('Error fetching user donations:', error);
    return [];
  }
};

/**
 * Get donations for an NGO
 */
export const getNgoDonations = async (ngoId: string): Promise<DonationRecord[]> => {
  try {
    const q = query(
      collection(db, 'donations'),
      where('targetNgoId', '==', ngoId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as DonationRecord));
  } catch (error) {
    console.error('Error fetching NGO donations:', error);
    return [];
  }
};

/**
 * Get donations for a project
 */
export const getProjectDonations = async (projectId: string): Promise<DonationRecord[]> => {
  try {
    const q = query(
      collection(db, 'donations'),
      where('targetProjectId', '==', projectId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as DonationRecord));
  } catch (error) {
    console.error('Error fetching project donations:', error);
    return [];
  }
};

/**
 * Create or update a donation goal
 */
export const createDonationGoal = async (
  goal: Omit<DonationGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount'>
): Promise<string> => {
  try {
    const goalData = {
      ...goal,
      currentAmount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'donation_goals'), goalData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating donation goal:', error);
    throw error;
  }
};

/**
 * Update goal progress
 */
const updateGoalProgress = async (projectId: string, amount: number): Promise<void> => {
  try {
    const q = query(
      collection(db, 'donation_goals'),
      where('projectId', '==', projectId),
      where('isActive', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const goalDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'donation_goals', goalDoc.id), {
        currentAmount: increment(amount),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating goal progress:', error);
  }
};

/**
 * Get donation goals for an NGO
 */
export const getNgoDonationGoals = async (ngoId: string): Promise<DonationGoal[]> => {
  try {
    const q = query(
      collection(db, 'donation_goals'),
      where('ngoId', '==', ngoId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as DonationGoal));
  } catch (error) {
    console.error('Error fetching NGO donation goals:', error);
    return [];
  }
};

/**
 * Get donation analytics for an NGO
 */
export const getNgoDonationAnalytics = async (ngoId: string): Promise<DonationAnalytics> => {
  try {
    const donations = await getNgoDonations(ngoId);
    
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const uniqueDonors = new Set(donations.filter(d => d.donorId).map(d => d.donorId)).size;
    const recurringDonors = donations.filter(d => d.frequency !== 'one-time').length;

    // Get recent donations (last 10)
    const recentDonations = donations.slice(0, 10);

    // Calculate monthly trends (last 6 months)
    const monthlyTrends = calculateMonthlyTrends(donations);

    // Get top donors
    const topDonors = calculateTopDonors(donations);

    return {
      totalDonations: donations.length,
      totalAmount,
      averageDonation: donations.length > 0 ? totalAmount / donations.length : 0,
      uniqueDonors,
      recurringDonors,
      recentDonations,
      topDonors,
      monthlyTrends,
    };
  } catch (error) {
    console.error('Error fetching donation analytics:', error);
    throw error;
  }
};

/**
 * Calculate monthly donation trends
 */
const calculateMonthlyTrends = (donations: DonationRecord[]) => {
  const trends: { [key: string]: { amount: number; count: number } } = {};
  
  donations.forEach(donation => {
    if (donation.completedAt) {
      const date = donation.completedAt.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!trends[monthKey]) {
        trends[monthKey] = { amount: 0, count: 0 };
      }
      
      trends[monthKey].amount += donation.amount;
      trends[monthKey].count += 1;
    }
  });

  return Object.entries(trends)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6)
    .reverse();
};

/**
 * Calculate top donors
 */
const calculateTopDonors = (donations: DonationRecord[]) => {
  const donorMap: { [key: string]: { amount: number; count: number; name: string } } = {};

  donations.forEach(donation => {
    if (donation.donorId && !donation.isAnonymous) {
      const key = donation.donorId;
      if (!donorMap[key]) {
        donorMap[key] = {
          amount: 0,
          count: 0,
          name: donation.donorName || 'Unknown',
        };
      }
      donorMap[key].amount += donation.amount;
      donorMap[key].count += 1;
    }
  });

  return Object.values(donorMap)
    .map(donor => ({
      donorName: donor.name,
      amount: donor.amount,
      donationCount: donor.count,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
};

/**
 * Update donor profile
 */
const updateDonorProfile = async (userId: string, amount: number): Promise<void> => {
  try {
    const profileRef = doc(db, 'donor_profiles', userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      await updateDoc(profileRef, {
        totalDonated: increment(amount),
        donationCount: increment(1),
        lastDonationDate: serverTimestamp(),
      });
    } else {
      // Create new profile
      await updateDoc(profileRef, {
        userId,
        totalDonated: amount,
        donationCount: 1,
        lastDonationDate: serverTimestamp(),
        recurringDonations: 0,
        favoriteNgos: [],
        badges: [],
      });
    }
  } catch (error) {
    console.error('Error updating donor profile:', error);
  }
};

/**
 * Get donor profile
 */
export const getDonorProfile = async (userId: string): Promise<DonorProfile | null> => {
  try {
    const profileRef = doc(db, 'donor_profiles', userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return profileSnap.data() as DonorProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching donor profile:', error);
    return null;
  }
};
