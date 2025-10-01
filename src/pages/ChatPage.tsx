"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import { useGetDivisionsQuery, useSendChatMessageMutation } from '@/store/api'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addAssistantMessage, addUserMessage, clearChat, setDivision, setError, setIsSending } from '@/store/chatSlice'
import type { Division } from '@/types/entities'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

export default function ChatPage() {
  const dispatch = useAppDispatch()
  const { messages, selectedDivisionId, isSending } = useAppSelector((s) => s.chat)
  const { data: divisionsResp } = useGetDivisionsQuery()
  const divisions = divisionsResp?.data || []
  const [input, setInput] = useState('')
  const [sendChat] = useSendChatMessageMutation()
  const endRef = useRef<HTMLDivElement | null>(null)

  const divisionOptions = useMemo(() => divisions, [divisions])

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
      const resp = await sendChat({ division_id: selectedDivisionId, message: trimmed }).unwrap()
      const answer = resp?.data?.answer || ''
      const sources = resp?.data?.sources
      dispatch(addAssistantMessage(answer, sources))
    } catch (err: any) {
      const msg = err?.data?.error || 'Failed to get response'
      dispatch(setError(msg))
      toast.error(msg)
    } finally {
      dispatch(setIsSending(false))
    }
  }

  const onClear = () => {
    dispatch(clearChat())
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Chatbot</h1>
          <p className="text-muted-foreground">Ask questions based on documents per division.</p>
        </div>
      </div>

      <Card className="mb-4">
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
                onChange={(e) => dispatch(setDivision(e.target.value || null))}
              >
                <option value="">Select division</option>
                {divisionOptions.map((d: Division) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={onClear}>Clear Chat</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto space-y-4 p-2 border rounded-md bg-background">
            {messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">No messages yet. Select a division and ask a question.</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div className={
                    m.role === 'user'
                      ? 'inline-block px-3 py-2 rounded-lg bg-primary text-primary-foreground'
                      : 'inline-block px-3 py-2 rounded-lg bg-muted'
                  }>
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                    )}
                  </div>
                  {/* {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.sources.map((s, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {s.filename}
                        </Badge>
                      ))}
                    </div>
                  )} */}
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
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
          />
        </div>
        <Button onClick={onSend} disabled={isSending || !input.trim()}>
          <Send className="h-4 w-4 mr-2" />
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  )
}


