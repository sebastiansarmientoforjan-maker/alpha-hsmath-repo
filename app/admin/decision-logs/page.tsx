'use client';

import { useState, useEffect } from 'react';
import { BrutalCard, BrutalInput, BrutalButton } from '@/components/ui';
import {
  createDecisionLog,
  updateDecisionLog,
  deleteDecisionLog,
  getAllDecisionLogs,
  DecisionLog,
} from '@/lib/decisionLogs';
import { getAllInvestigations, Investigation } from '@/lib/investigations';
import { getAllReports, getReportsByDecisionLog } from '@/lib/scrollytellingReports';
import { attachReportToDecision, detachReportFromDecision } from '@/lib/decisionLogReports';
import {
  linkInvestigationToDecision,
  unlinkInvestigationFromDecision,
  getInvestigationsForDecision,
} from '@/lib/decisionInvestigations';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';
import { DecisionLogDetail } from '@/components/ui/DecisionLogDetail';
import { Edit, Trash2, Plus, Save, X, FileText, Link as LinkIcon, Microscope } from 'lucide-react';

export default function DecisionLogsAdmin() {
  const [logs, setLogs] = useState<DecisionLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DecisionLog | null>(null);
  const [logReports, setLogReports] = useState<(ScrollytellingReport & { id: string })[]>([]);
  const [allReports, setAllReports] = useState<(ScrollytellingReport & { id: string })[]>([]);
  const [showAttachModal, setShowAttachModal] = useState<string | null>(null);

  // New: Investigation linking
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [linkedInvestigations, setLinkedInvestigations] = useState<(Investigation & { id: string })[]>([]);
  const [showLinkInvestigationModal, setShowLinkInvestigationModal] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    taxonomy: 'Pedagogical Adjustment' as DecisionLog['taxonomy'],
    status: 'Under Debate' as DecisionLog['status'],
    rationale: '',
    evidence_url: '',
    author: '',
    schoolContext: '',
  });

  // Parser state
  const [showTextParser, setShowTextParser] = useState(false);
  const [rawDocText, setRawDocText] = useState('');
  const [selectedInvestigationIds, setSelectedInvestigationIds] = useState<string[]>([]);

  useEffect(() => {
    loadLogs();
    loadAllReports();
    loadInvestigations();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await getAllDecisionLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadAllReports = async () => {
    try {
      const data = await getAllReports();
      setAllReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const loadInvestigations = async () => {
    try {
      const data = await getAllInvestigations();
      setInvestigations(data);
    } catch (error) {
      console.error('Failed to load investigations:', error);
    }
  };

  const loadLogReports = async (logId: string) => {
    try {
      const data = await getReportsByDecisionLog(logId);
      setLogReports(data);
    } catch (error) {
      console.error('Failed to load log reports:', error);
    }
  };

  const handleViewDetails = async (log: DecisionLog) => {
    setSelectedLog(log);
    if (log.id) {
      await loadLogReports(log.id);
      await loadLinkedInvestigations(log.id);
    }
  };

  const loadLinkedInvestigations = async (logId: string) => {
    try {
      const data = await getInvestigationsForDecision(logId);
      setLinkedInvestigations(data);
    } catch (error) {
      console.error('Failed to load linked investigations:', error);
    }
  };

  const handleLinkInvestigation = async (logId: string, investigationId: string) => {
    try {
      await linkInvestigationToDecision(logId, investigationId);
      await loadLogs();
      setShowLinkInvestigationModal(null);
      alert('Investigation linked successfully!');
    } catch (error) {
      console.error('Failed to link investigation:', error);
      alert('Failed to link investigation. Please try again.');
    }
  };

  const handleUnlinkInvestigation = async (logId: string, investigationId: string) => {
    if (!confirm('Are you sure you want to unlink this investigation?')) return;

    try {
      await unlinkInvestigationFromDecision(logId, investigationId);
      await loadLogs();
      if (selectedLog?.id === logId) {
        await loadLinkedInvestigations(logId);
      }
      alert('Investigation unlinked successfully!');
    } catch (error) {
      console.error('Failed to unlink investigation:', error);
      alert('Failed to unlink investigation. Please try again.');
    }
  };

  const handleAttachReport = async (logId: string, reportId: string) => {
    try {
      await attachReportToDecision(logId, reportId);
      await loadLogs();
      await loadAllReports();
      setShowAttachModal(null);
      alert('Report attached successfully!');
    } catch (error) {
      console.error('Failed to attach report:', error);
      alert('Failed to attach report. Please try again.');
    }
  };

  const handleDetachReport = async (reportId: string) => {
    if (!selectedLog?.id) return;

    if (!confirm('Are you sure you want to detach this report?')) return;

    try {
      await detachReportFromDecision(selectedLog.id, reportId);
      await loadLogs();
      await loadLogReports(selectedLog.id);
      alert('Report detached successfully!');
    } catch (error) {
      console.error('Failed to detach report:', error);
      alert('Failed to detach report. Please try again.');
    }
  };

  // Parser functions
  const extractSection = (text: string, keywords: string[]): string => {
    const keywordPattern = keywords.join('|');
    const regex = new RegExp(
      `(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:${keywordPattern})[:\\s]*\\n([\\s\\S]*?)(?=\\n\\s*#{1,6}\\s|\\n\\n[A-Z]|$)`,
      'im'
    );
    const match = text.match(regex);
    if (match && match[1]) return match[1].trim();

    const inlineRegex = new RegExp(`(?:${keywordPattern})[:\\s]+([^\\n]+)`, 'im');
    const inlineMatch = text.match(inlineRegex);
    return inlineMatch ? inlineMatch[1].trim() : '';
  };

  const parseDocumentationText = () => {
    if (!rawDocText.trim()) {
      alert('Please paste documentation text first');
      return;
    }

    try {
      const lines = rawDocText.split('\n').filter(line => line.trim());

      // Extract title (first line or line with #)
      const titleLine = lines.find(l => l.startsWith('#')) || lines[0];
      const title = titleLine.replace(/^#+\s*/, '').trim();

      // Extract main sections
      const purpose = extractSection(rawDocText, ['purpose', 'propósito', 'objective', 'objetivo']);
      const context = extractSection(rawDocText, ['context', 'contexto', 'background', 'antecedentes']);
      const decision = extractSection(rawDocText, ['decision', 'decisión', 'approach', 'solution']);
      const rationale = extractSection(rawDocText, ['rationale', 'justification', 'justificación', 'why', 'por qué']);
      const evidence = extractSection(rawDocText, ['evidence', 'evidencia', 'data', 'results', 'findings']);

      // Build rationale from available content
      let fullRationale = '';
      if (purpose) fullRationale += `## Purpose\n${purpose}\n\n`;
      if (context) fullRationale += `## Context\n${context}\n\n`;
      if (decision) fullRationale += `## Decision\n${decision}\n\n`;
      if (rationale) fullRationale += `## Rationale\n${rationale}\n\n`;
      if (evidence) fullRationale += `## Evidence\n${evidence}\n\n`;

      // If no structured rationale, use the full text
      if (!fullRationale.trim()) {
        fullRationale = rawDocText;
      }

      // Detect taxonomy based on keywords
      let taxonomy: DecisionLog['taxonomy'] = 'Pedagogical Adjustment';
      const lowerText = rawDocText.toLowerCase();
      if (lowerText.includes('refut') || lowerText.includes('experiment')) {
        taxonomy = 'Experimental Refutation';
      } else if (lowerText.includes('new model') || lowerText.includes('didactic model') || lowerText.includes('nuevo modelo')) {
        taxonomy = 'New Didactic Model';
      }

      // Detect status
      let status: DecisionLog['status'] = 'Under Debate';
      if (lowerText.includes('validated') || lowerText.includes('validado') || lowerText.includes('empirically')) {
        status = 'Empirically Validated';
      } else if (lowerText.includes('refuted') || lowerText.includes('refutado')) {
        status = 'Refuted';
      }

      // Extract author if present
      const authorMatch = rawDocText.match(/(?:author|autor|by|created by)[:\s]+([^\n]+)/i);
      const author = authorMatch ? authorMatch[1].trim() : 'Sebastian Sarmiento';

      // Extract school context if present
      const schoolMatch = rawDocText.match(/(?:school|escuela|hub|sede)[:\s]+([^\n]+)/i);
      const schoolContext = schoolMatch ? schoolMatch[1].trim() : '';

      // Pre-fill form
      setFormData({
        title: title || 'Untitled Decision',
        taxonomy,
        status,
        rationale: fullRationale.trim(),
        evidence_url: '',
        author,
        schoolContext,
      });

      setShowTextParser(false);
      setShowForm(true);
      setEditingId(null);
      alert('✅ Documentation parsed! Review the form and select related investigations before saving.');
    } catch (error) {
      console.error('Parse error:', error);
      alert('Error parsing documentation. Please check the format and try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      taxonomy: 'Pedagogical Adjustment',
      status: 'Under Debate',
      rationale: '',
      evidence_url: '',
      author: '',
      schoolContext: '',
    });
    setEditingId(null);
    setShowForm(false);
    setSelectedInvestigationIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logId: string;

      if (editingId) {
        await updateDecisionLog(editingId, formData);
        logId = editingId;
      } else {
        logId = await createDecisionLog(formData);
      }

      // Link selected investigations
      if (selectedInvestigationIds.length > 0 && logId) {
        for (const invId of selectedInvestigationIds) {
          await linkInvestigationToDecision(logId, invId);
        }
      }

      await loadLogs();
      resetForm();
      alert(`Decision log saved successfully!${selectedInvestigationIds.length > 0 ? ` Linked to ${selectedInvestigationIds.length} investigation(s).` : ''}`);
    } catch (error) {
      console.error('Failed to save log:', error);
      alert('Failed to save. Make sure Firebase is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log: DecisionLog) => {
    setFormData({
      title: log.title,
      taxonomy: log.taxonomy,
      status: log.status,
      rationale: log.rationale,
      evidence_url: log.evidence_url || '',
      author: log.author,
      schoolContext: log.schoolContext || '',
    });
    setEditingId(log.id!);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this decision log?')) return;

    try {
      await deleteDecisionLog(id);
      await loadLogs();
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  };

  const orphanedReports = allReports.filter(r => !r.decisionLogId);

  return (
    <div>
      {selectedLog && (
        <DecisionLogDetail
          log={selectedLog}
          reports={logReports}
          onClose={() => setSelectedLog(null)}
          onDetachReport={handleDetachReport}
        />
      )}

      {showAttachModal && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-dark max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-cool-blue border-b-4 border-dark p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-dark">Attach Report</h3>
              <button
                onClick={() => setShowAttachModal(null)}
                className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {orphanedReports.length === 0 ? (
                <p className="text-dark/60 text-center py-8">
                  No unattached reports available. All reports are already associated with decision logs.
                </p>
              ) : (
                <div className="space-y-2">
                  {orphanedReports.map((report) => (
                    <div
                      key={report.id}
                      className="border-4 border-dark bg-white p-4 hover:bg-bg-light transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-dark">{report.title}</h4>
                          <div className="flex gap-2 mt-2 text-xs">
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
                        <BrutalButton
                          onClick={() => handleAttachReport(showAttachModal, report.id)}
                          variant="primary"
                          className="ml-4"
                        >
                          Attach
                        </BrutalButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link Investigation Modal */}
      {showLinkInvestigationModal && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-dark max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-cool-blue border-b-4 border-dark p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-dark">Link Investigation</h3>
              <button
                onClick={() => setShowLinkInvestigationModal(null)}
                className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {investigations.length === 0 ? (
                <p className="text-dark/60 text-center py-8">
                  No investigations available. Create investigations in the Research Repository first.
                </p>
              ) : (
                <div className="space-y-2">
                  {investigations.map((inv) => (
                    <div
                      key={inv.id}
                      className="border-4 border-dark bg-white p-4 hover:bg-bg-light transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-dark">{inv.title}</h4>
                          <div className="flex gap-2 mt-2 text-xs">
                            <span className="px-2 py-1 border-2 border-dark bg-cool-blue font-bold">
                              {inv.researchType}
                            </span>
                            <span className="px-2 py-1 border-2 border-dark bg-bg-light font-bold">
                              {inv.mathematicalArea}
                            </span>
                          </div>
                        </div>
                        <BrutalButton
                          onClick={() => handleLinkInvestigation(showLinkInvestigationModal, inv.id!)}
                          variant="primary"
                          className="ml-4"
                        >
                          Link
                        </BrutalButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-dark mb-2">Decision Logs</h1>
          <p className="text-dark/70">
            Document pedagogical decisions and experimental findings
          </p>
        </div>
        <div className="flex gap-3">
          <BrutalButton
            onClick={() => {
              setShowTextParser(!showTextParser);
              setShowForm(false);
            }}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <FileText size={20} />
            {showTextParser ? 'Close Parser' : 'Generate from Documentation'}
          </BrutalButton>
          <BrutalButton
            onClick={() => {
              setShowForm(!showForm);
              setShowTextParser(false);
            }}
            variant="primary"
            className="flex items-center gap-2"
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? 'Cancel' : 'New Log'}
          </BrutalButton>
        </div>
      </div>

      {/* Text Parser */}
      {showTextParser && (
        <BrutalCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-dark">Generate Decision Log from Documentation</h2>
              <p className="text-sm text-dark/70 mt-1">
                Paste your documentation below and we'll automatically extract the decision log structure
              </p>
            </div>
            <button
              onClick={() => setShowTextParser(false)}
              className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <textarea
            value={rawDocText}
            onChange={(e) => setRawDocText(e.target.value)}
            placeholder={`Paste your documentation here. Example:

# Alpha Desmos SAT Training Platform

## Purpose
Enable students to master progressive training units through an interactive, split-screen interface with an embedded calculator.

## Context
Currently students lack practical training for Digital SAT Math section Desmos calculator skills...

## Decision
Created a comprehensive training platform with Unit A (Regression Analysis) and Unit B (Visual Problem Solving)...

## Rationale
Speed is a critical component of mastery. The platform enforces a "Platinum" tier requiring correct answers in <6 minutes...

## Evidence
Students using the platform showed 2.3x faster progression when mastering vertex form before standard form...`}
            rows={16}
            className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-mono text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y mb-4"
          />

          <div className="flex gap-3">
            <BrutalButton
              onClick={parseDocumentationText}
              variant="primary"
              disabled={!rawDocText.trim()}
            >
              <FileText size={20} className="inline mr-2" />
              Parse & Generate Decision Log
            </BrutalButton>
            <BrutalButton
              onClick={() => setRawDocText('')}
              variant="secondary"
            >
              Clear
            </BrutalButton>
          </div>
        </BrutalCard>
      )}

      {/* Form */}
      {showForm && (
        <BrutalCard className="mb-6">
          <h2 className="text-xl font-bold text-dark mb-4">
            {editingId ? 'Edit Decision Log' : 'Create New Decision Log'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <BrutalInput
              label="Title"
              placeholder="e.g., Shift from Traditional to Inquiry-Based Learning"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                  Taxonomy
                </label>
                <select
                  value={formData.taxonomy}
                  onChange={(e) =>
                    setFormData({ ...formData, taxonomy: e.target.value as any })
                  }
                  className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]"
                  required
                >
                  <option value="Pedagogical Adjustment">Pedagogical Adjustment</option>
                  <option value="Experimental Refutation">Experimental Refutation</option>
                  <option value="New Didactic Model">New Didactic Model</option>
                </select>
              </div>

              <div>
                <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]"
                  required
                >
                  <option value="Under Debate">Under Debate</option>
                  <option value="Empirically Validated">Empirically Validated</option>
                  <option value="Refuted">Refuted</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                Rationale (Supports Markdown/LaTeX)
              </label>
              <textarea
                value={formData.rationale}
                onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                rows={8}
                className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-serif focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y"
                placeholder="Explain the reasoning, evidence, and implications..."
                required
              />
            </div>

            <div>
              <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                School Context (Optional)
              </label>
              <textarea
                value={formData.schoolContext}
                onChange={(e) => setFormData({ ...formData, schoolContext: e.target.value })}
                rows={4}
                className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-serif focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y"
                placeholder="Specific student cases or school scenarios that led to this decision..."
              />
            </div>

            <BrutalInput
              label="Evidence URL (Optional)"
              placeholder="https://dashboard.example.com/data"
              value={formData.evidence_url}
              onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })}
              type="url"
            />

            <BrutalInput
              label="Author"
              placeholder="e.g., Dr. Smith"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />

            {/* Related Investigations Selector */}
            {!editingId && investigations.length > 0 && (
              <div className="border-4 border-cool-blue bg-cool-blue/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Microscope size={20} className="text-dark" />
                  <h3 className="text-lg font-bold text-dark">Link Related Investigations (Optional)</h3>
                </div>
                <p className="text-sm text-dark/70 mb-3">
                  Select investigations that informed this decision
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 bg-white border-2 border-dark p-3">
                  {investigations.map((inv) => (
                    <label
                      key={inv.id}
                      className="flex items-start gap-3 p-2 hover:bg-cool-blue/20 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInvestigationIds.includes(inv.id || '')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvestigationIds([...selectedInvestigationIds, inv.id || '']);
                          } else {
                            setSelectedInvestigationIds(selectedInvestigationIds.filter(id => id !== inv.id));
                          }
                        }}
                        className="mt-1 border-2 border-dark"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-dark text-sm">{inv.title}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-0.5 border border-dark bg-white text-xs font-medium">
                            {inv.researchType}
                          </span>
                          <span className="px-2 py-0.5 border border-dark bg-white text-xs font-medium">
                            {inv.mathematicalArea}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedInvestigationIds.length > 0 && (
                  <p className="text-sm text-dark font-bold mt-2">
                    ✓ {selectedInvestigationIds.length} investigation(s) selected
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <BrutalButton type="submit" variant="primary" disabled={loading}>
                <Save size={20} className="inline mr-2" />
                {loading ? 'Saving...' : editingId ? 'Update Log' : 'Create Log'}
              </BrutalButton>
              <BrutalButton type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </BrutalButton>
            </div>
          </form>
        </BrutalCard>
      )}

      {/* List of Logs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-dark">Existing Logs</h2>

        {logs.length === 0 ? (
          <BrutalCard>
            <p className="text-dark/60 text-center py-8">
              No decision logs yet. Create your first one above.
            </p>
          </BrutalCard>
        ) : (
          logs.map((log) => (
            <BrutalCard key={log.id} hoverable>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-dark">{log.title}</h3>
                    {(log.investigationCount ?? 0) > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 border-2 border-dark bg-cool-blue text-dark font-bold text-xs">
                        <Microscope size={14} />
                        {log.investigationCount}
                      </span>
                    )}
                    {(log.reportCount ?? 0) > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 border-2 border-dark bg-cool-blue text-dark font-bold text-xs">
                        <FileText size={14} />
                        {log.reportCount}
                      </span>
                    )}
                  </div>
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
                <div className="flex gap-2">
                  <button
                    onClick={() => log.id && handleViewDetails(log)}
                    className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                    title="View details and reports"
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    onClick={() => log.id && setShowLinkInvestigationModal(log.id)}
                    className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                    title="Link investigation"
                  >
                    <Microscope size={18} />
                  </button>
                  <button
                    onClick={() => log.id && setShowAttachModal(log.id)}
                    className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                    title="Attach report"
                  >
                    <LinkIcon size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(log)}
                    className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(log.id!)}
                    className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <p className="text-dark/80 font-serif mb-3 whitespace-pre-wrap">
                {log.rationale.length > 300
                  ? log.rationale.substring(0, 300) + '...'
                  : log.rationale}
              </p>

              <div className="flex items-center gap-4 text-sm text-dark/60">
                <span>By {log.author}</span>
                {log.evidence_url && (
                  <a
                    href={log.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cool-blue hover:underline font-medium"
                  >
                    View Evidence →
                  </a>
                )}
              </div>
            </BrutalCard>
          ))
        )}
      </div>
    </div>
  );
}
