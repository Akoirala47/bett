-- Reset Game State & Fix Sprints
-- WARNING: This will delete daily tasks and reset pot amounts.

-- 1. Truncate daily tasks (history)
TRUNCATE TABLE daily_tasks;

-- 2. Reset Pot Amount in game_state
UPDATE game_state SET pot_amount = 0 WHERE id = 1;

-- 3. Reset Sprints for existing users
-- Align them to start Jan 24, 2026
-- CRITICAL: We set a 'start_value' so the progress bar works. 
-- We'll assume the goal is difficult, so we reset 'current_value' to 'start_value'.
-- And we verify 'start_value' is reasonable.

UPDATE sprints 
SET 
    start_date = '2026-01-24T00:00:00Z',
    end_date = '2026-02-07T00:00:00Z',
    sprint_number = 1,
    -- If we have a target, let's assume we are 5 lbs away from it for a fresh start
    start_value = CASE 
        WHEN target_value < 100 THEN target_value - 5 -- Weight gain?
        ELSE target_value + 5 -- Weight loss (common)
    END
WHERE status = 'active';

-- Now reset current progress to the start
UPDATE sprints 
SET current_value = start_value
WHERE status = 'active';
