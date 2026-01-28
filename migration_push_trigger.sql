-- Database trigger to call Edge Function when daily_tasks is updated
-- Run this in Supabase SQL Editor AFTER deploying the Edge Function

-- Create the trigger function
CREATE OR REPLACE FUNCTION notify_rival_on_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rival_id UUID;
  rival_name TEXT;
  pot_amount INT;
  notification_type TEXT;
  should_notify BOOLEAN := FALSE;
BEGIN
  -- Find the rival (the other user)
  SELECT id, display_name INTO rival_id, rival_name
  FROM profiles
  WHERE id != NEW.user_id
  LIMIT 1;

  -- Get pot amount
  SELECT pot_amount INTO pot_amount FROM game_state WHERE id = 1;

  -- Check what changed
  IF OLD IS NULL THEN
    -- New record - check if anything is set
    IF NEW.gym_completed = TRUE THEN
      notification_type := 'gym';
      should_notify := TRUE;
    ELSIF NEW.calories_completed = TRUE THEN
      notification_type := 'calories';
      should_notify := TRUE;
    ELSIF NEW.weight IS NOT NULL THEN
      notification_type := 'weight';
      should_notify := TRUE;
    END IF;
  ELSE
    -- Update - check what changed
    IF OLD.gym_completed = FALSE AND NEW.gym_completed = TRUE THEN
      notification_type := 'gym';
      should_notify := TRUE;
    ELSIF OLD.calories_completed = FALSE AND NEW.calories_completed = TRUE THEN
      notification_type := 'calories';
      should_notify := TRUE;
    ELSIF (OLD.weight IS NULL OR OLD.weight != NEW.weight) AND NEW.weight IS NOT NULL THEN
      notification_type := 'weight';
      should_notify := TRUE;
    ELSIF (OLD.current_calories IS NULL OR NEW.current_calories > OLD.current_calories) THEN
      notification_type := 'calories';
      should_notify := TRUE;
    END IF;
  END IF;

  -- Send notification to rival
  IF should_notify AND rival_id IS NOT NULL THEN
    -- Get the current user's name for the notification
    SELECT display_name INTO rival_name FROM profiles WHERE id = NEW.user_id;
    
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'user_id', rival_id,
        'type', notification_type,
        'rival_name', rival_name,
        'bet_amount', COALESCE(pot_amount, 0)
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_notify_rival ON daily_tasks;
CREATE TRIGGER trg_notify_rival
AFTER INSERT OR UPDATE ON daily_tasks
FOR EACH ROW
EXECUTE FUNCTION notify_rival_on_progress();

-- Note: You need to enable the pg_net extension and set the app settings
-- Run these commands first:
-- 
-- CREATE EXTENSION IF NOT EXISTS pg_net;
-- 
-- ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.service_role_key = 'your-service-role-key';
