'use client';

import { useState } from 'react';
import { BrutalCard, BrutalButton, BrutalInput } from '@/components/ui';
import { Sparkles, Copy, Check, Download } from 'lucide-react';

export default function GemGenerator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePrompt = () => {
    const prompt = `Tu función es orquestar investigaciones educativas de alto nivel para un entorno High School, ejecutando una arquitectura de **"Lectura Activa"** (RLM) y una **Auditoría de Fuentes Ponderadas** antes de generar cualquier output.

**Context:** Alpha School (Adaptive Pathways, Data-Driven, 2x Acceleration).

---

### INPUT DEL USUARIO

**Research Query:** "${searchQuery}"

---

### PROTOCOLO DE EJECUCIÓN (RLM KERNEL)

No respondas de inmediato. Debes ejecutar secuencialmente las siguientes operaciones cognitivas:

#### FASE 1: PEEK & SEARCH (Exploración)

1. **Estrategia:** Genera keywords de búsqueda técnica (ej: "meta-analysis", "effect size") combinadas con el tópico.
2. **Búsqueda:** Utiliza tus herramientas de navegación para encontrar 8-12 fuentes académicas/técnicas potenciales.

#### FASE 2: AUDIT & FILTER (Source Table Evaluation)

**CRÍTICO:** Para cada fuente encontrada, ejecuta el siguiente algoritmo de evaluación *line-by-line*.

**Logic for Reliability Score (Max 10.0):**

Calcula el promedio ponderado usando estos 3 factores exactos:

1. **Recency (50% Weight):** Escala continua donde **Jan 2026 = 10 pts**.
   * *Regla:* Resta 1 punto por cada 3 meses de antigüedad desde Ene 2026.
   * *Ejemplo:* July 2025 = 8.0 | Jan 2025 = 6.0 | Jan 2024 = 2.0.

2. **Type (30% Weight):**
   * **10 pts** = "Hard Data" (Meta-análisis, Estudios empíricos controlados, Estadísticas oficiales).
   * **7 pts** = "Applied Research" (Estudios de caso con data).
   * **5 pts** = "Theory/Framework" (Marcos pedagógicos respaldados).
   * **2 pts** = "Perspectives" (Artículos de opinión, Teoría, Blog posts).

3. **Authority (20% Weight):**
   * Rate 1-10 based on institution/journal reputation (e.g., Nature/ERIC = High).

**Action Threshold:**
* Si \`Final Score\` < 5.0 → **FLAG FOR DESELECTION**.
* Si \`Final Score\` >= 5.0 → **KEEP**.

#### FASE 3: EXTRACT & SYNTHESIZE (Data Processing)

De las fuentes "KEEP", extrae la data mapeándola a los campos relevantes:
* Identifica \`[EVIDENCIA EMPÍRICA]\` (números, % aceleración, effect sizes).
* Identifica \`[MODELOS PEDAGÓGICOS/DIDÁCTICOS]\` (estrategias aplicables).
* Identifica \`[FRAMEWORKS EDUCATIVOS]\` (marcos teóricos respaldados).

---

### OUTPUT FINAL ESPERADO

Debes presentar el resultado en dos partes claras:

#### PARTE 1: SOURCE RELIABILITY MATRIX (Visual Audit)

Genera la tabla de auditoría obligatoria ordenada por Score (Mayor a Menor).

| Source Name | Date | Category | Logic | Reliability Score | Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [Paper Title] | [YYYY-MM] | [Hard Data/Persp] | [1-sentence justification] | **X.X** | [KEEP/DROP] |

**Deselection List (Sources < 5.0):**
* *[Source Name] - Score: X.X (Reason: Too old / Pure opinion)*

---

**INSTRUCCIONES FINALES:**
1. Ejecuta TODAS las fases antes de responder
2. NO omitas la Source Reliability Matrix
3. Ordena las fuentes por Reliability Score (mayor a menor)
4. Incluye justificación clara para cada source`;

    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPrompt = () => {
    const blob = new Blob([generatedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gem-prompt-${searchQuery.slice(0, 50).replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            className="w-full border-4 border-dark px-6 py-5 text-lg bg-white text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue pr-32"
          />
          <BrutalButton
            onClick={generatePrompt}
            disabled={!searchQuery.trim()}
            variant="primary"
            className="absolute right-2 top-2 gap-2"
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
      {generatedPrompt && (
        <BrutalCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark">Generated Prompt</h2>
            <div className="flex gap-2">
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

          <div className="bg-bg-light border-4 border-dark p-4 font-mono text-sm max-h-96 overflow-auto">
            <pre className="whitespace-pre-wrap text-dark">{generatedPrompt}</pre>
          </div>

          <div className="mt-4 p-4 border-4 border-cool-blue bg-cool-blue/10">
            <p className="text-sm font-bold text-dark mb-2">📋 Next Steps:</p>
            <ol className="text-sm text-dark/80 space-y-1 list-decimal list-inside">
              <li>Copy the generated prompt above</li>
              <li>Open <strong>Gemini Deep Research</strong> or <strong>Gemini 2.0 Flash Thinking</strong></li>
              <li>Paste the prompt and run the research</li>
              <li>Wait for Gemini to complete all phases (typically 5-10 minutes)</li>
              <li>Review the <strong>Source Reliability Matrix</strong> with scored sources</li>
              <li>Use the findings to create an investigation in <strong>Research Repository</strong></li>
            </ol>
            <p className="text-xs text-dark/60 mt-3">
              💡 Works for any educational topic: mathematics, pedagogy, didactics, assessment, learning theory, etc.
            </p>
          </div>
        </BrutalCard>
      )}
    </div>
  );
}
