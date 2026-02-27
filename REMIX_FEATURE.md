# 🎨 Paste Results & Create Investigation Feature

## Overview
This feature allows you to paste research results from Gemini/Perplexity and automatically convert them into structured Research Investigations. The system extracts key findings, citations, and metadata from your results.

## Complete Workflow

### Step 1: Generate a GEM Prompt
1. Go to **Admin** → **GEM Generator**
2. Enter your research query (e.g., "Adaptive Learning Pathways in Algebra")
3. Click **Generate GEM**
4. Review the generated prompt

### Step 2: Execute the Prompt
1. **Copy** the generated prompt (use the Copy button)
2. Open **Gemini Deep Research** or **Perplexity AI**
3. **Paste** and execute the prompt
4. **Wait** for complete results (5-10 minutes)
5. **Copy ALL results** including:
   - Source Reliability Matrix (table with scores)
   - Key findings and conclusions
   - All citations and references
   - Methodology notes

### Step 3: Paste Results & Create Investigation
1. Back in GEM Generator, click **"Paste Results & Save"** (🪄 orange button)
2. A modal opens with a large textarea
3. **Paste your complete results** from Gemini/Perplexity
4. The system shows character/line count for feedback
5. Fill in metadata:
   - **Title**: Pre-filled from query (editable)
   - **Description**: Optional (auto-generated if empty)
   - **Research Type**: Select from dropdown
   - **Mathematical Area**: Select domain
   - **Author**: Your name (auto-filled)

### Step 4: Review & Save
1. System automatically extracts:
   - ✅ Key findings from results
   - ✅ Citations and sources (markdown links)
   - ✅ Paper count (numbered sources)
   - ✅ Methodology details
2. Click **"Create Investigation"**
3. Investigation created with status "Completed"
4. ✅ View in Research Repository

## Auto-Extraction Features

The system intelligently extracts:

### 📊 Key Findings
- Searches for sections labeled: "key findings", "conclusions", "summary", "highlights"
- Falls back to first 500 characters if no section found
- Preserves formatting and structure

### 📚 Citations & Sources
- Detects markdown links: `[Title](URL)`
- Extracts URLs from text
- Creates citation array with title + URL
- Preserves all reference information

### 🔢 Paper Count
- Counts numbered sources (e.g., "1.", "2.", "3.")
- Displays as "X sources analyzed"
- Used for impact metrics

### 🔬 Methodology
- Records AI engine used (Gemini/Perplexity)
- Includes RLM architecture details
- Captures original query
- Notes full results location

## Auto-Generated Fields

Fields automatically populated:

- ✅ **Status**: "Completed" (results are available)
- ✅ **Key Findings**: Extracted from results text
- ✅ **Citations**: Auto-detected markdown links
- ✅ **Paper Count**: Counted from numbered sources
- ✅ **Methodology**: AI engine + RLM + query
- ✅ **Search Keywords**: Extracted from query
- ✅ **Databases**: ["Google Scholar", "ERIC", "ResearchGate", "Semantic Scholar"]
- ✅ **Start Date**: Current timestamp
- ✅ **Completion Date**: Current timestamp

## Research Types Available

- **Systematic Literature Review** (default)
- Learning Pattern Analysis
- Content Development
- AI-Powered Pathways
- Student Data Analysis
- Pedagogical Innovation

## Mathematical Areas Available

- Elementary Arithmetic
- **Algebra** (default)
- Geometry
- Calculus
- Statistics
- Cross-Domain

## Complete Workflow Example

```
1. User Query: "Formative Assessment in High School Calculus"
    ↓
2. [Generate GEM Prompt]
    ↓
3. Copy prompt → Execute in Gemini
    ↓
4. Gemini returns results with:
   - Source Reliability Matrix (8 papers, scores 6.5-9.2)
   - Key Findings (3 paragraphs)
   - Citations (8 markdown links)
    ↓
5. [Paste Results & Save]
    ↓
6. Paste complete Gemini output (2,340 characters)
    ↓
7. System extracts:
   ✓ Key Findings: "Research shows formative assessment..."
   ✓ Citations: 8 papers with URLs
   ✓ Paper Count: 8 sources
    ↓
8. Investigation Created:
   - Title: "Formative Assessment in High School Calculus"
   - Status: Completed
   - Key Findings: [Extracted text]
   - Citations: [8 papers with links]
   - Paper Count: 8
   - Area: Calculus
    ↓
9. [View in Research Repository] ✓
```

## Benefits

1. **Real Research Data**: Captures actual findings, not just prompts
2. **Auto-Extraction**: No manual copying of citations/findings
3. **Complete Traceability**: Full results preserved
4. **Time Savings**: 5-minute manual process → 30 seconds
5. **Data Integrity**: No information lost between tools
6. **Ready for Review**: Creates "Completed" investigations
7. **Structured Storage**: All data queryable in Firestore

## Example Results Format

Paste results in any format. The system handles:

### Markdown Format (Gemini)
```
# Key Findings

Research shows that adaptive learning...

## Source Reliability Matrix

| Source | Score | Action |
| [Paper 1](url1) | 8.5 | KEEP |
| [Paper 2](url2) | 7.2 | KEEP |
```

### Plain Text Format (Perplexity)
```
Key findings:
1. Formative assessment improves...
2. Real-time feedback shows...

Sources:
1. Smith et al. (2023) - https://...
2. Johnson (2024) - https://...
```

Both formats work! The system adapts.

## Next Steps After Creating Investigation

1. Navigate to **Admin** → **Research Repository**
2. Find your investigation (sorted by date)
3. Click "View" to see full details
4. Upload Scrollytelling Reports if available
5. Share with stakeholders

## Authentication Required

⚠️ You must be signed in with an **@alpha.school** Google account to:
- Create investigations
- Paste and save results
- Access Research Repository

## Technical Details

### Data Flow
```
GEM Prompt → AI Engine (Gemini/Perplexity) → Results
    ↓
User copies results
    ↓
Pastes in modal textarea
    ↓
extractCitationsFromResults() → finds [Title](URL)
extractKeyFindings() → finds sections
    ↓
createInvestigation() with extracted data
    ↓
Firestore 'investigations' collection
    ↓
Research Repository View
```

### Extraction Algorithms

**Citations**:
```typescript
// Regex: /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/
// Matches: [Paper Title](https://url.com)
```

**Key Findings**:
```typescript
// Searches: 'key findings', 'conclusions', 'summary'
// Regex: /section[:\s]+([^#]+?)(?=\n#{1,2}|$)/i
```

**Paper Count**:
```typescript
// Regex: /\d+\./g
// Counts: "1.", "2.", "3.", etc.
```

### Firestore Schema
```javascript
{
  title: string,
  description: string,
  researchType: ResearchType,
  mathematicalArea: MathematicalArea,
  status: 'Completed',
  keyFindings: string,        // Extracted
  methodology: string,         // AI engine + query
  impactMetrics: string,       // "X sources analyzed"
  author: string,
  startDate: Timestamp,
  completionDate: Timestamp,
  searchKeywords: string[],    // Split from query
  databases: string[],
  paperCount: number,          // Counted
  citationLinks: Array<{       // Extracted
    title: string,
    url: string,
    authors?: string
  }>
}
```

## Troubleshooting

### "Please paste the research results first"
→ You must paste results in the textarea before creating

### No citations extracted
→ Ensure results include markdown links `[Title](URL)`
→ Or paste URLs directly in results

### Key findings seem truncated
→ System looks for section headers
→ Fallback: uses first 500 chars
→ Manually edit in Research Repository if needed

### Investigation not appearing
→ Check **Admin** → **Research Repository**
→ Sort by date (newest first)
→ Verify Firestore rules are deployed

### Character limit concerns
→ No hard limit on textarea
→ Firestore supports up to 1MB per field
→ Paste complete results without worry

## Best Practices

1. **Paste Complete Results**: Include everything from Gemini/Perplexity
2. **Don't Edit Results**: Paste raw output for best extraction
3. **Use Markdown Links**: Format `[Title](URL)` for best citation detection
4. **Include Matrix**: The Source Reliability Matrix is especially valuable
5. **Verify Title**: Edit pre-filled title if needed
6. **Add Description**: Optional but helpful for context

## Future Enhancements

Potential improvements:
- [ ] AI-powered citation parsing (authors, year, journal)
- [ ] Support for PDF paste
- [ ] Multi-language results support
- [ ] Custom extraction rules
- [ ] Batch paste (multiple investigations)
- [ ] Direct API integration with Gemini/Perplexity
- [ ] Auto-categorization of mathematical area from content
- [ ] Suggested tags based on findings
