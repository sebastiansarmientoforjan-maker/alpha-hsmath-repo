import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const DESIGN_BIBLE = `You are a Lead Information Architect & Cognitive Scientist specialized in MBB-style executive consulting.

CRITICAL PRINCIPLES:
1. BLUF (Bottom Line Up Front) - Start with the conclusion
2. Action Headings - [Verb] + [KPI] + [Consequence]
3. SCQA Framework - Situation, Complication, Question, Answer
4. Minto Pyramid - Answer first, then supporting arguments (MECE)
5. Layered Reading (Onion Architecture):
   - Outer Layer: Action headings (0-5 sec)
   - Middle Layer: Visualizations (5-30 sec)
   - Core: Evidence and methodology (deep reading)

COLOR PALETTE (WCAG AAA Compliant):
- Navy Primary: #12436D (Trust, Stability)
- Orange Accent: #D84315 (Urgency, Action items)
- Green Positive: #2E7D32 (Achievements, Goals met)
- Grey Context: #616161 (Secondary information)

SCROLLYTELLING STRUCTURE:
- 5-7 viewports minimum
- Each viewport = One key message
- Fade-in + Slide-up animations via Tailwind + IntersectionObserver
- Integrated text WITHIN visualizations (Spatial Contiguity)

COGNITIVE LOAD OPTIMIZATION:
- Remove "chartjunk" (grids, external legends, unnecessary borders)
- Direct annotations on graphs
- Maximum 10 visual elements per viewport
- Use saturation hierarchy: 100% for critical data, 60% for support, 30% for context

HTML REQUIREMENTS:
- Single file HTML with Tailwind CSS via CDN
- IntersectionObserver for scroll-based animations
- Microlearning sections for technical terms
- QR codes for data traceability
- End with "ROI of Decision" section
- Responsive design (desktop-first, then mobile)`;

export async function POST(request: NextRequest) {
  try {
    const { decisionLog, investigations } = await request.json();

    if (!decisionLog) {
      return NextResponse.json(
        { error: 'Decision log is required' },
        { status: 400 }
      );
    }

    // Initialize AWS Bedrock client
    const awsRegion = process.env.AWS_REGION || 'us-east-1';
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
        { status: 500 }
      );
    }

    const client = new BedrockRuntimeClient({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });

    // Build the comprehensive prompt
    const prompt = `${DESIGN_BIBLE}

**DECISION LOG TO TRANSFORM:**

Title: ${decisionLog.title}
Taxonomy: ${decisionLog.taxonomy}
Status: ${decisionLog.status}
Author: ${decisionLog.author}

Rationale (Full Content):
${decisionLog.rationale}

${investigations && investigations.length > 0 ? `
**LINKED INVESTIGATIONS:**
${investigations.map((inv: any, idx: number) => `
${idx + 1}. ${inv.title}
   Type: ${inv.researchType} | Area: ${inv.mathematicalArea}
   Impact: ${inv.impactMetrics || 'Not specified'}
`).join('\n')}
` : ''}

**YOUR TASK:**

Generate a complete, production-ready HTML scrollytelling report following these steps:

1. AUDIT PHASE (Internal Analysis):
   - Extract the SCQA elements (Situation, Complication, Question, Answer)
   - Identify 3-5 MECE supporting points
   - Determine key data points that need emphasis

2. STORYBOARD (5-7 Viewports):
   Viewport 1: BLUF - The Answer/Decision (Action Heading)
   Viewport 2: Situation - Current state context
   Viewport 3: Complication - The problem/challenge
   Viewport 4-5: Supporting Evidence (from investigations)
   Viewport 6: Implementation/Action Items
   Viewport 7: ROI of Decision

3. HTML GENERATION:
   - Use Tailwind CSS CDN (v3.4)
   - Implement IntersectionObserver for fade-in animations
   - Each viewport = <section> with min-height: 100vh
   - Use the exact color palette specified above
   - Add data-scroll-target attributes for animation triggers
   - Include a fixed progress bar showing scroll position
   - Embed QR code placeholders for data traceability
   - Add microlearning tooltips for technical terms

4. VISUAL STRATEGY:
   - Use text-based "visualizations" with ASCII art or styled divs
   - Implement bar charts/progress bars using Tailwind width utilities
   - Color-code metrics: Green for positive, Orange for action-needed, Grey for context
   - Annotate directly on visual elements

5. FINAL TOUCHES:
   - Smooth scroll behavior
   - Mobile responsive (stack vertically on small screens)
   - Print-friendly CSS
   - Footer with author, date, and data sources

**OUTPUT:**
Return ONLY the complete HTML code. No explanations, no markdown code blocks, just pure HTML starting with <!DOCTYPE html>.

The HTML should be ready to save as a .html file and open in a browser immediately.`;

    const modelId = 'us.anthropic.claude-sonnet-4-20250514-v1:0';

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 16000, // Need more tokens for full HTML
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const htmlContent = responseBody.content?.[0]?.text || '';

    return NextResponse.json({
      html: htmlContent,
      usage: {
        inputTokens: responseBody.usage?.input_tokens || 0,
        outputTokens: responseBody.usage?.output_tokens || 0,
      },
    });
  } catch (error: any) {
    console.error('Error generating scrollytelling:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate scrollytelling' },
      { status: 500 }
    );
  }
}
