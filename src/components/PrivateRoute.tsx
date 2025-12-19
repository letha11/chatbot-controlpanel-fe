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
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const { isLoading: isCurrentUserLoading, error: isCurrentUserError, data: currentUser } = useGetCurrentUserQuery();
  const location = useLocation()
  const dispatch = useAppDispatch()

  // Show loading state while checking authentication
  if (isLoading || isCurrentUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isCurrentUserError && 'status' in isCurrentUserError && (isCurrentUserError as { status: number }).status === 401) {
    dispatch(logout())
    return <Navigate to="/login" state={{ from: location }} replace />
  }


  if (allowedRoles && !allowedRoles.includes(currentUser?.data?.role)) {
    toast.error(`You are not authorized to access ${location.pathname} page.`)
    return <Navigate to="/dashboard" state={{ from: location }} replace />
  }

  // Redirect to login if not authenticated, preserving the attempted location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
