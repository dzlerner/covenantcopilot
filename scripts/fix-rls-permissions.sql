-- Fix Row Level Security permissions for Covenant Copilot
-- This SQL fixes the "Unknown error" when trying to access the documents table

-- Option 1: Disable RLS completely (recommended for this use case)
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Option 2: Keep RLS but allow service role access (alternative)
-- CREATE POLICY "Enable all access for service role" ON documents
-- FOR ALL USING (true);

-- Also disable RLS on crawler tables when they're created
ALTER TABLE IF EXISTS discovered_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crawl_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crawl_policies DISABLE ROW LEVEL SECURITY;

-- Verify tables are accessible
SELECT 'documents table' as table_name, COUNT(*) as row_count FROM documents
UNION ALL
SELECT 'discovered_links table', COUNT(*) FROM discovered_links
UNION ALL  
SELECT 'crawl_sessions table', COUNT(*) FROM crawl_sessions
UNION ALL
SELECT 'crawl_policies table', COUNT(*) FROM crawl_policies;