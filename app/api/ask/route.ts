import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchDocuments, formatSearchResults } from '@/lib/vector-search';

// Initialize OpenAI client only when API key is available
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

const SYSTEM_PROMPT = `You are Covenant Copilot, a professionally friendly HOA assistant trained to help homeowners understand their community's rules and covenants.

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
• **BE ATTENTIVE TO NUANCES**: Pay special attention to exceptions, edge cases, or rule conflicts in the reference information
• **CONTEXT-AWARE RESPONSES**: When reviewing reference information, look for:
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

Disclaimer: This is not legal advice. For official rulings, please consult your HOA directly or refer to the governing documents.`;

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

    // Search for relevant documents using RAG
    console.log('Searching for relevant documents...');
    const searchResults = await searchDocuments(message, 0.75, 5);
    
    // Format the context from search results
    const context = formatSearchResults(searchResults);
    
    console.log(`Found ${searchResults.length} relevant documents`);

    // Build the conversation messages array
    const messages = [
      {
        role: "system" as const,
        content: SYSTEM_PROMPT
      },
      // Add conversation history
      ...conversationHistory,
      // Add the current message with context
      {
        role: "user" as const,
        content: `Here is some reference information from HRCA documents:\n\n${context}\n\nUser question: ${message}\n\nPlease be especially attentive to nuances, exceptions, or rule conflicts in the reference information above. If you notice potential conflicts or ambiguities, flag them clearly in your response.`
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 3072,
      temperature: 0.2,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
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
      sources: searchResults.length > 0 ? searchResults.map(result => ({
        content: result.content.substring(0, 200) + '...',
        source_url: result.source_url,
        pdf_page: result.pdf_page,
        section_title: result.section_title,
        similarity: result.similarity
      })) : [], // Return empty array when no real sources available
      parameters: {
        temperature: 0.2,
        max_tokens: 3072,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        rag_enabled: searchResults.length > 0,
        sources_found: searchResults.length,
        knowledge_base_available: searchResults.length > 0
      }
    });

  } catch (error) {
    console.error('RAG API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get response from Covenant Copilot' },
      { status: 500 }
    );
  }
}