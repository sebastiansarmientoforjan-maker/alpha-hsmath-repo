'use client';

import { useState, useEffect } from 'react';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { getAllDecisionLogs, DecisionLog } from '@/lib/decisionLogs';
import { getAllInvestigations, Investigation } from '@/lib/investigations';
import { getReportsByDecisionLog, getReportsByInvestigation } from '@/lib/scrollytellingReports';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';
import { getInvestigationsForDecision } from '@/lib/decisionInvestigations';
import { FileText, Microscope, X } from 'lucide-react';
import Link from 'next/link';

type TabType = 'investigations' | 'decisions';

export default function Gallery() {
  const [activeTab, setActiveTab] = useState<TabType>('investigations');
  const [loading, setLoading] = useState(true);

  // Investigations
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [investigationReports, setInvestigationReports] = useState<(ScrollytellingReport & { id: string })[]>([]);

  // Decisions
  const [decisions, setDecisions] = useState<DecisionLog[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<DecisionLog | null>(null);
  const [decisionReports, setDecisionReports] = useState<(ScrollytellingReport & { id: string })[]>([]);

  // Investigations Modal
  const [showInvestigationsModal, setShowInvestigationsModal] = useState(false);
  const [linkedInvestigations, setLinkedInvestigations] = useState<(Investigation & { id: string })[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allInvestigations, allDecisions] = await Promise.all([
        getAllInvestigations(),
        getAllDecisionLogs(),
      ]);

      // Filter published investigations with published reports
      const publishedInvestigations = await Promise.all(
        allInvestigations
          .filter((inv) => inv.status === 'Published')
          .map(async (inv) => {
            if (!inv.id) return null;
            const reports = await getReportsByInvestigation(inv.id);
            return reports.some((r) => r.status === 'Published') ? inv : null;
          })
      );
      const filteredInv = publishedInvestigations.filter((inv) => inv !== null) as Investigation[];
      setInvestigations(filteredInv);
      if (filteredInv.length > 0) setSelectedInvestigation(filteredInv[0]);

      // Filter decisions with published reports
      const decisionsWithReports = await Promise.all(
        allDecisions.map(async (dec) => {
          if (!dec.id) return null;
          const reports = await getReportsByDecisionLog(dec.id);
          return reports.some((r) => r.status === 'Published') ? dec : null;
        })
      );
      const filteredDec = decisionsWithReports.filter((dec) => dec !== null) as DecisionLog[];
      setDecisions(filteredDec);
      if (filteredDec.length > 0) setSelectedDecision(filteredDec[0]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInvestigation?.id) {
      loadInvestigationReports(selectedInvestigation.id);
    }
  }, [selectedInvestigation]);

  useEffect(() => {
    if (selectedDecision?.id) {
      loadDecisionReports(selectedDecision.id);
    }
  }, [selectedDecision]);

  const loadInvestigationReports = async (id: string) => {
    try {
      const reports = await getReportsByInvestigation(id);
      setInvestigationReports(reports.filter((r) => r.status === 'Published'));
    } catch (error) {
      console.error('Failed to load investigation reports:', error);
    }
  };

  const loadDecisionReports = async (id: string) => {
    try {
      const reports = await getReportsByDecisionLog(id);
      setDecisionReports(reports.filter((r) => r.status === 'Published'));
    } catch (error) {
      console.error('Failed to load decision reports:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-2xl font-bold text-dark">Loading...</div>
      </div>
    );
  }

  const hasContent = investigations.length > 0 || decisions.length > 0;

  if (!hasContent) {
    return (
      <div className="min-h-screen bg-bg-light p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-dark mb-4">Research & Decision Hub</h1>
          <BrutalCard>
            <div className="text-center py-12">
              <p className="text-xl text-dark/60 mb-4">No published content yet</p>
              <p className="text-dark/50 mb-6">
                Published investigations and decisions will appear here.
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
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <div className="border-b-4 border-dark bg-white p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark">HS Math Research & Decision Hub</h1>
            <p className="text-dark/70">Explore investigations and pedagogical decisions</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 border-4 border-dark bg-cool-blue text-dark font-bold shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm"
          >
            Admin Panel
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b-4 border-dark bg-white">
        <div className="max-w-7xl mx-auto flex">
          <button
            onClick={() => setActiveTab('investigations')}
            className={`px-6 py-4 border-r-4 border-dark font-bold transition-all ${
              activeTab === 'investigations'
                ? 'bg-cool-blue text-dark'
                : 'bg-white text-dark/60 hover:bg-bg-light'
            }`}
          >
            <Microscope size={20} className="inline mr-2" />
            Investigations ({investigations.length})
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-6 py-4 font-bold transition-all ${
              activeTab === 'decisions'
                ? 'bg-cool-blue text-dark'
                : 'bg-white text-dark/60 hover:bg-bg-light'
            }`}
          >
            <FileText size={20} className="inline mr-2" />
            Decisions ({decisions.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        {activeTab === 'investigations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Investigation List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-2xl font-bold text-dark mb-4">Research Repository</h2>
              {investigations.map((inv) => (
                <BrutalCard
                  key={inv.id}
                  hoverable
                  onClick={() => setSelectedInvestigation(inv)}
                  className={`cursor-pointer ${
                    selectedInvestigation?.id === inv.id ? 'ring-4 ring-cool-blue' : ''
                  }`}
                >
                  <h3 className="text-lg font-bold text-dark mb-2">{inv.title}</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 border-2 border-dark bg-cool-blue font-bold">
                      {inv.researchType}
                    </span>
                    <span className="px-2 py-1 border-2 border-dark bg-bg-light font-bold">
                      {inv.mathematicalArea}
                    </span>
                  </div>
                </BrutalCard>
              ))}
            </div>

            {/* Investigation Detail */}
            <div className="lg:col-span-2">
              {selectedInvestigation && (
                <BrutalCard>
                  <h2 className="text-2xl font-bold text-dark mb-4">{selectedInvestigation.title}</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-dark uppercase mb-2">Description</h3>
                      <p className="text-dark font-serif">{selectedInvestigation.description}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-dark uppercase mb-2">Key Findings</h3>
                      <p className="text-dark font-serif">{selectedInvestigation.keyFindings}</p>
                    </div>
                    {selectedInvestigation.impactMetrics && (
                      <div className="p-3 border-4 border-dark bg-cool-blue/20">
                        <p className="text-dark font-bold">📈 {selectedInvestigation.impactMetrics}</p>
                      </div>
                    )}
                    {/* Systematic Literature Review Details */}
                    {selectedInvestigation.researchType === 'Systematic Literature Review' && (
                      <div className="border-4 border-cool-blue bg-cool-blue/10 p-4 space-y-3">
                        <h3 className="text-sm font-bold text-dark uppercase mb-2">Systematic Review Details</h3>

                        {selectedInvestigation.searchKeywords && selectedInvestigation.searchKeywords.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-dark mb-1 uppercase">Search Keywords</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedInvestigation.searchKeywords.map((keyword, index) => (
                                <span key={index} className="px-2 py-0.5 border-2 border-dark bg-white text-xs font-medium">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedInvestigation.databases && selectedInvestigation.databases.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-dark mb-1 uppercase">Databases</p>
                            <p className="text-sm text-dark">{selectedInvestigation.databases.join(', ')}</p>
                          </div>
                        )}

                        {selectedInvestigation.paperCount && (
                          <div>
                            <p className="text-xs font-bold text-dark mb-1 uppercase">Papers Reviewed</p>
                            <p className="text-xl font-bold text-dark">{selectedInvestigation.paperCount}</p>
                          </div>
                        )}

                        {selectedInvestigation.citationLinks && selectedInvestigation.citationLinks.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-dark mb-2 uppercase">Key Citations</p>
                            <div className="space-y-2">
                              {selectedInvestigation.citationLinks.map((citation, index) => (
                                <div key={index} className="border-2 border-dark bg-white p-2">
                                  <p className="font-bold text-dark text-sm">{citation.title}</p>
                                  {citation.authors && (
                                    <p className="text-xs text-dark/60">{citation.authors}</p>
                                  )}
                                  <a
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-cool-blue hover:underline"
                                  >
                                    View Paper →
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-dark uppercase mb-2">
                        Reports ({investigationReports.length})
                      </h3>
                      {investigationReports.map((report) => (
                        <div key={report.id} className="mb-2 p-3 border-4 border-dark bg-white">
                          <a
                            href={report.storage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-dark font-bold hover:text-cool-blue"
                          >
                            {report.title} →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </BrutalCard>
              )}
            </div>
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Decision List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-2xl font-bold text-dark mb-4">Decision Logs</h2>
              {decisions.map((dec) => (
                <BrutalCard
                  key={dec.id}
                  hoverable
                  onClick={() => setSelectedDecision(dec)}
                  className={`cursor-pointer ${
                    selectedDecision?.id === dec.id ? 'ring-4 ring-cool-blue' : ''
                  }`}
                >
                  <h3 className="text-lg font-bold text-dark mb-2">{dec.title}</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 border-2 border-dark bg-cool-blue font-bold">
                      {dec.taxonomy}
                    </span>
                    <span className={`px-2 py-1 border-2 border-dark font-bold ${
                      dec.status === 'Empirically Validated' ? 'bg-cool-blue' :
                      dec.status === 'Refuted' ? 'bg-alert-orange' : 'bg-bg-light'
                    }`}>
                      {dec.status}
                    </span>
                  </div>
                </BrutalCard>
              ))}
            </div>

            {/* Decision Detail */}
            <div className="lg:col-span-2">
              {selectedDecision && (
                <BrutalCard>
                  <h2 className="text-2xl font-bold text-dark mb-4">{selectedDecision.title}</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-dark uppercase mb-2">Rationale</h3>
                      <p className="text-dark font-serif whitespace-pre-wrap">{selectedDecision.rationale}</p>
                    </div>
                    {selectedDecision.schoolContext && (
                      <div>
                        <h3 className="text-sm font-bold text-dark uppercase mb-2">School Context</h3>
                        <p className="text-dark font-serif whitespace-pre-wrap">{selectedDecision.schoolContext}</p>
                      </div>
                    )}
                    {selectedDecision.id && (
                      <div>
                        <BrutalButton
                          onClick={async () => {
                            if (selectedDecision.id) {
                              const investigations = await getInvestigationsForDecision(selectedDecision.id);
                              setLinkedInvestigations(investigations);
                              setShowInvestigationsModal(true);
                            }
                          }}
                          variant="secondary"
                          className="gap-2"
                        >
                          <Microscope size={16} />
                          View Research Foundation ({selectedDecision.investigationCount || 0})
                        </BrutalButton>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-dark uppercase mb-2">
                        Reports ({decisionReports.length})
                      </h3>
                      {decisionReports.map((report) => (
                        <div key={report.id} className="mb-2 p-3 border-4 border-dark bg-white">
                          <a
                            href={report.storage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-dark font-bold hover:text-cool-blue"
                          >
                            {report.title} →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </BrutalCard>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Investigations Modal */}
      {showInvestigationsModal && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white border-4 border-dark max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-cool-blue border-b-4 border-dark p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-dark">Research Foundation</h3>
              <button
                onClick={() => setShowInvestigationsModal(false)}
                className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {linkedInvestigations.length === 0 ? (
                <p className="text-dark/60 text-center py-8">No linked investigations found.</p>
              ) : (
                <div className="space-y-4">
                  {linkedInvestigations.map((inv) => (
                    <div key={inv.id} className="border-4 border-dark bg-bg-light p-6">
                      <h4 className="text-xl font-bold text-dark mb-3">{inv.title}</h4>

                      <div className="flex gap-2 mb-4">
                        <span className="px-3 py-1 border-2 border-dark bg-cool-blue font-bold text-sm">
                          {inv.researchType}
                        </span>
                        <span className="px-3 py-1 border-2 border-dark bg-white font-bold text-sm">
                          {inv.mathematicalArea}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-bold text-dark uppercase mb-1">Description</p>
                          <p className="text-dark font-serif">{inv.description}</p>
                        </div>

                        {inv.keyFindings && (
                          <div>
                            <p className="text-xs font-bold text-dark uppercase mb-1">Key Findings</p>
                            <p className="text-dark font-serif">{inv.keyFindings}</p>
                          </div>
                        )}

                        {inv.methodology && (
                          <div>
                            <p className="text-xs font-bold text-dark uppercase mb-1">Methodology</p>
                            <p className="text-dark font-serif">{inv.methodology}</p>
                          </div>
                        )}

                        {inv.impactMetrics && (
                          <div className="p-3 border-2 border-dark bg-cool-blue/20">
                            <p className="text-dark font-bold text-sm">📈 {inv.impactMetrics}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
