-- Fix database function type mismatches for search functionality
-- This resolves "double precision vs numeric" errors

-- Drop existing functions
DROP FUNCTION IF EXISTS match_documents_enhanced(vector, float, int, text[], text[]);
DROP FUNCTION IF EXISTS match_documents(vector, float, int);

-- Recreate match_documents_enhanced with correct types
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
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.source_url,
    d.pdf_page,
    d.section_title,
    d.tags,
    d.page_range,
    (1 - (d.embedding <=> query_embedding))::double precision AS similarity,
    CASE 
      WHEN array_length(boost_tags, 1) > 0 AND d.tags IS NOT NULL THEN
        (SELECT COUNT(*)::double precision * 0.1 FROM unnest(d.tags) tag WHERE tag = ANY(boost_tags))
      ELSE 0.0::double precision
    END AS tag_boost_score
  FROM documents d
  WHERE 
    (1 - (d.embedding <=> query_embedding)) > match_threshold
    AND (
      array_length(require_tags, 1) IS NULL 
      OR array_length(require_tags, 1) = 0 
      OR (d.tags IS NOT NULL AND d.tags && require_tags)
    )
  ORDER BY 
    (1 - (d.embedding <=> query_embedding)) + 
    CASE 
      WHEN array_length(boost_tags, 1) > 0 AND d.tags IS NOT NULL THEN
        (SELECT COUNT(*) * 0.1 FROM unnest(d.tags) tag WHERE tag = ANY(boost_tags))
      ELSE 0
    END DESC
  LIMIT match_count;
END;
$$;

-- Recreate basic match_documents function
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
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.source_url,
    d.pdf_page,
    d.section_title,
    (1 - (d.embedding <=> query_embedding))::double precision AS similarity
  FROM documents d
  WHERE (1 - (d.embedding <=> query_embedding)) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;