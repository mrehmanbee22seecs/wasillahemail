/**
 * Report Service for Segment 23: Reporting & Export
 * Handles report CRUD operations, scheduling, and analytics
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import {
  ReportConfig,
  ReportTemplate,
  ReportResult,
  ReportAnalytics,
  ReportSchedule,
  BulkExportRequest,
  BulkExportResult
} from '../types/report';
import { generateReport } from '../utils/reportGenerator';
import { exportReport } from '../utils/exportUtils';

const REPORTS_COLLECTION = 'reports';
const TEMPLATES_COLLECTION = 'report_templates';
const RESULTS_COLLECTION = 'report_results';
const ANALYTICS_COLLECTION = 'report_analytics';

/**
 * Create a new report configuration
 */
export const createReport = async (
  report: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ReportConfig> => {
  const reportData = {
    ...report,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, REPORTS_COLLECTION), reportData);
  
  return {
    id: docRef.id,
    ...report,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Get report by ID
 */
export const getReport = async (reportId: string): Promise<ReportConfig | null> => {
  const docRef = doc(db, REPORTS_COLLECTION, reportId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate()
  } as ReportConfig;
};

/**
 * Get all reports for a user
 */
export const getUserReports = async (userId: string): Promise<ReportConfig[]> => {
  const q = query(
    collection(db, REPORTS_COLLECTION),
    where('createdBy', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  } as ReportConfig));
};

/**
 * Update report configuration
 */
export const updateReport = async (
  reportId: string,
  updates: Partial<ReportConfig>
): Promise<void> => {
  const docRef = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

/**
 * Delete report
 */
export const deleteReport = async (reportId: string): Promise<void> => {
  const docRef = doc(db, REPORTS_COLLECTION, reportId);
  await deleteDoc(docRef);

  // Also delete associated results
  const resultsQuery = query(
    collection(db, RESULTS_COLLECTION),
    where('reportId', '==', reportId)
  );
  const resultsSnapshot = await getDocs(resultsQuery);
  
  const deletePromises = resultsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

/**
 * Generate and save report
 */
export const generateAndSaveReport = async (
  reportId: string
): Promise<ReportResult> => {
  const report = await getReport(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }

  // Update status to generating
  await updateReport(reportId, { status: 'generating' });

  try {
    // Generate report
    const result = await generateReport(report);

    // Save result to Firestore
    const resultData = {
      ...result,
      metadata: {
        ...result.metadata,
        generatedAt: Timestamp.now()
      }
    };

    const docRef = await addDoc(collection(db, RESULTS_COLLECTION), resultData);
    result.id = docRef.id;

    // Update report status
    await updateReport(reportId, { status: 'completed' });

    // Track analytics
    await trackReportGeneration(reportId);

    return result;
  } catch (error) {
    await updateReport(reportId, { status: 'failed' });
    throw error;
  }
};

/**
 * Get report results
 */
export const getReportResults = async (
  reportId: string,
  limitCount: number = 10
): Promise<ReportResult[]> => {
  const q = query(
    collection(db, RESULTS_COLLECTION),
    where('reportId', '==', reportId),
    orderBy('metadata.generatedAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      metadata: {
        ...data.metadata,
        generatedAt: data.metadata.generatedAt?.toDate()
      }
    } as ReportResult;
  });
};

/**
 * Export report to file and upload to storage
 */
export const exportAndUploadReport = async (
  result: ReportResult,
  userId: string
): Promise<string> => {
  // Generate file content
  let content: string;
  const { exportToCSV, exportToJSON, exportToExcel, exportToPDF } = await import('../utils/exportUtils');

  switch (result.format) {
    case 'csv':
      content = exportToCSV(result.data);
      break;
    case 'json':
      content = exportToJSON(result.data);
      break;
    case 'excel':
      content = exportToExcel(result.data);
      break;
    case 'pdf':
      content = exportToPDF(result.data);
      break;
    default:
      throw new Error(`Unsupported format: ${result.format}`);
  }

  // Upload to Firebase Storage
  const filename = `reports/${userId}/${result.id}.${result.format}`;
  const storageRef = ref(storage, filename);
  const blob = new Blob([content], { type: getMimeType(result.format) });

  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);

  // Update result with file URL
  await updateDoc(doc(db, RESULTS_COLLECTION, result.id), {
    fileUrl: downloadURL,
    fileSize: blob.size
  });

  return downloadURL;
};

/**
 * Get MIME type for format
 */
const getMimeType = (format: string): string => {
  const mimeTypes: Record<string, string> = {
    csv: 'text/csv',
    json: 'application/json',
    excel: 'application/vnd.ms-excel',
    pdf: 'application/pdf'
  };
  return mimeTypes[format] || 'text/plain';
};

/**
 * Create report template
 */
export const createTemplate = async (
  template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
): Promise<ReportTemplate> => {
  const templateData = {
    ...template,
    usageCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), templateData);
  
  return {
    id: docRef.id,
    ...template,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Get report templates
 */
export const getTemplates = async (userId?: string): Promise<ReportTemplate[]> => {
  let q = query(collection(db, TEMPLATES_COLLECTION));

  if (userId) {
    q = query(q, where('isPublic', '==', true));
    // Also include user's private templates
    const userTemplatesQuery = query(
      collection(db, TEMPLATES_COLLECTION),
      where('createdBy', '==', userId)
    );
    const userSnapshot = await getDocs(userTemplatesQuery);
    const publicSnapshot = await getDocs(q);

    const allDocs = [...publicSnapshot.docs, ...userSnapshot.docs];
    const uniqueDocsMap = new Map();
 allDocs.forEach(doc => {
   if (!uniqueDocsMap.has(doc.id)) {
     uniqueDocsMap.set(doc.id, doc);
   }
 });

    return Array.from(uniqueDocsMap.values()).map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as ReportTemplate));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  } as ReportTemplate));
};

/**
 * Use template to create report
 */
export const createReportFromTemplate = async (
  templateId: string,
  userId: string,
  customName?: string
): Promise<ReportConfig> => {
  const templateDoc = await getDoc(doc(db, TEMPLATES_COLLECTION, templateId));
  
  if (!templateDoc.exists()) {
    throw new Error('Template not found');
  }

  const template = templateDoc.data() as ReportTemplate;

  // Increment usage count
  await updateDoc(doc(db, TEMPLATES_COLLECTION, templateId), {
    usageCount: increment(1)
  });

  // Create report from template
  const report: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'> = {
    name: customName || `${template.name} - ${new Date().toLocaleDateString()}`,
    description: template.description,
    type: template.type,
    templateId: templateId,
    fields: template.fields,
    filters: template.filters,
    sorts: template.sorts,
    groupBy: template.groupBy,
    format: 'csv',
    status: 'draft',
    createdBy: userId
  };

  return await createReport(report);
};

/**
 * Track report generation for analytics
 */
const trackReportGeneration = async (reportId: string): Promise<void> => {
  const analyticsRef = doc(db, ANALYTICS_COLLECTION, reportId);
  await setDoc(
     analyticsRef,
     {
       reportId,
      totalGenerations: increment(1),
      // Ensure other counters exist; merge will keep existing values
      totalViews: 0,
      totalDownloads: 0,
      totalShares: 0,
      lastGenerated: Timestamp.now(),
    },
     { merge: true }
   );
};

/**
 * Get report analytics
 */
export const getReportAnalytics = async (reportId: string): Promise<ReportAnalytics | null> => {
  const docRef = doc(db, ANALYTICS_COLLECTION, reportId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    reportId,
    ...data,
    lastGenerated: data.lastGenerated?.toDate()
  } as ReportAnalytics;
};

/**
 * Track report view
 */
export const trackReportView = async (reportId: string): Promise<void> => {
  const analyticsRef = doc(db, ANALYTICS_COLLECTION, reportId);
  await updateDoc(analyticsRef, {
    totalViews: increment(1)
  });
};

/**
 * Track report download
 */
export const trackReportDownload = async (reportId: string): Promise<void> => {
  const analyticsRef = doc(db, ANALYTICS_COLLECTION, reportId);
  await updateDoc(analyticsRef, {
    totalDownloads: increment(1)
  });
};

/**
 * Bulk export reports
 */
export const bulkExportReports = async (
  request: BulkExportRequest,
  userId: string
): Promise<BulkExportResult> => {
  const bulkResult: BulkExportResult = {
    id: `bulk_${Date.now()}`,
    reportIds: request.reportIds,
    format: request.format,
    status: 'processing',
    createdAt: new Date()
  };

  try {
    // Generate all reports
    const results: ReportResult[] = [];
    
    for (const reportId of request.reportIds) {
      const result = await generateAndSaveReport(reportId);
      results.push(result);
    }

    // Export all reports
    const { bulkExport } = await import('../utils/exportUtils');
    await bulkExport(results, request.format);

    bulkResult.status = 'completed';
    bulkResult.completedAt = new Date();

    return bulkResult;
  } catch (error) {
    bulkResult.status = 'failed';
    bulkResult.error = error instanceof Error ? error.message : 'Unknown error';
    bulkResult.completedAt = new Date();
    
    return bulkResult;
  }
};
