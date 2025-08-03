-- Helper functions for crawl status monitoring

-- Function to get top external domains
CREATE OR REPLACE FUNCTION get_top_external_domains(
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  domain TEXT,
  link_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN dl.url LIKE 'http://%' THEN split_part(split_part(dl.url, '://', 2), '/', 1)
      WHEN dl.url LIKE 'https://%' THEN split_part(split_part(dl.url, '://', 2), '/', 1)
      ELSE 'unknown'
    END as domain,
    COUNT(*) as link_count
  FROM discovered_links dl
  WHERE dl.link_type = 'external'
  GROUP BY domain
  ORDER BY link_count DESC
  LIMIT limit_count;
END;
$$;

-- Function to create helper functions if they don't exist (for backward compatibility)
CREATE OR REPLACE FUNCTION create_helper_functions_if_not_exists()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function exists just to ensure the get_top_external_domains function is available
  -- It will be called by the status checker to ensure all required functions exist
  NULL;
END;
$$;