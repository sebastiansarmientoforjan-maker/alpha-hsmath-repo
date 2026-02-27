'use client';

import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { DecisionLog } from '@/lib/decisionLogs';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';
import { BrutalCard } from './BrutalCard';
import { ReportThumbnail } from './ReportThumbnail';

interface DecisionLogDetailProps {
  log: DecisionLog;
  reports: (ScrollytellingReport & { id: string })[];
  onClose: () => void;
  onDetachReport?: (reportId: string) => void;
}

export function DecisionLogDetail({
  log,
  reports,
  onClose,
  onDetachReport,
}: DecisionLogDetailProps) {
  const [selectedReport, setSelectedReport] = useState<(ScrollytellingReport & { id: string }) | null>(
    reports.length > 0 ? reports[0] : null
  );

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-light border-4 border-dark max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b-4 border-dark p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-dark mb-2">{log.title}</h2>
            <div className="flex gap-3 text-sm">
              <span className="px-3 py-1 border-2 border-dark bg-cool-blue font-bold">
                {log.taxonomy}
              </span>
              <span
                className={`px-3 py-1 border-2 border-dark font-bold ${
                  log.status === 'Empirically Validated'
                    ? 'bg-cool-blue'
                    : log.status === 'Refuted'
                    ? 'bg-alert-orange'
                    : 'bg-bg-light'
                }`}
              >
                {log.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 border-4 border-dark bg-white hover:bg-alert-orange transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-dark mb-2">Rationale</h3>
            <div className="bg-white border-4 border-dark p-4">
              <p className="text-dark font-serif whitespace-pre-wrap">{log.rationale}</p>
            </div>
          </div>

          {log.evidence_url && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-dark mb-2">External Evidence</h3>
              <a
                href={log.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border-4 border-dark bg-cool-blue text-dark font-bold hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all"
              >
                View Evidence <ExternalLink size={16} />
              </a>
            </div>
          )}

          <div className="mb-2">
            <h3 className="text-lg font-bold text-dark mb-3">
              Associated Reports ({reports.length})
            </h3>
          </div>

          {reports.length === 0 ? (
            <BrutalCard>
              <p className="text-dark/60 text-center py-4">
                No reports associated with this decision yet.
              </p>
            </BrutalCard>
          ) : (
            <div className="space-y-4">
              {/* Report Thumbnails */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {reports.map((report) => (
                  <ReportThumbnail
                    key={report.id}
                    report={report}
                    onView={() => setSelectedReport(report)}
                    onDetach={onDetachReport ? () => onDetachReport(report.id) : undefined}
                    showDetach={!!onDetachReport}
                  />
                ))}
              </div>

              {/* Report Preview */}
              {selectedReport && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-dark mb-3">Preview: {selectedReport.title}</h4>
                  <div className="border-4 border-dark bg-white">
                    <iframe
                      srcDoc={selectedReport.html_content || undefined}
                      src={selectedReport.html_content ? undefined : selectedReport.storage_url}
                      className="w-full h-[500px]"
                      title={selectedReport.title}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t-4 border-dark text-sm text-dark/60">
            <p>
              <strong>Author:</strong> {log.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
