-- ============================================================================
-- Comic Reader Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
-- ============================================================================
-- 1. Comics table — stores comic metadata
CREATE TABLE IF NOT EXISTS comics (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    cover_url text,
    source_url text NOT NULL,
    total_chapters int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 2. Chapters table — stores chapter info
CREATE TABLE IF NOT EXISTS chapters (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    comic_id bigint NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
    chapter_number int NOT NULL,
    chapter_title text,
    source_url text NOT NULL,
    next_chapter_url text,
    image_count int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(comic_id, chapter_number)
);
-- 3. Chapter images table — stores image URLs for each chapter
CREATE TABLE IF NOT EXISTS chapter_images (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    chapter_id bigint NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    image_index int NOT NULL,
    src text NOT NULL,
    alt text,
    UNIQUE(chapter_id, image_index)
);
-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_chapters_comic_id ON chapters(comic_id);
CREATE INDEX IF NOT EXISTS idx_chapters_comic_number ON chapters(comic_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_chapter_images_chapter_id ON chapter_images(chapter_id);
CREATE INDEX IF NOT EXISTS idx_comics_slug ON comics(slug);
-- ============================================================================
-- Row Level Security — allow public read access
-- ============================================================================
ALTER TABLE comics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_images ENABLE ROW LEVEL SECURITY;
-- Public read policies
CREATE POLICY "public can read comics" ON comics FOR
SELECT TO anon USING (true);
CREATE POLICY "public can read chapters" ON chapters FOR
SELECT TO anon USING (true);
CREATE POLICY "public can read chapter_images" ON chapter_images FOR
SELECT TO anon USING (true);
-- Insert/update policies (for crawl script using publishable key)
CREATE POLICY "allow insert comics" ON comics FOR
INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow update comics" ON comics FOR
UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow insert chapters" ON chapters FOR
INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow update chapters" ON chapters FOR
UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow insert chapter_images" ON chapter_images FOR
INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow delete chapter_images" ON chapter_images FOR DELETE TO anon USING (true);