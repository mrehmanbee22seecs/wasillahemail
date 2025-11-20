/**
 * Report Viewer Component for Segment 23: Reporting & Export
 * Displays generated reports with export and sharing options
 */

import React, { useState, useEffect } from 'react';
import {
  ReportConfig,
  ReportResult,
  ReportAnalytics,
  ReportFormat
} from '../../types/report';
import {
  getReport,
  getReportResults,
  generateAndSaveReport,
  getReportAnalytics,
  trackReportView,
  trackReportDownload
} from '../../services/reportService';
import { exportReport } from '../../utils/exportUtils';

interface ReportViewerProps {
  reportId: string;
  onEdit?: () => void;
  onClose?: () => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({
  reportId,
  onEdit,
  onClose
}) => {
  const [report, setReport] = useState<ReportConfig | null>(null);
  const [results, setResults] = useState<ReportResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ReportResult | null>(null);
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'analytics'>('table');

  useEffect(() => {
    loadReport();
    loadResults();
    loadAnalytics();
    trackView();
  }, [reportId]);

  const loadReport = async () => {
    try {
      const reportData = await getReport(reportId);
      setReport(reportData);
    } catch (err) {
      setError('Failed to load report');
      console.error('Error loading report:', err);
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      const resultsData = await getReportResults(reportId, 10);
      setResults(resultsData);
      
      if (resultsData.length > 0) {
        setCurrentResult(resultsData[0]);
      }
    } catch (err) {
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await getReportAnalytics(reportId);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  const trackView = async () => {
    try {
      await trackReportView(reportId);
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const result = await generateAndSaveReport(reportId);
      setCurrentResult(result);
      setResults([result, ...results]);
      
      await loadAnalytics();
    } catch (err) {
      setError('Failed to generate report');
      console.error('Error generating report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format?: ReportFormat) => {
    if (!currentResult) return;

    try {
      await trackReportDownload(reportId);
      
      exportReport(currentResult, {
        format: format || currentResult.format
      });

      await loadAnalytics();
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  };

  const handleResultSelect = (result: ReportResult) => {
    setCurrentResult(result);
  };

  if (!report) {
    return <div>Loading...</div>;
  }

  return (
    <div className="report-viewer">
      {/* Header */}
      <div className="report-viewer-header">
        <div>
          <h2>{report.name}</h2>
          {report.description && <p>{report.description}</p>}
        </div>

        <div className="header-actions">
          <button onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : '🔄 Generate'}
          </button>
          {onEdit && <button onClick={onEdit}>✏️ Edit</button>}
          {onClose && <button onClick={onClose}>✕ Close</button>}
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <button
          className={viewMode === 'table' ? 'active' : ''}
          onClick={() => setViewMode('table')}
        >
          📊 Data
        </button>
        <button
          className={viewMode === 'analytics' ? 'active' : ''}
          onClick={() => setViewMode('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-view">
          {/* Result History */}
          {results.length > 0 && (
            <div className="result-selector">
              <label>Previous Results:</label>
              <select
                value={currentResult?.id || ''}
                onChange={(e) => {
                  const result = results.find(r => r.id === e.target.value);
                  if (result) handleResultSelect(result);
                }}
              >
                {results.map(result => (
                  <option key={result.id} value={result.id}>
                    {new Date(result.metadata.generatedAt).toLocaleString()} - {result.metadata.totalRows} rows
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export Options */}
          {currentResult && (
            <div className="export-options">
              <button onClick={() => handleExport('csv')}>📄 Export CSV</button>
              <button onClick={() => handleExport('excel')}>📊 Export Excel</button>
              <button onClick={() => handleExport('json')}>📋 Export JSON</button>
              <button onClick={() => handleExport('pdf')}>📕 Export PDF</button>
            </div>
          )}

          {/* Data Table */}
          {currentResult && currentResult.data.length > 0 ? (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(currentResult.data[0]).map(key => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentResult.data.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td key={cellIndex}>
                          {value instanceof Date
                            ? value.toLocaleString()
                            : typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Metadata */}
              <div className="report-metadata">
                <div>Total Rows: {currentResult.metadata.totalRows}</div>
                <div>Generated: {new Date(currentResult.metadata.generatedAt).toLocaleString()}</div>
                <div>Generation Time: {currentResult.metadata.generationTime}ms</div>
              </div>
            </div>
          ) : currentResult ? (
            <div className="no-data">No data available for this report</div>
          ) : (
            <div className="no-results">
              No results yet. Click "Generate" to create the first report.
            </div>
          )}
        </div>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && analytics && (
        <div className="analytics-view">
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>Total Generations</h3>
              <div className="analytics-value">{analytics.totalGenerations}</div>
            </div>

            <div className="analytics-card">
              <h3>Total Views</h3>
              <div className="analytics-value">{analytics.totalViews}</div>
            </div>

            <div className="analytics-card">
              <h3>Total Downloads</h3>
              <div className="analytics-value">{analytics.totalDownloads}</div>
            </div>

            <div className="analytics-card">
              <h3>Average Generation Time</h3>
              <div className="analytics-value">
                {analytics.averageGenerationTime}ms
              </div>
            </div>

            {analytics.lastGenerated && (
              <div className="analytics-card">
                <h3>Last Generated</h3>
                <div className="analytics-value">
                  {new Date(analytics.lastGenerated).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Format Breakdown */}
          {analytics.formatBreakdown && Object.keys(analytics.formatBreakdown).length > 0 && (
            <div className="analytics-section">
              <h3>Export Format Breakdown</h3>
              <div className="format-breakdown">
                {Object.entries(analytics.formatBreakdown).map(([format, count]) => (
                  <div key={format} className="format-item">
                    <span className="format-name">{format.toUpperCase()}</span>
                    <span className="format-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportViewer;
