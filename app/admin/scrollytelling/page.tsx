'use client';

import { useState, useEffect } from 'react';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';
import { getAllDecisionLogs, DecisionLog } from '@/lib/decisionLogs';
import { getAllInvestigations, Investigation } from '@/lib/investigations';
import { getAllReports, updateReport, deleteReport } from '@/lib/scrollytellingReports';
import { Edit, Trash2, AlertTriangle, ExternalLink } from 'lucide-react';

export default function ScrollytellingAdmin() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [decisionLogs, setDecisionLogs] = useState<DecisionLog[]>([]);
  const [reports, setReports] = useState<(ScrollytellingReport & { id: string })[]>([]);
  const [editingReport, setEditingReport] = useState<(ScrollytellingReport & { id: string }) | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssociation, setFilterAssociation] = useState<string>('all');

  useEffect(() => {
    loadInvestigations();
    loadDecisionLogs();
    loadReports();
  }, []);

  const loadInvestigations = async () => {
    try {
      const data = await getAllInvestigations();
      setInvestigations(data);
    } catch (error) {
      console.error('Failed to load investigations:', error);
    }
  };

  const loadDecisionLogs = async () => {
    try {
      const data = await getAllDecisionLogs();
      setDecisionLogs(data);
    } catch (error) {
      console.error('Failed to load decision logs:', error);
    }
  };

  const loadReports = async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleEditReport = (report: ScrollytellingReport & { id: string }) => {
    setEditingReport(report);
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;

    try {
      await updateReport(editingReport.id, {
        title: editingReport.title,
        status: editingReport.status,
        description: editingReport.description,
        reportType: editingReport.reportType,
        tags: editingReport.tags,
      });
      await loadReports();
      setEditingReport(null);
      alert('Report updated successfully!');
    } catch (error) {
      console.error('Failed to update report:', error);
      alert('Failed to update report. Please try again.');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteReport(reportId);
      await loadReports();
      alert('Report deleted successfully!');
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (filterAssociation === 'associated' && !report.decisionLogId && !report.investigationId) return false;
    if (filterAssociation === 'orphaned' && (report.decisionLogId || report.investigationId)) return false;
    return true;
  });

  const orphanedCount = reports.filter((r) => !r.decisionLogId && !r.investigationId).length;

  return (
    <div>
      <h1 className="text-4xl font-bold text-dark mb-2">Scrollytelling Reports</h1>
      <p className="text-dark/70 mb-8">
        Manage AI-generated scrollytelling reports. New reports are created from Decision Logs using AI.
      </p>

      {/* Report Management */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-dark">All Reports</h2>
          {orphanedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 border-4 border-dark bg-alert-orange text-dark font-bold">
              <AlertTriangle size={20} />
              {orphanedCount} Orphaned Report{orphanedCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-dark font-bold mb-2 text-xs uppercase tracking-wide">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-4 border-dark bg-white px-3 py-2 text-dark font-medium focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-dark font-bold mb-2 text-xs uppercase tracking-wide">
              Association
            </label>
            <select
              value={filterAssociation}
              onChange={(e) => setFilterAssociation(e.target.value)}
              className="border-4 border-dark bg-white px-3 py-2 text-dark font-medium focus:outline-none"
            >
              <option value="all">All Reports</option>
              <option value="associated">Associated</option>
              <option value="orphaned">Orphaned</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <BrutalCard>
          {filteredReports.length === 0 ? (
            <p className="text-dark/60 text-center py-8">
              No reports match the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-4 border-dark">
                  <tr className="bg-bg-light">
                    <th className="text-left p-3 font-bold text-dark text-sm uppercase tracking-wide">
                      Title
                    </th>
                    <th className="text-left p-3 font-bold text-dark text-sm uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left p-3 font-bold text-dark text-sm uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-left p-3 font-bold text-dark text-sm uppercase tracking-wide">
                      Associated With
                    </th>
                    <th className="text-right p-3 font-bold text-dark text-sm uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => {
                    const associatedLog = decisionLogs.find((log) => log.id === report.decisionLogId);
                    const associatedInvestigation = investigations.find((inv) => inv.id === report.investigationId);

                    return (
                      <tr key={report.id} className="border-b-2 border-dark hover:bg-bg-light">
                        <td className="p-3">
                          <div>
                            <p className="font-bold text-dark">{report.title}</p>
                            {report.description && (
                              <p className="text-xs text-dark/60 mt-1">{report.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 border-2 border-dark font-bold text-xs ${
                              report.status === 'Published'
                                ? 'bg-cool-blue'
                                : report.status === 'Archived'
                                ? 'bg-alert-orange'
                                : 'bg-bg-light'
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-dark">{report.reportType || 'Other'}</span>
                        </td>
                        <td className="p-3">
                          {associatedInvestigation ? (
                            <div>
                              <span className="text-xs text-dark/60">Investigation:</span>
                              <span className="text-sm text-dark font-medium block">{associatedInvestigation.title}</span>
                            </div>
                          ) : associatedLog ? (
                            <div>
                              <span className="text-xs text-dark/60">Decision:</span>
                              <span className="text-sm text-dark font-medium block">{associatedLog.title}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-alert-orange font-bold flex items-center gap-1">
                              <AlertTriangle size={14} />
                              Orphaned
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                const newWindow = window.open('', '_blank');
                                if (newWindow) {
                                  newWindow.document.write(report.html_content || report.storage_url || '<p>No content available</p>');
                                  newWindow.document.close();
                                }
                              }}
                              className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                              title="View report"
                            >
                              <ExternalLink size={16} />
                            </button>
                            <button
                              onClick={() => handleEditReport(report)}
                              className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                              title="Edit report"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
                              title="Delete report"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </BrutalCard>
      </div>

      {/* Edit Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-dark max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-cool-blue border-b-4 border-dark p-4">
              <h3 className="text-xl font-bold text-dark">Edit Report</h3>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                <BrutalInput
                  label="Title"
                  value={editingReport.title}
                  onChange={(e) =>
                    setEditingReport({ ...editingReport, title: e.target.value })
                  }
                />

                <div>
                  <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={editingReport.status}
                    onChange={(e) =>
                      setEditingReport({
                        ...editingReport,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                    Report Type
                  </label>
                  <select
                    value={editingReport.reportType || 'Other'}
                    onChange={(e) =>
                      setEditingReport({ ...editingReport, reportType: e.target.value })
                    }
                    className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none"
                  >
                    <option value="Pre-Analysis">Pre-Analysis</option>
                    <option value="Mid-Term">Mid-Term</option>
                    <option value="Final">Final</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={editingReport.description || ''}
                    onChange={(e) =>
                      setEditingReport({ ...editingReport, description: e.target.value })
                    }
                    rows={3}
                    className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-serif focus:outline-none resize-y"
                  />
                </div>
              </div>
            </div>
            <div className="border-t-4 border-dark p-4 flex gap-4">
              <BrutalButton onClick={handleSaveEdit} variant="primary">
                Save Changes
              </BrutalButton>
              <BrutalButton onClick={() => setEditingReport(null)} variant="secondary">
                Cancel
              </BrutalButton>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 border-4 border-alert-orange bg-alert-orange/10">
        <p className="font-bold text-dark mb-2">⚠️ Important Notes:</p>
        <ul className="text-sm text-dark/80 space-y-1 list-disc list-inside font-serif">
          <li>HTML files should be self-contained with embedded styles and scripts</li>
          <li>Large external dependencies may affect loading performance</li>
          <li>Only Published reports will appear in the public Gallery</li>
          <li>Orphaned reports are not associated with any decision log</li>
          <li>Make sure Firebase is configured in .env.local before uploading</li>
        </ul>
      </div>
    </div>
  );
}
