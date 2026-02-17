-- ============================================================================
-- Tracking individual chapters read by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_read_chapters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comic_id bigint NOT NULL REFERENCES public.comics(id) ON DELETE CASCADE,
    chapter_number int NOT NULL,
    read_at timestamptz DEFAULT now(),
    UNIQUE(user_id, comic_id, chapter_number)
);
ALTER TABLE public.user_read_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own read chapters" ON public.user_read_chapters FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own read chapters" ON public.user_read_chapters FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own read chapters" ON public.user_read_chapters FOR DELETE USING (auth.uid() = user_id);
-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_read_chapters_user_comic ON public.user_read_chapters(user_id, comic_id);