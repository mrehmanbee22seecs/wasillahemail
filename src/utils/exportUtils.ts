/**
 * Export Utilities for Segment 23: Reporting & Export
 * Handles CSV, Excel, PDF, and JSON export functionality
 */

import { ReportFormat, ExportOptions, ReportResult } from '../types/report';

/**
 * Export data to CSV format
 */
export const exportToCSV = (
  data: any[],
  options: ExportOptions = {}
): string => {
  const {
    includeHeaders = true,
    dateFormat = 'yyyy-MM-dd',
    filename = 'export.csv'
  } = options;

  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const rows: string[] = [];

  if (includeHeaders) {
    rows.push(headers.map(escapeCSVField).join(','));
  }

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return escapeCSVField(formatValue(value, dateFormat));
    });
    rows.push(values.join(','));
  });

  return rows.join('\n');
};

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
const escapeCSVField = (field: any): string => {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = String(field);
  
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
};

/**
 * Format value for export (dates, numbers, etc.)
 */
const formatValue = (value: any, dateFormat: string): any => {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return formatDate(value, dateFormat);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
};

/**
 * Simple date formatting
 */
const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Export data to JSON format
 */
export const exportToJSON = (
  data: any[],
  options: ExportOptions = {}
): string => {
  const { dateFormat = 'yyyy-MM-dd' } = options;

  const formattedData = data.map(item => {
    const formatted: any = {};
    
    Object.entries(item).forEach(([key, value]) => {
      formatted[key] = formatValue(value, dateFormat);
    });

    return formatted;
  });

  return JSON.stringify(formattedData, null, 2);
};

/**
 * Export data to Excel format (simplified - returns CSV for now)
 * For full Excel support, integrate xlsx library
 */
export const exportToExcel = (
  data: any[],
  options: ExportOptions = {}
): string => {
  // For now, return CSV format which can be opened in Excel
  // In production, use xlsx library for true .xlsx format
  return exportToCSV(data, options);
};

/**
 * Export data to PDF format (simplified - returns formatted text)
 * For full PDF support, integrate jsPDF or pdfmake library
 */
export const exportToPDF = (
  data: any[],
  options: ExportOptions = {}
): string => {
  const { filename = 'export.pdf', includeHeaders = true } = options;

  if (!data || data.length === 0) {
    return 'No data to export';
  }

  const headers = Object.keys(data[0]);
  let content = `Report: ${filename}\n`;
  content += `Generated: ${new Date().toLocaleString()}\n`;
  content += `Total Records: ${data.length}\n\n`;

  if (includeHeaders) {
    content += headers.join(' | ') + '\n';
    content += headers.map(() => '---').join('-|-') + '\n';
  }

  data.forEach(row => {
    const values = headers.map(header => String(row[header] || ''));
    content += values.join(' | ') + '\n';
  });

  return content;
};

/**
 * Download file to user's computer
 */
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

/**
 * Export report result based on format
 */
export const exportReport = (
  result: ReportResult,
  options: ExportOptions = {}
): void => {
  const { format, filename } = options;
  const exportFormat = format || result.format;
  const baseFilename = filename || result.reportName.replace(/\s+/g, '_');

  let content: string;
  let mimeType: string;
  let extension: string;

  switch (exportFormat) {
    case 'csv':
      content = exportToCSV(result.data, options);
      mimeType = 'text/csv';
      extension = 'csv';
      break;

    case 'json':
      content = exportToJSON(result.data, options);
      mimeType = 'application/json';
      extension = 'json';
      break;

    case 'excel':
      // The exportToExcel function currently returns CSV data.
      // To avoid creating a corrupted .xlsx file, we use the .csv extension and mime type.
      content = exportToExcel(result.data, options);
      mimeType = 'text/csv';
      extension = 'csv';
      break;

    case 'pdf':
      content = exportToPDF(result.data, options);
      mimeType = 'application/pdf';
      extension = 'pdf';
      break;

    default:
      throw new Error(`Unsupported export format: ${exportFormat}`);
  }

  const finalFilename = `${baseFilename}.${extension}`;
  downloadFile(content, finalFilename, mimeType);
};

/**
 * Get MIME type for format
 */
export const getMimeType = (format: ReportFormat): string => {
  const mimeTypes: Record<ReportFormat, string> = {
    csv: 'text/csv',
    json: 'application/json',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf'
  };

  return mimeTypes[format] || 'application/octet-stream';
};

/**
 * Get file extension for format
 */
export const getFileExtension = (format: ReportFormat): string => {
  const extensions: Record<ReportFormat, string> = {
    csv: 'csv',
    json: 'json',
    excel: 'xlsx',
    pdf: 'pdf'
  };

  return extensions[format] || 'txt';
};

/**
 * Compress data (simple base64 encoding)
 * For production, use pako or similar library for gzip compression
 */
export const compressData = (data: string): string => {
  return btoa(encodeURIComponent(data));
};

/**
 * Decompress data
 */
export const decompressData = (compressed: string): string => {
  return decodeURIComponent(atob(compressed));
};

/**
 * Bulk export multiple reports
 */
export const bulkExport = async (
  reports: ReportResult[],
  format: ReportFormat,
  options: ExportOptions = {}
): Promise<void> => {
  const { compression = false } = options;

  reports.forEach((report, index) => {
    const filename = options.filename 
      ? `${options.filename}_${index + 1}`
      : report.reportName;

    exportReport(report, {
      ...options,
      format,
      filename
    });

    // Small delay to prevent browser blocking multiple downloads
    if (index < reports.length - 1) {
      setTimeout(() => {}, 100);
    }
  });
};
