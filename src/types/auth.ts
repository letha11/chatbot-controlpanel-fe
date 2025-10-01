export interface User {
  id: string
  username: string
  role: 'admin' | 'super_admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  status: 'success'
  message: string
  data: {
    token: string
    user: User
  }
  timestamp: string
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  message: string
  data?: T
  error?: string
  errors?: string[]
  timestamp: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
