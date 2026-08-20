-- ════════════════════════════════════════════════════════════════════════════
-- BUDDIN — schema v2
-- Run this ONCE in the Supabase SQL Editor (paste all of it, click Run).
-- Safe to re-run: every statement is IF NOT EXISTS / idempotent.
--
-- Run supabase-fixes.sql FIRST if you haven't already — this file assumes the
-- UNIQUE(user_id) constraint on user_profile that it adds.
--
-- Covers: the continuous intensity input, Preferences, Pop Culture, Numbers,
-- Career Discovery, and Learn It.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. This-or-That: distinguish old six-button answers from slider answers ──
-- Answers collected before the continuous input shipped were rounded into one of
-- six preset values. Without this column those coarse readings would silently be
-- treated as equally precise as everything collected afterwards.
ALTER TABLE comparison_responses
  ADD COLUMN IF NOT EXISTS input_method TEXT DEFAULT 'buttons';

COMMENT ON COLUMN comparison_responses.input_method IS
  'buttons = pre-2026 six-option grid (coarse); continuous = slider/typed value';

-- ── 2. user_profile: preferences + career discovery ─────────────────────────
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS career_answers JSONB;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS career_directions JSONB;

-- ── 3. Pop Culture Recognition ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pop_culture_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  era TEXT,
  reach TEXT,
  insight TEXT,
  recognized BOOLEAN NOT NULL,
  familiarity INTEGER,          -- null when they didn't recognise the name
  scale_max INTEGER,            -- the prime scale that familiarity was rated on
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pop_culture_responses_user_idx
  ON pop_culture_responses (user_id);

-- ── 4. Number Preference ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS number_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  position INTEGER,             -- how far up the ladder they were
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'neutral', 'dislike')),
  reason TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS number_responses_user_idx
  ON number_responses (user_id);

-- ── 5. Learn It progress ────────────────────────────────────────────────────
-- training_progress was provisioned early and never used. Create it if it isn't
-- there, and add any columns it's missing if it is.
CREATE TABLE IF NOT EXISTS training_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  choice_index INTEGER,
  score INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE training_progress ADD COLUMN IF NOT EXISTS module_id TEXT;
ALTER TABLE training_progress ADD COLUMN IF NOT EXISTS scenario_id TEXT;
ALTER TABLE training_progress ADD COLUMN IF NOT EXISTS choice_index INTEGER;
ALTER TABLE training_progress ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE training_progress ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
ALTER TABLE training_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE training_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Revisiting a scenario updates the answer instead of stacking duplicates that
-- would inflate the level count. The API upserts on exactly this key.
CREATE UNIQUE INDEX IF NOT EXISTS training_progress_user_module_scenario_key
  ON training_progress (user_id, module_id, scenario_id);

CREATE INDEX IF NOT EXISTS training_progress_user_idx
  ON training_progress (user_id);

-- ── 6. Row Level Security ───────────────────────────────────────────────────
-- The API routes write with the service key and bypass RLS, but MyProfile and
-- the module screens read these tables directly from the browser with the anon
-- key. Without these policies those reads return zero rows and progress looks
-- like it was never saved.
ALTER TABLE pop_culture_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_responses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress     ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['pop_culture_responses', 'number_responses', 'training_progress']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = t AND policyname = 'Users can read own rows'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "Users can read own rows" ON %I FOR SELECT USING (auth.uid() = user_id)', t);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = t AND policyname = 'Users can insert own rows'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "Users can insert own rows" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', t);
    END IF;
  END LOOP;
END $$;

-- ── 7. Sanity check ─────────────────────────────────────────────────────────
-- Run this after the above and confirm every row says true.
SELECT 'comparison_responses.input_method' AS check, EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'comparison_responses' AND column_name = 'input_method') AS ok
UNION ALL SELECT 'user_profile.preferences', EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'user_profile' AND column_name = 'preferences')
UNION ALL SELECT 'user_profile.career_directions', EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'user_profile' AND column_name = 'career_directions')
UNION ALL SELECT 'pop_culture_responses', EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'pop_culture_responses')
UNION ALL SELECT 'number_responses', EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'number_responses')
UNION ALL SELECT 'training_progress', EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'training_progress');
