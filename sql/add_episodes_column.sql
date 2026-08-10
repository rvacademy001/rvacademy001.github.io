-- ==========================================================
-- Movie Prime — Add Episodes Column Migration SQL
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- ==========================================================

-- Add episodes column to movies table (text format to store list of links)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS episodes text;
