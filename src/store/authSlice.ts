import { createSlice } from '@reduxjs/toolkit'
import type { AuthState } from '@/types/auth'
import { api } from './api'

// Helper function to get token from localStorage
const getTokenFromStorage = (): string | null => {
  try {
    return localStorage.getItem('auth_token')
  } catch {
    return null
  }
}

// Helper function to save token to localStorage
const saveTokenToStorage = (token: string): void => {
  try {
    localStorage.setItem('auth_token', token)
  } catch {
    // Handle storage errors silently
  }
}

// Helper function to remove token from localStorage
const removeTokenFromStorage = (): void => {
  try {
    localStorage.removeItem('auth_token')
  } catch {
    // Handle storage errors silently
  }
}

const initialState: AuthState = {
  user: null,
  token: getTokenFromStorage(),
  // token: null,
  // isAuthenticated: false,
  isAuthenticated: !!getTokenFromStorage(),
  isLoading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isLoading = false
      removeTokenFromStorage()
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle login
      .addMatcher(
        api.endpoints.login.matchPending,
        (state) => {
          state.isLoading = true
        }
      )
      .addMatcher(
        api.endpoints.login.matchFulfilled,
        (state, action) => {
          state.isLoading = false
          state.user = action.payload.data.user
          state.token = action.payload.data.token
          state.isAuthenticated = true
          saveTokenToStorage(action.payload.data.token)
        }
      )
      .addMatcher(
        api.endpoints.login.matchRejected,
        (state) => {
          state.isLoading = false
          state.user = null
          state.token = null
          state.isAuthenticated = false
          removeTokenFromStorage()
        }
      )
      // Handle getCurrentUser
      .addMatcher(
        api.endpoints.getCurrentUser.matchFulfilled,
        (state, action) => {
          state.user = action.payload.data
        }
      )
      .addMatcher(
        api.endpoints.getCurrentUser.matchRejected,
        (state) => {
          // If getCurrentUser fails, clear auth state
          state.user = null
          state.token = null
          state.isAuthenticated = false
          removeTokenFromStorage()
        }
      )
  },
})

export const { logout, setLoading } = authSlice.actions
export default authSlice.reducer
