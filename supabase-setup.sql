-- Run this entire script in your Supabase SQL editor
-- Dashboard > SQL Editor > New query > paste > Run

-- 1. Game state (singleton row)
CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  status TEXT DEFAULT 'waiting',
  current_question INTEGER DEFAULT 0,
  question_started_at TIMESTAMPTZ,
  show_answer BOOLEAN DEFAULT FALSE
);

-- Insert the singleton row
INSERT INTO game_state (id, status, current_question, show_answer)
VALUES (1, 'waiting', 0, false)
ON CONFLICT (id) DO NOTHING;

-- 2. Players
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Player answers
CREATE TABLE IF NOT EXISTS player_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  selected_option INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  points INTEGER DEFAULT 0,
  time_taken FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, question_index)
);

-- 4. RPC function to safely increment a player's score
CREATE OR REPLACE FUNCTION increment_score(p_id TEXT, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE players SET score = score + amount WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Disable Row Level Security (this is a short-lived internal event)
ALTER TABLE game_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_answers DISABLE ROW LEVEL SECURITY;

-- 6. Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_answers;
