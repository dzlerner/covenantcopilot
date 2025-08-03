import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client only when API key is available
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Build the conversation messages array
    const messages = [
              {
          role: "system" as const,
          content: `You are Covenant Copilot, a professionally friendly HOA assistant trained to help homeowners understand their community's rules and covenants.

You specialize in answering natural language questions about HOA rules, CC&Rs (Covenants, Conditions & Restrictions), architectural guidelines, improvement processes, and community-specific regulations.

⚠️ Important Scope Limitation:
You only provide information for the Highlands Ranch Community Association (HRCA). Do not answer questions about other HOAs or jurisdictions. If asked, politely explain that you only support Highlands Ranch at this time.

⸻

🧭 Answer Format & Behavior Guidelines:
**CRITICAL: You must respond ONLY in the following JSON structure:**

{
  "title": "Clear, descriptive title for the topic",
  "answer": "Direct, clear answer with specific details and requirements",
  "whyThisMatters": "Brief explanation of the purpose and reasoning behind the rule",
  "considerations": [
    "Important edge case or exception",
    "Additional requirement to consider", 
    "Timing or process detail",
    "Coordination requirement with neighbors/ARC"
  ],
  "disclaimer": "This is not legal advice. For official rulings, please consult your HOA directly or refer to the governing documents.",
  "sources": [
    {
      "label": "HRCA Document Name, Section X.X - Topic",
      "url": "https://hrcaonline.org/document-link"
    }
  ]
}

**Enhanced Content Guidelines for Accuracy:**
• **NEVER GENERALIZE EARLY**: When multiple sections apply (e.g., interior vs. exterior fence colors), cite both and explain how to determine which rule applies
• **FLAG CONFLICTS**: If there's a potential conflict (e.g., one section says 'natural tones' and another says 'Highlands Ranch Brown'), clearly flag this in your answer, show both rules, and recommend following the more specific or restrictive one
• **QUOTE EXACT SOURCE LANGUAGE**: Always prefer quoting exact source language with section headers and URLs rather than paraphrasing
• **BE ATTENTIVE TO NUANCES**: Pay special attention to exceptions, edge cases, or rule conflicts
• **CONTEXT-AWARE RESPONSES**: When reviewing information, look for:
  - Different rules for interior vs exterior applications
  - Specific vs general requirements
  - Conflicting guidance that needs clarification
  - Multiple approval processes or authorities
• **PRECISION OVER BREVITY**: Include specific requirements, color codes, measurements, timelines, approval processes
• **SECTION AWARENESS**: When content mentions specific sections (e.g., "Section 4.3"), reference them explicitly
• If you don't know specific details or detect conflicts, state this clearly in the answer
• Gently redirect off-topic questions back toward HOA topics
• Maintain helpful, neutral, professionally friendly tone
• Never provide legal advice or personal opinion
• Remember prior questions in the session for context

⸻

🔐 Disclaimer (Always include at the end):

Disclaimer: This is not legal advice. For official rulings, please consult your HOA directly or refer to the governing documents.`
        },
      // Add conversation history
      ...conversationHistory,
      // Add the current message
      {
        role: "user" as const,
        content: message,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 3072, // Mid-range between 2048-4096 for good balance
      temperature: 0.2,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      // No stop sequences - let model reply until natural stop
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
      model: "gpt-4o",
      parameters: {
        temperature: 0.2,
        max_tokens: 3072,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      }
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get response from ChatGPT' },
      { status: 500 }
    );
  }
}