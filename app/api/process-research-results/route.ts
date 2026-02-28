import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const PROCESSING_PROMPT = `You are an expert research synthesizer. Your task is to transform raw research results into a polished, structured research investigation.

OBJECTIVES:
1. Extract a clear executive summary as the description
2. Organize key findings with categorical tags
3. Preserve ALL citations with proper attribution
4. Provide clear methodology and impact metrics
5. Maintain academic rigor while being readable

OUTPUT FORMAT:
Return a JSON object with these exact fields:

{
  "suggestedTitle": "A clear, concise title (5-10 words) that captures the main focus of the investigation. Examples: 'Digital SAT Math: 650 to 800 Score Gap Analysis', 'AP Calculus Performance Thresholds and Cognitive Fluencies', 'Structural Fluency in Advanced Algebra Learning'",

  "suggestedMathArea": "One of these exact values: 'Elementary Arithmetic', 'Algebra', 'Geometry', 'Calculus', 'Statistics', 'Cross-Domain'. Choose the most appropriate based on the investigation content.",

  "description": "A single, detailed paragraph (150-250 words) providing an executive summary of the investigation. Explain what the study is about, the main question/problem addressed, the approach taken, and the primary conclusion. Be comprehensive yet concise. Example: 'A detailed psychometric analysis defining the transition from a competence score (650) to a mastery score (800) on the Digital SAT...'",

  "keyFindings": "Structured bullet list of 4-6 key findings. Each bullet must start with a categorical tag in brackets like [PEDAGOGY], [HARD DATA], [STUDENT OUTCOMES], [METHODOLOGY], or [TECHNOLOGY]. After the tag, provide a clear finding title followed by a colon, then a detailed explanation. Include inline citations using [cite: number] format. Format:\n• [TAG] Finding Title: Detailed explanation with evidence [cite: 5, 12].\n• [TAG] Another Finding: More details [cite: 23].\n\nExample:\n• [PEDAGOGY] Structural Fluency vs. Procedural Utility: Level 650 students rely on linear algorithms, while Level 800 students utilize 'conceptual shortcuts' and pattern recognition [cite: 10, 36].\n• [HARD DATA] The Desmos Gap: Strategic use of Desmos is a key differentiator [cite: 166, 170].",

  "methodology": "2-3 paragraph description of how the research was conducted. Include: search strategy, databases/sources used, selection criteria, analytical approach, and any weighting or prioritization methods. Be specific about sources. Example: 'Weighted source audit (Recency 50%, Type 30%, Authority 20%) applied to College Board specifications, official Desmos documentation, and Khan Academy pedagogy...'",

  "impactMetrics": "Concise summary (1-3 sentences) of quantifiable impact or key takeaways. Focus on practical outcomes, cognitive shifts, or strategic advantages identified. Example: 'Defines the specific cognitive sub-skills required to bridge the 650-800 gap. Identifies Technological Arbitrage via Desmos as a primary efficiency driver.'",

  "citations": [
    {
      "title": "Exact paper/source title",
      "url": "Full URL",
      "authors": "Author names or organization if available"
    }
  ]
}

GUIDELINES:
- Description: Write as a single flowing paragraph, not bullets
- Key Findings: Use categorical tags consistently, maintain parallel structure, include cite numbers
- Methodology: Be specific about sources and methods, avoid vague language
- Impact Metrics: Focus on actionable insights and measurable outcomes
- Citations: Extract every unique source mentioned in the raw results
- Preserve all source information exactly as provided
- Use professional academic tone throughout`;

export async function POST(request: NextRequest) {
  try {
    const { resultsText, searchQuery } = await request.json();

    if (!resultsText) {
      return NextResponse.json(
        { error: 'Missing resultsText' },
        { status: 400 }
      );
    }

    const userPrompt = `# Research Results to Process
${searchQuery ? `\n## Original Search Query:\n"${searchQuery}"\n` : ''}
## Raw Research Results:
${resultsText}

---

Please process these research results into a well-structured, narrative-style investigation. Extract all citations, synthesize the findings into flowing paragraphs, and organize the information professionally.

Return ONLY valid JSON with the structure specified in the system prompt. No markdown code blocks, no explanations, just the JSON object.`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `${PROCESSING_PROMPT}\n\n${userPrompt}`,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract the text content
    const content = responseBody.content[0].text;

    // Try to parse as JSON
    let processedData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      processedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', content);
      return NextResponse.json(
        {
          error: 'Failed to parse AI response',
          rawResponse: content,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      processed: processedData,
    });
  } catch (error: any) {
    console.error('Error processing research results:', error);
    return NextResponse.json(
      {
        error: 'Failed to process research results',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
