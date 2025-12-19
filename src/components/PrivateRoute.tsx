import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useGetCurrentUserQuery } from '@/store/api'
import { logout } from '@/store/authSlice'
import type { UserRole } from '@/types/auth'
import { toast } from 'sonner'

interface PrivateRouteProps {
  children: ReactNode,
  allowedRoles?: UserRole[]
}

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { isAuthenticated, isLoading, token } = useAppSelector((state) => state.auth)
  const location = useLocation()
  const dispatch = useAppDispatch()
  
  // Only fetch current user if authenticated and has a token
  // This prevents race condition where query runs before token is set after login
  const { isLoading: isCurrentUserLoading, error: isCurrentUserError, data: currentUser } = useGetCurrentUserQuery(
    undefined,
    { skip: !isAuthenticated || !token }
  )

  // Show loading state while checking authentication
  if (isLoading || (isAuthenticated && token && isCurrentUserLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Only check for 401 error if we actually made the query (user is authenticated)
  // This prevents false positives when query is skipped
  if (
    isAuthenticated && 
    token && 
    isCurrentUserError && 
    'status' in isCurrentUserError && 
    isCurrentUserError.status === 401
  ) {
    dispatch(logout())
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect to login if not authenticated, preserving the attempted location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(currentUser?.data?.role)) {
    toast.error(`You are not authorized to access ${location.pathname} page.`)
    return <Navigate to="/dashboard" state={{ from: location }} replace />
  }

  return <>{children}</>
}
