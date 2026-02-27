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

  // Parser state - Multi-step wizard
  const [showTextParser, setShowTextParser] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: paste, 2: select investigations, 3: preview JSON
  const [rawDocText, setRawDocText] = useState('');
  const [selectedInvestigationIds, setSelectedInvestigationIds] = useState<string[]>([]);
  const [generatedJSON, setGeneratedJSON] = useState<any>(null);
  const [jsonText, setJsonText] = useState('');
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  // Parser functions - improved to handle long content
  const extractSection = (text: string, keywords: string[]): string => {
    const keywordPattern = keywords.join('|');

    // Try to find section with header
    const headerRegex = new RegExp(
      `(?:^|\\n)\\s*#{1,6}\\s*(${keywordPattern})\\s*\\n([\\s\\S]*?)(?=\\n#{1,6}\\s|$)`,
      'im'
    );
    const headerMatch = text.match(headerRegex);
    if (headerMatch && headerMatch[2]) {
      return headerMatch[2].trim();
    }

    // Try without header requirement - just keyword with colon
    const colonRegex = new RegExp(
      `(?:^|\\n)\\s*(?:${keywordPattern})[:\\s]*\\n([\\s\\S]*?)(?=\\n(?:Purpose|Context|Decision|Rationale|Evidence|Methodology|Key Findings|Summary|Who|Focus|Domain|Technical|Insights|SpikyPOVs)[:\\s]|\\n#{1,6}\\s|$)`,
      'im'
    );
    const colonMatch = text.match(colonRegex);
    if (colonMatch && colonMatch[1]) {
      return colonMatch[1].trim();
    }

    // Last resort: inline format
    const inlineRegex = new RegExp(`(?:${keywordPattern})[:\\s]+([^\\n]+)`, 'im');
    const inlineMatch = text.match(inlineRegex);
    return inlineMatch ? inlineMatch[1].trim() : '';
  };

  const parseDocumentationText = () => {
    if (!rawDocText.trim()) {
      alert('Please paste documentation text first');
      return;
    }

    // Move to step 2: select investigations
    setWizardStep(2);
  };

  const generateWithAI = async () => {
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      // Get selected investigations full data
      const selectedInvestigations = investigations.filter(inv =>
        selectedInvestigationIds.includes(inv.id || '')
      );

      // Call the API route
      const response = await fetch('/api/integrate-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decisionText: rawDocText,
          investigations: selectedInvestigations,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate integrated content');
      }

      const data = await response.json();

      // Extract title from original text
      const lines = rawDocText.split('\n').filter(line => line.trim());
      const titleLine = lines.find(l => l.startsWith('#')) || lines[0];
      const title = titleLine.replace(/^#+\s*/, '').trim();

      // Detect taxonomy and status
      let taxonomy: DecisionLog['taxonomy'] = 'Pedagogical Adjustment';
      const lowerText = rawDocText.toLowerCase();
      if (lowerText.includes('refut') || lowerText.includes('experiment')) {
        taxonomy = 'Experimental Refutation';
      } else if (lowerText.includes('new model') || lowerText.includes('didactic model') || lowerText.includes('nuevo modelo')) {
        taxonomy = 'New Didactic Model';
      }

      let status: DecisionLog['status'] = 'Under Debate';
      if (lowerText.includes('validated') || lowerText.includes('validado') || lowerText.includes('empirically')) {
        status = 'Empirically Validated';
      } else if (lowerText.includes('refuted') || lowerText.includes('refutado')) {
        status = 'Refuted';
      }

      const authorMatch = rawDocText.match(/(?:author|autor|by|created by)[:\s]+([^\n]+)/i);
      const author = authorMatch ? authorMatch[1].trim() : 'Sebastian Sarmiento';

      const schoolMatch = rawDocText.match(/(?:school|escuela|hub|sede)[:\s]+([^\n]+)/i);
      const schoolContext = schoolMatch ? schoolMatch[1].trim() : '';

      // Generate final JSON with AI-integrated content
      const generatedData = {
        title: title || 'Untitled Decision',
        taxonomy,
        status,
        rationale: data.integratedText,
        evidence_url: '',
        author,
        schoolContext,
        linkedInvestigations: selectedInvestigationIds,
        aiGenerated: true,
        aiTokens: data.usage,
      };

      setGeneratedJSON(generatedData);
      setJsonText(JSON.stringify(generatedData, null, 2));
      setWizardStep(3);
    } catch (error: any) {
      console.error('AI Generation error:', error);
      setAiError(error.message || 'Failed to generate AI-integrated content');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateIntegratedJSON = async () => {
    try {
      const lines = rawDocText.split('\n').filter(line => line.trim());

      // Extract title (first line or line with #)
      const titleLine = lines.find(l => l.startsWith('#')) || lines[0];
      const title = titleLine.replace(/^#+\s*/, '').trim();

      // Remove title from rawDocText to avoid duplication
      const contentWithoutTitle = rawDocText.replace(titleLine, '').trim();

      // For complex/long documents, use full content without parsing
      const isComplexDocument = rawDocText.length > 2000 ||
                                rawDocText.includes('Knowledge Tree') ||
                                rawDocText.includes('Strategic Meta-Analysis') ||
                                rawDocText.includes('SpikyPOVs') ||
                                rawDocText.includes('Experts');

      let fullRationale = '';

      if (isComplexDocument) {
        // Use full document as-is (without title since it's in the title field)
        fullRationale = contentWithoutTitle;
      } else {
        // Try to parse structured sections for simpler documents
        const purpose = extractSection(rawDocText, ['purpose', 'propósito', 'objective', 'objetivo']);
        const context = extractSection(rawDocText, ['context', 'contexto', 'background', 'antecedentes']);
        const decision = extractSection(rawDocText, ['decision', 'decisión', 'approach', 'solution']);
        const rationale = extractSection(rawDocText, ['rationale', 'justification', 'justificación', 'why', 'por qué']);
        const evidence = extractSection(rawDocText, ['evidence', 'evidencia', 'data', 'results', 'findings']);

        // Check if we have structured content
        const hasStructuredContent = purpose || context || decision || rationale || evidence;

        if (hasStructuredContent) {
          // Use structured format
          if (purpose) fullRationale += `## Purpose\n${purpose}\n\n`;
          if (context) fullRationale += `## Context\n${context}\n\n`;
          if (decision) fullRationale += `## Decision\n${decision}\n\n`;
          if (rationale) fullRationale += `## Rationale\n${rationale}\n\n`;
          if (evidence) fullRationale += `## Evidence\n${evidence}\n\n`;
        } else {
          // No structured content found - use full document
          fullRationale = contentWithoutTitle;
        }
      }

      // INTEGRATE INVESTIGATIONS
      if (selectedInvestigationIds.length > 0) {
        const selectedInvestigations = investigations.filter(inv =>
          selectedInvestigationIds.includes(inv.id || '')
        );

        fullRationale += `\n\n---\n\n## Related Research\n\n`;
        fullRationale += `This decision is informed by ${selectedInvestigations.length} research investigation(s):\n\n`;

        selectedInvestigations.forEach((inv, idx) => {
          fullRationale += `### ${idx + 1}. ${inv.title}\n\n`;
          fullRationale += `**Type:** ${inv.researchType} | **Area:** ${inv.mathematicalArea} | **Status:** ${inv.status}\n\n`;

          if (inv.description) {
            fullRationale += `**Summary:** ${inv.description}\n\n`;
          }

          if (inv.keyFindings) {
            fullRationale += `**Key Findings:**\n${inv.keyFindings}\n\n`;
          }

          if (inv.impactMetrics) {
            fullRationale += `**Impact:** ${inv.impactMetrics}\n\n`;
          }

          if (inv.methodology) {
            fullRationale += `**Methodology:** ${inv.methodology}\n\n`;
          }

          fullRationale += `---\n\n`;
        });
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

      // Generate final JSON
      const generatedData = {
        title: title || 'Untitled Decision',
        taxonomy,
        status,
        rationale: fullRationale.trim(),
        evidence_url: '',
        author,
        schoolContext,
        linkedInvestigations: selectedInvestigationIds,
      };

      setGeneratedJSON(generatedData);
      setJsonText(JSON.stringify(generatedData, null, 2));
      setWizardStep(3);
    } catch (error) {
      console.error('Parse error:', error);
      alert('Error generating integrated JSON. Please check the format and try again.');
    }
  };

  const saveFromGeneratedJSON = async () => {
    if (!generatedJSON) {
      alert('No JSON to save');
      return;
    }

    setLoading(true);
    try {
      // Update JSON if user edited it
      let dataToSave = generatedJSON;
      if (isEditingJson) {
        try {
          dataToSave = JSON.parse(jsonText);
        } catch (e) {
          alert('Invalid JSON. Please fix syntax errors.');
          setLoading(false);
          return;
        }
      }

      // Remove linkedInvestigations from data (not a DecisionLog field)
      const { linkedInvestigations, ...logData } = dataToSave;

      // Create decision log
      const logId = await createDecisionLog(logData);

      // Link investigations if any
      if (selectedInvestigationIds.length > 0) {
        for (const invId of selectedInvestigationIds) {
          await linkInvestigationToDecision(logId, invId);
        }
      }

      await loadLogs();
      resetWizard();
      alert(`✅ Decision log saved successfully!${selectedInvestigationIds.length > 0 ? ` Linked to ${selectedInvestigationIds.length} investigation(s).` : ''}`);
    } catch (error) {
      console.error('Failed to save log:', error);
      alert('Failed to save. Make sure Firebase is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setShowTextParser(false);
    setWizardStep(1);
    setRawDocText('');
    setSelectedInvestigationIds([]);
    setGeneratedJSON(null);
    setJsonText('');
    setIsEditingJson(false);
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
              if (showTextParser) {
                resetWizard();
              } else {
                setShowTextParser(true);
                setWizardStep(1);
                setShowForm(false);
              }
            }}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <FileText size={20} />
            {showTextParser ? 'Close Wizard' : 'Generate from Documentation'}
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

      {/* Multi-Step Wizard */}
      {showTextParser && (
        <BrutalCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-dark">Generate Decision Log - Smart Integration</h2>
              <p className="text-sm text-dark/70 mt-1">
                Step {wizardStep} of 3: {
                  wizardStep === 1 ? 'Paste Documentation' :
                  wizardStep === 2 ? 'Link Investigations' :
                  'Review & Save'
                }
              </p>
            </div>
            <button
              onClick={resetWizard}
              className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-6">
            <div className={`flex-1 h-2 border-2 border-dark ${wizardStep >= 1 ? 'bg-cool-blue' : 'bg-white'}`} />
            <div className={`flex-1 h-2 border-2 border-dark ${wizardStep >= 2 ? 'bg-cool-blue' : 'bg-white'}`} />
            <div className={`flex-1 h-2 border-2 border-dark ${wizardStep >= 3 ? 'bg-cool-blue' : 'bg-white'}`} />
          </div>

          {/* STEP 1: Paste Documentation */}
          {wizardStep === 1 && (
            <>
              <div className="mb-4">
                <h3 className="font-bold text-dark mb-2">📄 Paste Your Documentation</h3>
                <p className="text-sm text-dark/70">
                  Include purpose, context, decision, rationale, and evidence
                </p>
              </div>
              <textarea
                value={rawDocText}
                onChange={(e) => setRawDocText(e.target.value)}
                placeholder={`Paste your documentation here. Example:

# Alpha Desmos SAT Training Platform

## Purpose
Enable students to master progressive training units through an interactive, split-screen interface.

## Context
Students lack practical training for Digital SAT Math Desmos calculator skills...

## Decision
Created a comprehensive training platform with Unit A (Regression) and Unit B (Visual Problem Solving)...

## Rationale
Speed is critical. Platform enforces "Platinum" tier requiring <6 minutes...

## Evidence
Students showed 2.3x faster progression when mastering vertex form first...`}
                rows={14}
                className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-mono text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y mb-4"
              />
              <div className="flex gap-3">
                <BrutalButton
                  onClick={parseDocumentationText}
                  variant="primary"
                  disabled={!rawDocText.trim()}
                >
                  Next: Link Investigations →
                </BrutalButton>
                <BrutalButton onClick={() => setRawDocText('')} variant="secondary">
                  Clear
                </BrutalButton>
              </div>
            </>
          )}

          {/* STEP 2: Select Investigations */}
          {wizardStep === 2 && (
            <>
              <div className="mb-4">
                <h3 className="font-bold text-dark mb-2">🔬 Link Related Investigations (Optional)</h3>
                <p className="text-sm text-dark/70">
                  Select investigations that informed this decision. Their content will be integrated into the final document.
                </p>
              </div>
              {investigations.length === 0 ? (
                <div className="text-center py-8 text-dark/60">
                  No investigations available. You can skip this step.
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border-4 border-dark bg-white p-4 mb-4">
                  {investigations.map((inv) => (
                    <label
                      key={inv.id}
                      className="flex items-start gap-3 p-3 mb-2 border-2 border-dark bg-bg-light hover:bg-cool-blue/20 transition-colors cursor-pointer"
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
                        className="mt-1 w-5 h-5 border-2 border-dark"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-dark">{inv.title}</p>
                        <p className="text-sm text-dark/70 mt-1 line-clamp-2">{inv.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-1 border-2 border-dark bg-white text-xs font-bold">
                            {inv.researchType}
                          </span>
                          <span className="px-2 py-1 border-2 border-dark bg-white text-xs font-bold">
                            {inv.mathematicalArea}
                          </span>
                          <span className="px-2 py-1 border-2 border-dark bg-white text-xs font-bold">
                            {inv.status}
                          </span>
                        </div>
                        {inv.impactMetrics && (
                          <p className="text-xs text-dark/60 mt-1">📈 {inv.impactMetrics}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedInvestigationIds.length > 0 && (
                <div className="mb-4 p-3 bg-cool-blue/20 border-2 border-cool-blue">
                  <p className="text-sm font-bold text-dark">
                    ✓ {selectedInvestigationIds.length} investigation(s) selected - their content will be integrated into the decision log
                  </p>
                </div>
              )}

              {aiError && (
                <div className="mb-4 p-3 bg-alert-orange/20 border-2 border-alert-orange">
                  <p className="text-sm font-bold text-dark">⚠️ AI Error: {aiError}</p>
                  <p className="text-xs text-dark/70 mt-1">
                    Make sure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) are configured in your .env.local file
                  </p>
                </div>
              )}

              <div className="mb-4 p-4 bg-purple-500/10 border-4 border-purple-500">
                <h4 className="font-bold text-dark mb-2">🤖 Choose Integration Method:</h4>
                <div className="space-y-2 text-sm text-dark/80">
                  <p>
                    <strong>AI Integration (Recommended):</strong> Claude will create a natural, coherent narrative
                    that weaves the decision and investigations together with smooth transitions.
                  </p>
                  <p>
                    <strong>Simple Concatenation:</strong> Faster, appends investigation content at the end without AI processing.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <BrutalButton onClick={() => setWizardStep(1)} variant="secondary">
                  ← Back
                </BrutalButton>
                <BrutalButton
                  onClick={generateIntegratedJSON}
                  variant="secondary"
                  disabled={isGeneratingAI}
                >
                  Simple Integration →
                </BrutalButton>
                <BrutalButton
                  onClick={generateWithAI}
                  variant="primary"
                  disabled={isGeneratingAI}
                  className="relative"
                >
                  {isGeneratingAI ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⚙️</span>
                      AI Generating...
                    </>
                  ) : (
                    <>🤖 AI Integration →</>
                  )}
                </BrutalButton>
              </div>
            </>
          )}

          {/* STEP 3: Preview & Save */}
          {wizardStep === 3 && generatedJSON && (
            <>
              <div className="mb-4">
                <h3 className="font-bold text-dark mb-2">
                  ✨ Generated Decision Log {generatedJSON.aiGenerated && <span className="text-purple-600">(AI-Integrated)</span>}
                </h3>
                <p className="text-sm text-dark/70">
                  Review the generated JSON. The rationale includes {generatedJSON.aiGenerated ? 'naturally integrated' : 'concatenated'} content from {selectedInvestigationIds.length} investigation(s).
                </p>
              </div>

              {generatedJSON.aiGenerated && generatedJSON.aiTokens && (
                <div className="mb-4 p-3 bg-purple-500/10 border-2 border-purple-500">
                  <p className="text-xs font-bold text-dark">
                    🤖 AI Integration Complete | Input: {generatedJSON.aiTokens.inputTokens.toLocaleString()} tokens | Output: {generatedJSON.aiTokens.outputTokens.toLocaleString()} tokens
                  </p>
                </div>
              )}

              <div className="mb-4 p-3 bg-cool-blue/10 border-2 border-cool-blue">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-dark">
                    📋 Title: {generatedJSON.title}
                  </p>
                  {!isEditingJson && (
                    <button
                      onClick={() => setIsEditingJson(true)}
                      className="px-3 py-1 border-2 border-dark bg-white hover:bg-cool-blue text-xs font-bold"
                    >
                      Edit JSON
                    </button>
                  )}
                </div>
                <p className="text-xs text-dark/70 mt-1">
                  Type: {generatedJSON.taxonomy} | Status: {generatedJSON.status}
                </p>
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                readOnly={!isEditingJson}
                rows={20}
                className={`w-full border-4 border-dark bg-white px-4 py-3 text-dark font-mono text-xs focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y mb-4 ${!isEditingJson ? 'bg-gray-50' : ''}`}
              />

              {isEditingJson && (
                <div className="mb-4 p-2 bg-alert-orange/20 border-2 border-alert-orange text-xs">
                  ⚠️ Editing JSON manually. Make sure syntax is valid before saving.
                </div>
              )}

              <div className="flex gap-3">
                <BrutalButton onClick={() => setWizardStep(2)} variant="secondary">
                  ← Back
                </BrutalButton>
                <BrutalButton
                  onClick={saveFromGeneratedJSON}
                  variant="primary"
                  disabled={loading}
                >
                  <Save size={20} className="inline mr-2" />
                  {loading ? 'Saving...' : 'Save Decision Log'}
                </BrutalButton>
              </div>
            </>
          )}
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
