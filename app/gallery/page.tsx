'use client';

import { useState, useEffect } from 'react';
import { BrutalCard } from '@/components/ui';
import { getAllDecisionLogs, DecisionLog } from '@/lib/decisionLogs';
import { getReportsByDecisionLog } from '@/lib/scrollytellingReports';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';
import { DecisionLogSidebar } from '@/components/gallery/DecisionLogSidebar';
import { DecisionLogViewer } from '@/components/gallery/DecisionLogViewer';
import Link from 'next/link';

export default function Gallery() {
  const [logs, setLogs] = useState<DecisionLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<DecisionLog | null>(null);
  const [selectedLogReports, setSelectedLogReports] = useState<
    (ScrollytellingReport & { id: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filterTaxonomy, setFilterTaxonomy] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedLog?.id) {
      loadLogReports(selectedLog.id);
    }
  }, [selectedLog]);

  const loadData = async () => {
    try {
      const allLogs = await getAllDecisionLogs();

      // Filter to only show logs with published reports
      const logsWithPublishedReports = await Promise.all(
        allLogs.map(async (log) => {
          if (!log.id) return null;
          const reports = await getReportsByDecisionLog(log.id);
          const hasPublished = reports.some((r) => r.status === 'Published');
          return hasPublished ? log : null;
        })
      );

      const filteredLogs = logsWithPublishedReports.filter((log) => log !== null) as DecisionLog[];
      setLogs(filteredLogs);

      if (filteredLogs.length > 0) {
        setSelectedLog(filteredLogs[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogReports = async (logId: string) => {
    try {
      const reports = await getReportsByDecisionLog(logId);
      // Only show published reports in the gallery
      const publishedReports = reports.filter((r) => r.status === 'Published');
      setSelectedLogReports(publishedReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
      setSelectedLogReports([]);
    }
  };

  const handleSelectLog = (log: DecisionLog) => {
    setSelectedLog(log);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-2xl font-bold text-dark">Loading...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="min-h-screen bg-bg-light p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-dark mb-4">Research Gallery</h1>
          <BrutalCard>
            <div className="text-center py-12">
              <p className="text-xl text-dark/60 mb-4">No published content yet</p>
              <p className="text-dark/50 mb-6">
                Decision logs with published reports will appear here once they are created in the
                admin panel.
              </p>
              <Link
                href="/admin"
                className="inline-block px-6 py-3 border-4 border-dark bg-cool-blue text-dark font-bold shadow-[6px_6px_0px_0px_rgba(18,18,18,1)] hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
              >
                Go to Admin Panel
              </Link>
            </div>
          </BrutalCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      {/* Header */}
      <div className="border-b-4 border-dark bg-white p-6 flex-shrink-0">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark">HS Math Research Gallery</h1>
            <p className="text-dark/70">Decision-Based Documentation & Analysis Hub</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 border-4 border-dark bg-cool-blue text-dark font-bold shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm"
          >
            Admin Panel
          </Link>
        </div>
      </div>

      {/* Main Content: Sidebar + Viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - 30% */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex-shrink-0 overflow-hidden">
          <DecisionLogSidebar
            logs={logs}
            selectedLogId={selectedLog?.id || null}
            onSelectLog={handleSelectLog}
            filterTaxonomy={filterTaxonomy}
            filterStatus={filterStatus}
            onFilterTaxonomyChange={setFilterTaxonomy}
            onFilterStatusChange={setFilterStatus}
          />
        </div>

        {/* Main Viewer - 70% */}
        <div className="flex-1 overflow-hidden">
          {selectedLog ? (
            <DecisionLogViewer log={selectedLog} reports={selectedLogReports} />
          ) : (
            <div className="h-full flex items-center justify-center bg-bg-light">
              <div className="text-center">
                <p className="text-xl text-dark/60">Select a decision log to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
