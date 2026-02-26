# Investigation JSON Import Format

Esta documentación describe el formato JSON esperado para importar investigaciones al sistema Alpha Math Research Hub.

## Estructura del JSON

```json
{
  "title": "Título de la investigación",
  "description": "Resumen ejecutivo de la investigación",
  "researchType": "Systematic Literature Review",
  "mathematicalArea": "Algebra",
  "status": "In Progress",
  "keyFindings": "Principales hallazgos de la investigación",
  "methodology": "Descripción de cómo se realizó el análisis",
  "author": "Nombre del autor",
  "startDate": "2025-01-15",
  "completionDate": "2025-02-20",
  "impactMetrics": "2x acceleration in concept mastery",
  "searchKeywords": ["keyword1", "keyword2", "keyword3"],
  "databases": ["Google Scholar", "ERIC", "JSTOR"],
  "paperCount": 38,
  "citationLinks": [
    {
      "title": "Título del paper",
      "authors": "Autores del paper",
      "url": "https://doi.org/..."
    }
  ]
}
```

## Campos Requeridos

Estos campos son **obligatorios** y deben estar presentes en el JSON:

- **`title`** (string): Título de la investigación
- **`description`** (string): Resumen ejecutivo o descripción general
- **`researchType`** (string): Tipo de investigación. Valores permitidos:
  - `"Systematic Literature Review"`
  - `"Learning Pattern Analysis"`
  - `"Content Development"`
  - `"AI-Powered Pathways"`
  - `"Student Data Analysis"`
  - `"Pedagogical Innovation"`
- **`mathematicalArea`** (string): Área matemática. Valores permitidos:
  - `"Elementary Arithmetic"`
  - `"Algebra"`
  - `"Geometry"`
  - `"Calculus"`
  - `"Statistics"`
  - `"Cross-Domain"`
- **`status`** (string): Estado de la investigación. Valores permitidos:
  - `"In Progress"`
  - `"Completed"`
  - `"Published"`
- **`keyFindings`** (string): Principales descubrimientos o hallazgos
- **`methodology`** (string): Cómo se realizó el análisis
- **`author`** (string): Autor de la investigación
- **`startDate`** (string): Fecha de inicio en formato `YYYY-MM-DD`

## Campos Opcionales

Estos campos son **opcionales** y pueden omitirse:

- **`completionDate`** (string): Fecha de finalización en formato `YYYY-MM-DD`
- **`impactMetrics`** (string): Métricas de impacto (ej: "2x acceleration in concept mastery")
- **`searchKeywords`** (array de strings): Keywords usados en búsqueda de literatura
- **`databases`** (array de strings): Bases de datos consultadas
- **`paperCount`** (number): Número de papers revisados
- **`citationLinks`** (array de objetos): Citaciones clave con la estructura:
  - `title` (string, requerido): Título del paper
  - `url` (string, requerido): URL o DOI del paper
  - `authors` (string, opcional): Autores del paper

## Ejemplos Completos

### Ejemplo 1: Revisión Sistemática de Literatura

```json
{
  "title": "Systematic Review: Inquiry-Based Learning in Algebra",
  "description": "Comprehensive analysis of 38 academic papers investigating the effectiveness of inquiry-based learning approaches in 8th grade algebra instruction.",
  "researchType": "Systematic Literature Review",
  "mathematicalArea": "Algebra",
  "status": "Completed",
  "keyFindings": "Literature shows that inquiry-based learning improves retention by 1.5x compared to direct instruction, but requires structured scaffolding for optimal results. Students with strong foundational skills benefit most from this approach.",
  "methodology": "Systematic search across Google Scholar, ERIC, and JSTOR using keywords 'inquiry-based learning', 'algebra', '8th grade', 'retention', and 'conceptual understanding'. Applied inclusion criteria: peer-reviewed, published 2015-2025, quantitative or mixed-methods studies.",
  "impactMetrics": "1.5x retention improvement across 12 randomized controlled trials",
  "searchKeywords": [
    "inquiry-based learning",
    "algebra",
    "8th grade",
    "retention",
    "conceptual understanding"
  ],
  "databases": [
    "Google Scholar",
    "ERIC",
    "JSTOR",
    "ResearchGate"
  ],
  "paperCount": 38,
  "citationLinks": [
    {
      "title": "Inquiry Methods in Algebra Instruction: A Meta-Analysis",
      "authors": "Smith, J., & Johnson, M. (2023)",
      "url": "https://doi.org/10.1234/example1"
    },
    {
      "title": "Scaffolding Strategies for Inquiry-Based Math Learning",
      "authors": "García, L. et al. (2024)",
      "url": "https://doi.org/10.1234/example2"
    },
    {
      "title": "Comparing Instructional Approaches in Middle School Algebra",
      "authors": "Chen, W., & Park, S. (2022)",
      "url": "https://doi.org/10.1234/example3"
    }
  ],
  "author": "Sebastian Sarmiento",
  "startDate": "2025-01-15",
  "completionDate": "2025-02-20"
}
```

### Ejemplo 2: Análisis de Patrones de Aprendizaje

```json
{
  "title": "Learning Pattern Analysis: Quadratic Functions Mastery",
  "description": "AI-powered analysis of student performance data to identify common misconceptions and optimal learning pathways for quadratic functions in Algebra 2.",
  "researchType": "Learning Pattern Analysis",
  "mathematicalArea": "Algebra",
  "status": "Published",
  "keyFindings": "Students who master vertex form before standard form show 2.3x faster progression to factoring. Common misconception: confusing vertex coordinates with axis of symmetry location.",
  "methodology": "Analyzed 450 student submissions across 12 weeks using Claude AI to identify error patterns, misconception clusters, and successful learning sequences. Applied k-means clustering to group similar error types.",
  "impactMetrics": "2.3x faster progression when teaching vertex form first",
  "author": "Sebastian Sarmiento",
  "startDate": "2024-11-01",
  "completionDate": "2025-01-10"
}
```

### Ejemplo 3: Desarrollo de Contenido

```json
{
  "title": "Adaptive Content Development: Trigonometry Scaffolding",
  "description": "Design and validation of adaptive learning content for trigonometric identities with personalized difficulty progression.",
  "researchType": "Content Development",
  "mathematicalArea": "Calculus",
  "status": "In Progress",
  "keyFindings": "Preliminary results show adaptive scaffolding reduces completion time by 40% while maintaining mastery levels above 85%.",
  "methodology": "Created 3 difficulty tiers with AI-generated practice problems. Student progression determined by performance on checkpoint assessments. Pilot tested with 2 sections (n=48).",
  "author": "Sebastian Sarmiento",
  "startDate": "2025-02-01"
}
```

## Uso del Import

1. Prepara tu archivo JSON siguiendo el formato especificado
2. En la página **Research Repository** (`/admin/research`), haz clic en el botón **"Import JSON"**
3. Selecciona tu archivo `.json`
4. El sistema validará la estructura y pre-llenará el formulario
5. Revisa los datos importados y edita si es necesario
6. Haz clic en **"Create Investigation"** para guardar

## Validaciones

El sistema validará:

- ✅ Todos los campos requeridos están presentes
- ✅ Los valores de `researchType`, `mathematicalArea`, y `status` son válidos
- ✅ El formato de fechas es correcto (`YYYY-MM-DD`)
- ✅ Los arrays tienen la estructura correcta
- ✅ Las citaciones incluyen al menos `title` y `url`

Si hay errores de validación, recibirás un mensaje específico indicando qué corregir.

## Integración con IA (Gemini, Claude, etc.)

Puedes pedirle a un asistente de IA que genere investigaciones en este formato:

```
Prompt sugerido:
"Genera una revisión sistemática de literatura sobre [tema]
en formato JSON siguiendo esta estructura: [pega la estructura de arriba].
Incluye entre 5-10 citaciones clave con títulos, autores y URLs reales."
```

El JSON generado por la IA puede importarse directamente al sistema.
