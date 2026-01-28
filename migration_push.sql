-- Push Subscriptions Table for Web Push Notifications
-- Run this in Supabase SQL Editor

CREATE TABLE push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: users can manage their own subscriptions
CREATE POLICY "all_push_subscriptions" ON push_subscriptions 
    FOR ALL TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Enable realtime (optional, for debugging)
ALTER PUBLICATION supabase_realtime ADD TABLE push_subscriptions;
