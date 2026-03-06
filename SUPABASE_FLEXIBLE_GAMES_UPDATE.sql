-- Kraken Motorsports: make leaderboard game values fully configurable
-- Run once in Supabase SQL Editor for existing databases.

BEGIN;

-- Remove old hardcoded game list constraint if present.
ALTER TABLE public.leaderboard_entries
  DROP CONSTRAINT IF EXISTS leaderboard_entries_game_check;

-- Keep lightweight validation so game cannot be blank.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leaderboard_entries_game_not_blank_check'
      AND conrelid = 'public.leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE public.leaderboard_entries
      ADD CONSTRAINT leaderboard_entries_game_not_blank_check
      CHECK (length(trim(game)) > 0);
  END IF;
END
$$;

COMMIT;
