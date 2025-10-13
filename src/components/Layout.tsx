import type { ReactNode } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/authSlice'
import { cn } from '@/lib/utils'
import { config } from '@/lib/environment'
import { useSSE } from '@/contexts/SSE/Context'
import { Wifi, WifiOff } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { isConnected, connectionError } = useSSE()

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-primary">
                Chatbot Control Panel
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* SSE Connection Status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-1 text-green-600" title="Real-time updates connected">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600" title={connectionError || "Real-time updates disconnected"}>
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm">Offline</span>
                  </div>
                )}
              </div>
              
              {user && (
                <span className="text-sm text-muted-foreground">
                  Welcome, <span className="font-medium text-foreground">{user.name}</span>
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Sidebar */}
      <div className="flex">
        <nav className="w-64 bg-card shadow-sm min-h-screen border-r">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className={cn(
                    "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    location.pathname === "/dashboard"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  Dashboard
                </Link>
              </li>
              {user?.role === 'super_admin' && (
                <li>
                  <Link
                    to="/users"
                    className={cn(
                      "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      location.pathname === "/users"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    Users
                  </Link>
                </li>
              )}
              {config.division_enabled && (
                <li>
                  <Link
                    to="/divisions"
                    className={cn(
                      "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      location.pathname === "/divisions"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    Divisions
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/documents"
                  className={cn(
                    "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    location.pathname === "/documents"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  Documents
                </Link>
              </li>
              <li>
                <Link
                  to="/chat"
                  className={cn(
                    "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    location.pathname === "/chat"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  Chatbot
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
