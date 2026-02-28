'use client';

import { useState, useEffect } from 'react';
import { BrutalCard } from '@/components/ui';
import { FileText, Database, TrendingUp, AlertTriangle, BarChart3, Microscope, Sparkles, Wand2, Clock, ArrowRight } from 'lucide-react';
import { getAllReports } from '@/lib/scrollytellingReports';
import { getAllDecisionLogs } from '@/lib/decisionLogs';
import { getAllInvestigations, Investigation } from '@/lib/investigations';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [totalReports, setTotalReports] = useState(0);
  const [totalDecisionLogs, setTotalDecisionLogs] = useState(0);
  const [totalInvestigations, setTotalInvestigations] = useState(0);
  const [activeDebates, setActiveDebates] = useState(0);
  const [orphanedReports, setOrphanedReports] = useState(0);
  const [reportsPerDecision, setReportsPerDecision] = useState(0);
  const [recentInvestigations, setRecentInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load statistics when auth is ready and user is present
    if (!authLoading && user) {
      loadStatistics();
    } else if (!authLoading && !user) {
      setError('You must be signed in to view the dashboard.');
      setLoading(false);
    }
  }, [authLoading, user]);

  const loadStatistics = async () => {
    try {
      setError(null);
      const [reports, logs, investigations] = await Promise.all([
        getAllReports(),
        getAllDecisionLogs(),
        getAllInvestigations(),
      ]);

      setTotalReports(reports.length);
      setTotalDecisionLogs(logs.length);
      setTotalInvestigations(investigations.length);

      // Get 3 most recent investigations
      setRecentInvestigations(investigations.slice(0, 3));

      // Count active debates
      const debates = logs.filter((log) => log.status === 'Under Debate').length;
      setActiveDebates(debates);

      // Count orphaned reports (no investigation AND no decision)
      const orphaned = reports.filter((report) => !report.decisionLogId && !report.investigationId).length;
      setOrphanedReports(orphaned);

      // Calculate average reports per decision
      const logsWithReports = logs.filter((log) => (log.reportCount ?? 0) > 0);
      const avgReports =
        logsWithReports.length > 0
          ? (logsWithReports.reduce((sum, log) => sum + (log.reportCount ?? 0), 0) /
              logsWithReports.length).toFixed(1)
          : 0;
      setReportsPerDecision(Number(avgReports));
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
      setError(error?.message || 'Failed to load dashboard data. Check Firebase permissions.');
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

      {error && (
        <BrutalCard className="mb-6 border-alert-orange bg-alert-orange/10">
          <div className="flex items-start gap-4">
            <AlertTriangle size={24} className="text-alert-orange flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-dark mb-1">Dashboard Error</h3>
              <p className="text-dark/80 mb-3">{error}</p>
              <button
                onClick={loadStatistics}
                className="px-4 py-2 border-4 border-dark bg-white text-dark font-bold hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        </BrutalCard>
      )}

      {loading ? (
        <BrutalCard>
          <p className="text-center text-dark/60 py-8">Loading statistics...</p>
        </BrutalCard>
      ) : !error ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <BrutalCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-dark/60 font-bold mb-1">
                    Investigations
                  </p>
                  <p className="text-3xl font-bold text-dark">{totalInvestigations}</p>
                </div>
                <Microscope size={32} className="text-cool-blue" />
              </div>
            </BrutalCard>

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
      ) : null}

      {/* Quick Actions */}
      <BrutalCard className="mb-8">
        <h2 className="text-xl font-bold text-dark mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/gem-generator"
            className="flex items-center gap-3 p-4 border-4 border-dark bg-cool-blue hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all group"
          >
            <Sparkles size={24} className="text-dark" />
            <div className="flex-1">
              <div className="font-bold text-dark">Generate GEM Prompt</div>
              <div className="text-sm text-dark/70">Create AI-powered guidance</div>
            </div>
            <ArrowRight size={20} className="text-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/admin/process-results"
            className="flex items-center gap-3 p-4 border-4 border-dark bg-alert-orange hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all group"
          >
            <Wand2 size={24} className="text-dark" />
            <div className="flex-1">
              <div className="font-bold text-dark">Process AI Results</div>
              <div className="text-sm text-dark/70">Convert to investigation</div>
            </div>
            <ArrowRight size={20} className="text-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/admin/research"
            className="flex items-center gap-3 p-4 border-4 border-dark bg-white hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all group"
          >
            <Microscope size={24} className="text-dark" />
            <div className="flex-1">
              <div className="font-bold text-dark">View Research</div>
              <div className="text-sm text-dark/70">Browse all investigations</div>
            </div>
            <ArrowRight size={20} className="text-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </BrutalCard>

      {/* Recent Investigations */}
      {recentInvestigations.length > 0 && (
        <BrutalCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark flex items-center gap-2">
              <Clock size={24} />
              Recent Investigations
            </h2>
            <Link
              href="/admin/research"
              className="text-sm text-dark/70 hover:text-dark font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentInvestigations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 border-2 border-dark bg-bg-light hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-dark mb-1">{inv.title}</h3>
                    <p className="text-sm text-dark/70 mb-2 line-clamp-2">
                      {inv.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-dark/60">
                      <span className="font-medium">{inv.researchType}</span>
                      <span>•</span>
                      <span>{inv.mathematicalArea}</span>
                      <span>•</span>
                      <span>{inv.author}</span>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 border-2 border-dark text-xs font-bold ${
                      inv.status === 'Completed'
                        ? 'bg-cool-blue'
                        : inv.status === 'Published'
                        ? 'bg-alert-orange'
                        : 'bg-white'
                    }`}
                  >
                    {inv.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BrutalCard>
      )}
    </div>
  );
}
