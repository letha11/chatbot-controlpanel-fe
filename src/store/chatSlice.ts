import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'
import type { ChatMessage, Conversation } from '@/types/entities'
import { config } from '@/lib/environment'

export interface ChatState {
  messages: ChatMessage[]
  selectedDivisionId: string | null
  currentConversationId: string | null
  conversations: Conversation[]
  isSending: boolean
  isLoadingHistory: boolean
  error?: string
}

const initialState: ChatState = {
  messages: [],
  selectedDivisionId: config.division_enabled ? null : 'default',
  currentConversationId: null,
  conversations: [],
  isSending: false,
  isLoadingHistory: false,
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
      prepare(content: string, sources?: string) {
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
    setCurrentConversation(state, action: PayloadAction<string | null>) {
      state.currentConversationId = action.payload
    },
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload
    },
    addConversation(state, action: PayloadAction<Conversation>) {
      state.conversations.unshift(action.payload)
    },
    updateConversation(state, action: PayloadAction<Conversation>) {
      const index = state.conversations.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.conversations[index] = action.payload
      }
    },
    setMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages = action.payload
    },
    setIsLoadingHistory(state, action: PayloadAction<boolean>) {
      state.isLoadingHistory = action.payload
    },
    resetChatState(state) {
      // Reset all chat state to initial values
      state.messages = []
      state.selectedDivisionId = null
      state.currentConversationId = null
      state.conversations = []
      state.isSending = false
      state.isLoadingHistory = false
      state.error = undefined
    },
  },
})

export const { 
  setDivision, 
  addUserMessage, 
  addAssistantMessage, 
  clearChat, 
  setIsSending, 
  setError,
  setCurrentConversation,
  setConversations,
  addConversation,
  updateConversation,
  setMessages,
  setIsLoadingHistory,
  resetChatState
} = chatSlice.actions

export default chatSlice.reducer


