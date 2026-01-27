-- Fix missing start_value
-- Sets start_value to a guess (current_value + or - 5) if it's 0, just to make the bar look "relative".
-- Ideally, YOU should manually update this to the actual starting weight.

UPDATE sprints 
SET start_value = CASE 
    WHEN target_value > current_value THEN current_value - 5 -- Assuming weight gain
    ELSE current_value + 5 -- Assuming weight loss
END
WHERE start_value = 0 AND current_value > 0;

-- Ensure start_value is not 0 for the logic to work
UPDATE sprints SET start_value = target_value * 0.9 WHERE start_value = 0;
