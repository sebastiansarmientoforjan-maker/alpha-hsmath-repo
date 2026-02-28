'use client';

import { useState } from 'react';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { Sparkles, Save, Wand2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createInvestigation, ResearchType, MathematicalArea } from '@/lib/investigations';
import { Timestamp } from 'firebase/firestore';

export default function ProcessResultsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEngine, setActiveEngine] = useState<'gemini' | 'perplexity' | 'both'>('both');
  const [resultsText, setResultsText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processedData, setProcessedData] = useState<{
    suggestedTitle: string;
    suggestedMathArea: string;
    description: string;
    keyFindings: string;
    methodology: string;
    impactMetrics: string;
    citations: Array<{ title: string; url: string; authors?: string }>;
  } | null>(null);
  const [investigationData, setInvestigationData] = useState({
    title: '',
    researchType: 'Systematic Literature Review' as ResearchType,
    mathematicalArea: 'Algebra' as MathematicalArea,
    author: user?.displayName || user?.email || '',
  });

  const processWithClaude = async () => {
    if (!resultsText.trim()) {
      alert('Please paste research results first.');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/process-research-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultsText,
          searchQuery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process results');
      }

      setProcessedData(data.processed);

      // Auto-fill title and math area from Claude suggestions
      setInvestigationData(prev => ({
        ...prev,
        title: data.processed.suggestedTitle || prev.title,
        mathematicalArea: (data.processed.suggestedMathArea as MathematicalArea) || prev.mathematicalArea,
      }));

      alert('✅ Results processed successfully! Title and area auto-filled. Review and edit below before saving.');
    } catch (error) {
      console.error('Error processing with Claude:', error);
      alert('Failed to process results with Claude. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const extractCitationsFromResults = (text: string) => {
    const citations: Array<{ title: string; url: string; authors?: string }> = [];
    const lines = text.split('\n');
    for (const line of lines) {
      const urlMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
      if (urlMatch) {
        citations.push({
          title: urlMatch[1],
          url: urlMatch[2],
        });
      }
    }
    return citations;
  };

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
      alert('You need to sign in to create investigations.');
      return;
    }

    if (!resultsText.trim()) {
      alert('Please paste the research results first.');
      return;
    }

    if (!investigationData.title.trim()) {
      alert('Please enter an investigation title.');
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
        citations = extractCitationsFromResults(resultsText);
        keyFindings = extractKeyFindings(resultsText);
        sourceCount = (resultsText.match(/\d+\./g) || []).length;
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

      await createInvestigation({
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
        citationLinks: citations.length > 0 ? citations : undefined,
      });

      alert('✅ Research Investigation created successfully!\n\nCheck Research Repository to view your investigation.');

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
    } catch (error) {
      console.error('Error creating investigation:', error);
      alert('Failed to create investigation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-dark mb-2 flex items-center gap-3">
          <Wand2 size={36} className="text-alert-orange" />
          Process Research Results
        </h1>
        <p className="text-dark/70">
          Paste results from Gemini or Perplexity and convert them into structured Research Investigations
        </p>
      </div>

      {/* Instructions */}
      <BrutalCard className="mb-6 border-cool-blue bg-cool-blue/10">
        <h2 className="text-lg font-bold text-dark mb-3">📝 How to Use:</h2>
        <ol className="text-sm text-dark/70 space-y-2 list-decimal list-inside">
          <li>Paste the COMPLETE results from Gemini, Perplexity, or BOTH including Source Reliability Matrix and citations</li>
          <li>If using both engines, separate them with clear headers in the same textarea</li>
          <li>Optionally enter your original search query (helps with metadata)</li>
          <li>Select which AI engine(s) you used</li>
          <li>Click <strong>"Process with Claude"</strong> to automatically synthesize findings</li>
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
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveEngine('gemini')}
            className={`px-6 py-4 border-4 border-dark font-bold transition-all ${
              activeEngine === 'gemini'
                ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
                : 'bg-white text-dark hover:bg-bg-light'
            }`}
          >
            <Sparkles size={20} className="inline mr-2" />
            Gemini Only
          </button>
          <button
            onClick={() => setActiveEngine('perplexity')}
            className={`px-6 py-4 border-4 border-dark font-bold transition-all ${
              activeEngine === 'perplexity'
                ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
                : 'bg-white text-dark hover:bg-bg-light'
            }`}
          >
            Perplexity Only
          </button>
          <button
            onClick={() => setActiveEngine('both')}
            className={`px-6 py-4 border-4 border-dark font-bold transition-all ${
              activeEngine === 'both'
                ? 'bg-alert-orange text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
                : 'bg-white text-dark hover:bg-bg-light'
            }`}
          >
            <Sparkles size={20} className="inline mr-2" />
            Both / Ambas
          </button>
        </div>
        {activeEngine === 'both' && (
          <p className="text-xs text-dark/70 mt-3 p-3 border-2 border-alert-orange bg-alert-orange/10">
            💡 <strong>Tip:</strong> Paste results from both engines in the same textarea. Separate them with clear headers like "=== GEMINI RESULTS ===" and "=== PERPLEXITY RESULTS ==="
          </p>
        )}
      </BrutalCard>

      {/* Results Textarea */}
      <BrutalCard className="mb-6">
        <h2 className="text-xl font-bold text-dark mb-4">3. Paste Research Results</h2>
        <textarea
          value={resultsText}
          onChange={(e) => setResultsText(e.target.value)}
          rows={16}
          className="w-full border-4 border-dark px-4 py-3 text-dark font-mono text-sm focus:outline-none focus:ring-4 focus:ring-alert-orange"
          placeholder="Paste the complete results here, including:
- Source Reliability Matrix (table with scores)
- Key findings and conclusions
- All citations and references
- Methodology notes

Example (single engine):
# Key Findings
Research demonstrates that...

## Source Reliability Matrix
| Source | Score |
| [Paper 1](url) | 8.5 |

Example (both engines):
=== GEMINI DEEP RESEARCH RESULTS ===
[Gemini findings here...]

=== PERPLEXITY AI RESULTS ===
[Perplexity findings here...]
"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-dark/60">
            {resultsText.length} characters • {resultsText.split('\n').length} lines
          </p>
          <BrutalButton
            onClick={processWithClaude}
            disabled={processing || !resultsText.trim()}
            variant="primary"
            className="gap-2 bg-alert-orange border-alert-orange"
          >
            <Sparkles size={16} />
            {processing ? 'Processing...' : 'Process with Claude'}
          </BrutalButton>
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

      {/* Investigation Metadata */}
      <BrutalCard className="mb-6">
        <h2 className="text-xl font-bold text-dark mb-4">4. Investigation Metadata</h2>

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
      <div className="flex gap-3">
        <BrutalButton
          onClick={saveInvestigation}
          variant="primary"
          className="flex-1 gap-2"
          disabled={saving || !investigationData.title || !investigationData.author || !resultsText.trim()}
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Investigation'}
        </BrutalButton>
      </div>
    </div>
  );
}
