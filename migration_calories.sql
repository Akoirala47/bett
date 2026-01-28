-- Add current_calories column to daily_tasks
ALTER TABLE daily_tasks 
ADD COLUMN current_calories INTEGER DEFAULT 0;

-- Optional: Update existing rows to have 0 instead of null if needed (though DEFAULT handles new ones)
UPDATE daily_tasks SET current_calories = 0 WHERE current_calories IS NULL;
