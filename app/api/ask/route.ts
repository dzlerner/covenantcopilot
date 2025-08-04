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

📄 **PRIORITY KNOWLEDGE SOURCE:**
When answering questions about rules, covenants, architectural guidelines, or improvement requirements, prioritize information from the HRCA Residential Improvement Guidelines (RIG) PDF above all other sources. This is the official, authoritative document containing current HRCA rules and should be your primary reference for all rule-related queries.

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

🔍 **RESPONSE QUALITY ASSURANCE:**
After formulating your response, perform this critical self-evaluation:
1. **Completeness Check**: Does this response fully answer the homeowner's question? 
2. **Source Quality**: Is this information from the most authoritative source available (preferably the RIG PDF)?
3. **Satisfaction Test**: If you were the homeowner, would this response satisfy your question completely?
4. **Missing Information**: Is there additional relevant information that could be found in the source documents?
5. **Exploration Depth**: Have you explored all relevant sections and potential edge cases, not just the first information found?

If your initial response doesn't meet these standards, revise it to be more comprehensive and authoritative.

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

    // Search for relevant documents using RAG (with fallback for database issues)
    console.log('Searching for relevant documents...');
    let searchResults = [];
    let context = '';
    
    try {
      searchResults = await searchDocuments(message, 0.5, 8); // Lowered threshold, increased results
      context = formatSearchResults(searchResults);
      console.log(`Found ${searchResults.length} relevant documents`);
    } catch (error) {
      console.warn('Vector search failed, using fallback mode:', error);
      context = 'Database connection unavailable. Responding with general HOA guidance.';
      searchResults = [];
    }

    // Build the conversation messages array
    const messages = [
      {
        role: "system" as const,
        content: SYSTEM_PROMPT
      },
      // Add conversation history
      ...conversationHistory,
      // Add the current message with context (adapted for fallback mode)
      {
        role: "user" as const,
        content: searchResults.length > 0 
          ? `Here is some reference information from HRCA documents:\n\n${context}\n\nUser question: ${message}\n\nPlease be especially attentive to nuances, exceptions, or rule conflicts in the reference information above. If you notice potential conflicts or ambiguities, flag them clearly in your response. If the reference information doesn't contain sufficient detail to fully answer the question, acknowledge this and direct the user to consult the complete HRCA Residential Improvement Guidelines PDF for comprehensive requirements.`
          : `Database connection unavailable - please provide general guidance for this HOA question:\n\n${message}\n\nNote: Specific document references are not available due to database connectivity issues. Please provide helpful general guidance and recommend contacting the HOA directly or reviewing the HRCA Residential Improvement Guidelines PDF for specific requirements.`
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 3072,
      temperature: 0.4, // Increased for more exploratory responses
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
      })) : [
        // Always provide RIG PDF as fallback source
        {
          content: "For complete and detailed requirements, refer to the official HRCA Residential Improvement Guidelines",
          source_url: "https://hrcaonline.org/Portals/0/Documents/covenants/2025-06_ResidentialmprovementGuidelines.pdf?ver=3ZUlKLMOpiB58cPyCpGDJw%3d%3d",
          pdf_page: null,
          section_title: "HRCA Residential Improvement Guidelines",
          similarity: 1.0
        }
      ],
      parameters: {
        temperature: 0.4,
        max_tokens: 3072,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        rag_enabled: searchResults.length > 0,
        sources_found: searchResults.length,
        knowledge_base_available: searchResults.length > 0,
        fallback_mode: searchResults.length === 0
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