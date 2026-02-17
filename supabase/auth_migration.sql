-- ============================================================================
-- Supabase Auth & User Data Persistence
-- ============================================================================
-- QUAN TRỌNG: Để loại bỏ bước xác thực email sau khi đăng ký:
-- 1. Vào Dashboard Supabase -> Authentication -> Providers -> Email
-- 2. Tắt (Disable) mục "Confirm email"
-- ============================================================================
-- 1. Profiles Table (Optional but good practice)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id);
-- 2. User Reading History Table
CREATE TABLE IF NOT EXISTS public.user_reading_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comic_id bigint NOT NULL REFERENCES public.comics(id) ON DELETE CASCADE,
    last_chapter int NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, comic_id)
);
ALTER TABLE public.user_reading_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own history" ON public.user_reading_history FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.user_reading_history FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON public.user_reading_history FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.user_reading_history FOR DELETE USING (auth.uid() = user_id);
-- 3. User Reader Settings Table
CREATE TABLE IF NOT EXISTS public.user_reader_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    prefetch_ahead int NOT NULL DEFAULT 2,
    max_retries int NOT NULL DEFAULT 7,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_reader_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own settings" ON public.user_reader_settings FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_reader_settings FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_reader_settings FOR
UPDATE USING (auth.uid() = user_id);
-- 4. Automate Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN
INSERT INTO public.profiles (id, email)
VALUES (new.id, new.email);
-- Create default settings for new user
INSERT INTO public.user_reader_settings (user_id, prefetch_ahead, max_retries)
VALUES (new.id, 2, 7);
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();