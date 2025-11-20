/**
 * Report Builder Component for Segment 23: Reporting & Export
 * Allows users to create custom reports with drag-and-drop field selection
 */

import React, { useState, useEffect } from 'react';
import {
  ReportConfig,
  ReportType,
  ReportFormat,
  ReportField,
  ReportFilter,
  ReportSort,
  ReportTemplate
} from '../../types/report';
import { createReport, updateReport, getTemplates, createReportFromTemplate } from '../../services/reportService';
import { validateReportConfig } from '../../utils/reportGenerator';

interface ReportBuilderProps {
  initialReport?: ReportConfig;
  onSave?: (report: ReportConfig) => void;
  onCancel?: () => void;
  userId: string;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  initialReport,
  onSave,
  onCancel,
  userId
}) => {
  const [reportName, setReportName] = useState(initialReport?.name || '');
  const [description, setDescription] = useState(initialReport?.description || '');
  const [reportType, setReportType] = useState<ReportType>(initialReport?.type || 'project');
  const [format, setFormat] = useState<ReportFormat>(initialReport?.format || 'csv');
  const [fields, setFields] = useState<ReportField[]>(initialReport?.fields || []);
  const [filters, setFilters] = useState<ReportFilter[]>(initialReport?.filters || []);
  const [sorts, setSorts] = useState<ReportSort[]>(initialReport?.sorts || []);
  const [groupBy, setGroupBy] = useState<string[]>(initialReport?.groupBy || []);
  const [limit, setLimit] = useState<number | undefined>(initialReport?.limit);
  
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Available field options based on report type
  const availableFields: Record<ReportType, ReportField[]> = {
    user: [
      { id: 'name', name: 'Name', type: 'string', path: 'displayName' },
      { id: 'email', name: 'Email', type: 'string', path: 'email' },
      { id: 'role', name: 'Role', type: 'string', path: 'role' },
      { id: 'createdAt', name: 'Created Date', type: 'date', path: 'createdAt' }
    ],
    project: [
      { id: 'title', name: 'Title', type: 'string', path: 'title' },
      { id: 'category', name: 'Category', type: 'string', path: 'category' },
      { id: 'status', name: 'Status', type: 'string', path: 'status' },
      { id: 'volunteers', name: 'Volunteers', type: 'number', path: 'volunteersNeeded', aggregate: 'sum' },
      { id: 'createdAt', name: 'Created Date', type: 'date', path: 'createdAt' }
    ],
    event: [
      { id: 'title', name: 'Title', type: 'string', path: 'title' },
      { id: 'location', name: 'Location', type: 'string', path: 'location' },
      { id: 'attendees', name: 'Attendees', type: 'number', path: 'attendees', aggregate: 'sum' },
      { id: 'date', name: 'Date', type: 'date', path: 'date' }
    ],
    ngo: [
      { id: 'name', name: 'Name', type: 'string', path: 'name' },
      { id: 'verified', name: 'Verified', type: 'boolean', path: 'verified' },
      { id: 'projectsCount', name: 'Projects Count', type: 'number', path: 'projectsCount', aggregate: 'sum' }
    ],
    donation: [
      { id: 'amount', name: 'Amount', type: 'number', path: 'amount', aggregate: 'sum' },
      { id: 'donor', name: 'Donor', type: 'string', path: 'donorName' },
      { id: 'date', name: 'Date', type: 'date', path: 'createdAt' }
    ],
    analytics: [
      { id: 'metric', name: 'Metric', type: 'string', path: 'metric' },
      { id: 'value', name: 'Value', type: 'number', path: 'value', aggregate: 'sum' }
    ],
    custom: []
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const temps = await getTemplates(userId);
      setTemplates(temps);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId) return;

    try {
      setLoading(true);
      const report = await createReportFromTemplate(templateId, userId);
      
      setReportName(report.name);
      setDescription(report.description || '');
      setReportType(report.type);
      setFormat(report.format);
      setFields(report.fields);
      setFilters(report.filters || []);
      setSorts(report.sorts || []);
      setGroupBy(report.groupBy || []);
      setLimit(report.limit);

      setSelectedTemplate(templateId);
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = (field: ReportField) => {
    if (!fields.find(f => f.id === field.id)) {
      setFields([...fields, field]);
    }
  };

  const handleRemoveField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleAddFilter = () => {
    const newFilter: ReportFilter = {
      field: '',
      operator: 'eq',
      value: ''
    };
    setFilters([...filters, newFilter]);
  };

  const handleUpdateFilter = (index: number, filter: ReportFilter) => {
    const updated = [...filters];
    updated[index] = filter;
    setFilters(updated);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleAddSort = () => {
    const newSort: ReportSort = {
      field: '',
      direction: 'asc'
    };
    setSorts([...sorts, newSort]);
  };

  const handleUpdateSort = (index: number, sort: ReportSort) => {
    const updated = [...sorts];
    updated[index] = sort;
    setSorts(updated);
  };

  const handleRemoveSort = (index: number) => {
    setSorts(sorts.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const reportConfig: Partial<ReportConfig> = {
      name: reportName,
      description,
      type: reportType,
      fields,
      filters: filters.filter(f => f.field && f.value),
      sorts: sorts.filter(s => s.field),
      groupBy,
      limit,
      format,
      status: 'draft',
      createdBy: userId
    };

    const validation = validateReportConfig(reportConfig);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      let savedReport: ReportConfig;

      if (initialReport) {
        await updateReport(initialReport.id, reportConfig);
        savedReport = { ...initialReport, ...reportConfig } as ReportConfig;
      } else {
        savedReport = await createReport(reportConfig as Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>);
      }

      onSave?.(savedReport);
    } catch (error) {
      setErrors(['Failed to save report. Please try again.']);
      console.error('Error saving report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-builder">
      <div className="report-builder-header">
        <h2>{initialReport ? 'Edit Report' : 'Create New Report'}</h2>
      </div>

      <div className="report-builder-content">
        {/* Template Selection */}
        {!initialReport && templates.length > 0 && (
          <div className="form-section">
            <label>Start from Template (Optional)</label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Start from scratch --</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Basic Info */}
        <div className="form-section">
          <label>Report Name *</label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder="Enter report name"
          />
        </div>

        <div className="form-section">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter report description"
            rows={3}
          />
        </div>

        {/* Report Type */}
        <div className="form-section">
          <label>Report Type *</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
          >
            <option value="user">Users</option>
            <option value="project">Projects</option>
            <option value="event">Events</option>
            <option value="ngo">NGOs</option>
            <option value="donation">Donations</option>
            <option value="analytics">Analytics</option>
          </select>
        </div>

        {/* Fields Selection */}
        <div className="form-section">
          <label>Fields *</label>
          <div className="field-selection">
            <div className="available-fields">
              <h4>Available Fields</h4>
              {availableFields[reportType].map(field => (
                <div
                  key={field.id}
                  className="field-item"
                  onClick={() => handleAddField(field)}
                >
                  + {field.name}
                </div>
              ))}
            </div>

            <div className="selected-fields">
              <h4>Selected Fields</h4>
              {fields.map(field => (
                <div key={field.id} className="field-item selected">
                  {field.name}
                  <button onClick={() => handleRemoveField(field.id)}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="form-section">
          <label>Filters</label>
          {filters.map((filter, index) => (
            <div key={index} className="filter-row">
              <select
                value={filter.field}
                onChange={(e) => handleUpdateFilter(index, { ...filter, field: e.target.value })}
              >
                <option value="">Select field</option>
                {availableFields[reportType].map(field => (
                  <option key={field.id} value={field.path}>
                    {field.name}
                  </option>
                ))}
              </select>

              <select
                value={filter.operator}
                onChange={(e) => handleUpdateFilter(index, { ...filter, operator: e.target.value as any })}
              >
                <option value="eq">Equals</option>
                <option value="ne">Not Equals</option>
                <option value="gt">Greater Than</option>
                <option value="lt">Less Than</option>
                <option value="contains">Contains</option>
              </select>

              <input
                type="text"
                value={filter.value}
                onChange={(e) => handleUpdateFilter(index, { ...filter, value: e.target.value })}
                placeholder="Value"
              />

              <button onClick={() => handleRemoveFilter(index)}>Remove</button>
            </div>
          ))}
          <button onClick={handleAddFilter}>+ Add Filter</button>
        </div>

        {/* Sorting */}
        <div className="form-section">
          <label>Sorting</label>
          {sorts.map((sort, index) => (
            <div key={index} className="sort-row">
              <select
                value={sort.field}
                onChange={(e) => handleUpdateSort(index, { ...sort, field: e.target.value })}
              >
                <option value="">Select field</option>
                {fields.map(field => (
                  <option key={field.id} value={field.path}>
                    {field.name}
                  </option>
                ))}
              </select>

              <select
                value={sort.direction}
                onChange={(e) => handleUpdateSort(index, { ...sort, direction: e.target.value as 'asc' | 'desc' })}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>

              <button onClick={() => handleRemoveSort(index)}>Remove</button>
            </div>
          ))}
          <button onClick={handleAddSort}>+ Add Sort</button>
        </div>

        {/* Format Selection */}
        <div className="form-section">
          <label>Export Format *</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormat)}
          >
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        {/* Limit */}
        <div className="form-section">
          <label>Row Limit</label>
          <input
            type="number"
            value={limit || ''}
            onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="No limit"
            min="1"
          />
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="errors">
            {errors.map((error, index) => (
              <div key={index} className="error">{error}</div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Report'}
          </button>
          {onCancel && (
            <button onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
