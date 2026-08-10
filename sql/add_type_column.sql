-- ==========================================================
-- Movie Prime — Add Type Column Migration SQL
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- ==========================================================

-- Add type column to movies table (defaults to 'movie')
ALTER TABLE movies ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'movie';

-- Disable row-level security to ensure admin panel can write to the table
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;
