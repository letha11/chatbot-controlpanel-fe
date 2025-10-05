import { combineReducers, configureStore, createAction } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { api } from './api'
import authReducer from './authSlice'
import chatReducer from './chatSlice'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
}

const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  [api.reducerPath]: api.reducer,
})

// Create a logout action that resets both auth and chat state
export const logout = createAction('app/logout')

// Enhanced reducer that handles the logout action
const enhancedRootReducer = (state: ReturnType<typeof rootReducer> | undefined, action: { type: string }) => {
  if (action.type === 'app/logout') {
    // Reset the entire state to initial values
    state = undefined
  }
  return rootReducer(state, action)
}

const persistedReducer = persistReducer(persistConfig, enhancedRootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(api.middleware),
  devTools: import.meta.env.MODE !== 'production',
})

// Optional, but required for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch)

export const persistor = persistStore(store)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
