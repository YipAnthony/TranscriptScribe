import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types'

/**
 * Subscribe to realtime chat messages for a given session.
 * @param sessionId The chat session ID to subscribe to
 * @param onNewMessage Callback invoked with each new ChatMessage
 */
export function useChatMessagesRealtime(
  sessionId: string | null,
  onNewMessage: (msg: ChatMessage) => void
) {
  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          onNewMessage(payload.new as ChatMessage)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, onNewMessage])
} 