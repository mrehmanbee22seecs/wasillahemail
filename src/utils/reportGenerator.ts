/**
 * Report Generator Utilities for Segment 23: Reporting & Export
 * Handles report generation, aggregation, and data transformation
 */

import {
  ReportConfig,
  ReportResult,
  ReportField,
  ReportFilter,
  ReportSort
} from '../types/report';
import { collection, getDocs, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Generate report based on configuration
 */
export const generateReport = async (
  config: ReportConfig
): Promise<ReportResult> => {
  const startTime = Date.now();

  try {
    // Fetch data based on report type
    const rawData = await fetchReportData(config);

    // Apply filters
    let filteredData = applyFilters(rawData, config.filters || []);

    // Apply sorting
    filteredData = applySorts(filteredData, config.sorts || []);

    // Apply limit
    if (config.limit) {
      filteredData = filteredData.slice(0, config.limit);
    }

    // Apply grouping and aggregation
    const processedData = config.groupBy && config.groupBy.length > 0
      ? applyGrouping(filteredData, config.groupBy, config.fields)
      : selectFields(filteredData, config.fields);

    const generationTime = Date.now() - startTime;

    const result: ReportResult = {
      id: generateReportId(),
      reportId: config.id,
      reportName: config.name,
      data: processedData,
      metadata: {
        totalRows: processedData.length,
        generatedAt: new Date(),
        generationTime,
        filters: config.filters || [],
        sorts: config.sorts || []
      },
      format: config.format,
      status: 'success'
    };

    return result;
  } catch (error) {
    const generationTime = Date.now() - startTime;

    return {
      id: generateReportId(),
      reportId: config.id,
      reportName: config.name,
      data: [],
      metadata: {
        totalRows: 0,
        generatedAt: new Date(),
        generationTime,
        filters: config.filters || [],
        sorts: config.sorts || []
      },
      format: config.format,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Fetch data from Firestore based on report type
 */
const fetchReportData = async (config: ReportConfig): Promise<any[]> => {
  const collectionName = getCollectionName(config.type);
  let q = collection(db, collectionName);

  // Build Firestore query with filters
  const firestoreFilters = config.filters?.filter(f => 
    ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in'].includes(f.operator)
  ) || [];

  let queryRef: any = q;

  firestoreFilters.forEach(filter => {
    const operator = mapOperatorToFirestore(filter.operator);
    queryRef = query(queryRef, where(filter.field, operator, filter.value));
  });

  // Apply Firestore sorting
  if (config.sorts && config.sorts.length > 0) {
    config.sorts.forEach(sort => {
      queryRef = query(queryRef, orderBy(sort.field, sort.direction));
    });
  }

  // Apply limit
  if (config.limit) {
    queryRef = query(queryRef, firestoreLimit(config.limit));
  }

  const snapshot = await getDocs(queryRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get Firestore collection name based on report type
 */
const getCollectionName = (type: string): string => {
  const collectionMap: Record<string, string> = {
    user: 'users',
    project: 'projects',
    event: 'events',
    ngo: 'ngos',
    donation: 'donations',
    analytics: 'analytics'
  };

  return collectionMap[type] || 'reports';
};

/**
 * Map filter operator to Firestore operator
 */
const mapOperatorToFirestore = (operator: string): any => {
  const operatorMap: Record<string, string> = {
    eq: '==',
    ne: '!=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    in: 'in'
  };

  return operatorMap[operator] || '==';
};

/**
 * Apply filters to data
 */
const applyFilters = (data: any[], filters: ReportFilter[]): any[] => {
  return data.filter(item => {
    return filters.every(filter => {
      const value = getNestedValue(item, filter.field);

      // Handle null/undefined values
      if (value === null || value === undefined) {
        // For 'ne' (not equal) and 'contains' operations, null/undefined should be excluded
        // For other operations, exclude items with null/undefined values
        return filter.operator === 'ne';
      }

      switch (filter.operator) {
        case 'eq':
          return value === filter.value;
        case 'ne':
          return value !== filter.value;
        case 'gt':
          return value > filter.value;
        case 'gte':
          return value >= filter.value;
        case 'lt':
          return value < filter.value;
        case 'lte':
          return value <= filter.value;
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'startsWith':
          return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
        case 'endsWith':
          return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
        default:
          return true;
      }
    });
  });
};

/**
 * Apply sorting to data
 */
const applySorts = (data: any[], sorts: ReportSort[]): any[] => {
  if (sorts.length === 0) return data;

  return [...data].sort((a, b) => {
    for (const sort of sorts) {
      const aValue = getNestedValue(a, sort.field);
      const bValue = getNestedValue(b, sort.field);

      if (aValue === bValue) continue;

      const comparison = aValue < bValue ? -1 : 1;
      return sort.direction === 'asc' ? comparison : -comparison;
    }
    return 0;
  });
};

/**
 * Select specific fields from data
 */
const selectFields = (data: any[], fields: ReportField[]): any[] => {
  return data.map(item => {
    const selected: any = {};

    fields.forEach(field => {
      selected[field.name] = getNestedValue(item, field.path);
    });

    return selected;
  });
};

/**
 * Apply grouping and aggregation
 */
const applyGrouping = (
  data: any[],
  groupByFields: string[],
  fields: ReportField[]
): any[] => {
  const groups = new Map<string, any[]>();

  // Group data
  data.forEach(item => {
    const key = groupByFields.map(field => getNestedValue(item, field)).join('|');
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(item);
  });

  // Aggregate groups
  const aggregated: any[] = [];

  groups.forEach((items, key) => {
    const result: any = {};

    // Add group keys
    groupByFields.forEach((field, index) => {
      result[field] = key.split('|')[index];
    });

    // Apply aggregations
    fields.forEach(field => {
      if (field.aggregate) {
        const values = items.map(item => getNestedValue(item, field.path));
        result[field.name] = calculateAggregate(values, field.aggregate);
      } else if (!groupByFields.includes(field.path)) {
        // For non-aggregated, non-groupBy fields, take first value
        result[field.name] = getNestedValue(items[0], field.path);
      }
    });

    aggregated.push(result);
  });

  return aggregated;
};

/**
 * Calculate aggregate value
 */
const calculateAggregate = (values: any[], aggregateType: string): any => {
  const numericValues = values.filter(v => typeof v === 'number');

  switch (aggregateType) {
    case 'sum':
      return numericValues.reduce((acc, val) => acc + val, 0);
    case 'avg':
      return numericValues.length > 0 
        ? numericValues.reduce((acc, val) => acc + val, 0) / numericValues.length 
        : 0;
    case 'count':
      return values.length;
    case 'min':
      return numericValues.length > 0 ? Math.min(...numericValues) : null;
    case 'max':
      return numericValues.length > 0 ? Math.max(...numericValues) : null;
    default:
      return values.length;
  }
};

/**
 * Get nested value from object using path
 */
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Generate unique report ID
 */
const generateReportId = (): string => {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate automated report (for scheduled reports)
 */
export const generateAutomatedReport = async (
  config: ReportConfig
): Promise<ReportResult> => {
  console.log(`Generating automated report: ${config.name}`);
  return await generateReport(config);
};

/**
 * Validate report configuration
 */
export const validateReportConfig = (config: Partial<ReportConfig>): { 
  valid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];

  if (!config.name || config.name.trim() === '') {
    errors.push('Report name is required');
  }

  if (!config.type) {
    errors.push('Report type is required');
  }

  if (!config.fields || config.fields.length === 0) {
    errors.push('At least one field is required');
  }

  if (!config.format) {
    errors.push('Report format is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
