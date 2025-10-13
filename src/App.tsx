import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import DivisionsPage from '@/pages/DivisionsPage'
import DocumentsPage from '@/pages/DocumentsPage'
import ChatPage from '@/pages/ChatPage'
import PrivateRoute from '@/components/PrivateRoute'
import Layout from '@/components/Layout'
import UserPage from '@/pages/UserPage'
import { SSEProvider } from '@/contexts/SSE/Provider'

function App() {
  return (
    <SSEProvider>
      <Router>
        <div className="App">
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Layout>
                  <UserPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/divisions"
            element={
              <PrivateRoute>
                <Layout>
                  <DivisionsPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <PrivateRoute>
                <Layout>
                  <DocumentsPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Layout>
                  <ChatPage />
                </Layout>
              </PrivateRoute>
            }
          />
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all other routes and redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
          {/* Toast notifications */}
          <Toaster />
        </div>
      </Router>
    </SSEProvider>
  )
}

export default App
