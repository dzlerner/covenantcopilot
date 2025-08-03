-- Enhanced database schema for improved RAG accuracy
-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing table if you want to recreate with new schema
-- DROP TABLE IF EXISTS documents;

-- Create enhanced documents table with tags and metadata
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small produces 1536-dimensional vectors
  source_url TEXT,
  pdf_page INTEGER,
  section_title TEXT,
  tags TEXT[], -- Array of tags for boosting/filtering
  page_range TEXT, -- Page range information
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index for fast similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for tag-based filtering
CREATE INDEX IF NOT EXISTS documents_tags_idx ON documents USING GIN (tags);

-- Create index for section filtering
CREATE INDEX IF NOT EXISTS documents_section_idx ON documents (section_title);

-- Enhanced function for similarity search with tag boosting
CREATE OR REPLACE FUNCTION match_documents_enhanced (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5,
  boost_tags text[] DEFAULT '{}',
  require_tags text[] DEFAULT '{}'
)
RETURNS TABLE (
  id uuid,
  content text,
  source_url text,
  pdf_page integer,
  section_title text,
  tags text[],
  page_range text,
  similarity float,
  tag_boost_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.source_url,
    documents.pdf_page,
    documents.section_title,
    documents.tags,
    documents.page_range,
    1 - (documents.embedding <=> query_embedding) AS similarity,
    CASE 
      WHEN array_length(boost_tags, 1) > 0 THEN
        (SELECT COUNT(*) FROM unnest(documents.tags) tag WHERE tag = ANY(boost_tags)) * 0.1
      ELSE 0
    END AS tag_boost_score
  FROM documents
  WHERE 
    1 - (documents.embedding <=> query_embedding) > match_threshold
    AND (
      array_length(require_tags, 1) IS NULL 
      OR array_length(require_tags, 1) = 0 
      OR documents.tags && require_tags
    )
  ORDER BY 
    (1 - (documents.embedding <=> query_embedding)) + 
    CASE 
      WHEN array_length(boost_tags, 1) > 0 THEN
        (SELECT COUNT(*) FROM unnest(documents.tags) tag WHERE tag = ANY(boost_tags)) * 0.1
      ELSE 0
    END DESC
  LIMIT match_count;
END;
$$;

-- Original function for backward compatibility
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  source_url text,
  pdf_page integer,
  section_title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.source_url,
    documents.pdf_page,
    documents.section_title,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to detect potential rule conflicts
CREATE OR REPLACE FUNCTION detect_rule_conflicts(
  content_array text[]
)
RETURNS TABLE (
  conflict_type text,
  description text,
  affected_content text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for fence color conflicts
  IF EXISTS (
    SELECT 1 FROM unnest(content_array) AS content 
    WHERE content ILIKE '%highlands ranch brown%'
  ) AND EXISTS (
    SELECT 1 FROM unnest(content_array) AS content 
    WHERE content ILIKE '%natural wood tones%'
  ) THEN
    RETURN QUERY SELECT 
      'fence_color_conflict'::text,
      'Documents mention both "Highlands Ranch Brown" and "natural wood tones" requirements'::text,
      ARRAY(
        SELECT content FROM unnest(content_array) AS content 
        WHERE content ILIKE '%highlands ranch brown%' OR content ILIKE '%natural wood tones%'
      );
  END IF;
  
  -- Check for approval requirement conflicts
  IF EXISTS (
    SELECT 1 FROM unnest(content_array) AS content 
    WHERE content ILIKE '%no approval required%'
  ) AND EXISTS (
    SELECT 1 FROM unnest(content_array) AS content 
    WHERE content ILIKE '%approval required%' OR content ILIKE '%arc approval%'
  ) THEN
    RETURN QUERY SELECT 
      'approval_conflict'::text,
      'Documents contain conflicting approval requirements'::text,
      ARRAY(
        SELECT content FROM unnest(content_array) AS content 
        WHERE content ILIKE '%approval%'
      );
  END IF;
  
  RETURN;
END;
$$;