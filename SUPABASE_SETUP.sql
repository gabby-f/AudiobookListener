-- Supabase Setup SQL for Audiobook Listener
-- Copy and paste this into Supabase SQL Editor and run it

-- Library table: stores metadata about uploaded audiobooks
CREATE TABLE library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT now(),
  file_name TEXT NOT NULL,
  title TEXT,
  artist TEXT,
  album TEXT,
  duration FLOAT,
  storage_path TEXT NOT NULL, -- path in Supabase storage
  cover_url TEXT
);

-- Playback state table: syncs playback position across devices
CREATE TABLE playback_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID REFERENCES library(id) ON DELETE CASCADE,
  current_position FLOAT DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  playback_speed FLOAT DEFAULT 1,
  volume FLOAT DEFAULT 1,
  is_muted BOOLEAN DEFAULT false,
  last_updated TIMESTAMP DEFAULT now(),
  UNIQUE(library_id)
);

-- Enable RLS (Row Level Security) - allow public access for single user
ALTER TABLE library ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_state ENABLE ROW LEVEL SECURITY;

-- OPTION 1: Single-user with secret passcode (better security)
-- Replace 'your-secret-passcode' with a random string only you know
-- CREATE POLICY "Single user access" ON library
--   FOR ALL USING (current_setting('request.headers')::json->>'x-user-secret' = 'your-secret-passcode');
-- CREATE POLICY "Single user access" ON playback_state
--   FOR ALL USING (current_setting('request.headers')::json->>'x-user-secret' = 'your-secret-passcode');

-- OPTION 2: Public access (current - anyone with link can use)
CREATE POLICY "Allow all access" ON library
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON playback_state
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX idx_library_created_at ON library(created_at DESC);
CREATE INDEX idx_playback_state_library_id ON playback_state(library_id);
