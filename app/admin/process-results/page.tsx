'use client';

import { useState, useEffect } from 'react';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { Sparkles, Save, Wand2, ClipboardList, Eye, ArrowRight, Microscope, Database, Package, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createInvestigation, ResearchType, MathematicalArea } from '@/lib/investigations';
import { Timestamp } from 'firebase/firestore';
import { WorkflowManager } from '@/lib/workflow-context';
import {
  createResearchCollection,
  addTopicToCollection,
  getAllResearchCollections,
  updateTopicInCollection,
  ResearchCollection
} from '@/lib/researchCollections';
import { getMostRecentRawResult } from '@/lib/rawResults';
import { authenticatedFetch } from '@/lib/api-client';
import { sanitizeResearchResults } from '@/lib/sanitize';
import { useToast } from '@/contexts/ToastContext';
import { WorkflowBreadcrumb } from '@/components/WorkflowBreadcrumb';
import { extractPapersAndCitations } from '@/lib/citation-extractor';
import { BatchQueueManager } from '@/lib/batch-queue';
import { AddToBatchModal } from '@/components/AddToBatchModal';
import {
  validateBeforeProcessing,
  checkCache,
  cacheResult,
  estimateTokenUsage,
} from '@/lib/api-optimization';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProcessResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEngine, setActiveEngine] = useState<'gemini' | 'perplexity' | 'both'>('both');
  const [geminiResults, setGeminiResults] = useState('');
  const [perplexityResults, setPerplexityResults] = useState('');
  const [resultsText, setResultsText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddToBatchModal, setShowAddToBatchModal] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [currentBatchItemId, setCurrentBatchItemId] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<{
    suggestedTitle: string;
    suggestedMathArea: string;
    description: string;
    keyFindings: string;
    methodology: string;
    impactMetrics: string;
    citations: Array<{ title: string; url: string; authors?: string }>;
  } | null>(null);
  const [savedInvestigationId, setSavedInvestigationId] = useState<string | null>(null);
  const [savedInvestigationTitle, setSavedInvestigationTitle] = useState<string>('');
  const [savedKeyFindings, setSavedKeyFindings] = useState<string>('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [investigationData, setInvestigationData] = useState({
    title: '',
    researchType: 'Systematic Literature Review' as ResearchType,
    mathematicalArea: 'Algebra' as MathematicalArea,
    author: user?.displayName || user?.email || '',
  });

  // Collections association
  const [collections, setCollections] = useState<ResearchCollection[]>([]);
  const [associationType, setAssociationType] = useState<'new' | 'existing'>('new');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [autoLoadedResults, setAutoLoadedResults] = useState(false);

  // Check for clipboard-detected results on mount
  useEffect(() => {
    const pendingResults = localStorage.getItem('pending-research-results');
    if (pendingResults) {
      setResultsText(pendingResults);
      localStorage.removeItem('pending-research-results');
      setAutoLoadedResults(true);
      toast.showSuccess('✨ Clipboard results auto-loaded! Ready to process.', 5000);
    }
  }, [toast]);

  // Check for batch mode
  useEffect(() => {
    const isBatchMode = searchParams?.get('batch') === 'true';
    if (isBatchMode) {
      const batchItemJson = localStorage.getItem('batch-current-item');
      if (batchItemJson) {
        try {
          const batchItem = JSON.parse(batchItemJson);
          setResultsText(batchItem.resultsText);
          setSearchQuery(batchItem.searchQuery);
          setActiveEngine(batchItem.engine);
          setBatchMode(true);
          setCurrentBatchItemId(batchItem.id);
          setAutoLoadedResults(true);
          toast.showInfo(`📦 Batch Mode: Processing "${batchItem.title}"`, 5000);
        } catch (error) {
          console.error('Failed to load batch item:', error);
        }
      }
    }
  }, [searchParams, toast]);

  // Load most recent raw results on mount (only if clipboard didn't provide any)
  useEffect(() => {
    if (autoLoadedResults) return; // Skip if already loaded from clipboard

    const loadRecentRawResults = async () => {
      try {
        const recentResult = await getMostRecentRawResult();
        if (recentResult) {
          // Separate Gemini and Perplexity results into their own fields
          if (recentResult.geminiResults) {
            // ✅ SECURITY: Sanitize results from database
            setGeminiResults(sanitizeResearchResults(recentResult.geminiResults));
          }

          if (recentResult.perplexityResults) {
            // ✅ SECURITY: Sanitize results from database
            setPerplexityResults(sanitizeResearchResults(recentResult.perplexityResults));
          }

          // DO NOT auto-fill searchQuery - leave it empty for user to enter
          // setSearchQuery(recentResult.searchQuery); // REMOVED

          // Determine which engine was used
          if (recentResult.geminiResults && recentResult.perplexityResults) {
            setActiveEngine('both');
          } else if (recentResult.geminiResults) {
            setActiveEngine('gemini');
          } else if (recentResult.perplexityResults) {
            setActiveEngine('perplexity');
          }

          setAutoLoadedResults(true);
        }
      } catch (error) {
        console.error('Error loading recent raw results:', error);
      }
    };

    if (user) {
      loadRecentRawResults();
    }
  }, [user]);

  // Load collections on mount
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const data = await getAllResearchCollections();
        setCollections(data);
      } catch (error) {
        console.error('Error loading collections:', error);
      }
    };

    if (user) {
      loadCollections();
    }
  }, [user]);

  const processWithClaude = async () => {
    // Combine Gemini and Perplexity results
    let combinedResults = '';
    if (geminiResults.trim()) {
      combinedResults += '=== GEMINI RESULTS ===\n\n' + geminiResults.trim() + '\n\n';
    }
    if (perplexityResults.trim()) {
      combinedResults += '=== PERPLEXITY RESULTS ===\n\n' + perplexityResults.trim();
    }

    if (!combinedResults.trim()) {
      toast.showError('Please paste results from at least one engine (Gemini or Perplexity).');
      return;
    }

    // Store combined results for later use
    setResultsText(combinedResults);

    // ✅ OPTIMIZATION: Validate input before sending to API
    const validation = validateBeforeProcessing(combinedResults);
    if (!validation.valid) {
      toast.showWarning(`${validation.reason}: ${validation.suggestion}`);
      return;
    }

    // ✅ OPTIMIZATION: Show token estimate
    const tokenEstimate = estimateTokenUsage(combinedResults);
    if (tokenEstimate.warning) {
      toast.showWarning(tokenEstimate.warning);
    } else {
      toast.showInfo(`Processing ~${tokenEstimate.estimatedTokens.toLocaleString()} tokens (Est. $${tokenEstimate.estimatedCost})`);
    }

    // ✅ OPTIMIZATION: Check cache for recent identical requests
    const cachedData = checkCache(combinedResults, searchQuery);
    if (cachedData) {
      setProcessedData(cachedData);
      setInvestigationData(prev => ({
        ...prev,
        title: cachedData.suggestedTitle || prev.title,
        mathematicalArea: (cachedData.suggestedMathArea as MathematicalArea) || prev.mathematicalArea,
      }));
      toast.showSuccess('✅ Results loaded from cache (saved API call)');
      return;
    }

    setProcessing(true);
    try {
      // ✅ SECURITY: Use authenticated fetch
      const response = await authenticatedFetch('/api/process-research-results', {
        method: 'POST',
        body: JSON.stringify({
          resultsText: combinedResults,
          searchQuery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process results');
      }

      setProcessedData(data.processed);

      // ✅ OPTIMIZATION: Cache the result
      cacheResult(resultsText, searchQuery, data.processed);

      // Auto-fill title and math area from Claude suggestions
      setInvestigationData(prev => ({
        ...prev,
        title: data.processed.suggestedTitle || prev.title,
        mathematicalArea: (data.processed.suggestedMathArea as MathematicalArea) || prev.mathematicalArea,
      }));

      toast.showSuccess('✅ Results processed successfully! Title and area auto-filled.');
    } catch (error: any) {
      console.error('Error processing with Claude:', error);
      toast.showError(error.message || 'Failed to process results with Claude. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Smart citation extraction is now handled by lib/citation-extractor.ts

  const extractKeyFindings = (text: string) => {
    const sections = [
      'key findings',
      'main findings',
      'conclusions',
      'summary',
      'highlights',
    ];

    for (const section of sections) {
      const regex = new RegExp(`${section}[:\\s]+([^#]+?)(?=\\n#{1,2}|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[1].trim();
      }
    }
    return text.substring(0, 500) + '...';
  };

  const saveInvestigation = async () => {
    if (!user) {
      toast.showError('You need to sign in to create investigations.');
      return;
    }

    if (!resultsText.trim()) {
      toast.showError('Please paste the research results first.');
      return;
    }

    if (!investigationData.title.trim()) {
      toast.showError('Please enter an investigation title.');
      return;
    }

    try {
      setSaving(true);

      let keyFindings, methodology, impactMetrics, citations, sourceCount;

      if (processedData) {
        // Use Claude-processed data
        keyFindings = processedData.keyFindings;
        methodology = processedData.methodology;
        impactMetrics = processedData.impactMetrics;
        citations = processedData.citations;
        sourceCount = processedData.citations.length;
      } else {
        // Use smart extraction for papers and citations
        const extracted = extractPapersAndCitations(resultsText);
        citations = extracted.citations;
        sourceCount = extracted.paperCount; // Now accurately reflects unique papers
        keyFindings = extractKeyFindings(resultsText);
        const engineText = activeEngine === 'gemini'
          ? 'Gemini Deep Research'
          : activeEngine === 'perplexity'
          ? 'Perplexity AI'
          : 'Gemini Deep Research and Perplexity AI (combined analysis)';
        methodology = `Research conducted using ${engineText}.${searchQuery ? `\n\nOriginal Query: "${searchQuery}"` : ''}\n\nFull results captured in key findings section.`;
        impactMetrics = `${sourceCount} sources analyzed`;
      }

      // Use Claude-generated description if available, otherwise create a basic one
      const description = processedData?.description ||
                         `Systematic literature review on ${investigationData.title}. ${keyFindings.substring(0, 200)}...`;

      const investigationId = await createInvestigation({
        title: investigationData.title,
        description: description,
        researchType: investigationData.researchType,
        mathematicalArea: investigationData.mathematicalArea,
        status: 'Completed',
        keyFindings: keyFindings,
        methodology: methodology,
        impactMetrics: impactMetrics,
        author: investigationData.author,
        startDate: Timestamp.now(),
        completionDate: Timestamp.now(),
        searchKeywords: searchQuery ? searchQuery.split(/[,\s]+/).filter(k => k.trim()) : investigationData.title.split(/[,\s]+/).filter(k => k.trim()).slice(0, 5),
        databases: ['Google Scholar', 'ERIC', 'ResearchGate', 'Semantic Scholar', 'Academic Sources'],
        paperCount: sourceCount,
        citationLinks: citations.length > 0
          ? citations.filter(c => c.url).map(c => ({
              title: c.title,
              url: c.url!,
              authors: c.authors
            }))
          : undefined,
      });

      // Save to workflow context for auto-navigation
      WorkflowManager.setLastInvestigation(investigationId, investigationData.title);

      // If associating to existing topic, update it
      if (associationType === 'existing' && selectedCollectionId && selectedTopicId) {
        console.log('Updating topic to completed:', {
          collectionId: selectedCollectionId,
          topicId: selectedTopicId,
          investigationId: investigationId,
        });

        await updateTopicInCollection(selectedCollectionId, selectedTopicId, {
          linkedInvestigationId: investigationId,
          linkedInvestigationTitle: investigationData.title,
          status: 'completed', // Mark as completed when investigation is linked
          completedAt: Timestamp.now(),
        } as any);

        console.log('Topic updated successfully to completed');

        // Wait a moment to ensure Firestore update is complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Navigate to collections tab
        router.push('/admin/research?tab=collections');

        // Show success message after navigation
        setTimeout(() => {
          toast.showSuccess('Investigation saved and linked to topic! Topic marked as completed.');
        }, 100);
      } else {
        // Save investigation details for success modal (before resetting)
        setSavedInvestigationId(investigationId);
        setSavedInvestigationTitle(investigationData.title);
        setSavedKeyFindings(keyFindings); // Save keyFindings before reset
        toast.showSuccess(`✅ Investigation saved: "${investigationData.title}"`, 2500);
      }

      // Reset form
      setResultsText('');
      setSearchQuery('');
      setProcessedData(null);
      setInvestigationData({
        title: '',
        researchType: 'Systematic Literature Review',
        mathematicalArea: 'Algebra',
        author: user?.displayName || user?.email || '',
      });
      setAssociationType('new');
      setSelectedCollectionId('');
      setSelectedTopicId('');
    } catch (error) {
      console.error('Error creating investigation:', error);
      toast.showError('Failed to create investigation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setGeminiResults('');
    setPerplexityResults('');
    setResultsText('');
    setSearchQuery('');
    setProcessedData(null);
    setInvestigationData({
      title: '',
      researchType: 'Systematic Literature Review',
      mathematicalArea: 'Algebra',
      author: user?.displayName || user?.email || '',
    });
    setActiveEngine('both');
    toast.showInfo('All fields reset. Starting fresh!');
  };

  const extractTopicsFromKeyFindings = (keyFindings: string | any): string[] => {
    const topics: string[] = [];

    // Convert to string if it's an array (legacy data format)
    let keyFindingsStr: string;
    if (Array.isArray(keyFindings)) {
      console.log('Converting keyFindings from array to string');
      keyFindingsStr = keyFindings.join('\n');
    } else if (typeof keyFindings === 'string') {
      keyFindingsStr = keyFindings;
    } else {
      console.error('keyFindings is not a valid string or array:', keyFindings);
      return [];
    }

    if (!keyFindingsStr) {
      return [];
    }

    const lines = keyFindingsStr.split('\n');

    for (const line of lines) {
      const match = line.match(/^[•\-\*]\s*(?:\[[\w\s]+\])?\s*(.+?)(?::|$)/);
      if (match) {
        let topic = match[1].trim();
        topic = topic.replace(/^\[[\w\s]+\]\s*/, '');
        if (topic.length > 100) {
          topic = topic.substring(0, 97) + '...';
        }
        if (topic) {
          topics.push(topic);
        }
      }
    }

    return topics.slice(0, 10);
  };


  return (
    <div>
      {/* Workflow Breadcrumb */}
      <WorkflowBreadcrumb />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-dark mb-2 flex items-center gap-3">
            <Wand2 size={36} className="text-alert-orange" />
            Process Research Results
          </h1>
          <p className="text-dark/70">
            Paste results from Gemini or Perplexity and convert them into structured Research Investigations
          </p>
        </div>
        {(resultsText || processedData) && (
          <button
            onClick={resetAll}
            className="px-6 py-3 border-4 border-dark bg-white text-dark font-bold hover:bg-alert-orange/20 hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all"
          >
            🔄 Start Over
          </button>
        )}
      </div>

      {/* Instructions */}
      <BrutalCard className="mb-6 border-cool-blue bg-cool-blue/10">
        <h2 className="text-lg font-bold text-dark mb-3">📝 How to Use:</h2>
        <ol className="text-sm text-dark/70 space-y-2 list-decimal list-inside">
          <li>Enter your original search query (helps with metadata)</li>
          <li>Select which AI engine(s) you used (Gemini, Perplexity, or Both)</li>
          <li>Paste the COMPLETE results from each engine in its respective text area (including Source Reliability Matrix and citations)</li>
          <li>Click <strong>"Process with Claude"</strong> to automatically synthesize findings (results will be combined automatically)</li>
          <li>Review and edit the processed results</li>
          <li>Fill in investigation metadata</li>
          <li>Click <strong>"Save Investigation"</strong></li>
        </ol>
      </BrutalCard>

      {/* Original Query - Optional */}
      <BrutalCard className="mb-6">
        <h2 className="text-xl font-bold text-dark mb-4">1. Original Search Query <span className="text-sm font-normal text-dark/60">(Optional)</span></h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="e.g., Adaptive Learning Pathways in Algebra"
          className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue"
        />
        <p className="text-xs text-dark/60 mt-2">
          If you remember the original query, it helps generate better metadata (keywords)
        </p>
      </BrutalCard>

      {/* AI Engine Selection */}
      <BrutalCard className="mb-6">
        <h2 className="text-xl font-bold text-dark mb-4">2. AI Engine Used</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setActiveEngine('gemini')}
            className={`group px-6 py-6 border-4 border-dark font-bold transition-all ${
              activeEngine === 'gemini'
                ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] scale-105'
                : 'bg-white text-dark hover:bg-cool-blue/20 hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
            }`}
          >
            <Sparkles size={24} className={`inline mb-2 ${activeEngine === 'gemini' ? '' : 'group-hover:animate-pulse'}`} />
            <div className="text-base">Gemini Only</div>
            {activeEngine === 'gemini' && <div className="text-xs font-normal mt-1">✓ Selected</div>}
          </button>
          <button
            onClick={() => setActiveEngine('perplexity')}
            className={`group px-6 py-6 border-4 border-dark font-bold transition-all ${
              activeEngine === 'perplexity'
                ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] scale-105'
                : 'bg-white text-dark hover:bg-cool-blue/20 hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
            }`}
          >
            <div className="text-base">Perplexity Only</div>
            {activeEngine === 'perplexity' && <div className="text-xs font-normal mt-1">✓ Selected</div>}
          </button>
          <button
            onClick={() => setActiveEngine('both')}
            className={`group px-6 py-6 border-4 border-dark font-bold transition-all ${
              activeEngine === 'both'
                ? 'bg-alert-orange text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] scale-105'
                : 'bg-white text-dark hover:bg-alert-orange/20 hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
            }`}
          >
            <Sparkles size={24} className={`inline mb-2 ${activeEngine === 'both' ? '' : 'group-hover:animate-pulse'}`} />
            <div className="text-base">Both / Ambas</div>
            {activeEngine === 'both' && <div className="text-xs font-normal mt-1">✓ Recommended</div>}
          </button>
        </div>
        {activeEngine === 'both' && (
          <div className="mt-4 p-4 border-2 border-alert-orange bg-alert-orange/10 animate-fade-in">
            <p className="text-sm text-dark/80">
              💡 <strong>Tip:</strong> Use the separate text areas below for each engine. They will be combined automatically.
            </p>
          </div>
        )}
      </BrutalCard>

      {/* Results Textareas - Separated by Engine */}
      <BrutalCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark">3. Paste Research Results</h2>
          {autoLoadedResults && (
            <div className="px-3 py-1 border-2 border-cool-blue bg-cool-blue text-xs font-bold">
              ✓ AUTO-LOADED
            </div>
          )}
        </div>
        {autoLoadedResults && (
          <div className="mb-4 p-3 border-2 border-cool-blue bg-cool-blue/10">
            <p className="text-sm text-dark/80">
              <strong>✓ Results loaded automatically</strong> from your most recent raw search results.
              You can edit or replace them if needed.
            </p>
          </div>
        )}

        {/* Gemini Results */}
        {(activeEngine === 'gemini' || activeEngine === 'both') && (
          <div className="mb-6">
            <label className="block text-sm font-bold text-dark mb-2">
              🔵 Gemini Deep Research Results
            </label>
            <textarea
              value={geminiResults}
              onChange={(e) => setGeminiResults(e.target.value)}
              rows={12}
              className="w-full border-4 border-dark px-4 py-3 text-dark font-mono text-sm focus:outline-none focus:ring-4 focus:ring-cool-blue"
              placeholder="Paste Gemini Deep Research results here, including:
- Source Reliability Matrix (table with scores)
- Key findings and conclusions
- All citations and references
- Methodology notes

Example:
# Key Findings
Research demonstrates that...

## Source Reliability Matrix
| Source | Score |
| [Paper 1](url) | 8.5 |"
            />
            <p className="text-xs text-dark/60 mt-2">
              {geminiResults.length} characters • {geminiResults.split('\n').length} lines
            </p>
          </div>
        )}

        {/* Perplexity Results */}
        {(activeEngine === 'perplexity' || activeEngine === 'both') && (
          <div className="mb-6">
            <label className="block text-sm font-bold text-dark mb-2">
              🟣 Perplexity AI Results
            </label>
            <textarea
              value={perplexityResults}
              onChange={(e) => setPerplexityResults(e.target.value)}
              rows={12}
              className="w-full border-4 border-dark px-4 py-3 text-dark font-mono text-sm focus:outline-none focus:ring-4 focus:ring-alert-orange"
              placeholder="Paste Perplexity AI results here, including:
- Key findings and conclusions
- All citations and references [1], [2], etc.
- Sources list with URLs

Example:
# Research Summary
Based on recent studies [1][2]...

## Sources:
[1] Paper Title - https://..."
            />
            <p className="text-xs text-dark/60 mt-2">
              {perplexityResults.length} characters • {perplexityResults.split('\n').length} lines
            </p>
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs text-dark/60 mb-3">
            Total: {(geminiResults.length + perplexityResults.length).toLocaleString()} characters
          </p>
          <div className="flex gap-3">
            <button
              onClick={processWithClaude}
              disabled={processing || (!geminiResults.trim() && !perplexityResults.trim())}
              className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 border-4 border-dark font-bold text-lg transition-all ${
                processing || (!geminiResults.trim() && !perplexityResults.trim())
                  ? 'bg-gray-300 text-dark/40 cursor-not-allowed'
                  : 'bg-alert-orange text-dark hover:shadow-[8px_8px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] active:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] active:translate-x-[2px] active:translate-y-[2px]'
              }`}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-dark border-t-transparent"></div>
                  <span>Processing with Claude AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  <span>Process with Claude</span>
                </>
              )}
            </button>
            {(geminiResults.trim() || perplexityResults.trim()) && (
              <button
                onClick={() => {
                  setGeminiResults('');
                  setPerplexityResults('');
                  setResultsText('');
                  toast.showInfo('Results cleared');
                }}
                className="px-6 py-5 border-4 border-dark bg-white text-dark font-bold hover:bg-bg-light transition-all"
                title="Clear results"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </BrutalCard>

      {/* Processed Preview */}
      {processedData && (
        <BrutalCard className="mb-6 border-4 border-alert-orange bg-alert-orange/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark flex items-center gap-2">
              <Sparkles size={24} className="text-alert-orange" />
              Claude-Processed Results
            </h2>
            <p className="text-xs text-dark/60">✨ AI-synthesized narrative</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-dark mb-2">
                KEY FINDINGS (Editable)
              </label>
              <textarea
                value={processedData.keyFindings}
                onChange={(e) =>
                  setProcessedData({ ...processedData, keyFindings: e.target.value })
                }
                rows={10}
                className="w-full border-2 border-dark px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-alert-orange"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">
                METHODOLOGY (Editable)
              </label>
              <textarea
                value={processedData.methodology}
                onChange={(e) =>
                  setProcessedData({ ...processedData, methodology: e.target.value })
                }
                rows={5}
                className="w-full border-2 border-dark px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-alert-orange"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  IMPACT METRICS
                </label>
                <input
                  type="text"
                  value={processedData.impactMetrics}
                  onChange={(e) =>
                    setProcessedData({ ...processedData, impactMetrics: e.target.value })
                  }
                  className="w-full border-2 border-dark px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-alert-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  CITATIONS EXTRACTED
                </label>
                <div className="border-2 border-dark px-3 py-2 text-sm text-dark bg-white">
                  {processedData.citations.length} sources
                </div>
              </div>
            </div>
          </div>
        </BrutalCard>
      )}

      {/* Association Type */}
      <BrutalCard className="mb-6">
        <h2 className="text-xl font-bold text-dark mb-4">4. Association Type</h2>
        <p className="text-sm text-dark/70 mb-4">
          Choose whether to create a new standalone investigation or associate it with an existing research topic.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => {
              setAssociationType('new');
              setSelectedCollectionId('');
              setSelectedTopicId('');
            }}
            className={`px-6 py-4 border-4 border-dark font-bold transition-all ${
              associationType === 'new'
                ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
                : 'bg-white text-dark hover:bg-bg-light'
            }`}
          >
            <div className="text-base mb-1">New Investigation</div>
            <div className="text-xs font-normal">Create standalone investigation</div>
          </button>

          <button
            onClick={() => setAssociationType('existing')}
            className={`px-6 py-4 border-4 border-dark font-bold transition-all ${
              associationType === 'existing'
                ? 'bg-alert-orange text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
                : 'bg-white text-dark hover:bg-bg-light'
            }`}
          >
            <div className="text-base mb-1">Link to Existing Topic</div>
            <div className="text-xs font-normal">Associate with research topic</div>
          </button>
        </div>

        {/* Collection & Topic Selection */}
        {associationType === 'existing' && (
          <div className="space-y-4 p-4 border-4 border-alert-orange bg-alert-orange/10">
            <div>
              <label className="block text-sm font-bold text-dark mb-2">
                Select Collection *
              </label>
              <select
                value={selectedCollectionId}
                onChange={(e) => {
                  setSelectedCollectionId(e.target.value);
                  setSelectedTopicId(''); // Reset topic when collection changes
                }}
                className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-alert-orange"
              >
                <option value="">-- Select a collection --</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title} ({collection.topics.length} topics)
                  </option>
                ))}
              </select>
            </div>

            {selectedCollectionId && (
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Select Topic *
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-alert-orange"
                >
                  <option value="">-- Select a topic --</option>
                  {collections
                    .find((c) => c.id === selectedCollectionId)
                    ?.topics.filter((t) => t.status === 'in-progress') // Only show in-progress topics
                    .map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-dark/60 mt-2">
                  Only showing in-progress topics (ready to be researched)
                </p>
              </div>
            )}

            {selectedCollectionId && selectedTopicId && (
              <div className="p-3 border-2 border-cool-blue bg-cool-blue/10">
                <p className="text-sm text-dark">
                  ✓ This investigation will be linked to the selected topic and marked as "completed"
                </p>
              </div>
            )}
          </div>
        )}
      </BrutalCard>

      {/* Investigation Metadata */}
      <BrutalCard className="mb-6">
        <h2 className="text-xl font-bold text-dark mb-4">5. Investigation Metadata</h2>

        {processedData && (
          <div className="mb-6 p-4 border-2 border-cool-blue bg-cool-blue/5">
            <h3 className="text-sm font-bold text-dark mb-3">📋 Preview: How this will appear in Research Repository</h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="font-bold text-dark mb-1">Title (Suggested by Claude)</div>
                <p className="text-dark font-bold text-base">{processedData.suggestedTitle}</p>
              </div>
              <div>
                <div className="font-bold text-dark mb-1">Mathematical Area (Suggested by Claude)</div>
                <p className="text-dark">{processedData.suggestedMathArea}</p>
              </div>
              <div>
                <div className="font-bold text-dark mb-1">Description</div>
                <p className="text-dark/80">{processedData.description || processedData.keyFindings.split('\n\n')[0]}</p>
              </div>
              <div>
                <div className="font-bold text-dark mb-1">Key Findings</div>
                <div className="text-dark/80 whitespace-pre-line font-serif">{processedData.keyFindings}</div>
              </div>
              <div>
                <div className="font-bold text-dark mb-1">Methodology</div>
                <p className="text-dark/80 font-serif">{processedData.methodology}</p>
              </div>
              <div>
                <div className="font-bold text-dark mb-1">Impact Metrics</div>
                <p className="text-dark/80">{processedData.impactMetrics}</p>
              </div>
              {processedData.citations.length > 0 && (
                <div>
                  <div className="font-bold text-dark mb-1">Key Citations ({processedData.citations.length})</div>
                  <div className="space-y-1">
                    {processedData.citations.slice(0, 5).map((cit, i) => (
                      <div key={i} className="text-xs text-dark/70">
                        {i + 1}. {cit.title}
                        {cit.authors && (
                          <span className="text-dark/50"> — {cit.authors}</span>
                        )}
                      </div>
                    ))}
                    {processedData.citations.length > 5 && (
                      <div className="text-xs text-dark/60">... and {processedData.citations.length - 5} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-dark mb-2">
              Investigation Title * {processedData && <span className="text-xs font-normal text-dark/60">(Auto-filled by Claude)</span>}
            </label>
            <input
              type="text"
              value={investigationData.title}
              onChange={(e) =>
                setInvestigationData({ ...investigationData, title: e.target.value })
              }
              className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue"
              placeholder="e.g., Adaptive Learning Pathways in Algebra"
            />
            <p className="text-xs text-dark/60 mt-2">
              {processedData
                ? '✅ Title suggested by Claude - you can edit it if needed'
                : '💡 Process with Claude first to auto-generate the title'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-dark mb-2">
                Research Type *
              </label>
              <select
                value={investigationData.researchType}
                onChange={(e) =>
                  setInvestigationData({
                    ...investigationData,
                    researchType: e.target.value as ResearchType,
                  })
                }
                className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue"
              >
                <option>Systematic Literature Review</option>
                <option>Learning Pattern Analysis</option>
                <option>Content Development</option>
                <option>AI-Powered Pathways</option>
                <option>Student Data Analysis</option>
                <option>Pedagogical Innovation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">
                Mathematical Area * {processedData && <span className="text-xs font-normal text-dark/60">(Auto-filled by Claude)</span>}
              </label>
              <select
                value={investigationData.mathematicalArea}
                onChange={(e) =>
                  setInvestigationData({
                    ...investigationData,
                    mathematicalArea: e.target.value as MathematicalArea,
                  })
                }
                className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue"
              >
                <option>Elementary Arithmetic</option>
                <option>Algebra</option>
                <option>Geometry</option>
                <option>Calculus</option>
                <option>Statistics</option>
                <option>Cross-Domain</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-dark mb-2">
              Author *
            </label>
            <input
              type="text"
              value={investigationData.author}
              onChange={(e) =>
                setInvestigationData({ ...investigationData, author: e.target.value })
              }
              className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue"
              placeholder="Your name"
            />
          </div>
        </div>
      </BrutalCard>

      {/* Save Button */}
      <div className="sticky bottom-4 bg-white border-4 border-dark p-6 shadow-[8px_8px_0px_0px_rgba(18,18,18,1)]">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark mb-1">Ready to save?</h3>
            <p className="text-sm text-dark/60">
              {!processedData
                ? '⚠️ Process with Claude first to generate complete investigation data'
                : !investigationData.title
                ? '⚠️ Investigation title is required'
                : !investigationData.author
                ? '⚠️ Author name is required'
                : associationType === 'existing' && (!selectedCollectionId || !selectedTopicId)
                ? '⚠️ Select both collection and topic to link investigation'
                : '✅ All required fields complete - ready to save!'}
            </p>
          </div>
          <button
            onClick={saveInvestigation}
            disabled={
              saving ||
              !investigationData.title ||
              !investigationData.author ||
              !resultsText.trim() ||
              (associationType === 'existing' && (!selectedCollectionId || !selectedTopicId))
            }
            className={`flex items-center gap-3 px-10 py-5 border-4 border-dark font-bold text-lg transition-all ${
              saving ||
              !investigationData.title ||
              !investigationData.author ||
              !resultsText.trim() ||
              (associationType === 'existing' && (!selectedCollectionId || !selectedTopicId))
                ? 'bg-gray-300 text-dark/40 cursor-not-allowed'
                : 'bg-cool-blue text-dark hover:shadow-[8px_8px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] active:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] active:translate-x-[2px] active:translate-y-[2px]'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-dark border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={24} />
                <span>Save Investigation</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
