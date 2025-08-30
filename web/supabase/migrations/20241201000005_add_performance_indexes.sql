-- Add performance indexes for journal_entries table
-- This will significantly improve query performance, especially for free tier

-- Index on user_id for faster filtering by user
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);

-- Composite index on user_id and last_modified for faster ordering
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_modified ON journal_entries(user_id, last_modified DESC);

-- Index on date for date-based queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);

-- Index on source for filtering by source (web/mobile)
CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON journal_entries(source);

-- Index on tags array for faster tag-based filtering
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON journal_entries USING GIN(tags);

-- Analyze the table to update statistics
ANALYZE journal_entries;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'journal_entries'
ORDER BY indexname;
