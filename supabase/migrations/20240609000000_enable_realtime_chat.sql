-- Enable realtime for chat tables
-- This migration enables realtime subscriptions for chat_sessions and chat_messages tables

-- Enable realtime for chat_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;

-- Enable realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages; 