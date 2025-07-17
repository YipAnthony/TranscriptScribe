-- Enable realtime for chat tables
-- This migration enables realtime subscriptions for chat_sessions and chat_messages tables

-- Enable realtime for chat_sessions table (only if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chat_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
    END IF;
END $$;

-- Enable realtime for chat_messages table (only if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    END IF;
END $$; 