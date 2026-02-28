'use client';

import { useState, useEffect } from 'react';
import { BrutalCard } from '@/components/ui';
import {
  deleteInvestigation,
  getAllInvestigations,
  Investigation,
} from '@/lib/investigations';
import { getReportsByInvestigation } from '@/lib/scrollytellingReports';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';
import { Trash2, FileText, Eye } from 'lucide-react';

export default function ResearchRepositoryAdmin() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loadingInvestigations, setLoadingInvestigations] = useState(true);
  const [viewingInvestigation, setViewingInvestigation] = useState<Investigation | null>(null);
  const [viewingReports, setViewingReports] = useState<(ScrollytellingReport & { id: string })[]>([]);


  useEffect(() => {
    loadInvestigations();
  }, []);

  const loadInvestigations = async () => {
    setLoadingInvestigations(true);
    try {
      const data = await getAllInvestigations();
      setInvestigations(data);
    } catch (error) {
      console.error('Failed to load investigations:', error);
    } finally {
      setLoadingInvestigations(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investigation?')) return;

    try {
      await deleteInvestigation(id);
      await loadInvestigations();
    } catch (error) {
      console.error('Failed to delete investigation:', error);
    }
  };

  const handleView = async (investigation: Investigation) => {
    setViewingInvestigation(investigation);
    if (investigation.id) {
      const reports = await getReportsByInvestigation(investigation.id);
      setViewingReports(reports);
    }
  };


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-dark mb-2">Research Repository</h1>
        <p className="text-dark/70">
          View and manage research investigations. Create new investigations from{' '}
          <a href="/admin/process-results" className="text-cool-blue hover:underline font-bold">
            Process Results
          </a>
          .
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-dark">All Investigations</h2>

        {loadingInvestigations ? (
          <BrutalCard>
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-dark border-t-transparent mb-4"></div>
              <p className="text-dark/60">Loading investigations...</p>
            </div>
          </BrutalCard>
        ) : investigations.length === 0 ? (
          <BrutalCard>
            <p className="text-dark/60 text-center py-8">
              No investigations yet. Create one from{' '}
              <a href="/admin/process-results" className="text-cool-blue hover:underline font-bold">
                Process Results
              </a>
              .
            </p>
          </BrutalCard>
        ) : (
          investigations.map((inv) => (
            <BrutalCard key={inv.id} hoverable>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-dark">{inv.title}</h3>
                    {inv.reportCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 border-2 border-dark bg-cool-blue text-dark font-bold text-xs">
                        <FileText size={14} />
                        {inv.reportCount}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-sm mb-3">
                    <span className="px-3 py-1 border-2 border-dark bg-cool-blue font-bold">
                      {inv.researchType}
                    </span>
                    <span className="px-3 py-1 border-2 border-dark bg-bg-light font-bold">
                      {inv.mathematicalArea}
                    </span>
                    <span
                      className={`px-3 py-1 border-2 border-dark font-bold ${
                        inv.status === 'Published'
                          ? 'bg-cool-blue'
                          : inv.status === 'Completed'
                          ? 'bg-alert-orange'
                          : 'bg-bg-light'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(inv)}
                    className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id!)}
                    className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
                    title="Delete investigation"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <p className="text-dark/80 font-serif mb-3">
                {inv.description.length > 200
                  ? inv.description.substring(0, 200) + '...'
                  : inv.description}
              </p>

              {inv.impactMetrics && (
                <div className="mb-3 px-3 py-2 border-2 border-dark bg-cool-blue/20">
                  <p className="text-sm font-bold text-dark">
                    📈 Impact: {inv.impactMetrics}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-dark/60">
                <span>By {inv.author}</span>
                <span>Started: {new Date(inv.startDate.seconds * 1000).toLocaleDateString()}</span>
              </div>
            </BrutalCard>
          ))
        )}
      </div>

      {/* View Modal */}
      {viewingInvestigation && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white border-4 border-dark max-w-4xl w-full max-h-[90vh] overflow-auto my-8">
            <div className="sticky top-0 bg-cool-blue border-b-4 border-dark p-6 flex items-start justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-dark mb-2">{viewingInvestigation.title}</h2>
                <div className="flex gap-2 text-sm">
                  <span className="px-2 py-1 border-2 border-dark bg-white font-bold">
                    {viewingInvestigation.researchType}
                  </span>
                  <span className="px-2 py-1 border-2 border-dark bg-white font-bold">
                    {viewingInvestigation.mathematicalArea}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingInvestigation(null)}
                className="p-2 border-4 border-dark bg-white hover:bg-alert-orange transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-dark mb-2">Description</h3>
                <p className="text-dark font-serif whitespace-pre-wrap">
                  {viewingInvestigation.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-dark mb-2">Key Findings</h3>
                <p className="text-dark font-serif whitespace-pre-wrap">
                  {viewingInvestigation.keyFindings}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-dark mb-2">Methodology</h3>
                <p className="text-dark font-serif whitespace-pre-wrap">
                  {viewingInvestigation.methodology}
                </p>
              </div>

              {viewingInvestigation.impactMetrics && (
                <div>
                  <h3 className="text-lg font-bold text-dark mb-2">Impact Metrics</h3>
                  <p className="text-dark font-serif">{viewingInvestigation.impactMetrics}</p>
                </div>
              )}

              {/* Systematic Literature Review Details */}
              {viewingInvestigation.researchType === 'Systematic Literature Review' && (
                <div className="border-4 border-cool-blue bg-cool-blue/10 p-4 space-y-4">
                  <h3 className="text-lg font-bold text-dark mb-2">Systematic Review Details</h3>

                  {viewingInvestigation.searchKeywords && viewingInvestigation.searchKeywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-dark mb-1 uppercase tracking-wide">Search Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingInvestigation.searchKeywords.map((keyword, index) => (
                          <span key={index} className="px-2 py-1 border-2 border-dark bg-white text-sm font-medium">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingInvestigation.databases && viewingInvestigation.databases.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-dark mb-1 uppercase tracking-wide">Databases Searched</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingInvestigation.databases.map((db, index) => (
                          <span key={index} className="px-2 py-1 border-2 border-dark bg-white text-sm font-medium">
                            {db}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingInvestigation.paperCount && (
                    <div>
                      <h4 className="text-sm font-bold text-dark mb-1 uppercase tracking-wide">Papers Reviewed</h4>
                      <p className="text-2xl font-bold text-dark">{viewingInvestigation.paperCount}</p>
                    </div>
                  )}

                  {viewingInvestigation.citationLinks && viewingInvestigation.citationLinks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-dark mb-2 uppercase tracking-wide">
                        Key Citations ({viewingInvestigation.citationLinks.length})
                      </h4>
                      <div className="space-y-2">
                        {viewingInvestigation.citationLinks.map((citation, index) => (
                          <div key={index} className="border-2 border-dark bg-white p-3">
                            <p className="font-bold text-dark mb-1">{citation.title}</p>
                            {citation.authors && (
                              <p className="text-sm text-dark/60 mb-1">{citation.authors}</p>
                            )}
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-cool-blue hover:underline"
                            >
                              {citation.url} →
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-dark mb-3">
                  Associated Reports ({viewingReports.length})
                </h3>
                {viewingReports.length === 0 ? (
                  <p className="text-dark/60">No reports associated yet. Upload reports from the Scrollytelling Reports page.</p>
                ) : (
                  <div className="space-y-2">
                    {viewingReports.map((report) => (
                      <div
                        key={report.id}
                        className="border-4 border-dark bg-white p-3 hover:bg-bg-light transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-dark">{report.title}</h4>
                            <div className="flex gap-2 mt-1 text-xs">
                              <span className={`px-2 py-1 border-2 border-dark font-bold ${
                                report.status === 'Published' ? 'bg-cool-blue' :
                                report.status === 'Archived' ? 'bg-alert-orange' : 'bg-bg-light'
                              }`}>
                                {report.status}
                              </span>
                              {report.reportType && (
                                <span className="px-2 py-1 border-2 border-dark bg-bg-light font-bold">
                                  {report.reportType}
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={report.storage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 border-4 border-dark bg-cool-blue text-dark font-bold hover:bg-white transition-colors text-sm"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
