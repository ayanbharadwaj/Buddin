-- ════════════════════════════════════════════════════════════════════════════
-- BUDDIN — schema v3 (security hardening)
-- Run this ONCE in the Supabase SQL Editor, after supabase-fixes.sql and
-- supabase-schema-v2.sql. Safe to re-run: every statement is idempotent.
--
-- Covers two defects that are really the same defect in two places:
--   1. Guest usage counters lived in serverless process memory, so they reset
--      every time the platform scaled out a new instance — the 10/day guest
--      limit and the 100/min rate limit were both effectively advisory.
--   2. Every counter in the app used read-modify-write (read N, write N+1),
--      which is not atomic. Two concurrent requests both read N and both write
--      N+1, so one increment vanishes. Under double-clicks, retries or two
--      tabs, limits drift and can be walked straight past.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Persistent guest usage ───────────────────────────────────────────────
-- Guests have no user_id, so they cannot share the `usage` table (whose
-- user_id is a UUID). Identity here is a salted hash of the platform-supplied
-- client address — never anything the client can set.
CREATE TABLE IF NOT EXISTS guest_usage (
  identity_hash TEXT NOT NULL,
  date          DATE NOT NULL,
  count         INTEGER NOT NULL DEFAULT 0,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_count  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (identity_hash, date)
);

-- Only the service role touches this; no end user should ever read it.
ALTER TABLE guest_usage ENABLE ROW LEVEL SECURITY;

-- Old guest rows are worthless after their day ends.
CREATE INDEX IF NOT EXISTS guest_usage_date_idx ON guest_usage (date);

-- ── 2. Atomic increments ────────────────────────────────────────────────────
-- Each returns the value AFTER incrementing, so the caller can enforce the
-- limit on the post-increment number without a second read.

CREATE OR REPLACE FUNCTION increment_guest_usage(p_hash TEXT, p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO guest_usage (identity_hash, date, count)
  VALUES (p_hash, p_date, 1)
  ON CONFLICT (identity_hash, date)
  DO UPDATE SET count = guest_usage.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

CREATE OR REPLACE FUNCTION increment_usage(p_user UUID, p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO usage (user_id, date, count)
  VALUES (p_user, p_date, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = COALESCE(usage.count, 0) + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

CREATE OR REPLACE FUNCTION increment_coach_usage(p_user UUID, p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO usage (user_id, date, coach_count)
  VALUES (p_user, p_date, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET coach_count = COALESCE(usage.coach_count, 0) + 1
  RETURNING coach_count INTO new_count;
  RETURN new_count;
END;
$$;

-- These RPCs are called with the service key only.
REVOKE ALL ON FUNCTION increment_guest_usage(TEXT, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION increment_usage(UUID, DATE)       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION increment_coach_usage(UUID, DATE) FROM PUBLIC, anon, authenticated;

-- ── 3. user_memory: make the upsert target real ─────────────────────────────
-- api/memory.js upserts with onConflict: 'user_id'. Without a matching unique
-- constraint that call errors, and before this pass the error was never checked
-- so it returned {success: true} anyway. Guarded because user_memory has no
-- CREATE TABLE in this repo (see the README note on the missing base schema).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_memory') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'user_memory_user_id_key'
    ) THEN
      -- Remove any duplicates first, keeping the most recently updated row.
      DELETE FROM user_memory a USING user_memory b
      WHERE a.user_id = b.user_id AND a.ctid < b.ctid;
      ALTER TABLE user_memory ADD CONSTRAINT user_memory_user_id_key UNIQUE (user_id);
    END IF;
  ELSE
    RAISE NOTICE 'user_memory does not exist — skipping its unique constraint.';
  END IF;
END $$;

-- ── 3. Sanity check ─────────────────────────────────────────────────────────
-- Every row should read true.
SELECT 'guest_usage table' AS check, EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'guest_usage') AS ok
UNION ALL SELECT 'increment_guest_usage', EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'increment_guest_usage')
UNION ALL SELECT 'increment_usage', EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'increment_usage')
UNION ALL SELECT 'increment_coach_usage', EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'increment_coach_usage')
UNION ALL SELECT 'usage unique(user_id,date)', EXISTS (
  SELECT 1 FROM pg_indexes WHERE indexname = 'usage_user_date_key')
UNION ALL SELECT 'user_memory unique(user_id)', EXISTS (
  SELECT 1 FROM pg_constraint WHERE conname = 'user_memory_user_id_key');
