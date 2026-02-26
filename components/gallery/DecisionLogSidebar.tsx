'use client';

import { DecisionLog } from '@/lib/decisionLogs';
import { FileText, ChevronRight } from 'lucide-react';

interface DecisionLogSidebarProps {
  logs: DecisionLog[];
  selectedLogId: string | null;
  onSelectLog: (log: DecisionLog) => void;
  filterTaxonomy: string;
  filterStatus: string;
  onFilterTaxonomyChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
}

export function DecisionLogSidebar({
  logs,
  selectedLogId,
  onSelectLog,
  filterTaxonomy,
  filterStatus,
  onFilterTaxonomyChange,
  onFilterStatusChange,
}: DecisionLogSidebarProps) {
  const filteredLogs = logs.filter((log) => {
    if (filterTaxonomy !== 'all' && log.taxonomy !== filterTaxonomy) return false;
    if (filterStatus !== 'all' && log.status !== filterStatus) return false;
    return true;
  });

  // Group by taxonomy
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    if (!acc[log.taxonomy]) {
      acc[log.taxonomy] = [];
    }
    acc[log.taxonomy].push(log);
    return acc;
  }, {} as Record<string, DecisionLog[]>);

  return (
    <div className="h-full flex flex-col bg-white border-r-4 border-dark">
      {/* Filters */}
      <div className="p-4 border-b-4 border-dark bg-bg-light">
        <h2 className="text-lg font-bold text-dark mb-3">Filters</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-dark mb-1 uppercase tracking-wide">
              Taxonomy
            </label>
            <select
              value={filterTaxonomy}
              onChange={(e) => onFilterTaxonomyChange(e.target.value)}
              className="w-full border-4 border-dark bg-white px-2 py-2 text-sm text-dark font-medium focus:outline-none"
            >
              <option value="all">All</option>
              <option value="Pedagogical Adjustment">Pedagogical Adjustment</option>
              <option value="Experimental Refutation">Experimental Refutation</option>
              <option value="New Didactic Model">New Didactic Model</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-dark mb-1 uppercase tracking-wide">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value)}
              className="w-full border-4 border-dark bg-white px-2 py-2 text-sm text-dark font-medium focus:outline-none"
            >
              <option value="all">All</option>
              <option value="Under Debate">Under Debate</option>
              <option value="Empirically Validated">Empirically Validated</option>
              <option value="Refuted">Refuted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Decision Logs List */}
      <div className="flex-1 overflow-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-4 text-center text-dark/60">
            <p className="text-sm">No decision logs match the current filters.</p>
          </div>
        ) : (
          <div className="divide-y-4 divide-dark">
            {Object.entries(groupedLogs).map(([taxonomy, logsInGroup]) => (
              <div key={taxonomy}>
                <div className="p-3 bg-bg-light sticky top-0 z-10">
                  <h3 className="text-xs font-bold text-dark uppercase tracking-wide">
                    {taxonomy}
                  </h3>
                </div>
                {logsInGroup.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => onSelectLog(log)}
                    className={`w-full text-left p-3 border-b-2 border-dark hover:bg-bg-light transition-colors ${
                      selectedLogId === log.id ? 'bg-cool-blue' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-dark leading-tight flex-1">
                        {log.title}
                      </h4>
                      <ChevronRight
                        size={16}
                        className={`flex-shrink-0 mt-0.5 ${
                          selectedLogId === log.id ? 'text-dark' : 'text-dark/40'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 border-2 border-dark font-bold ${
                          log.status === 'Empirically Validated'
                            ? 'bg-cool-blue'
                            : log.status === 'Refuted'
                            ? 'bg-alert-orange'
                            : 'bg-bg-light'
                        }`}
                      >
                        {log.status}
                      </span>
                      {log.reportCount > 0 && (
                        <span className="flex items-center gap-1 text-dark/60">
                          <FileText size={12} />
                          {log.reportCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
