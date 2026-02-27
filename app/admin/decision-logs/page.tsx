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
import { ScrollytellingReport, uploadHtmlFromString } from '@/lib/uploadHtmlReport';
import { DecisionLogDetail } from '@/components/ui/DecisionLogDetail';
import { Edit, Trash2, Plus, Save, X, FileText, Link as LinkIcon, Microscope, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [showRationalePreview, setShowRationalePreview] = useState(true); // Toggle between markdown preview and JSON
  const [isGeneratingScrolly, setIsGeneratingScrolly] = useState(false);
  const [scrollytellingHTML, setScrollytellingHTML] = useState<string | null>(null);

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


  const generateScrollytelling = async () => {
    if (!generatedJSON) {
      alert('No decision log to generate scrollytelling from');
      return;
    }

    setIsGeneratingScrolly(true);
    setAiError(null);

    try {
      const selectedInvestigations = investigations.filter(inv =>
        selectedInvestigationIds.includes(inv.id || '')
      );

      // Step 1: Generate HTML with Claude
      const response = await fetch('/api/generate-scrollytelling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decisionLog: generatedJSON,
          investigations: selectedInvestigations,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate scrollytelling');
      }

      const data = await response.json();

      // Step 2: Upload to Firestore as Draft (BEFORE showing UI message)
      const reportId = await uploadHtmlFromString(
        data.html,
        generatedJSON.title,
        generatedJSON.tags || [],
        'Draft', // Status
        null, // investigationId (not linked to investigation)
        null, // decisionLogId (will be linked after saving decision)
        `Auto-generated ScrollyTelling report from Decision Log: ${generatedJSON.title}`,
        'ScrollyTelling'
      );

      // Step 3: Store reportId in generatedJSON so it can be linked when saving
      setGeneratedJSON({
        ...generatedJSON,
        generatedScrollytellingId: reportId,
      });

      // Step 4: NOW set the HTML to show success message (AFTER Firestore save)
      setScrollytellingHTML(data.html);

      // Reset state BEFORE showing alert to avoid blocking
      setIsGeneratingScrolly(false);

      // Now show success message
      alert(`✅ ScrollyTelling HTML generated and saved!\n\nStatus: Draft (pending approval)\nTokens: Input ${data.usage.inputTokens.toLocaleString()} | Output ${data.usage.outputTokens.toLocaleString()}\n\nThe report has been saved to Firestore and will be linked to this decision when you save.\n\nGo to Scrollytelling Reports to view and approve.`);
    } catch (error: any) {
      console.error('❌ ScrollyTelling generation error:', error);
      console.error('Error stack:', error.stack);
      setAiError(error.message || 'Failed to generate scrollytelling');
      setIsGeneratingScrolly(false); // Reset state on error too
      alert(`❌ Error: ${error.message}`);
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

      // Remove linkedInvestigations and generatedScrollytellingId from data (not DecisionLog fields)
      const { linkedInvestigations, generatedScrollytellingId, aiGenerated, aiTokens, ...logData } = dataToSave;

      // Create decision log
      const logId = await createDecisionLog(logData);

      // Link investigations if any
      if (selectedInvestigationIds.length > 0) {
        for (const invId of selectedInvestigationIds) {
          await linkInvestigationToDecision(logId, invId);
        }
      }

      // Link scrollytelling report if generated
      if (generatedScrollytellingId) {
        // Update the scrollytelling report to link it to this decision
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const reportRef = doc(db, 'scrollytelling_reports', generatedScrollytellingId);
        await updateDoc(reportRef, {
          decisionLogId: logId,
        });
      }

      await loadLogs();
      resetWizard();

      let successMessage = `✅ Decision log saved successfully!`;
      if (selectedInvestigationIds.length > 0) {
        successMessage += `\nLinked to ${selectedInvestigationIds.length} investigation(s).`;
      }
      if (generatedScrollytellingId) {
        successMessage += `\n\n📊 ScrollyTelling report linked! Go to Scrollytelling Reports to approve and publish.`;
      }

      alert(successMessage);
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
    setScrollytellingHTML(null);
    setShowRationalePreview(true);
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

  const generateScrollytellingForEdit = async () => {
    if (!editingId) {
      alert('No decision log to generate scrollytelling from');
      return;
    }

    setIsGeneratingScrolly(true);
    setAiError(null);

    try {
      // Get linked investigations for this decision
      const linkedInvs = await getInvestigationsForDecision(editingId);

      // Build decision log object from form data
      const currentDecisionLog = {
        title: formData.title,
        taxonomy: formData.taxonomy,
        status: formData.status,
        rationale: formData.rationale,
        author: formData.author,
        evidence_url: formData.evidence_url,
        schoolContext: formData.schoolContext,
      };

      // Step 1: Generate HTML with Claude
      const response = await fetch('/api/generate-scrollytelling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decisionLog: currentDecisionLog,
          investigations: linkedInvs,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate scrollytelling');
      }

      const data = await response.json();
      console.log('✅ HTML generated, uploading to Firebase...');

      // Step 2: Upload HTML to Firebase as Draft
      const reportId = await uploadHtmlFromString(
        data.html,
        formData.title,
        [], // tags
        'Draft',
        null, // investigationId
        editingId, // decisionLogId - link to the current decision being edited
        `Auto-generated ScrollyTelling report from Decision Log`,
        'ScrollyTelling'
      );

      console.log('✅ Report uploaded, ID:', reportId);
      alert(`✨ ScrollyTelling report generated and saved as Draft!\nReport ID: ${reportId}\n\nInput: ${data.usage.inputTokens} tokens | Output: ${data.usage.outputTokens} tokens`);

      // Reload logs to show updated report count
      await loadLogs();
    } catch (error: any) {
      console.error('ScrollyTelling generation error:', error);
      setAiError(error.message || 'Failed to generate scrollytelling');
      alert(`Error generating ScrollyTelling: ${error.message}`);
    } finally {
      setIsGeneratingScrolly(false);
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
                <p className="text-sm text-dark font-bold">
                  🤖 AI Integration: Claude will create a natural, coherent narrative that weaves the decision and investigations together with smooth transitions.
                </p>
              </div>

              <div className="flex gap-3">
                <BrutalButton onClick={() => setWizardStep(1)} variant="secondary">
                  ← Back
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
                    <>🤖 Generate with AI →</>
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

              {/* Tabs: Preview / JSON / ScrollyTelling */}
              <div className="mb-4">
                <div className="flex gap-2 border-b-4 border-dark">
                  <button
                    onClick={() => setShowRationalePreview(true)}
                    className={`px-4 py-2 font-bold border-2 border-dark transition-colors ${
                      showRationalePreview
                        ? 'bg-cool-blue text-dark'
                        : 'bg-white text-dark hover:bg-bg-light'
                    }`}
                  >
                    <Eye size={16} className="inline mr-2" />
                    Preview
                  </button>
                  <button
                    onClick={() => setShowRationalePreview(false)}
                    className={`px-4 py-2 font-bold border-2 border-dark transition-colors ${
                      !showRationalePreview
                        ? 'bg-cool-blue text-dark'
                        : 'bg-white text-dark hover:bg-bg-light'
                    }`}
                  >
                    <FileText size={16} className="inline mr-2" />
                    JSON
                  </button>
                </div>

                {/* Preview Tab - Rendered Markdown */}
                {showRationalePreview && (
                  <div className="border-4 border-dark p-6 bg-white max-h-[600px] overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-dark mt-6 mb-3" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-xl font-bold text-dark mt-4 mb-2" {...props} />,
                          p: ({node, ...props}) => <p className="text-dark mb-3 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-3 text-dark" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-3 text-dark" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-dark" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-dark" {...props} />,
                          code: ({node, ...props}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" {...props} />,
                          hr: ({node, ...props}) => <hr className="my-6 border-t-2 border-dark" {...props} />,
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto mb-4">
                              <table className="w-full border-4 border-dark" {...props} />
                            </div>
                          ),
                          thead: ({node, ...props}) => <thead className="bg-cool-blue" {...props} />,
                          th: ({node, ...props}) => <th className="border-2 border-dark px-4 py-2 text-left font-bold" {...props} />,
                          td: ({node, ...props}) => <td className="border-2 border-dark px-4 py-2" {...props} />,
                        }}
                      >
                        {generatedJSON.rationale}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* JSON Tab - Editable */}
                {!showRationalePreview && (
                  <>
                    <div className="flex items-center justify-end p-2 bg-bg-light border-2 border-dark border-t-0">
                      {!isEditingJson ? (
                        <button
                          onClick={() => setIsEditingJson(true)}
                          className="px-3 py-1 border-2 border-dark bg-white hover:bg-cool-blue text-xs font-bold"
                        >
                          Edit JSON
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditingJson(false)}
                          className="px-3 py-1 border-2 border-dark bg-green-500 hover:bg-green-600 text-white text-xs font-bold"
                        >
                          Done Editing
                        </button>
                      )}
                    </div>
                    <textarea
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      readOnly={!isEditingJson}
                      rows={20}
                      className={`w-full border-4 border-dark border-t-0 bg-white px-4 py-3 text-dark font-mono text-xs focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y ${!isEditingJson ? 'bg-gray-50' : ''}`}
                    />
                    {isEditingJson && (
                      <div className="mt-2 p-2 bg-alert-orange/20 border-2 border-alert-orange text-xs">
                        ⚠️ Editing JSON manually. Make sure syntax is valid before saving.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mb-4 p-4 bg-purple-500/10 border-4 border-purple-500">
                <h4 className="font-bold text-dark mb-2">📊 Generate ScrollyTelling Report</h4>
                <p className="text-sm text-dark/70 mb-3">
                  Transform this decision into an executive-ready ScrollyTelling HTML report following MBB standards
                  (BLUF, SCQA, Minto Pyramid, Cognitive Load Optimization).
                </p>
                <div className="flex gap-2">
                  <BrutalButton
                    onClick={generateScrollytelling}
                    variant="secondary"
                    disabled={isGeneratingScrolly}
                    className="flex-1"
                  >
                    {isGeneratingScrolly ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⚙️</span>
                        Generating & Uploading ScrollyTelling...
                      </>
                    ) : scrollytellingHTML ? (
                      <>🔄 Regenerate ScrollyTelling</>
                    ) : (
                      <>📊 Generate ScrollyTelling HTML</>
                    )}
                  </BrutalButton>
                  {isGeneratingScrolly && (
                    <BrutalButton
                      onClick={() => {
                        setIsGeneratingScrolly(false);
                        setScrollytellingHTML(null);
                        alert('✅ Reset complete. You can try again.');
                      }}
                      variant="secondary"
                      className="bg-alert-orange border-alert-orange"
                    >
                      ❌ Reset
                    </BrutalButton>
                  )}
                </div>
                {scrollytellingHTML && generatedJSON.generatedScrollytellingId && (
                  <div className="mt-3 p-3 bg-green-500/20 border-2 border-green-500">
                    <p className="text-sm font-bold text-dark">✅ ScrollyTelling Report Saved!</p>
                    <p className="text-xs text-dark/70 mt-1">
                      Status: <strong>Draft</strong> (pending approval)
                    </p>
                    <p className="text-xs text-dark/70 mt-1">
                      Report ID: <span className="font-mono text-xs">{generatedJSON.generatedScrollytellingId}</span>
                    </p>
                    <p className="text-xs text-dark/70 mt-1">
                      The report will be linked to this decision when you save.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          const newWindow = window.open('', '_blank');
                          if (newWindow) {
                            newWindow.document.write(scrollytellingHTML);
                            newWindow.document.close();
                          }
                        }}
                        className="px-3 py-1 border-2 border-dark bg-white hover:bg-cool-blue text-xs font-bold transition-colors"
                      >
                        👁️ Preview Report
                      </button>
                      <a
                        href="/admin/scrollytelling"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 border-2 border-dark bg-cool-blue hover:bg-white text-xs font-bold transition-colors"
                      >
                        Go to Reports List →
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {isGeneratingScrolly && (
                <div className="mb-4 p-3 bg-alert-orange/20 border-2 border-alert-orange">
                  <p className="text-sm font-bold text-dark">⚠️ ScrollyTelling Generation in Progress</p>
                  <p className="text-xs text-dark/70 mt-1">
                    Please wait until the ScrollyTelling generation completes before saving.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <BrutalButton onClick={() => setWizardStep(2)} variant="secondary" disabled={isGeneratingScrolly}>
                  ← Back
                </BrutalButton>
                <BrutalButton
                  onClick={saveFromGeneratedJSON}
                  variant="primary"
                  disabled={loading || isGeneratingScrolly}
                >
                  <Save size={20} className="inline mr-2" />
                  {loading ? 'Saving...' : isGeneratingScrolly ? 'Wait for generation...' : 'Save Decision Log'}
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
              <BrutalButton type="submit" variant="primary" disabled={loading || isGeneratingScrolly}>
                <Save size={20} className="inline mr-2" />
                {loading ? 'Saving...' : editingId ? 'Update Log' : 'Create Log'}
              </BrutalButton>
              {editingId && (
                <BrutalButton
                  type="button"
                  variant="primary"
                  onClick={generateScrollytellingForEdit}
                  disabled={loading || isGeneratingScrolly}
                  className="bg-purple-600 border-purple-600"
                >
                  {isGeneratingScrolly ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⚙️</span>
                      Generating ScrollyTelling...
                    </>
                  ) : (
                    <>
                      ✨ Generate ScrollyTelling
                    </>
                  )}
                </BrutalButton>
              )}
              <BrutalButton type="button" variant="secondary" onClick={resetForm} disabled={isGeneratingScrolly}>
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
