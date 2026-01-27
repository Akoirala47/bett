-- Add start_value to sprints table
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS start_value FLOAT DEFAULT 0;

-- Optional: Update existing sprints to have start_value = current_value - (progress gap)? 
-- Actually, for existing sprints, we don't know the start. 
-- Let's just leave them at 0, which preserves the "old" calculation (current / target).
