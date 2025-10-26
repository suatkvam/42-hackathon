-- Analytics Database Setup for Supabase
-- Run this in your Supabase SQL Editor

-- Create link_clicks table
CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT NOT NULL,
  link_label TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_link_clicks_profile_id ON link_clicks(profile_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_timestamp ON link_clicks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_label ON link_clicks(link_label);

-- Enable Row Level Security (RLS)
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is analytics data)
-- Anyone can insert clicks
CREATE POLICY "Anyone can insert clicks"
  ON link_clicks
  FOR INSERT
  WITH CHECK (true);

-- Anyone can read clicks (for analytics dashboard)
CREATE POLICY "Anyone can read clicks"
  ON link_clicks
  FOR SELECT
  USING (true);

-- Optional: Add policy to delete old data (for cleanup)
CREATE POLICY "Service role can delete old data"
  ON link_clicks
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Create a function to clean up old analytics data (optional)
-- Keep only last 90 days of data
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM link_clicks 
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to run cleanup weekly
-- You can set this up in Supabase Dashboard -> Database -> Cron Jobs
