import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

export async function POST(request: NextRequest) {
  try {
    const { decisionText, investigations } = await request.json();

    if (!decisionText) {
      return NextResponse.json(
        { error: 'Decision text is required' },
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

    // Build the prompt
    let prompt = `You are a research documentation specialist. Your task is to create a coherent, integrated narrative that combines a pedagogical decision with related research investigations.

**DECISION DOCUMENT:**
${decisionText}

`;

    if (investigations && investigations.length > 0) {
      prompt += `\n**RELATED RESEARCH INVESTIGATIONS:**\n\n`;
      investigations.forEach((inv: any, idx: number) => {
        prompt += `### Investigation ${idx + 1}: ${inv.title}\n`;
        prompt += `**Type:** ${inv.researchType} | **Area:** ${inv.mathematicalArea}\n\n`;
        if (inv.description) prompt += `**Summary:** ${inv.description}\n\n`;
        if (inv.keyFindings) prompt += `**Key Findings:**\n${inv.keyFindings}\n\n`;
        if (inv.impactMetrics) prompt += `**Impact:** ${inv.impactMetrics}\n\n`;
        if (inv.methodology) prompt += `**Methodology:** ${inv.methodology}\n\n`;
        prompt += `---\n\n`;
      });
    }

    prompt += `\n**YOUR TASK:**
Create a single, integrated narrative document that:
1. Preserves ALL the content from the decision document
2. Naturally weaves in references to the research investigations where relevant
3. Uses phrases like "As demonstrated in [Investigation Title]..." or "This aligns with findings from..."
4. Maintains the original structure but enhances it with research context
5. Creates smooth transitions between the decision rationale and supporting research
6. Ends with a "Research Foundation" section that summarizes how the investigations inform this decision

**OUTPUT FORMAT:**
Return ONLY the integrated markdown document. Do NOT add meta-commentary or explanations.
Start directly with the content using appropriate markdown headers (##, ###).`;

    // Prepare request for Claude on Bedrock
    // Use inference profile for cross-region access
    const modelId = 'us.anthropic.claude-sonnet-4-20250514-v1:0'; // Claude Sonnet 4 inference profile

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 8000,
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

    // Call Bedrock
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract the response text
    const responseText = responseBody.content?.[0]?.text || '';

    return NextResponse.json({
      integratedText: responseText,
      usage: {
        inputTokens: responseBody.usage?.input_tokens || 0,
        outputTokens: responseBody.usage?.output_tokens || 0,
      },
    });
  } catch (error: any) {
    console.error('Error calling AWS Bedrock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to integrate content' },
      { status: 500 }
    );
  }
}
