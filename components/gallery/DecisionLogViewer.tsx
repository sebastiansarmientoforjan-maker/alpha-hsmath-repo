'use client';

import { useState } from 'react';
import { DecisionLog } from '@/lib/decisionLogs';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';
import { BrutalCard } from '@/components/ui';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface DecisionLogViewerProps {
  log: DecisionLog;
  reports: (ScrollytellingReport & { id: string })[];
}

export function DecisionLogViewer({ log, reports }: DecisionLogViewerProps) {
  const [selectedReport, setSelectedReport] = useState<(ScrollytellingReport & { id: string }) | null>(
    reports.length > 0 ? reports[0] : null
  );
  const [showFullRationale, setShowFullRationale] = useState(false);

  return (
    <div className="h-full overflow-auto bg-bg-light p-6">
      {/* Decision Details */}
      <BrutalCard className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-dark mb-3">{log.title}</h1>
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
        </div>

        {/* Rationale Preview/Full */}
        <div className="mb-3">
          <h3 className="text-sm font-bold text-dark mb-2 uppercase tracking-wide">Rationale</h3>
          <div className="bg-bg-light border-4 border-dark p-4">
            <p className="text-dark font-serif whitespace-pre-wrap">
              {showFullRationale
                ? log.rationale
                : log.rationale.length > 400
                ? log.rationale.substring(0, 400) + '...'
                : log.rationale}
            </p>
          </div>
          {log.rationale.length > 400 && (
            <button
              onClick={() => setShowFullRationale(!showFullRationale)}
              className="mt-2 px-3 py-2 border-4 border-dark bg-white text-dark font-bold hover:bg-cool-blue transition-colors flex items-center gap-2 text-sm"
            >
              {showFullRationale ? (
                <>
                  <ChevronUp size={16} /> Show Less
                </>
              ) : (
                <>
                  <ChevronDown size={16} /> View Full Rationale
                </>
              )}
            </button>
          )}
        </div>

        {/* Author and Evidence */}
        <div className="flex items-center gap-4 text-sm text-dark/60 pt-3 border-t-2 border-dark">
          <span>
            <strong>Author:</strong> {log.author}
          </span>
          {log.evidence_url && (
            <a
              href={log.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-cool-blue hover:underline font-medium"
            >
              External Evidence <ExternalLink size={14} />
            </a>
          )}
        </div>
      </BrutalCard>

      {/* Associated Reports */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-dark mb-3">
          Associated Reports ({reports.length})
        </h2>
      </div>

      {reports.length === 0 ? (
        <BrutalCard>
          <p className="text-dark/60 text-center py-8">
            No reports are associated with this decision yet.
          </p>
        </BrutalCard>
      ) : (
        <>
          {/* Report Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`px-4 py-3 border-4 border-dark font-bold whitespace-nowrap transition-all ${
                  selectedReport?.id === report.id
                    ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
                    : 'bg-white text-dark hover:bg-bg-light'
                }`}
              >
                <div className="text-left">
                  <div className="text-sm">{report.title}</div>
                  {report.reportType && (
                    <div className="text-xs text-dark/60 mt-1">{report.reportType}</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Report Viewer */}
          {selectedReport && (
            <BrutalCard className="p-0 overflow-hidden">
              <div className="bg-dark text-white p-4 border-b-4 border-dark">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{selectedReport.title}</h3>
                    {selectedReport.description && (
                      <p className="text-sm text-white/80 mt-1">{selectedReport.description}</p>
                    )}
                    <div className="flex gap-2 mt-2 text-xs">
                      {selectedReport.reportType && (
                        <span className="px-2 py-1 bg-cool-blue text-dark font-bold border-2 border-white">
                          {selectedReport.reportType}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-white text-dark font-bold border-2 border-white">
                        {selectedReport.status}
                      </span>
                    </div>
                  </div>
                  <a
                    href={selectedReport.storage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 border-4 border-white bg-cool-blue text-dark font-bold hover:bg-white transition-colors flex items-center gap-2 text-sm ml-4"
                  >
                    Open Full Screen <ExternalLink size={14} />
                  </a>
                </div>
              </div>
              <iframe
                src={selectedReport.storage_url}
                className="w-full h-[700px] bg-white"
                title={selectedReport.title}
                sandbox="allow-scripts allow-same-origin"
              />
            </BrutalCard>
          )}
        </>
      )}
    </div>
  );
}
