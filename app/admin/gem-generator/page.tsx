'use client';

import { useState } from 'react';
import { BrutalCard, BrutalButton, BrutalInput } from '@/components/ui';
import { Sparkles, Copy, Check, Download, Save, FileText, Wand2, X } from 'lucide-react';
import { saveGemPrompt } from '@/lib/gemPrompts';
import { useAuth } from '@/contexts/AuthContext';
import { createInvestigation, ResearchType, MathematicalArea } from '@/lib/investigations';
import { Timestamp } from 'firebase/firestore';

type PromptEngine = 'gemini' | 'perplexity';

export default function GemGenerator() {
  const { user, signInWithGoogle } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedPrompts, setGeneratedPrompts] = useState<{
    gemini: string;
    perplexity: string;
  }>({ gemini: '', perplexity: '' });
  const [activeEngine, setActiveEngine] = useState<PromptEngine>('gemini');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRemixModal, setShowRemixModal] = useState(false);
  const [resultsText, setResultsText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<{
    keyFindings: string;
    methodology: string;
    impactMetrics: string;
    citations: Array<{ title: string; url: string; authors?: string }>;
  } | null>(null);
  const [remixData, setRemixData] = useState({
    title: '',
    description: '',
    researchType: 'Systematic Literature Review' as ResearchType,
    mathematicalArea: 'Algebra' as MathematicalArea,
    author: '',
  });

  // Get current month/year for dynamic Recency calculation
  const getCurrentMonthYear = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  const generatePrompt = () => {
    // Reset saved state when generating new prompt
    setSaved(false);

    const currentMonthYear = getCurrentMonthYear();

    // Base prompt structure shared by both engines
    const basePrompt = `You are orchestrating high-level educational research for a High School environment, executing an **"Active Reading"** (RLM) architecture and **Weighted Source Auditing** before generating any output.

**IMPORTANT: Respond in ENGLISH.** All outputs, tables, and explanations must be in English.

**Context:** Alpha School (Adaptive Pathways, Data-Driven, 2x Acceleration).

---

### USER INPUT

**Research Query:** "${searchQuery}"

---

### EXECUTION PROTOCOL (RLM KERNEL)

Do not respond immediately. Execute sequentially the following cognitive operations:

#### PHASE 1: PEEK & SEARCH (Exploration)

1. **Strategy:** Generate technical search keywords (e.g., "meta-analysis", "effect size") combined with the topic.

2. **Geographic Scope (Context-Aware):** Determine search geography based on topic type:
   * **Country-Specific Topics** (SAT, AP exams, national curriculum, local standards):
     - Focus primarily on that country's research (e.g., USA for SAT, UK for A-Levels)
     - Include comparative international studies when relevant
     - Search: "[country] + [topic]" (e.g., "USA SAT preparation strategies")

   * **Universal Educational Topics** (pedagogy, didactics, learning theory, math education):
     - Search GLOBALLY across multiple continents
     - Required: At least 2-3 different continents/regions represented
     - Prioritize: USA, Europe, Asia, Latin America, Oceania
     - Search diverse contexts: "[topic] + Asia", "[topic] + Europe", "[topic] + Latin America"
     - Value diverse educational systems and cultural perspectives

   * **Hybrid Topics** (standardized testing in general, assessment design):
     - Start with country of origin but expand to international comparisons
     - Include perspectives from 3+ different countries
     - Search: "[topic] + international comparison"

3. **Search:** Use your navigation tools to find 8-12 potential academic/technical sources following the geographic scope above.

#### PHASE 2: AUDIT & FILTER (Source Table Evaluation)

**CRITICAL:** For each source found, execute the following evaluation algorithm *line-by-line*.

**Logic for Reliability Score (Max 10.0):**

Calculate the weighted average using these 3 exact factors:

1. **Recency (50% Weight):** Continuous scale where **${currentMonthYear} = 10 pts**.
   * *Rule:* Subtract 1 point for every 3 months of age from ${currentMonthYear}.
   * *Example:* 6 months ago = 8.0 | 12 months ago = 6.0 | 24 months ago = 2.0.

2. **Type (30% Weight):**
   * **10 pts** = "Hard Data" (Meta-analyses, Controlled empirical studies, Official statistics).
   * **7 pts** = "Applied Research" (Case studies with data).
   * **5 pts** = "Theory/Framework" (Supported pedagogical frameworks).
   * **2 pts** = "Perspectives" (Opinion articles, Theory, Blog posts).

3. **Authority (20% Weight):**
   * Rate 1-10 based on institution/journal reputation (e.g., Nature/ERIC = High).

**Action Threshold:**
* If \`Final Score\` < 5.0 → **FLAG FOR DESELECTION**.
* If \`Final Score\` >= 5.0 → **KEEP**.

#### PHASE 3: EXTRACT & SYNTHESIZE (Data Processing)

From "KEEP" sources, extract data mapping it to relevant fields:
* Identify \`[EMPIRICAL EVIDENCE]\` (numbers, % acceleration, effect sizes).
* Identify \`[PEDAGOGICAL/DIDACTIC MODELS]\` (applicable strategies).
* Identify \`[EDUCATIONAL FRAMEWORKS]\` (supported theoretical frameworks).

---

### EXPECTED FINAL OUTPUT

Present the result in two clear parts:

#### PART 1: SOURCE RELIABILITY MATRIX (Visual Audit)

Generate the mandatory audit table ordered by Score (Highest to Lowest). **Include geographic origin.**

| Source Name | Date | Category | Country/Region | Logic | Reliability Score | Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [Paper Title] | [YYYY-MM] | [Hard Data/Persp] | [USA/Europe/Asia/etc] | [1-sentence justification] | **X.X** | [KEEP/DROP] |

**Geographic Diversity Check:**
* Count sources by region: ___ USA, ___ Europe, ___ Asia, ___ Latin America, ___ Other
* For universal topics: Ensure at least 2-3 continents represented

**Deselection List (Sources < 5.0):**
* *[Source Name] - Score: X.X (Reason: Too old / Pure opinion)*

---

**FINAL INSTRUCTIONS:**
1. Execute ALL phases before responding
2. DO NOT omit the Source Reliability Matrix
3. Order sources by Reliability Score (highest to lowest)
4. Include clear justification for each source
5. **Verify geographic diversity:** For universal topics, ensure sources from at least 2-3 different continents
6. Include Country/Region column in the table
7. **All output must be in ENGLISH**`;

    // Gemini-specific optimization
    const geminiPrompt = basePrompt + `

---

**GEMINI OPTIMIZATION:**
- Use your web search tools to find academic sources
- Perform multiple iterative searches if necessary
- Prioritize Google Scholar, ERIC, ResearchGate
- Generate complete table with clear markdown formatting`;

    // Perplexity-specific optimization
    const perplexityPrompt = basePrompt + `

---

**PERPLEXITY OPTIMIZATION:**
- Use your search engine to find relevant sources
- Include direct citations in each table entry
- Prioritize academic papers with verifiable DOI/URLs
- Concise but complete format`;

    setGeneratedPrompts({
      gemini: geminiPrompt,
      perplexity: perplexityPrompt,
    });
  };

  const getActivePrompt = () => {
    return generatedPrompts[activeEngine];
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getActivePrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPrompt = () => {
    const blob = new Blob([getActivePrompt()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gem-${activeEngine}-${searchQuery.slice(0, 50).replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const savePrompt = async () => {
    // Check if user is authenticated
    if (!user) {
      const shouldSignIn = confirm(
        'You need to sign in to save prompts. Would you like to sign in with Google?'
      );
      if (shouldSignIn) {
        try {
          await signInWithGoogle();
          // After sign in, try to save again
          await saveGemPrompt(`[${activeEngine.toUpperCase()}] ${searchQuery}`, getActivePrompt());
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          alert(`${activeEngine === 'gemini' ? 'Gemini' : 'Perplexity'} prompt saved to repository!`);
        } catch (error) {
          console.error('Error during sign in or save:', error);
          alert('Failed to sign in or save prompt. Please try again.');
        }
      }
      return;
    }

    setSaving(true);
    try {
      await saveGemPrompt(`[${activeEngine.toUpperCase()}] ${searchQuery}`, getActivePrompt());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      alert(`${activeEngine === 'gemini' ? 'Gemini' : 'Perplexity'} prompt saved to repository!`);
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openRemixModal = () => {
    if (!user) {
      alert('You need to sign in to create research investigations.');
      return;
    }
    // Pre-fill with search query
    setRemixData({
      title: searchQuery,
      description: '',
      researchType: 'Systematic Literature Review',
      mathematicalArea: 'Algebra',
      author: user.displayName || user.email || '',
    });
    setResultsText('');
    setProcessedData(null);
    setShowRemixModal(true);
  };

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
      alert('✅ Results processed successfully! Review the synthesized findings below.');
    } catch (error) {
      console.error('Error processing with Claude:', error);
      alert('Failed to process results with Claude. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const extractCitationsFromResults = (text: string) => {
    const citations: Array<{ title: string; url: string; authors?: string }> = [];

    // Try to find citation patterns (basic extraction)
    const lines = text.split('\n');
    for (const line of lines) {
      // Look for markdown links or URLs
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
    // Look for sections with findings, conclusions, or key points
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

    // If no section found, return first 500 chars
    return text.substring(0, 500) + '...';
  };

  const saveRemixToInvestigation = async () => {
    if (!user) {
      alert('You need to sign in to create investigations.');
      return;
    }

    if (!resultsText.trim()) {
      alert('Please paste the research results from Gemini/Perplexity first.');
      return;
    }

    try {
      setSaving(true);

      // Use processed data if available, otherwise fall back to extraction
      let keyFindings, methodology, impactMetrics, citations, sourceCount;

      if (processedData) {
        // Use Claude-processed data
        keyFindings = processedData.keyFindings;
        methodology = processedData.methodology;
        impactMetrics = processedData.impactMetrics;
        citations = processedData.citations;
        sourceCount = processedData.citations.length;
      } else {
        // Fall back to basic extraction
        citations = extractCitationsFromResults(resultsText);
        keyFindings = extractKeyFindings(resultsText);
        sourceCount = (resultsText.match(/\d+\./g) || []).length;
        methodology = `Research conducted using ${activeEngine === 'gemini' ? 'Gemini Deep Research' : 'Perplexity AI'} with RLM architecture (Read, List, Mono-cite).\n\nOriginal Query: "${searchQuery}"\n\nFull results captured in key findings section.`;
        impactMetrics = `${sourceCount} sources analyzed`;
      }

      await createInvestigation({
        title: remixData.title,
        description: remixData.description || `Systematic literature review on ${searchQuery}`,
        researchType: remixData.researchType,
        mathematicalArea: remixData.mathematicalArea,
        status: 'Completed',
        keyFindings: keyFindings,
        methodology: methodology,
        impactMetrics: impactMetrics,
        author: remixData.author,
        startDate: Timestamp.now(),
        completionDate: Timestamp.now(),
        searchKeywords: searchQuery.split(/[,\s]+/).filter(k => k.trim()),
        databases: ['Google Scholar', 'ERIC', 'ResearchGate', 'Semantic Scholar', 'Academic Sources'],
        paperCount: sourceCount,
        citationLinks: citations.length > 0 ? citations : undefined,
      });

      alert('✅ Research Investigation created successfully!\n\nCheck Research Repository to view your investigation.');
      setShowRemixModal(false);
      // Reset form
      setRemixData({
        title: '',
        description: '',
        researchType: 'Systematic Literature Review',
        mathematicalArea: 'Algebra',
        author: '',
      });
      setResultsText('');
      setProcessedData(null);
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
          <Sparkles size={36} className="text-alert-orange" />
          GEM Generator
        </h1>
        <p className="text-dark/70">
          Transform any research query into a Gemini Deep Research prompt with RLM architecture
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                generatePrompt();
              }
            }}
            placeholder="e.g., Adaptive Learning Pathways in Algebra, Formative Assessment Strategies, Growth Mindset in Mathematics..."
            className="w-full border-4 border-dark px-6 py-5 text-lg bg-white text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue pr-48"
          />
          <BrutalButton
            onClick={generatePrompt}
            disabled={!searchQuery.trim()}
            variant="primary"
            className="absolute right-3 top-1/2 -translate-y-1/2 gap-2"
          >
            <Sparkles size={20} />
            Generate GEM
          </BrutalButton>
        </div>
        <p className="text-xs text-dark/60 mt-2">
          Enter any topic: mathematics, pedagogy, didactics, educational theory, learning psychology, etc.
        </p>
      </div>

      {/* Generated Prompt Display */}
      {generatedPrompts.gemini && (
        <BrutalCard>
          {/* Engine Tabs */}
          <div className="flex gap-2 mb-4 border-b-4 border-dark pb-4">
            <button
              onClick={() => setActiveEngine('gemini')}
              className={`px-6 py-3 border-4 border-dark font-bold transition-all ${
                activeEngine === 'gemini'
                  ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
                  : 'bg-white text-dark hover:bg-bg-light'
              }`}
            >
              <Sparkles size={16} className="inline mr-2" />
              Gemini Deep Research
            </button>
            <button
              onClick={() => setActiveEngine('perplexity')}
              className={`px-6 py-3 border-4 border-dark font-bold transition-all ${
                activeEngine === 'perplexity'
                  ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
                  : 'bg-white text-dark hover:bg-bg-light'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Perplexity AI
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-dark">
                {activeEngine === 'gemini' ? 'Gemini' : 'Perplexity'} Optimized Prompt
              </h2>
              {!user && (
                <p className="text-xs text-dark/60 mt-1">
                  ℹ️ Sign in required to save prompts
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <BrutalButton
                onClick={savePrompt}
                variant="primary"
                className="gap-2"
                disabled={saving}
              >
                {saved ? (
                  <>
                    <Check size={16} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </>
                )}
              </BrutalButton>
              <BrutalButton
                onClick={copyToClipboard}
                variant="secondary"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </BrutalButton>
              <BrutalButton
                onClick={downloadPrompt}
                variant="secondary"
                className="gap-2"
              >
                <Download size={16} />
                Download
              </BrutalButton>
              <BrutalButton
                onClick={openRemixModal}
                variant="primary"
                className="gap-2 bg-alert-orange border-alert-orange"
              >
                <Wand2 size={16} />
                Paste Results & Save
              </BrutalButton>
            </div>
          </div>

          <div className="bg-bg-light border-4 border-dark p-4 font-mono text-sm max-h-96 overflow-auto">
            <pre className="whitespace-pre-wrap text-dark">{getActivePrompt()}</pre>
          </div>

          <div className="mt-4 p-4 border-4 border-cool-blue bg-cool-blue/10">
            <p className="text-sm font-bold text-dark mb-2">📋 Siguientes Pasos:</p>
            <ol className="text-sm text-dark/80 space-y-1 list-decimal list-inside">
              <li>Selecciona el tab <strong>Gemini</strong> o <strong>Perplexity</strong> según tu preferencia</li>
              <li>Copia el prompt optimizado para ese motor</li>
              <li>Abre {activeEngine === 'gemini' ? <><strong>Gemini Deep Research</strong> o <strong>Gemini 2.0 Flash Thinking</strong></> : <strong>Perplexity AI</strong>}</li>
              <li>Pega el prompt y ejecuta la búsqueda</li>
              <li>Espera a que complete todas las fases (típicamente 5-10 minutos)</li>
              <li>Copia TODOS los resultados (incluyendo la <strong>Source Reliability Matrix</strong>)</li>
              <li>Click en <strong>"Paste Results & Save"</strong> (botón naranja arriba) para crear una investigación</li>
            </ol>
            <div className="mt-3 p-3 border-2 border-dark bg-white">
              <p className="text-xs font-bold text-dark mb-1">🔍 Diferencias clave:</p>
              <ul className="text-xs text-dark/70 space-y-1">
                <li><strong>Gemini:</strong> Búsqueda profunda e iterativa, mejor para análisis comprehensivos</li>
                <li><strong>Perplexity:</strong> Respuestas rápidas con citations directas, mejor para síntesis concisas</li>
              </ul>
            </div>
            <div className="mt-3 p-3 border-2 border-cool-blue bg-cool-blue/10">
              <p className="text-xs font-bold text-dark mb-1">🌍 Búsqueda Geográfica Contextual:</p>
              <ul className="text-xs text-dark/70 space-y-1">
                <li><strong>Temas específicos de país</strong> (ej: SAT, AP) → Enfoque en ese país + comparaciones</li>
                <li><strong>Temas universales</strong> (ej: didáctica, pedagogía) → Búsqueda global en 2-3+ continentes</li>
                <li><strong>Diversidad incluida:</strong> USA, Europa, Asia, Latinoamérica, Oceanía</li>
              </ul>
            </div>
            <p className="text-xs text-dark/60 mt-3">
              💡 Incluye <strong>Recency automático</strong> (actualizado a {getCurrentMonthYear()}), <strong>diversidad geográfica</strong> y responde en <strong>inglés</strong>
            </p>
          </div>
        </BrutalCard>
      )}

      {/* Remix to Research Investigation Modal */}
      {showRemixModal && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-dark max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
                  <Wand2 size={28} className="text-alert-orange" />
                  Create Investigation from Results
                </h2>
                <button
                  onClick={() => setShowRemixModal(false)}
                  className="p-2 hover:bg-bg-light transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Instructions */}
              <div className="mb-4 p-4 border-4 border-cool-blue bg-cool-blue/10">
                <p className="text-sm font-bold text-dark mb-2">📝 How to use this:</p>
                <ol className="text-sm text-dark/70 space-y-1 list-decimal list-inside">
                  <li>Copy the GEM prompt above and run it in {activeEngine === 'gemini' ? 'Gemini' : 'Perplexity'}</li>
                  <li>Wait for the complete results (including Source Reliability Matrix)</li>
                  <li>Copy ALL the results and paste them in the field below</li>
                  <li>Fill in the metadata fields</li>
                  <li>Click "Create Investigation"</li>
                </ol>
              </div>

              <div className="space-y-4">
                {/* Results Textarea - MAIN FIELD */}
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">
                    Research Results from {activeEngine === 'gemini' ? 'Gemini' : 'Perplexity'} *
                  </label>
                  <textarea
                    value={resultsText}
                    onChange={(e) => setResultsText(e.target.value)}
                    rows={12}
                    className="w-full border-4 border-dark px-4 py-3 text-dark font-mono text-xs focus:outline-none focus:ring-4 focus:ring-alert-orange"
                    placeholder="Paste the complete results here, including:
- Source Reliability Matrix (table with scores)
- Key findings and conclusions
- All citations and references
- Any methodology notes

The system will automatically extract:
✓ Citations and sources
✓ Key findings
✓ Paper count
✓ Methodology details"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-dark/60">
                      {resultsText.length} characters • {resultsText.split('\n').length} lines
                    </p>
                    <BrutalButton
                      onClick={processWithClaude}
                      disabled={processing || !resultsText.trim()}
                      variant="primary"
                      className="gap-2 text-sm bg-alert-orange border-alert-orange"
                    >
                      <Sparkles size={14} />
                      {processing ? 'Processing...' : 'Process with Claude'}
                    </BrutalButton>
                  </div>
                </div>

                {/* Processed Preview */}
                {processedData && (
                  <div className="border-4 border-alert-orange bg-alert-orange/10 p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-dark flex items-center gap-2">
                        <Sparkles size={20} className="text-alert-orange" />
                        Claude-Processed Results
                      </h3>
                      <p className="text-xs text-dark/60">✨ AI-synthesized narrative</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-dark mb-1">
                        KEY FINDINGS (Editable)
                      </label>
                      <textarea
                        value={processedData.keyFindings}
                        onChange={(e) =>
                          setProcessedData({ ...processedData, keyFindings: e.target.value })
                        }
                        rows={8}
                        className="w-full border-2 border-dark px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-alert-orange"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-dark mb-1">
                        METHODOLOGY (Editable)
                      </label>
                      <textarea
                        value={processedData.methodology}
                        onChange={(e) =>
                          setProcessedData({ ...processedData, methodology: e.target.value })
                        }
                        rows={4}
                        className="w-full border-2 border-dark px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-alert-orange"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-dark mb-1">
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
                        <label className="block text-xs font-bold text-dark mb-1">
                          CITATIONS EXTRACTED
                        </label>
                        <div className="border-2 border-dark px-3 py-2 text-sm text-dark bg-white">
                          {processedData.citations.length} sources
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border-2 border-cool-blue bg-cool-blue/10">
                      <p className="text-xs font-bold text-dark mb-1">✅ Ready to Save</p>
                      <p className="text-xs text-dark/70">
                        Claude has synthesized the results into a narrative format. Review and edit above if needed, then fill in the metadata below and create the investigation.
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t-4 border-dark pt-4">
                  <p className="text-sm font-bold text-dark mb-3">Investigation Metadata:</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-dark mb-2">
                    Investigation Title *
                  </label>
                  <input
                    type="text"
                    value={remixData.title}
                    onChange={(e) => setRemixData({ ...remixData, title: e.target.value })}
                    className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue"
                    placeholder="e.g., Adaptive Learning Pathways in Algebra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-dark mb-2">
                    Description *
                  </label>
                  <textarea
                    value={remixData.description}
                    onChange={(e) => setRemixData({ ...remixData, description: e.target.value })}
                    rows={4}
                    className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue"
                    placeholder="Executive summary of the investigation..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">
                      Research Type *
                    </label>
                    <select
                      value={remixData.researchType}
                      onChange={(e) => setRemixData({ ...remixData, researchType: e.target.value as ResearchType })}
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
                      Mathematical Area *
                    </label>
                    <select
                      value={remixData.mathematicalArea}
                      onChange={(e) => setRemixData({ ...remixData, mathematicalArea: e.target.value as MathematicalArea })}
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
                    value={remixData.author}
                    onChange={(e) => setRemixData({ ...remixData, author: e.target.value })}
                    className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue"
                    placeholder="Your name"
                  />
                </div>

                <div className="p-4 border-4 border-alert-orange bg-alert-orange/10">
                  <p className="text-sm font-bold text-dark mb-2">🤖 Auto-Extracted from Results:</p>
                  <ul className="text-sm text-dark/70 space-y-1">
                    <li>• <strong>Key Findings:</strong> Extracted from results text</li>
                    <li>• <strong>Citations & Sources:</strong> Auto-detected from markdown links</li>
                    <li>• <strong>Paper Count:</strong> Counted from numbered sources</li>
                    <li>• <strong>Methodology:</strong> {activeEngine === 'gemini' ? 'Gemini Deep Research' : 'Perplexity AI'} + RLM architecture</li>
                    <li>• <strong>Status:</strong> Completed (since results are ready)</li>
                    <li>• <strong>Completion Date:</strong> Today</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <BrutalButton
                  onClick={saveRemixToInvestigation}
                  variant="primary"
                  className="flex-1 gap-2"
                  disabled={saving || !remixData.title || !remixData.author || !resultsText.trim()}
                >
                  <Save size={16} />
                  {saving ? 'Creating...' : 'Create Investigation'}
                </BrutalButton>
                <BrutalButton
                  onClick={() => setShowRemixModal(false)}
                  variant="secondary"
                  className="gap-2"
                >
                  <X size={16} />
                  Cancel
                </BrutalButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
