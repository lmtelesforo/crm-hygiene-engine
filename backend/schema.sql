-- ============================================================
-- LeadCheck — Supabase Schema
-- Run in: Supabase → SQL Editor → New Query → Run All
-- ============================================================

-- 1. Staging table (holds cleaned records awaiting CRM push)
CREATE TABLE IF NOT EXISTS crm_staging (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id    integer NOT NULL,
  cleaned_data   jsonb NOT NULL,
  confirmed_at   timestamptz DEFAULT now(),
  pushed_to_crm  boolean DEFAULT false,
  status         text DEFAULT 'confirmed'
);

-- 2. Audit log (full history of every clean action)
CREATE TABLE IF NOT EXISTS crm_audit_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id   integer NOT NULL,
  action      text NOT NULL,
  before      jsonb,
  after       jsonb,
  timestamp   timestamptz DEFAULT now()
);

-- 3. Issues registry (tracks which issue types are most common)
CREATE TABLE IF NOT EXISTS crm_issue_stats (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_type   text NOT NULL,
  count        integer DEFAULT 1,
  last_seen    timestamptz DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_staging_original    ON crm_staging(original_id);
CREATE INDEX IF NOT EXISTS idx_staging_status      ON crm_staging(status);
CREATE INDEX IF NOT EXISTS idx_audit_record        ON crm_audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp     ON crm_audit_log(timestamp DESC);

-- 5. Hygiene summary view
CREATE OR REPLACE VIEW hygiene_summary AS
  SELECT
    COUNT(*)                                              AS total_cleaned,
    COUNT(*) FILTER (WHERE pushed_to_crm = true)        AS pushed_to_crm,
    COUNT(*) FILTER (WHERE pushed_to_crm = false)       AS staged_only,
    MAX(confirmed_at)                                    AS last_clean_at
  FROM crm_staging;

-- 6. Most common issues view
CREATE OR REPLACE VIEW top_issues AS
  SELECT
    issue_type,
    count,
    last_seen
  FROM crm_issue_stats
  ORDER BY count DESC;

-- 7. Enable RLS
ALTER TABLE crm_staging   ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow public access for local demo purposes
CREATE POLICY "Public full access" ON crm_staging FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON crm_audit_log FOR ALL USING (true) WITH CHECK (true);

-- 8. Sample seed data (optional — run separately to test)
/*
INSERT INTO crm_staging (original_id, cleaned_data, status) VALUES
  (1, '{"cleaned_name":"Laura Claire Reyes","cleaned_email":"laura@techcorp.com","cleaned_phone":"+63 917 123 4567","cleaned_title":"Lead Project Manager","cleaned_company":"TechCorp Solutions","buyer_persona":"Influencer","best_contact_time":"9:00 AM - 11:00 AM PHT (Tue-Thu)"}'::jsonb, 'confirmed'),
  (2, '{"cleaned_name":"James Santos","cleaned_email":"james@startup.io","cleaned_phone":"+1 (800) 555-0199","cleaned_title":"Vice President of Sales","cleaned_company":"Startup IO","buyer_persona":"Executive Buyer","best_contact_time":"10:00 AM - 12:00 PM EST (Tue-Thu)"}'::jsonb, 'confirmed');
*/
