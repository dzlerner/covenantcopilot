# Covenant Copilot RAG System Setup

## Overview

This RAG (Retrieval Augmented Generation) system enables Covenant Copilot to answer questions based on actual HRCA documents and website content, rather than relying solely on ChatGPT's training data.

## Architecture

```
User Question → Vector Search → Relevant Documents → GPT-4o + Context → Informed Answer
```

## Setup Instructions

### 1. Supabase Database Setup

1. Create a Supabase project at https://supabase.com
2. Enable the pgvector extension in your database
3. Run the SQL commands from `scripts/setup-database.sql`

### 2. Environment Variables

Add these to your `.env.local`:

```bash
# Existing
OPENAI_API_KEY=your_openai_api_key_here

# New for RAG
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Document Processing

1. Place your HRCA PDF in `public/documents/ResidentialImprovementGuidelines.pdf`
2. Run the document processing script:

```bash
npm run process-docs
```

This will:
- Parse the PDF into chunks
- Scrape key HRCA web pages
- Generate embeddings for all content
- Store everything in Supabase with vector search

### 4. Testing

The system now uses `/api/ask` instead of `/api/chat` for RAG-powered responses.

## Key Features

### Smart Document Retrieval
- Searches through PDF and web content using semantic similarity
- Returns top 5 most relevant document chunks
- Includes source URLs and page references

### Enhanced Responses
- Answers backed by actual HRCA documents
- Proper citations with clickable links
- Context-aware follow-up questions
- Structured formatting (bullets, bold text, headings)

### Source Transparency
- API responses include metadata about sources used
- Similarity scores for retrieved documents
- Clear attribution in the chat interface

## API Response Format

```json
{
  "message": "AI response with HRCA-specific information...",
  "timestamp": "2024-01-XX:XX:XX.XXXZ",
  "model": "gpt-4o",
  "sources": [
    {
      "content": "Document excerpt...",
      "source_url": "https://hrcaonline.org/...",
      "pdf_page": 15,
      "section_title": "Fence Guidelines",
      "similarity": 0.87
    }
  ],
  "parameters": {
    "rag_enabled": true,
    "sources_found": 3,
    "temperature": 0.2
  }
}
```

## Maintenance

### Regular Updates
- Re-run document processing weekly to capture website updates
- Monitor PDF versions for changes
- Check source URLs for availability

### Performance Monitoring
- Track similarity scores to ensure quality retrieval
- Monitor response times
- Adjust similarity thresholds if needed

## Troubleshooting

### No Results Found
- Check if documents were properly indexed
- Verify Supabase connection
- Adjust similarity threshold (default: 0.75)

### Poor Quality Answers
- Review document chunking strategy
- Check embedding quality
- Verify source document accuracy

### Performance Issues
- Optimize vector index parameters
- Consider chunk size adjustments
- Monitor Supabase query performance

## Development Scripts

```bash
# Process all documents
npm run process-docs

# Build and test
npm run build
npm run dev

# Check database status
npm run check-docs
```

## Security Notes

- Service role key should never be exposed to client
- Documents table has RLS policies enabled
- Vector search is server-side only
- All API keys stored securely in environment variables