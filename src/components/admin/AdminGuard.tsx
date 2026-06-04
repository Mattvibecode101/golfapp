import { Navigate } from 'react-router-dom'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading } = useAdmin()

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
