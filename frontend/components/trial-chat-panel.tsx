import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconX, IconSend, IconLoader2, IconMessage } from "@tabler/icons-react"
import { apiClient } from "@/lib/api-client"
import { useChatMessagesRealtime } from "@/hooks/use-chat-messages-realtime"
import ReactMarkdown from 'react-markdown'
import type { ClinicalTrial, ChatSession, ChatMessage } from "@/types"

interface TrialChatPanelProps {
  open: boolean
  onClose: () => void
  patientId: string
  trial: ClinicalTrial | null
}

export const TrialChatPanel: React.FC<TrialChatPanelProps> = ({ open, onClose, patientId, trial }) => {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Initialize chat session when panel opens
  useEffect(() => {
    if (open && patientId && trial) {
      initializeChatSession()
    }
  }, [open, patientId, trial])

  const initializeChatSession = async () => {
    if (!patientId || !trial) return
    
    setIsLoading(true)
    try {
      // Check if session exists
      let existingSession = await apiClient.getChatSession(patientId, trial.id)
      
      if (!existingSession) {
        // Create new session
        existingSession = await apiClient.createChatSession(
          patientId, 
          trial.id, 
          `Chat about ${trial.brief_title}`
        )
      }
      
      setSession(existingSession)
      
      // Fetch existing messages
      const existingMessages = await apiClient.getChatMessages(existingSession.id)
      setMessages(existingMessages)
    } catch (error) {
      console.error("Failed to initialize chat session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle new messages from realtime subscription
  const handleNewMessage = useCallback((newMsg: ChatMessage) => {
    setMessages(prev => [...prev, newMsg])
  }, [])

  // Subscribe to realtime messages
  useChatMessagesRealtime(session?.id || null, handleNewMessage)

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session || isSending) return
    
    const userMessage = newMessage.trim()
    setNewMessage("")
    setIsSending(true)
    
    try {
      // Send to backend - rely on realtime subscription for UI updates
      await apiClient.sendChatMessage({
        patient_id: patientId,
        session_id: session.id,
        clinical_trial_id: trial!.id,
        user_message: userMessage
      })
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!open) return null

  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-lg text-gray-900">Ask Our AI Bot About This Trial</h4>
          {trial && (
            <div className="text-xs text-gray-500 truncate">
              Trial: {trial.brief_title}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="ml-2">
          <IconX className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <IconLoader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading chat...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <IconMessage className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Ask questions about this clinical trial, eligibility criteria, or any other concerns you might have.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm">
                    {message.sender === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.message}</p>
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-sm">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                          em: ({children}) => <em className="italic">{children}</em>,
                          h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2">{children}</blockquote>,
                          code: ({children}) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-200 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                        }}
                      >
                        {message.message}
                      </ReactMarkdown>
                    )}
                  </div>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isSending || isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending || isLoading}
            size="icon"
            className="shrink-0"
          >
            <IconSend className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 