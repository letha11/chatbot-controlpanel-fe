export interface Division {
  id: string
  name: string
  description?: string
  image_path?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type DocumentStatus =
  | 'uploaded'
  | 'parsing'
  | 'embedded'
  | 'parsing_failed'
  | 'failed'

export interface DocumentItem {
  id: string
  division_id: string
  original_filename: string
  storage_path: string
  file_type: string
  status: DocumentStatus
  is_active: boolean
  uploaded_by: string
  created_at: string
  updated_at: string
  division?: {
    id: string
    name: string
  }
}

// Chat-related types
// export interface ChatSource {
//   filename: string
//   preview: string
//   distance?: number
// }

export interface ChatResponseData {
  answer: string
  sources?: string
}

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  created_at: number
  sources?: string
}

// Conversation types
export interface Conversation {
  id: string
  title: string
  division_id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface ConversationHistory {
  conversation: Conversation
  messages: ChatMessage[]
}

export interface ChatRequest {
  division_id: string
  query: string
  conversation_id?: string
  title?: string
}
