/**
 * Report Type Definitions for Segment 23: Reporting & Export
 */

export type ReportType = 'user' | 'project' | 'event' | 'ngo' | 'donation' | 'analytics' | 'custom';
export type ReportFormat = 'csv' | 'excel' | 'pdf' | 'json';
export type ReportScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ReportStatus = 'draft' | 'scheduled' | 'generating' | 'completed' | 'failed';

export interface ReportField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  path: string; // JSON path to field in data source
  required?: boolean;
  format?: string; // Date format, number format, etc.
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportSchedule {
  id: string;
  frequency: ReportScheduleFrequency;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  timezone: string;
  enabled: boolean;
  recipients: string[]; // Email addresses
  lastRun?: Date;
  nextRun?: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  fields: ReportField[];
  filters?: ReportFilter[];
  sorts?: ReportSort[];
  groupBy?: string[];
  chartType?: 'bar' | 'line' | 'pie' | 'table' | 'scatter';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  usageCount: number;
}

export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  templateId?: string;
  fields: ReportField[];
  filters?: ReportFilter[];
  sorts?: ReportSort[];
  groupBy?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  format: ReportFormat;
  schedule?: ReportSchedule;
  status: ReportStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  sharedWith?: string[];
}

export interface ReportResult {
  id: string;
  reportId: string;
  reportName: string;
  data: any[];
  metadata: {
    totalRows: number;
    generatedAt: Date;
    generationTime: number; // milliseconds
    filters: ReportFilter[];
    sorts: ReportSort[];
  };
  format: ReportFormat;
  fileUrl?: string;
  fileSize?: number;
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

export interface ReportAnalytics {
  reportId: string;
  reportName: string;
  totalGenerations: number;
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  averageGenerationTime: number;
  formatBreakdown: Record<ReportFormat, number>;
  lastGenerated?: Date;
  popularFilters?: Array<{ filter: ReportFilter; count: number }>;
  usageByUser: Record<string, number>;
  usageTrend: Array<{ date: string; count: number }>;
}

export interface ExportOptions {
  format: ReportFormat;
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  numberFormat?: string;
  compression?: boolean;
  encryption?: boolean;
  password?: string;
}

export interface BulkExportRequest {
  reportIds: string[];
  format: ReportFormat;
  compression: boolean;
  notifyOnComplete: boolean;
}

export interface BulkExportResult {
  id: string;
  reportIds: string[];
  format: ReportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}
