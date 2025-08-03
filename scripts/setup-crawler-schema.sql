-- Enhanced database schema for comprehensive web crawling
-- This extends the existing documents table and adds crawling metadata

-- Add crawling metadata to existing documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS crawled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS response_status INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS page_title TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Create table for tracking discovered links
CREATE TABLE IF NOT EXISTS discovered_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  source_url TEXT, -- Where this link was found
  link_type TEXT CHECK (link_type IN ('internal', 'external', 'email', 'tel', 'file')),
  link_text TEXT, -- Anchor text
  is_processed BOOLEAN DEFAULT FALSE,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_crawl_attempt TIMESTAMP WITH TIME ZONE,
  crawl_status TEXT CHECK (crawl_status IN ('pending', 'success', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS discovered_links_url_idx ON discovered_links (url);
CREATE INDEX IF NOT EXISTS discovered_links_type_idx ON discovered_links (link_type);
CREATE INDEX IF NOT EXISTS discovered_links_processed_idx ON discovered_links (is_processed);
CREATE INDEX IF NOT EXISTS discovered_links_status_idx ON discovered_links (crawl_status);

-- Create table for crawl sessions to track progress
CREATE TABLE IF NOT EXISTS crawl_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_pages_discovered INTEGER DEFAULT 0,
  pages_processed INTEGER DEFAULT 0,
  pages_successful INTEGER DEFAULT 0,
  pages_failed INTEGER DEFAULT 0,
  internal_links_found INTEGER DEFAULT 0,
  external_links_found INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  error_message TEXT
);

-- Create table for robots.txt and crawl policies
CREATE TABLE IF NOT EXISTS crawl_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  robots_txt TEXT,
  last_robots_check TIMESTAMP WITH TIME ZONE,
  crawl_delay INTEGER DEFAULT 1000, -- milliseconds
  user_agent TEXT DEFAULT 'CovenantCopilot/1.0',
  respect_robots BOOLEAN DEFAULT TRUE,
  max_pages_per_session INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default policy for hrcaonline.org
INSERT INTO crawl_policies (domain, crawl_delay, max_pages_per_session) 
VALUES ('hrcaonline.org', 2000, 500)
ON CONFLICT (domain) DO UPDATE SET
  crawl_delay = EXCLUDED.crawl_delay,
  max_pages_per_session = EXCLUDED.max_pages_per_session,
  updated_at = timezone('utc'::text, now());

-- Function to get pending URLs for crawling
CREATE OR REPLACE FUNCTION get_pending_crawl_urls(
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  url TEXT,
  source_url TEXT,
  link_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dl.url,
    dl.source_url,
    dl.link_type
  FROM discovered_links dl
  WHERE dl.crawl_status = 'pending' 
    AND dl.link_type = 'internal'
    AND (dl.last_crawl_attempt IS NULL OR dl.last_crawl_attempt < NOW() - INTERVAL '1 hour')
  ORDER BY dl.discovered_at ASC
  LIMIT limit_count;
END;
$$;

-- Function to mark URL as processed
CREATE OR REPLACE FUNCTION mark_url_processed(
  url_to_update TEXT,
  status TEXT,
  error_msg TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE discovered_links 
  SET 
    is_processed = (status = 'success'),
    crawl_status = status,
    last_crawl_attempt = timezone('utc'::text, now()),
    error_message = error_msg
  WHERE url = url_to_update;
END;
$$;

-- Function to clean up old crawl data (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_crawl_data()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove old failed crawl attempts (older than 7 days)
  DELETE FROM discovered_links 
  WHERE crawl_status = 'failed' 
    AND last_crawl_attempt < NOW() - INTERVAL '7 days';
  
  -- Remove old crawl sessions (keep last 30 days)
  DELETE FROM crawl_sessions 
  WHERE started_at < NOW() - INTERVAL '30 days';
  
  -- Clean up documents that no longer exist (mark for re-crawl)
  UPDATE discovered_links 
  SET crawl_status = 'pending', is_processed = FALSE
  WHERE url IN (
    SELECT dl.url FROM discovered_links dl
    LEFT JOIN documents d ON d.source_url = dl.url
    WHERE dl.link_type = 'internal' 
      AND dl.crawl_status = 'success'
      AND d.id IS NULL
      AND dl.last_crawl_attempt < NOW() - INTERVAL '7 days'
  );
END;
$$;
