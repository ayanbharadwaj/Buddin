-- ════════════════════════════════════════════════════════════════
-- BUDDIN — run this ONCE in Supabase SQL Editor (paste all of it, click Run)
-- Required for: writing prompt saves, profile refresh, and the new feedback feature.
-- ════════════════════════════════════════════════════════════════

-- 1. writing_samples is missing the first-keystroke column the API inserts.
--    Without this, EVERY writing prompt save fails with "column does not exist".
ALTER TABLE writing_samples ADD COLUMN IF NOT EXISTS time_to_first_keystroke_ms INTEGER;

-- 2. user_profile: each "Refresh" was inserting a NEW row instead of updating,
--    which eventually breaks profile loading. Remove duplicates (keep newest),
--    then enforce one row per user so upserts update in place.
DELETE FROM user_profile a
USING user_profile b
WHERE a.user_id = b.user_id
  AND (a.updated_at < b.updated_at
       OR (a.updated_at = b.updated_at AND a.id < b.id));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profile_user_id_key'
  ) THEN
    ALTER TABLE user_profile ADD CONSTRAINT user_profile_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 3. New feedback table (the "Send feedback" button writes here).
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT,
  message TEXT NOT NULL,
  page TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can insert own feedback' AND tablename = 'feedback'
  ) THEN
    CREATE POLICY "Users can insert own feedback" ON feedback
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
