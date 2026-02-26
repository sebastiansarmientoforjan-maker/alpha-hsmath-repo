'use client';

import { useState, useEffect } from 'react';
import { BrutalCard } from '@/components/ui';
import { FileText, Database, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { getAllReports } from '@/lib/scrollytellingReports';
import { getAllDecisionLogs } from '@/lib/decisionLogs';

export default function AdminDashboard() {
  const [totalReports, setTotalReports] = useState(0);
  const [totalDecisionLogs, setTotalDecisionLogs] = useState(0);
  const [activeDebates, setActiveDebates] = useState(0);
  const [orphanedReports, setOrphanedReports] = useState(0);
  const [reportsPerDecision, setReportsPerDecision] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const [reports, logs] = await Promise.all([
        getAllReports(),
        getAllDecisionLogs(),
      ]);

      setTotalReports(reports.length);
      setTotalDecisionLogs(logs.length);

      // Count active debates
      const debates = logs.filter((log) => log.status === 'Under Debate').length;
      setActiveDebates(debates);

      // Count orphaned reports
      const orphaned = reports.filter((report) => !report.decisionLogId).length;
      setOrphanedReports(orphaned);

      // Calculate average reports per decision
      const logsWithReports = logs.filter((log) => log.reportCount > 0);
      const avgReports =
        logsWithReports.length > 0
          ? (logsWithReports.reduce((sum, log) => sum + log.reportCount, 0) /
              logsWithReports.length).toFixed(1)
          : 0;
      setReportsPerDecision(Number(avgReports));
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-dark mb-2">Admin Dashboard</h1>
      <p className="text-dark/70 mb-8">
        HS Math Documentation & Analysis Hub - Content Management System
      </p>

      {loading ? (
        <BrutalCard>
          <p className="text-center text-dark/60 py-8">Loading statistics...</p>
        </BrutalCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <BrutalCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-dark/60 font-bold mb-1">
                    Total Reports
                  </p>
                  <p className="text-3xl font-bold text-dark">{totalReports}</p>
                </div>
                <FileText size={32} className="text-cool-blue" />
              </div>
            </BrutalCard>

            <BrutalCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-dark/60 font-bold mb-1">
                    Decision Logs
                  </p>
                  <p className="text-3xl font-bold text-dark">{totalDecisionLogs}</p>
                </div>
                <Database size={32} className="text-cool-blue" />
              </div>
            </BrutalCard>

            <BrutalCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-dark/60 font-bold mb-1">
                    Active Debates
                  </p>
                  <p className="text-3xl font-bold text-dark">{activeDebates}</p>
                </div>
                <TrendingUp size={32} className="text-alert-orange" />
              </div>
            </BrutalCard>

            <BrutalCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-dark/60 font-bold mb-1">
                    Reports / Decision
                  </p>
                  <p className="text-3xl font-bold text-dark">{reportsPerDecision}</p>
                </div>
                <BarChart3 size={32} className="text-cool-blue" />
              </div>
            </BrutalCard>
          </div>

          {orphanedReports > 0 && (
            <div className="mb-8">
              <BrutalCard className="border-alert-orange bg-alert-orange/10">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 border-4 border-dark bg-alert-orange">
                    <AlertTriangle size={32} className="text-dark" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-dark mb-2">
                      {orphanedReports} Orphaned Report{orphanedReports !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-dark/80 font-serif mb-3">
                      You have {orphanedReports} report{orphanedReports !== 1 ? 's' : ''} that{' '}
                      {orphanedReports !== 1 ? 'are' : 'is'} not associated with any decision log.
                      Consider linking {orphanedReports !== 1 ? 'them' : 'it'} to provide context for stakeholders.
                    </p>
                    <a
                      href="/admin/scrollytelling"
                      className="inline-block px-4 py-2 border-4 border-dark bg-white text-dark font-bold hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all"
                    >
                      Manage Reports →
                    </a>
                  </div>
                </div>
              </BrutalCard>
            </div>
          )}
        </>
      )}

      <BrutalCard>
        <h2 className="text-xl font-bold text-dark mb-4">Quick Start Guide</h2>
        <div className="space-y-3 font-serif text-dark/80">
          <p>
            <strong className="text-dark">1. Configure Firebase:</strong> Copy{' '}
            <code className="bg-bg-light px-2 py-1 border-2 border-dark">
              .env.local.example
            </code>{' '}
            to{' '}
            <code className="bg-bg-light px-2 py-1 border-2 border-dark">
              .env.local
            </code>{' '}
            and add your Firebase credentials.
          </p>
          <p>
            <strong className="text-dark">2. Create Decision Logs:</strong> Document pedagogical
            decisions and experimental results first. These will be the primary entities in your hub.
          </p>
          <p>
            <strong className="text-dark">3. Upload Reports:</strong> Use the Scrollytelling
            Reports section to upload HTML files and associate them with decision logs.
          </p>
          <p>
            <strong className="text-dark">4. Share Results:</strong> Published reports associated with
            decision logs will appear in the public Gallery view for your team and stakeholders.
          </p>
        </div>
      </BrutalCard>
    </div>
  );
}
