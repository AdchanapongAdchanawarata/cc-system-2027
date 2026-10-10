-- ==============================================================================
-- CC MANAGEMENT SYSTEM 2027: SUPABASE DATABASE UPGRADE (FY70)
-- 1. Policies for Briefs Hard Delete
-- 2. Audit Logs Table (Activity Trail) for ISO 9001:2015
-- 3. Storage Bucket Configuration for Automated Monthly Backups
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BRIEFS TABLE: Allow Anon Hard Delete for Purged Tasks
-- ------------------------------------------------------------------------------
-- Enable Row Level Security (in case it is not enabled)
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- Allow anon to delete briefs that are already marked as 'purged'
DROP POLICY IF EXISTS "Allow anon delete on purged briefs" ON briefs;
CREATE POLICY "Allow anon delete on purged briefs"
ON briefs
FOR DELETE
TO anon, authenticated
USING (status = 'purged');

-- Allow anon and authenticated full select, insert, update
DROP POLICY IF EXISTS "Allow all select on briefs" ON briefs;
CREATE POLICY "Allow all select on briefs" ON briefs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow all insert on briefs" ON briefs;
CREATE POLICY "Allow all insert on briefs" ON briefs FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on briefs" ON briefs;
CREATE POLICY "Allow all update on briefs" ON briefs FOR UPDATE TO anon, authenticated USING (true);


-- ------------------------------------------------------------------------------
-- 2. AUDIT LOGS TABLE: Activity Trail for Enterprise ISO 9001 Compliance
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id TEXT,
    task_code TEXT,
    action TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    actor_role TEXT DEFAULT 'assignee',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for fast search and filtering by task_code and timestamp
CREATE INDEX IF NOT EXISTS idx_audit_logs_task_code ON audit_logs(task_code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs (readable by all, insertable by all)
DROP POLICY IF EXISTS "Allow all select on audit_logs" ON audit_logs;
CREATE POLICY "Allow all select on audit_logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow all insert on audit_logs" ON audit_logs;
CREATE POLICY "Allow all insert on audit_logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 3. STORAGE BUCKET: system_backups for Automated Monthly Snapshots
-- ------------------------------------------------------------------------------
-- Insert bucket into storage.buckets if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('system_backups', 'system_backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for system_backups bucket
DROP POLICY IF EXISTS "Allow authenticated and anon upload to system_backups" ON storage.objects;
CREATE POLICY "Allow authenticated and anon upload to system_backups"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'system_backups');

DROP POLICY IF EXISTS "Allow authenticated and anon read from system_backups" ON storage.objects;
CREATE POLICY "Allow authenticated and anon read from system_backups"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'system_backups');
