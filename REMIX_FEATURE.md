# 🎨 Remix to Research Investigation Feature

## Overview
Convert GEM prompts directly into Research Investigations with a single click. This feature bridges the gap between prompt generation and formal research tracking.

## How It Works

### Step 1: Generate a GEM Prompt
1. Go to **Admin** → **GEM Generator**
2. Enter your research query (e.g., "Adaptive Learning Pathways in Algebra")
3. Click **Generate GEM**
4. Review the generated prompt for Gemini or Perplexity

### Step 2: Remix to Investigation
1. Click the **"Remix to Research"** button (🪄 orange button)
2. A modal opens with pre-filled investigation form:
   - **Title**: Auto-filled from your search query
   - **Description**: Includes context about the AI engine used
   - **Author**: Your name from Google account
   - **Research Type**: Select from dropdown (defaults to "Systematic Literature Review")
   - **Mathematical Area**: Select domain (defaults to "Algebra")

### Step 3: Review & Save
1. Edit any fields as needed
2. All fields marked with * are required
3. Click **"Create Investigation"**
4. Success! Investigation saved to Research Repository

## Auto-Generated Fields

The system automatically populates:

- ✅ **Status**: "In Progress"
- ✅ **Methodology**: Includes AI engine (Gemini/Perplexity) + RLM architecture + prompt excerpt
- ✅ **Key Findings**: Placeholder text indicating research execution pending
- ✅ **Search Keywords**: Extracted from your original query
- ✅ **Databases**: Pre-populated with ["Google Scholar", "ERIC", "ResearchGate", "Semantic Scholar"]
- ✅ **Start Date**: Current timestamp

## Research Types Available

- Systematic Literature Review
- Learning Pattern Analysis
- Content Development
- AI-Powered Pathways
- Student Data Analysis
- Pedagogical Innovation

## Mathematical Areas Available

- Elementary Arithmetic
- Algebra
- Geometry
- Calculus
- Statistics
- Cross-Domain

## Workflow Example

```
User Query: "Formative Assessment in High School Calculus"
    ↓
[Generate GEM]
    ↓
GEM Prompt: "You are orchestrating high-level educational research..."
    ↓
[Remix to Research]
    ↓
Investigation Created:
  - Title: "Formative Assessment in High School Calculus"
  - Description: "Research investigation based on GEMINI prompt..."
  - Type: Systematic Literature Review
  - Area: Calculus
  - Status: In Progress
    ↓
[View in Research Repository]
```

## Benefits

1. **Speed**: Convert prompts to investigations in seconds
2. **Traceability**: Full connection between prompt and investigation
3. **Context Preservation**: Methodology includes AI engine details
4. **No Re-entry**: Auto-fills from existing data
5. **Ready for Research**: Investigation immediately ready for execution

## Next Steps After Creating Investigation

1. Navigate to **Admin** → **Research Repository**
2. Find your newly created investigation
3. Execute the GEM prompt in Gemini/Perplexity
4. Upload results as Scrollytelling Reports
5. Update investigation with key findings

## Authentication Required

⚠️ You must be signed in with an **@alpha.school** Google account to:
- Create investigations
- Save GEM prompts
- Access the Remix feature

If not signed in, the button will prompt you to authenticate first.

## Technical Notes

### Data Flow
```
GEM Generator State
  ↓
Remix Modal (Pre-filled)
  ↓
createInvestigation()
  ↓
Firestore 'investigations' collection
  ↓
Research Repository View
```

### Firestore Collections Used
- **gemPrompts**: Stores generated prompts (optional Save)
- **investigations**: Stores remixed research investigations

### Security
- All operations require @alpha.school authentication
- Write permissions enforced at Firestore level
- User email validated on both frontend and backend

## Troubleshooting

### "You need to sign in" message
→ Click "Remix to Research" and follow Google sign-in prompt

### Form validation errors
→ Ensure all fields marked with * are filled:
  - Title
  - Description
  - Author

### Investigation not appearing
→ Navigate to **Admin** → **Research Repository** to view all investigations

### Permission errors
→ Ensure Firebase rules are deployed (see FIREBASE_SETUP.md)

## Future Enhancements

Potential improvements:
- [ ] AI-powered field extraction from prompt content
- [ ] Suggested mathematical areas based on query
- [ ] Batch creation from multiple prompts
- [ ] Direct link to newly created investigation
- [ ] Template selection for different research types
