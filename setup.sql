-- ===== BETT - Battle of the Gains =====
-- Run this SQL in Supabase SQL Editor
-- https://supabase.com/dashboard/project/mbgwzkphnkssfjwnznmu/sql/new

-- Drop existing tables
DROP TABLE IF EXISTS daily_checkins CASCADE;
DROP TABLE IF EXISTS daily_tasks CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS sprints CASCADE;
DROP TABLE IF EXISTS sprint_results CASCADE;
DROP TABLE IF EXISTS game_state CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ==========================================
-- 1. PROFILES
-- ==========================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hard limit: max 2 profiles total
CREATE OR REPLACE FUNCTION enforce_lobby_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  c INT;
BEGIN
  SELECT COUNT(*) INTO c FROM public.profiles;
  IF c >= 2 THEN
    RAISE EXCEPTION 'LOBBY_FULL';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_lobby_limit ON public.profiles;
CREATE TRIGGER trg_enforce_lobby_limit
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_lobby_limit();

-- Allow unauthenticated clients to check if lobby is full (without exposing profile rows)
CREATE OR REPLACE FUNCTION lobby_status()
RETURNS TABLE(profile_count INT, is_full BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.profiles)::INT AS profile_count,
    ((SELECT COUNT(*) FROM public.profiles) >= 2) AS is_full;
$$;

GRANT EXECUTE ON FUNCTION lobby_status() TO anon, authenticated;

-- ==========================================
-- 2. SCHEDULES (gym days + calorie goal)
-- ==========================================
CREATE TABLE schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    gym_days INT[] DEFAULT '{}', -- 0=Sunday, 1=Monday, etc.
    calorie_goal INT, -- daily calorie target
    notes TEXT, -- any schedule notes
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. GAME STATE
-- ==========================================
CREATE TABLE game_state (
    id INT PRIMARY KEY DEFAULT 1,
    current_sprint INT DEFAULT 1,
    pot_amount INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO game_state (id, current_sprint, pot_amount) VALUES (1, 1, 0);

-- ==========================================
-- 4. SPRINTS
-- ==========================================
CREATE TABLE sprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    goal_title TEXT NOT NULL,
    goal_description TEXT,
    target_value FLOAT NOT NULL,
    current_value FLOAT DEFAULT 0,
    unit TEXT DEFAULT 'lbs',
    money_on_line INT DEFAULT 25,
    sprint_number INT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. DAILY TASKS (checkable items per day)
-- ==========================================
CREATE TABLE daily_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    gym_completed BOOLEAN DEFAULT FALSE,
    calories_completed BOOLEAN DEFAULT FALSE,
    weight FLOAT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ==========================================
-- 6. SPRINT RESULTS
-- ==========================================
CREATE TABLE sprint_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sprint_number INT NOT NULL,
    user1_id UUID REFERENCES profiles(id),
    user2_id UUID REFERENCES profiles(id),
    user1_won BOOLEAN DEFAULT FALSE,
    user2_won BOOLEAN DEFAULT FALSE,
    pot_amount INT DEFAULT 0,
    settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. ENABLE RLS
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_results ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 8. POLICIES (permissive for 2-person app)
-- ==========================================
CREATE POLICY "all_profiles" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_schedules" ON schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_game_state" ON game_state FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_sprints" ON sprints FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_daily_tasks" ON daily_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_sprint_results" ON sprint_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 9. ENABLE REALTIME
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE sprints;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_tasks;

-- ==========================================
-- Done!
-- ==========================================
