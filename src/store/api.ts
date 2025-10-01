import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { LoginRequest, LoginResponse, ApiResponse, User } from '@/types/auth'
import type { Division, DocumentItem, ChatResponseData } from '@/types/entities'

// Base URL for the API - you can configure this via environment variables
const API_BASE_URL = 'http://localhost:3000'

// Type for the state structure
interface RootState {
  auth: {
    token: string | null
  }
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // Get the token from the auth state
      const token = (getState() as RootState).auth.token
      
      // If we have a token, add it to the Authorization header
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      
      return headers
    },
  }),
  tagTypes: ['User', 'Division', 'Document', 'Chat'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/api/v1/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformErrorResponse: (response: { status: number; data: ApiResponse }) => {
        return response.data?.error || 'Login failed'
      },
    }),
    getCurrentUser: builder.query<ApiResponse, void>({
      query: () => '/api/v1/auth/me',
      providesTags: ['User'],
    }),

    // User CRUD operations
    getUsers: builder.query<ApiResponse<User[]>, void>({
      query: () => '/api/v1/users',
      providesTags: ['User'],
    }),
    createUser: builder.mutation<ApiResponse<User>, Omit<User, 'id' | 'created_at' | 'updated_at'>>({
      query: (newUser) => ({
        url: '/api/v1/users',
        method: 'POST',
        body: newUser,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<ApiResponse<User>, { id: string; data: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>> }>({
      query: ({ id, data }) => ({
        url: `/api/v1/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/api/v1/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Divisions
    getDivisions: builder.query<ApiResponse<Division[]>, void>({
      query: () => '/api/v1/divisions',
      providesTags: ['Division'],
    }),

    // Division CRUD operations
    createDivision: builder.mutation<ApiResponse<Division>, Omit<Division, 'id' | 'created_at' | 'updated_at'>>({
      query: (newDivision) => ({
        url: '/api/v1/divisions',
        method: 'POST',
        body: newDivision,
      }),
      invalidatesTags: ['Division'],
    }),
    updateDivision: builder.mutation<ApiResponse<Division>, { id: string; data: Partial<Omit<Division, 'id' | 'created_at' | 'updated_at'>> }>({
      query: ({ id, data }) => ({
        url: `/api/v1/divisions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Division'],
    }),
    deleteDivision: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/api/v1/divisions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Division'],
    }),

    // Documents with optional filters
    getDocuments: builder.query<ApiResponse<DocumentItem[]>, { division_id?: string; is_active?: boolean } | void>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params && params.division_id) search.set('division_id', params.division_id)
        if (params && typeof params.is_active === 'boolean') search.set('is_active', String(params.is_active))
        const qs = search.toString()
        return `/api/v1/documents${qs ? `?${qs}` : ''}`
      },
      providesTags: ['Document'],
    }),

    // Upload a new document (multipart/form-data)
    uploadDocument: builder.mutation<
      ApiResponse<DocumentItem>,
      { file: File; division_id: string }
    >({
      query: ({ file, division_id }) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('division_id', division_id)
        return {
          url: '/api/v1/documents/upload',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Document'],
    }),

    // Toggle active status
    toggleDocumentActive: builder.mutation<
      ApiResponse<DocumentItem>,
      { id: string; is_active: boolean }
    >({
      query: ({ id, is_active }) => ({
        url: `/api/v1/documents/${id}/toggle`,
        method: 'PATCH',
        body: { is_active },
      }),
      invalidatesTags: ['Document'],
    }),

    // Delete a document
    deleteDocument: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/api/v1/documents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Document'],
    }),

    // Chat - send a message and receive an answer
    sendChatMessage: builder.mutation<
      ApiResponse<ChatResponseData>,
      { division_id: string; message: string }
    >({
      query: ({ division_id, message }) => ({
        url: '/api/v1/chat',
        method: 'POST',
        body: { division_id, query: message },
      }),
      invalidatesTags: ['Chat'],
    }),
  }),
})

export const { 
  useLoginMutation, 
  useGetCurrentUserQuery,
  useGetDivisionsQuery,
  useCreateDivisionMutation,
  useUpdateDivisionMutation,
  useDeleteDivisionMutation,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useToggleDocumentActiveMutation,
  useDeleteDocumentMutation,
  useSendChatMessageMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = api
