-- ==========================================================
-- Movie Prime — Supabase Schema
-- WARNING: This will drop the existing tables to recreate them with the correct columns!
-- Supabase Dashboard > SQL Editor > New Query > paste all > Run
-- ==========================================================

-- Drop existing tables to ensure they are recreated with all correct columns
drop table if exists watchlist cascade;
drop table if exists movies cascade;

-- 1) Movies table
create table movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,               -- e.g. Action, Sinhala, Drama, Horror...
  year int,
  rating numeric(3,1),                  -- e.g. 8.5
  drive_link text,                      -- raw Google Drive share link (optional)
  poster_url text,                      -- direct image url (pastable or auto-generated from drive_link)
  download_link text,                   -- fallback/general watch/download link
  trailer_link text,                    -- optional: embed trailer link (e.g. YouTube url)
  link_480p text,                       -- 480p quality telegram link
  link_720p text,                       -- 720p quality telegram link
  link_1080p text,                      -- 1080p quality telegram link
  trending boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_movies_updated_at on movies;
create trigger trg_movies_updated_at
before update on movies
for each row execute procedure set_updated_at();

-- 2) Watchlist table for members
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,                -- references auth.users(id)
  movie_id uuid not null references movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, movie_id)
);

-- 3) Row Level Security (RLS)
alter table movies disable row level security;
alter table watchlist enable row level security;

-- Watchlist Table Policies:
-- Users can only view/write their own watchlist
drop policy if exists "Users can manage their own watchlist" on watchlist;
create policy "Users can manage their own watchlist" on watchlist for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
