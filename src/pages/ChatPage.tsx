"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import { useGetDivisionsQuery, useSendChatMessageMutation, useGetConversationsQuery, useGetConversationHistoryQuery } from '@/store/api'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { 
  addAssistantMessage, 
  addUserMessage, 
  clearChat, 
  setDivision, 
  setError, 
  setIsSending,
  setCurrentConversation,
  setConversations,
  setMessages,
  setIsLoadingHistory
} from '@/store/chatSlice'
import type { Division, Conversation, ChatMessage } from '@/types/entities'
import { toast } from 'sonner'
import { Send, Plus, MessageSquare } from 'lucide-react'

export default function ChatPage() {
  const dispatch = useAppDispatch()
  const { messages, selectedDivisionId, currentConversationId, isSending, isLoadingHistory } = useAppSelector((s) => s.chat)
  const { data: divisionsResp } = useGetDivisionsQuery()
  const [input, setInput] = useState('')
  const [sendChat] = useSendChatMessageMutation()
  const endRef = useRef<HTMLDivElement | null>(null)

  // Fetch conversations for the selected division
  const { data: conversationsResp, refetch: refetchConversations } = useGetConversationsQuery(
    { division_id: selectedDivisionId || undefined },
    { skip: !selectedDivisionId }
  )

  // Fetch conversation history when a conversation is selected
  const { data: historyResp, isLoading: isHistoryLoading } = useGetConversationHistoryQuery(
    { conversation_id: currentConversationId! },
    { 
      skip: !currentConversationId // Only skip if no conversation is selected
    }
  )

  const divisionOptions = useMemo(() => divisionsResp?.data || [], [divisionsResp?.data])
  const conversationList = conversationsResp?.data?.conversations || []

  // Update conversations in store when data changes
  useEffect(() => {
    if (conversationsResp?.data?.conversations) {
      dispatch(setConversations(conversationsResp.data.conversations))
    }
  }, [conversationsResp, dispatch])

  // Update messages when conversation history changes
  useEffect(() => {
    if (historyResp?.data?.messages && currentConversationId) {
      // Always load history when we have a response and a current conversation
      const formattedMessages = historyResp.data.messages.map(msg => ({
        ...msg,
        // created_at: new Date(msg.created_at).getTime(),
        created_at: new Date(msg.created_at).getTime(),
        sources: msg.sources || '' // Ensure sources is always an array, even if empty
      }))
      // Sort messages by created_at to ensure correct order
      const sortedMessages = formattedMessages.sort((a, b) => {
        if (a.created_at === b.created_at) {
          // If timestamps are the same, user messages come first
          if (a.role === 'user' && b.role === 'assistant') return -1
          if (a.role === 'assistant' && b.role === 'user') return 1
          return 0
        }
        return a.created_at - b.created_at
      })
      dispatch(setMessages(sortedMessages))
      dispatch(setIsLoadingHistory(false))
    }
  }, [historyResp, dispatch, currentConversationId])

  // Update loading state when history loading changes
  useEffect(() => {
    dispatch(setIsLoadingHistory(isHistoryLoading))
  }, [isHistoryLoading, dispatch])


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const onSend = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    if (!selectedDivisionId) {
      toast.error('Please select a division first')
      return
    }
    
    dispatch(addUserMessage(trimmed))
    setInput('')
    dispatch(setIsSending(true))
    dispatch(setError(undefined))
    
    try {
      const chatRequest = {
        division_id: selectedDivisionId,
        query: trimmed,
        conversation_id: currentConversationId || undefined,
        title: !currentConversationId ? trimmed.slice(0, 50) + (trimmed.length > 50 ? '...' : '') : undefined
      }
      
      const resp = await sendChat(chatRequest).unwrap()
      const answer = resp?.data?.answer || ''
      const sources = resp?.data?.sources || ''
      const conversationId = (resp?.data as { conversation_id?: string })?.conversation_id
      
      dispatch(addAssistantMessage(answer, sources))
      
      // If this is a new conversation, update the current conversation ID
      if (conversationId && !currentConversationId) {
        dispatch(setCurrentConversation(conversationId))
        // Refetch conversations to get the new one
        refetchConversations()
      }
      
      // Only refetch history if we're not in a conversation (to avoid overwriting local messages)
      // The local messages are already in the correct order
      if (!currentConversationId && conversationId) {
        // For new conversations, we don't need to refetch history since we just added the messages locally
        // The conversation will be created with the messages we just sent
      }
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error || 'Failed to get response'
      dispatch(setError(msg))
      toast.error(msg)
    } finally {
      dispatch(setIsSending(false))
    }
  }

  const onClear = () => {
    dispatch(clearChat())
  }

  const onSelectConversation = (conversationId: string) => {
    if (conversationId === currentConversationId) return

    dispatch(setIsLoadingHistory(true)) // Show loading state
    dispatch(clearChat()) // Clear current messages immediately
    // delay
    setTimeout(() => {  
      dispatch(setCurrentConversation(conversationId))
    }, 300)
    // The history will be fetched automatically due to the query dependency
  }

  const onNewConversation = () => {
    dispatch(setCurrentConversation(null))
    dispatch(clearChat())
    dispatch(setIsLoadingHistory(false))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Chatbot</h1>
          <p className="text-muted-foreground">Ask questions based on documents per division.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onNewConversation}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {!selectedDivisionId ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Select a division to view conversations
                  </div>
                ) : conversationList.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No conversations yet
                  </div>
                ) : (
                  conversationList.map((conversation: Conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => onSelectConversation(conversation.id)}
                      className={`w-full text-left p-3 hover:bg-muted transition-colors border-l-2 cursor-pointer ${
                        currentConversationId === conversation.id 
                          ? 'border-primary bg-muted' 
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {conversation.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(conversation.updated_at)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="division" className="text-sm font-medium">Division</label>
                  <select
                    id="division"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedDivisionId || ''}
                    onChange={(e) => {
                      dispatch(setDivision(e.target.value || null))
                      dispatch(setCurrentConversation(null))
                      dispatch(clearChat())
                    }}
                  >
                    <option value="">Select division</option>
                    {divisionOptions.map((d: Division) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  {/* <Button variant="outline" onClick={onClear}>Clear Chat</Button> */}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {currentConversationId 
                  ? conversationList.find(c => c.id === currentConversationId)?.title || 'Conversation'
                  : 'New Conversation'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-4 p-2 border rounded-md bg-background">
                {isLoadingHistory ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading conversation...
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    {!selectedDivisionId 
                      ? 'Select a division to start chatting'
                      : 'No messages yet. Ask a question to start the conversation.'
                    }
                  </div>
                ) : (
                  messages.map((m: ChatMessage) => (
                    <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                      <div className={
                        m.role === 'user'
                          ? 'inline-block px-3 py-2 rounded-lg bg-primary text-primary-foreground max-w-[80%]'
                          : 'inline-block px-3 py-2 rounded-lg bg-muted max-w-[80%]'
                      }>
                        {m.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                        )}
                      </div>
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {m.sources?.split(',').map((s, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={endRef} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Textarea
                placeholder={!selectedDivisionId ? "Select a division first..." : "Type your question..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!selectedDivisionId}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSend()
                  }
                }}
              />
            </div>
            <Button 
              onClick={onSend} 
              disabled={isSending || !input.trim() || !selectedDivisionId}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


