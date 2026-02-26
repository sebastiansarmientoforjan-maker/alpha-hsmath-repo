'use client';

import { FileText, X } from 'lucide-react';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';

interface ReportThumbnailProps {
  report: ScrollytellingReport & { id: string };
  onView?: () => void;
  onDetach?: () => void;
  showDetach?: boolean;
}

export function ReportThumbnail({
  report,
  onView,
  onDetach,
  showDetach = false,
}: ReportThumbnailProps) {
  return (
    <div className="relative border-4 border-dark bg-white p-3 hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all">
      {showDetach && onDetach && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetach();
          }}
          className="absolute -top-2 -right-2 p-1 border-2 border-dark bg-alert-orange hover:bg-alert-orange/80 transition-colors z-10"
          title="Detach report"
        >
          <X size={14} />
        </button>
      )}

      <div
        className={`flex items-start gap-3 ${onView ? 'cursor-pointer' : ''}`}
        onClick={onView}
      >
        <div className="flex-shrink-0 p-2 border-2 border-dark bg-cool-blue">
          <FileText size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-dark truncate">{report.title}</h4>

          {report.reportType && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs border-2 border-dark bg-bg-light font-bold uppercase">
              {report.reportType}
            </span>
          )}

          {report.description && (
            <p className="text-xs text-dark/60 mt-1 line-clamp-2">{report.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className={`px-2 py-0.5 border-2 border-dark font-bold ${
              report.status === 'Published' ? 'bg-cool-blue' :
              report.status === 'Archived' ? 'bg-alert-orange' : 'bg-bg-light'
            }`}>
              {report.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
