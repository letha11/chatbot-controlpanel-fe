import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'
import type { ChatMessage } from '@/types/entities'

export interface ChatState {
  messages: ChatMessage[]
  selectedDivisionId: string | null
  isSending: boolean
  error?: string
}

const initialState: ChatState = {
  messages: [],
  selectedDivisionId: null,
  isSending: false,
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setDivision(state, action: PayloadAction<string | null>) {
      state.selectedDivisionId = action.payload
    },
    addUserMessage: {
      reducer(state, action: PayloadAction<ChatMessage>) {
        state.messages.push(action.payload)
      },
      prepare(content: string) {
        return {
          payload: {
            id: nanoid(),
            role: 'user' as const,
            content,
            created_at: Date.now(),
          },
        }
      },
    },
    addAssistantMessage: {
      reducer(state, action: PayloadAction<ChatMessage>) {
        state.messages.push(action.payload)
      },
      prepare(content: string, sources?: ChatMessage['sources']) {
        return {
          payload: {
            id: nanoid(),
            role: 'assistant' as const,
            content,
            created_at: Date.now(),
            sources,
          },
        }
      },
    },
    clearChat(state) {
      state.messages = []
    },
    setIsSending(state, action: PayloadAction<boolean>) {
      state.isSending = action.payload
    },
    setError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload
    },
  },
})

export const { setDivision, addUserMessage, addAssistantMessage, clearChat, setIsSending, setError } = chatSlice.actions

export default chatSlice.reducer


