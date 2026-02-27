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

const PROCESSING_PROMPT = `You are an expert research synthesizer. Your task is to transform raw research results into a polished, narrative-style research investigation.

OBJECTIVES:
1. Create a coherent, flowing narrative from the source material
2. Preserve ALL citations and references exactly as provided
3. Extract and organize key findings naturally
4. Maintain academic rigor while being readable
5. Structure information logically

OUTPUT FORMAT:
Return a JSON object with these exact fields:

{
  "keyFindings": "A well-structured narrative of 3-5 paragraphs that naturally flows. Include key discoveries, patterns, and insights. Integrate citations naturally using markdown format [Source Title](URL). Make it read like a professional research summary, not bullet points.",

  "methodology": "A clear description of how the research was conducted. Include search strategy, databases used, selection criteria, and analytical approach. 2-3 paragraphs.",

  "impactMetrics": "Quantitative summary: 'X sources analyzed across Y databases, Z key findings identified' or similar concise metrics.",

  "citations": [
    {
      "title": "Exact paper/source title",
      "url": "Full URL",
      "authors": "Author names if available"
    }
  ]
}

GUIDELINES:
- Write in clear, professional academic English
- Use transition words to connect ideas
- Integrate citations naturally: "Research by [Smith et al.](url) demonstrates..."
- Group related findings together
- Highlight contradictions or gaps if present
- Make it engaging and informative
- Preserve all source information exactly
- Be comprehensive but concise

EXAMPLE INTEGRATION:
Bad: "Finding 1: X is true. [Citation]. Finding 2: Y is true. [Citation]."
Good: "Research demonstrates that X is a critical factor in learning outcomes [Smith, 2024](url). This finding is further supported by recent meta-analyses showing Y across diverse contexts [Johnson et al., 2023](url), suggesting a robust cross-cultural pattern."`;

export async function POST(request: NextRequest) {
  try {
    const { resultsText, searchQuery } = await request.json();

    if (!resultsText || !searchQuery) {
      return NextResponse.json(
        { error: 'Missing resultsText or searchQuery' },
        { status: 400 }
      );
    }

    const userPrompt = `# Research Results to Process

## Original Search Query:
"${searchQuery}"

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
