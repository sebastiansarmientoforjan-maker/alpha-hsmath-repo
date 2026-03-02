'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrutalCard, BrutalButton, BrutalInput } from '@/components/ui';
import { Sparkles, Copy, Check, Download, Save, FileText, Archive, Trash2, Calendar } from 'lucide-react';
import { saveGemPrompt, getAllGemPrompts, deleteGemPrompt, GemPrompt } from '@/lib/gemPrompts';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { WorkflowBreadcrumb } from '@/components/WorkflowBreadcrumb';
import { WorkflowManager } from '@/lib/workflow-context';

type PromptEngine = 'gemini' | 'perplexity';

export default function GemGenerator() {
  const { user, signInWithGoogle } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedPrompts, setGeneratedPrompts] = useState<{
    gemini: string;
    perplexity: string;
  }>({ gemini: '', perplexity: '' });
  const [activeEngine, setActiveEngine] = useState<PromptEngine>('gemini');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Prompt Repository State
  const [savedPrompts, setSavedPrompts] = useState<(GemPrompt & { id: string })[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);

  // Load saved prompts
  useEffect(() => {
    loadSavedPrompts();
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = {
      searchQuery,
      generatedPrompts,
      activeEngine,
      timestamp: Date.now(),
    };
    if (searchQuery || generatedPrompts.gemini || generatedPrompts.perplexity) {
      localStorage.setItem('gem-generator-draft', JSON.stringify(draft));
    }
  }, [searchQuery, generatedPrompts, activeEngine]);

  // Restore draft from localStorage on mount
  useEffect(() => {
    // Check for prefill from Research Planning
    const prefill = localStorage.getItem('gem-query-prefill');
    if (prefill) {
      setSearchQuery(prefill);
      localStorage.removeItem('gem-query-prefill');
      return; // Don't restore draft if we have a prefill
    }

    const savedDraft = localStorage.getItem('gem-generator-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // Only restore if less than 7 days old
        const age = Date.now() - (draft.timestamp || 0);
        if (age < 7 * 24 * 60 * 60 * 1000) {
          setSearchQuery(draft.searchQuery || '');
          setGeneratedPrompts(draft.generatedPrompts || { gemini: '', perplexity: '' });
          setActiveEngine(draft.activeEngine || 'gemini');
        } else {
          // Clear old draft
          localStorage.removeItem('gem-generator-draft');
        }
      } catch (error) {
        console.error('Error restoring draft:', error);
      }
    }
  }, []);

  const loadSavedPrompts = async () => {
    try {
      const prompts = await getAllGemPrompts();
      setSavedPrompts(prompts);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleCopyPrompt = (promptId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPromptId(promptId);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleDeletePrompt = async (promptId: string) => {
    setDeletingPromptId(promptId);
    try {
      await deleteGemPrompt(promptId);
      setSavedPrompts(savedPrompts.filter((p) => p.id !== promptId));
      toast.showSuccess('Prompt deleted successfully');
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.showError('Failed to delete prompt.');
    } finally {
      setDeletingPromptId(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get current month/year for dynamic Recency calculation
  const getCurrentMonthYear = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Draft management
  const clearDraft = () => {
    setSearchQuery('');
    setGeneratedPrompts({ gemini: '', perplexity: '' });
    setActiveEngine('gemini');
    localStorage.removeItem('gem-generator-draft');
    toast.showInfo('Draft cleared. Starting fresh!');
  };

  const hasDraft = searchQuery || generatedPrompts.gemini || generatedPrompts.perplexity;

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

#### PART 2: SYNTHESIZED RESEARCH NARRATIVE (Structured Analysis)

After completing the Source Reliability Matrix, provide a comprehensive narrative analysis organized into these sections:

**1. EXECUTIVE SUMMARY (2-3 paragraphs)**
* Concise overview of the research question
* Primary findings and key takeaways
* Overall state of the field based on reviewed sources

**2. KEY FINDINGS (Organized by theme/category)**

Use this structure for each major finding:

**• [CATEGORY TAG] Finding Title: Core Statement**
* Supporting evidence from high-reliability sources [cite: Source #]
* Quantitative data when available (effect sizes, percentages, statistics)
* Geographic/contextual variations if relevant
* Pedagogical implications for Alpha School context

Category tags to use: [PEDAGOGY], [HARD DATA], [STUDENT OUTCOMES], [METHODOLOGY], [TECHNOLOGY], [CURRICULUM DESIGN], [ASSESSMENT], [EQUITY]

**3. METHODOLOGICAL INSIGHTS**
* Common research approaches identified
* Quality of evidence base (experimental, correlational, qualitative)
* Gaps in current research
* Recommendations for future investigation

**4. PRACTICAL RECOMMENDATIONS FOR ALPHA SCHOOL**
* Actionable strategies aligned with 2x acceleration model
* Implementation priorities (High/Medium/Low)
* Required resources or professional development
* Expected timeline and success metrics

**5. GEOGRAPHIC & CONTEXTUAL ANALYSIS**
* Summary of geographic diversity in sources
* Cultural/systemic variations in findings
* Applicability to USA High School context
* International best practices worth adopting

**6. CITATIONS & REFERENCES**
* Full citation list for all KEEP sources
* Include: Author(s), Title, Publication, Year, DOI/URL
* Organized by reliability score or alphabetically

---

**FORMATTING REQUIREMENTS:**
* Use clear markdown headers (##, ###)
* Bullet points for lists and findings
* Bold for emphasis on key terms
* Include inline citations: [cite: Source Name, Score X.X]
* Maintain academic tone while being accessible
* Target length: 1500-2500 words for Part 2

---

**FINAL INSTRUCTIONS:**
1. Execute ALL phases before responding
2. DO NOT omit either Part 1 or Part 2
3. Part 1: Source Reliability Matrix (ordered by score)
4. Part 2: Synthesized Research Narrative (structured analysis)
5. Include clear justification for each source
6. **Verify geographic diversity:** For universal topics, ensure sources from at least 2-3 different continents
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
      toast.showWarning('You need to sign in to save prompts. Signing in...');
      try {
        await signInWithGoogle();
        // After sign in, try to save again
        await saveGemPrompt(`[${activeEngine.toUpperCase()}] ${searchQuery}`, getActivePrompt());
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        loadSavedPrompts(); // Reload repository
        toast.showSuccess(`${activeEngine === 'gemini' ? 'Gemini' : 'Perplexity'} prompt saved to repository!`);
      } catch (error) {
        console.error('Error during sign in or save:', error);
        toast.showError('Failed to sign in or save prompt. Please try again.');
      }
      return;
    }

    setSaving(true);
    try {
      const promptId = await saveGemPrompt(`[${activeEngine.toUpperCase()}] ${searchQuery}`, getActivePrompt());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // Save to workflow context for auto-navigation
      WorkflowManager.setLastPrompt(
        promptId,
        `[${activeEngine.toUpperCase()}] ${searchQuery}`,
        getActivePrompt(),
        activeEngine
      );

      loadSavedPrompts(); // Reload repository
      toast.showSuccess(`✅ Prompt saved!`, 2000);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.showError('Failed to save prompt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Workflow Breadcrumb */}
      <WorkflowBreadcrumb />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-dark mb-2 flex items-center gap-3">
            <Sparkles size={36} className="text-alert-orange" />
            GEM Generator
          </h1>
          <p className="text-dark/70">
            Transform any research query into a Gemini Deep Research prompt with RLM architecture
          </p>
          {hasDraft && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="px-3 py-1 border-2 border-cool-blue bg-cool-blue/10 text-dark font-medium">
                💾 Draft auto-saved
              </div>
              <p className="text-dark/60">Your work is preserved while navigating</p>
            </div>
          )}
        </div>
        {hasDraft && (
          <button
            onClick={clearDraft}
            className="px-6 py-3 border-4 border-dark bg-white text-dark font-bold hover:bg-alert-orange/20 hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all"
            title="Clear draft and start fresh"
          >
            🗑️ Clear Draft
          </button>
        )}
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
              <div className="flex items-center gap-3 mt-1">
                {!user && (
                  <p className="text-xs text-dark/60">
                    ℹ️ Sign in required to save prompts
                  </p>
                )}
                {getActivePrompt() && (
                  <p className="text-xs text-dark/60">
                    📏 {getActivePrompt().split('\n').length} lines • {getActivePrompt().length} characters
                  </p>
                )}
              </div>
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
            </div>
          </div>

          <div className="bg-bg-light border-4 border-dark p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap text-dark break-words">{getActivePrompt()}</pre>
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

      {/* Prompt Repository Section */}
      <div className="mt-12 pt-8 border-t-4 border-dark">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-dark mb-2 flex items-center gap-3">
            <Archive size={32} className="text-cool-blue" />
            Saved Prompts Repository
          </h2>
          <p className="text-dark/70">
            Your saved GEM prompts ready to use
          </p>
        </div>

        {/* Repository Stats */}
        <div className="mb-6">
          <BrutalCard className="inline-block">
            <div className="flex items-center gap-3">
              <FileText size={24} className="text-cool-blue" />
              <div>
                <p className="text-xs uppercase tracking-wide text-dark/60 font-bold">
                  Total Saved Prompts
                </p>
                <p className="text-2xl font-bold text-dark">{savedPrompts.length}</p>
              </div>
            </div>
          </BrutalCard>
        </div>

        {/* Prompts List */}
        {loadingPrompts ? (
          <BrutalCard>
            <div className="text-center py-8">
              <p className="text-dark/60">Loading saved prompts...</p>
            </div>
          </BrutalCard>
        ) : savedPrompts.length === 0 ? (
          <BrutalCard>
            <div className="text-center py-12">
              <FileText size={64} className="mx-auto text-dark/20 mb-4" />
              <p className="text-xl text-dark/60 mb-2">No saved prompts yet</p>
              <p className="text-dark/50">
                Generate a prompt above and click "Save" to see it here
              </p>
            </div>
          </BrutalCard>
        ) : (
          <div className="space-y-4">
            {savedPrompts.map((prompt) => (
              <BrutalCard key={prompt.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-dark mb-2">
                      {prompt.searchQuery}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-dark/60">
                      <Calendar size={14} />
                      <span>{formatDate(prompt.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <BrutalButton
                      onClick={() => handleCopyPrompt(prompt.id!, prompt.promptContent)}
                      variant="primary"
                      className="gap-2"
                    >
                      {copiedPromptId === prompt.id ? (
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
                      onClick={() => handleDeletePrompt(prompt.id!)}
                      variant="secondary"
                      className="gap-2"
                      disabled={deletingPromptId === prompt.id}
                    >
                      <Trash2 size={16} />
                      {deletingPromptId === prompt.id ? 'Deleting...' : 'Delete'}
                    </BrutalButton>
                  </div>
                </div>

                {/* Collapsible Prompt Preview */}
                <details className="group">
                  <summary className="cursor-pointer text-sm font-bold text-dark uppercase mb-2 hover:text-cool-blue transition-colors">
                    View Full Prompt →
                  </summary>
                  <div className="mt-2 bg-bg-light border-4 border-dark p-4 font-mono text-xs max-h-[600px] overflow-auto">
                    <pre className="whitespace-pre-wrap text-dark break-words">
                      {prompt.promptContent}
                    </pre>
                  </div>
                </details>
              </BrutalCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
