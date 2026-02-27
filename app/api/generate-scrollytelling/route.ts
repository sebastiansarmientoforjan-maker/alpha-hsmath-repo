import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const DESIGN_BIBLE = `You are a world-class UX Designer & Information Architect creating modern, elegant ScrollyTelling experiences.

MODERN DESIGN PRINCIPLES:
- Clean, spacious layouts with generous whitespace
- Dark theme with elegant gradients and subtle animations
- Professional typography (Inter + JetBrains Mono)
- Smooth scroll-based reveal animations
- Glass-morphism effects (backdrop-blur)
- Minimalist approach: less is more

COLOR PALETTE (Modern Dark Theme):
- Background: #0F1115 (Deep dark)
- Surface: #181B21 (Card backgrounds)
- Navy Primary: #12436D (Trust, depth)
- Cyan Accent: #22D3EE (Modern, tech)
- Alert Orange: #D84315 (Urgency)
- Success Green: #2E7D32 (Positive)
- Text: #E0E0E0 (High contrast)
- Muted: #9CA3AF (Secondary text)

TYPOGRAPHY:
- Headings: Inter, bold weights (font-black for hero)
- Body: Inter, regular/medium
- Code/Data: JetBrains Mono, monospace
- Generous line-height (leading-relaxed)
- Large font sizes: text-7xl, text-5xl, text-3xl

SPACING (Be generous!):
- Sections: py-24 (96px vertical padding)
- Cards: p-8, gap-8
- Between elements: mb-8, mt-8, gap-6
- Grid gaps: gap-12, gap-16
- Never cramped - always breathable

VISUAL EFFECTS:
- Backdrop blur: backdrop-blur-md on cards
- Subtle shadows: shadow-xl, shadow-2xl
- Gradients: from-navy via-cyan-500 to-success
- Border glow: border with opacity (border-white/10)
- Rounded corners: rounded-2xl, rounded-xl
- Smooth transitions: transition-all duration-300

SCROLL ANIMATIONS:
- Use IntersectionObserver for reveal-on-scroll
- Opacity fade-in: opacity-0 → opacity-100
- Slide up: translate-y-8 → translate-y-0
- Stagger animations for lists
- Smooth, professional timing (duration-700)

LAYOUT STRUCTURE:
- Hero section: Full viewport with gradient background
- Content sections: Max-width containers (max-w-6xl, max-w-4xl)
- Grid layouts: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Sticky progress indicator
- Generous padding: px-6, py-24

HTML TEMPLATE REQUIREMENTS:
- Tailwind CSS CDN v3.4 (with all utilities)
- Inter font from Google Fonts
- JetBrains Mono for monospace
- IntersectionObserver for scroll animations
- Responsive: mobile-first with md: and lg: breakpoints
- Single self-contained HTML file
- Smooth scroll behavior

CONTENT ARCHITECTURE:
1. Hero: Large title, subtitle, scroll indicator
2. BLUF Section: Key finding in large type
3. Context sections with generous spacing
4. Data visualizations with text-based charts
5. Supporting evidence in cards
6. Final section: Call-to-action or summary

NEVER:
- Cramped layouts
- Small fonts
- Lack of whitespace
- Harsh borders
- Dated designs
- Light theme (always dark)

ALWAYS:
- Generous spacing everywhere
- Large, readable text
- Smooth animations
- Modern aesthetic
- Professional polish
- Elegant simplicity`;

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

Generate a stunning, modern HTML ScrollyTelling experience with the aesthetic quality of premium design systems.

**HTML STRUCTURE TEMPLATE:**
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Decision Title]</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #0F1115; color: #E0E0E0; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .reveal { opacity: 0; transform: translateY(2rem); transition: all 0.7s; }
        .reveal.active { opacity: 1; transform: translateY(0); }
        html { scroll-behavior: smooth; }
    </style>
</head>
<body class="antialiased selection:bg-navy selection:text-white">
    <!-- Hero Section -->
    <section class="min-h-screen flex items-center justify-center py-24 px-6 bg-gradient-to-b from-navy/20 to-transparent">
        <div class="max-w-6xl mx-auto text-center space-y-8">
            <h1 class="text-7xl md:text-9xl font-black leading-tight tracking-tighter">
                [Main Title]
            </h1>
            <p class="text-2xl md:text-3xl text-muted leading-relaxed max-w-4xl mx-auto">
                [Subtitle/BLUF]
            </p>
            <div class="flex items-center justify-center gap-4 mt-16">
                <div class="text-cyan-400 text-6xl font-black">[Key Metric]</div>
                <div class="text-muted">[Metric Label]</div>
            </div>
        </div>
    </section>

    <!-- Content Sections (repeat with generous spacing) -->
    <section class="py-24 px-6">
        <div class="max-w-4xl mx-auto space-y-16">
            <h2 class="text-5xl md:text-7xl font-black tracking-tight">
                [Section Title]
            </h2>
            <div class="space-y-8">
                <p class="text-xl leading-relaxed text-text">
                    [Content with generous line-height]
                </p>
            </div>
        </div>
    </section>

    <!-- Data Visualization (text-based with modern styling) -->
    <section class="py-24 px-6">
        <div class="max-w-6xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="p-8 rounded-2xl bg-surface/30 backdrop-blur-md border border-white/10">
                    <div class="text-4xl font-black text-success mb-4">[Metric]</div>
                    <div class="text-muted">[Label]</div>
                </div>
                <!-- Repeat cards -->
            </div>
        </div>
    </section>

    <script>
        // IntersectionObserver for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('active');
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    </script>
</body>
</html>
```

**REQUIREMENTS:**
1. Use the template above as base structure
2. Add "reveal" class to elements for scroll animations
3. Use generous spacing: py-24, mb-16, gap-12
4. Large text: text-7xl for headings, text-xl for body
5. Cards with: rounded-2xl, backdrop-blur-md, border-white/10
6. Gradients for visual interest
7. Monospace font for data/metrics
8. Responsive breakpoints: md: and lg:
9. 6-8 sections total, each focusing on one idea
10. Footer with author/date

**OUTPUT:**
Return ONLY the complete HTML code. No markdown blocks, just pure HTML starting with <!DOCTYPE html>.
Make it beautiful, spacious, and modern - like a premium tech product.

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
