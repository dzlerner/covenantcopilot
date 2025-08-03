-- Fix data type mismatches in database functions
-- This fixes the "double precision vs numeric" error

-- Drop and recreate the enhanced function with correct types
DROP FUNCTION IF EXISTS match_documents_enhanced(vector, float, int, text[], text[]);

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
  similarity double precision,
  tag_boost_score double precision
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
    (1 - (documents.embedding <=> query_embedding))::double precision AS similarity,
    CASE 
      WHEN array_length(boost_tags, 1) > 0 THEN
        ((SELECT COUNT(*) FROM unnest(documents.tags) tag WHERE tag = ANY(boost_tags)) * 0.1)::double precision
      ELSE 0.0::double precision
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

-- Also fix the regular match_documents function
DROP FUNCTION IF EXISTS match_documents(vector, float, int);

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
  similarity double precision
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
    (1 - (documents.embedding <=> query_embedding))::double precision AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;